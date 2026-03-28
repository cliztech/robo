from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol


logger = logging.getLogger(__name__)
MAX_QUEUE_DEPTH_HISTORY_POINTS = 60


@dataclass(frozen=True)
class QueueDepthHistoryPoint:
    depth: int
    observed_at: datetime


@dataclass(frozen=True)
class QueueDepthSnapshot:
    current_depth: int
    observed_at: datetime
    history: tuple[QueueDepthHistoryPoint, ...] = ()


@dataclass(frozen=True)
class RotationTelemetry:
    last_successful_rotation_at: datetime


@dataclass(frozen=True)
class ServiceHealthTelemetry:
    status: str
    reason: str
    observed_at: datetime


class StatusTelemetryProvider(Protocol):
    def read_queue_depth(self) -> QueueDepthSnapshot:
        ...

    def read_rotation(self) -> RotationTelemetry:
        ...

    def read_service_health(self) -> ServiceHealthTelemetry:
        ...


class FileStatusTelemetryProvider:
    """Reads live status telemetry from a JSON snapshot emitted by runtime services."""

    def __init__(self, telemetry_path: Path) -> None:
        self._telemetry_path = telemetry_path

    def read_queue_depth(self) -> QueueDepthSnapshot:
        payload = self._read_payload()
        queue_payload = payload.get("queue_depth", {})
        observed_at = _parse_datetime_field(
            queue_payload.get("observed_at") or payload.get("observed_at"),
            default=datetime.now(timezone.utc),
            field_name="queue_depth.observed_at",
            telemetry_path=self._telemetry_path,
        )
        depth = _parse_non_negative_int_field(
            queue_payload.get("current_depth"),
            default=0,
            field_name="queue_depth.current_depth",
            telemetry_path=self._telemetry_path,
        )
        return QueueDepthSnapshot(current_depth=depth, observed_at=observed_at)
        depth = int(queue_payload.get("current_depth", 0))
        current_depth = max(depth, 0)
        history = _normalize_queue_history(
            history_payload=queue_payload.get("history"),
            fallback_depth=current_depth,
            fallback_observed_at=observed_at,
        )
        return QueueDepthSnapshot(
            current_depth=current_depth,
            observed_at=observed_at,
            history=history,
        )

    def read_rotation(self) -> RotationTelemetry:
        payload = self._read_payload()
        rotation_payload = payload.get("rotation", {})
        last_successful = _parse_datetime_field(
            rotation_payload.get("last_successful_rotation_at"),
            default=datetime.now(timezone.utc) - timedelta(minutes=5),
            field_name="rotation.last_successful_rotation_at",
            telemetry_path=self._telemetry_path,
        )
        return RotationTelemetry(last_successful_rotation_at=last_successful)

    def read_service_health(self) -> ServiceHealthTelemetry:
        payload = self._read_payload()
        health_payload = payload.get("service_health", {})
        observed_at = _parse_datetime_field(
            health_payload.get("observed_at") or payload.get("observed_at"),
            default=datetime.now(timezone.utc),
            field_name="service_health.observed_at",
            telemetry_path=self._telemetry_path,
        )
        return ServiceHealthTelemetry(
            status=_parse_string_field(
                health_payload.get("status"),
                default="healthy",
                field_name="service_health.status",
                telemetry_path=self._telemetry_path,
            ),
            reason=_parse_string_field(
                health_payload.get("reason"),
                default="all services nominal",
                field_name="service_health.reason",
                telemetry_path=self._telemetry_path,
            ),
            observed_at=observed_at,
        )

    def _read_payload(self) -> dict:
        if not self._telemetry_path.exists():
            return {}
        try:
            with self._telemetry_path.open("r", encoding="utf-8") as handle:
                return json.load(handle)
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning(
                "status telemetry payload unavailable; using safe defaults",
                extra={
                    "event_name": "status.telemetry.read_error",
                    "telemetry_path": str(self._telemetry_path),
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
            )
            return {}


def _parse_iso_datetime(raw: str) -> datetime:
    value = datetime.fromisoformat(raw)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _parse_datetime_field(
    raw: object,
    *,
    default: datetime,
    field_name: str,
    telemetry_path: Path,
) -> datetime:
    if raw in (None, ""):
        return default
    try:
        if not isinstance(raw, str):
            raise TypeError(f"expected str, got {type(raw).__name__}")
        return _parse_iso_datetime(raw)
    except (TypeError, ValueError) as exc:
        _log_field_warning(
            telemetry_path=telemetry_path,
            field_name=field_name,
            raw_value=raw,
            default=default.isoformat(),
            error=exc,
        )
        return default


def _parse_non_negative_int_field(
    raw: object,
    *,
    default: int,
    field_name: str,
    telemetry_path: Path,
) -> int:
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
        return max(value, 0)
    except (TypeError, ValueError) as exc:
        _log_field_warning(
            telemetry_path=telemetry_path,
            field_name=field_name,
            raw_value=raw,
            default=default,
            error=exc,
        )
        return default


def _parse_string_field(
    raw: object,
    *,
    default: str,
    field_name: str,
    telemetry_path: Path,
) -> str:
    if raw is None:
        return default
    if isinstance(raw, str):
        return raw
    _log_field_warning(
        telemetry_path=telemetry_path,
        field_name=field_name,
        raw_value=raw,
        default=default,
        error=TypeError(f"expected str, got {type(raw).__name__}"),
    )
    return default


def _log_field_warning(
    *,
    telemetry_path: Path,
    field_name: str,
    raw_value: object,
    default: object,
    error: Exception,
) -> None:
    logger.warning(
        "status telemetry field malformed; falling back to default",
        extra={
            "event_name": "status.telemetry.field_parse_error",
            "telemetry_path": str(telemetry_path),
            "field_name": field_name,
            "raw_value": repr(raw_value),
            "default_value": repr(default),
            "error_type": type(error).__name__,
            "error": str(error),
        },
    )
def _normalize_queue_history(
    history_payload: object,
    fallback_depth: int,
    fallback_observed_at: datetime,
) -> tuple[QueueDepthHistoryPoint, ...]:
    history_points: list[QueueDepthHistoryPoint] = []
    if isinstance(history_payload, list):
        for point in history_payload:
            if not isinstance(point, dict):
                continue

            try:
                raw_observed_at = point.get("observed_at") or point.get("timestamp")
                if not isinstance(raw_observed_at, str):
                    continue
                observed_at = _parse_iso_datetime(raw_observed_at)
                depth = max(int(point.get("depth", 0)), 0)
            except (TypeError, ValueError):
                continue

            history_points.append(QueueDepthHistoryPoint(depth=depth, observed_at=observed_at))

    if not history_points:
        history_points = [
            QueueDepthHistoryPoint(depth=fallback_depth, observed_at=fallback_observed_at)
        ]

    history_points.sort(key=lambda point: point.observed_at)
    bounded_history = history_points[-MAX_QUEUE_DEPTH_HISTORY_POINTS:]
    return tuple(bounded_history)
