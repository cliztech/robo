from __future__ import annotations

from functools import lru_cache
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.status.models import AlertCenterItem, AlertSeverity
from backend.status.repository import SQLiteStatusAlertRepository, StatusAlertRepository

router = APIRouter(prefix="/api/v1/status", tags=["status"])


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


def _default_alerts() -> list[AlertCenterItem]:
    return [
        AlertCenterItem(
            alert_id="alert-queue-critical",
            severity=AlertSeverity.critical,
            title="Queue depth above critical threshold",
            description="Queue depth has exceeded 50 items for over 5 minutes.",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=7),
        ),
        AlertCenterItem(
            alert_id="alert-rotation-stale",
            severity=AlertSeverity.warning,
            title="Rotation data stale",
            description="No successful rotation has been recorded for over 45 minutes.",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=2),
        ),
    ]


@lru_cache
def get_alert_repository() -> StatusAlertRepository:
    return SQLiteStatusAlertRepository(
        db_path=Path("config/logs/status_alerts.db"),
        default_alerts=_default_alerts(),
    )


@router.get("/dashboard", response_model=DashboardStatusResponse)
def read_dashboard_status(
    repository: StatusAlertRepository = Depends(get_alert_repository),
) -> DashboardStatusResponse:
    now = datetime.now(timezone.utc)
    trend = [
        QueueTrendPoint(timestamp=now - timedelta(minutes=10), depth=18),
        QueueTrendPoint(timestamp=now - timedelta(minutes=8), depth=25),
        QueueTrendPoint(timestamp=now - timedelta(minutes=6), depth=31),
        QueueTrendPoint(timestamp=now - timedelta(minutes=4), depth=42),
        QueueTrendPoint(timestamp=now - timedelta(minutes=2), depth=56),
        QueueTrendPoint(timestamp=now, depth=54),
    ]

    last_rotation = now - timedelta(minutes=47)
    stale_after = 30
    is_stale = (now - last_rotation) > timedelta(minutes=stale_after)

    return DashboardStatusResponse(
        service_health=ServiceHealthCard(
            status=ServiceHealth.degraded,
            reason="queue depth above critical threshold",
            observed_at=now,
        ),
        queue_depth=QueueDepthTrend(
            current_depth=trend[-1].depth,
            trend=trend,
            thresholds=ThresholdBand(warning=30, critical=50),
            state=AlertSeverity.critical,
        ),
        rotation=RotationStatus(
            last_successful_rotation_at=last_rotation,
            stale_after_minutes=stale_after,
            is_stale=is_stale,
            stale_reason="rotation worker has not published a successful run",
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
