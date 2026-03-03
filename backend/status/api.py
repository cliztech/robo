from __future__ import annotations

from functools import lru_cache
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.security.auth import verify_api_key
from backend.status.evaluators import (
    StatusThresholds,
    derive_queue_state,
    evaluate_queue_depth_alert,
    evaluate_rotation_alert,
)
from backend.status.models import AlertCenterItem, AlertSeverity
from backend.status.repository import SQLiteStatusAlertRepository, StatusAlertRepository
from backend.status.telemetry import FileStatusTelemetryProvider, StatusTelemetryProvider

router = APIRouter(prefix="/api/v1/status", tags=["status"], dependencies=[Depends(verify_api_key)])


class ServiceHealth(str, Enum):
    healthy = "healthy"
    degraded = "degraded"
    offline = "offline"


class QueueTrendPoint(BaseModel):
    timestamp: datetime
    depth: int = Field(ge=0)


class ThresholdBand(BaseModel):
    warning: int = Field(ge=0)
    critical: int = Field(ge=0)


class QueueDepthTrend(BaseModel):
    current_depth: int = Field(ge=0)
    trend: List[QueueTrendPoint] = Field(default_factory=list)
    thresholds: ThresholdBand
    state: AlertSeverity


class ServiceHealthCard(BaseModel):
    status: ServiceHealth
    reason: str
    observed_at: datetime


class RotationStatus(BaseModel):
    last_successful_rotation_at: datetime
    stale_after_minutes: int = Field(default=30, ge=1)
    is_stale: bool
    stale_reason: str | None = None


class AlertCenter(BaseModel):
    filters: List[AlertSeverity] = Field(default_factory=lambda: list(AlertSeverity))
    items: List[AlertCenterItem] = Field(default_factory=list)


class DashboardStatusResponse(BaseModel):
    service_health: ServiceHealthCard
    queue_depth: QueueDepthTrend
    rotation: RotationStatus
    alert_center: AlertCenter


@lru_cache
def get_alert_repository() -> StatusAlertRepository:
    return SQLiteStatusAlertRepository(
        db_path=Path("config/logs/status_alerts.db"),
        default_alerts=[],
    )


@lru_cache
def get_status_telemetry_provider() -> StatusTelemetryProvider:
    return FileStatusTelemetryProvider(telemetry_path=Path("config/logs/status_telemetry.json"))


def get_status_thresholds() -> StatusThresholds:
    return StatusThresholds()


@router.get("/dashboard", response_model=DashboardStatusResponse)
def read_dashboard_status(
    repository: StatusAlertRepository = Depends(get_alert_repository),
    telemetry_provider: StatusTelemetryProvider = Depends(get_status_telemetry_provider),
    thresholds: StatusThresholds = Depends(get_status_thresholds),
) -> DashboardStatusResponse:
    queue_snapshot = telemetry_provider.read_queue_depth()
    rotation_snapshot = telemetry_provider.read_rotation()
    service_health_snapshot = telemetry_provider.read_service_health()

    observed_at = max(
        queue_snapshot.observed_at,
        rotation_snapshot.last_successful_rotation_at,
        service_health_snapshot.observed_at,
    )
    queue_alert = evaluate_queue_depth_alert(
        current_depth=queue_snapshot.current_depth,
        observed_at=queue_snapshot.observed_at,
        thresholds=thresholds,
    )
    rotation_alert = evaluate_rotation_alert(
        last_successful_rotation_at=rotation_snapshot.last_successful_rotation_at,
        observed_at=observed_at,
        thresholds=thresholds,
    )
    active_alerts = [alert for alert in [queue_alert, rotation_alert] if alert is not None]
    repository.reconcile_alerts(active_alerts, observed_at=observed_at)

    queue_state = derive_queue_state(queue_snapshot.current_depth, thresholds)
    is_rotation_stale = rotation_alert is not None
    stale_reason = (
        "rotation worker has not published a successful run" if is_rotation_stale else None
    )

    service_health_status = ServiceHealth(service_health_snapshot.status)
    reason = service_health_snapshot.reason
    if queue_state == AlertSeverity.critical and service_health_status == ServiceHealth.healthy:
        service_health_status = ServiceHealth.degraded
        reason = "queue depth above critical threshold"

    return DashboardStatusResponse(
        service_health=ServiceHealthCard(
            status=service_health_status,
            reason=reason,
            observed_at=service_health_snapshot.observed_at,
        ),
        queue_depth=QueueDepthTrend(
            current_depth=queue_snapshot.current_depth,
            trend=[
                QueueTrendPoint(
                    timestamp=queue_snapshot.observed_at,
                    depth=queue_snapshot.current_depth,
                )
            ],
            thresholds=ThresholdBand(
                warning=thresholds.queue_warning,
                critical=thresholds.queue_critical,
            ),
            state=queue_state,
        ),
        rotation=RotationStatus(
            last_successful_rotation_at=rotation_snapshot.last_successful_rotation_at,
            stale_after_minutes=thresholds.rotation_stale_after_minutes,
            is_stale=is_rotation_stale,
            stale_reason=stale_reason,
        ),
        alert_center=AlertCenter(items=repository.list_alerts()),
    )


@router.get("/dashboard/alerts", response_model=list[AlertCenterItem])
def read_alerts(
    severity: AlertSeverity | None = None,
    repository: StatusAlertRepository = Depends(get_alert_repository),
) -> list[AlertCenterItem]:
    return repository.list_alerts(severity=severity)


@router.post("/dashboard/alerts/{alert_id}/ack", response_model=AlertCenterItem)
def acknowledge_alert(
    alert_id: str,
    repository: StatusAlertRepository = Depends(get_alert_repository),
) -> AlertCenterItem:
    alert = repository.acknowledge_alert(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")

    return alert
