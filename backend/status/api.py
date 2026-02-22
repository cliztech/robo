from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from backend.security.auth import verify_api_key

router = APIRouter(prefix="/api/v1/status", tags=["status"], dependencies=[Depends(verify_api_key)])


class ServiceHealth(str, Enum):
    healthy = "healthy"
    degraded = "degraded"
    offline = "offline"


class AlertSeverity(str, Enum):
    critical = "critical"
    warning = "warning"
    info = "info"


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


class AlertCenterItem(BaseModel):
    alert_id: str
    severity: AlertSeverity
    title: str
    description: str
    created_at: datetime
    acknowledged: bool = False
    acknowledged_at: datetime | None = None


class AlertCenter(BaseModel):
    filters: List[AlertSeverity] = Field(default_factory=lambda: list(AlertSeverity))
    items: List[AlertCenterItem] = Field(default_factory=list)


class DashboardStatusResponse(BaseModel):
    service_health: ServiceHealthCard
    queue_depth: QueueDepthTrend
    rotation: RotationStatus
    alert_center: AlertCenter


_ALERTS: Dict[str, AlertCenterItem] = {
    "alert-queue-critical": AlertCenterItem(
        alert_id="alert-queue-critical",
        severity=AlertSeverity.critical,
        title="Queue depth above critical threshold",
        description="Queue depth has exceeded 50 items for over 5 minutes.",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=7),
    ),
    "alert-rotation-stale": AlertCenterItem(
        alert_id="alert-rotation-stale",
        severity=AlertSeverity.warning,
        title="Rotation data stale",
        description="No successful rotation has been recorded for over 45 minutes.",
        created_at=datetime.now(timezone.utc) - timedelta(minutes=2),
    ),
}


@router.get("/dashboard", response_model=DashboardStatusResponse)
def read_dashboard_status() -> DashboardStatusResponse:
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
        alert_center=AlertCenter(items=list(_ALERTS.values())),
    )


@router.get("/dashboard/alerts", response_model=list[AlertCenterItem])
def read_alerts(severity: AlertSeverity | None = None) -> list[AlertCenterItem]:
    alerts = list(_ALERTS.values())
    if severity is not None:
        alerts = [item for item in alerts if item.severity == severity]
    return alerts


@router.post("/dashboard/alerts/{alert_id}/ack", response_model=AlertCenterItem)
def acknowledge_alert(alert_id: str) -> AlertCenterItem:
    alert = _ALERTS.get(alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="alert not found")

    if not alert.acknowledged:
        alert.acknowledged = True
        alert.acknowledged_at = datetime.now(timezone.utc)

    return alert
