from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol


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
        observed_at = _parse_iso_datetime(
            queue_payload.get("observed_at")
            or payload.get("observed_at")
            or datetime.now(timezone.utc).isoformat()
        )
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
        last_successful = _parse_iso_datetime(
            rotation_payload.get("last_successful_rotation_at")
            or (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
        )
        return RotationTelemetry(last_successful_rotation_at=last_successful)

    def read_service_health(self) -> ServiceHealthTelemetry:
        payload = self._read_payload()
        health_payload = payload.get("service_health", {})
        observed_at = _parse_iso_datetime(
            health_payload.get("observed_at")
            or payload.get("observed_at")
            or datetime.now(timezone.utc).isoformat()
        )
        return ServiceHealthTelemetry(
            status=str(health_payload.get("status", "healthy")),
            reason=str(health_payload.get("reason", "all services nominal")),
            observed_at=observed_at,
        )

    def _read_payload(self) -> dict:
        if not self._telemetry_path.exists():
            return {}
        with self._telemetry_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)


def _parse_iso_datetime(raw: str) -> datetime:
    value = datetime.fromisoformat(raw)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


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
