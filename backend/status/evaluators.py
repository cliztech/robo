from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from backend.status.models import AlertCenterItem, AlertSeverity


@dataclass(frozen=True)
class StatusThresholds:
    queue_warning: int = 30
    queue_critical: int = 50
    rotation_stale_after_minutes: int = 30


def evaluate_queue_depth_alert(
    current_depth: int,
    observed_at: datetime,
    thresholds: StatusThresholds,
) -> AlertCenterItem | None:
    if current_depth >= thresholds.queue_critical:
        severity = AlertSeverity.critical
        description = (
            f"Queue depth is {current_depth}; exceeds critical threshold "
            f"{thresholds.queue_critical}."
        )
    elif current_depth >= thresholds.queue_warning:
        severity = AlertSeverity.warning
        description = (
            f"Queue depth is {current_depth}; exceeds warning threshold "
            f"{thresholds.queue_warning}."
        )
    else:
        return None

    return AlertCenterItem(
        alert_id="alert-queue-depth",
        severity=severity,
        title="Queue depth threshold breached",
        description=description,
        created_at=observed_at,
    )


def evaluate_rotation_alert(
    last_successful_rotation_at: datetime,
    observed_at: datetime,
    thresholds: StatusThresholds,
) -> AlertCenterItem | None:
    stale_after = timedelta(minutes=thresholds.rotation_stale_after_minutes)
    lag = observed_at - last_successful_rotation_at
    if lag <= stale_after:
        return None

    return AlertCenterItem(
        alert_id="alert-rotation-stale",
        severity=AlertSeverity.warning,
        title="Rotation data stale",
        description=(
            "No successful rotation has been recorded for "
            f"{int(lag.total_seconds() // 60)} minutes."
        ),
        created_at=last_successful_rotation_at,
    )


def derive_queue_state(current_depth: int, thresholds: StatusThresholds) -> AlertSeverity:
    if current_depth >= thresholds.queue_critical:
        return AlertSeverity.critical
    if current_depth >= thresholds.queue_warning:
        return AlertSeverity.warning
    return AlertSeverity.info
