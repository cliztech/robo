import logging

from backend.status.telemetry import FileStatusTelemetryProvider


def test_malformed_json_uses_defaults(tmp_path, caplog):
    telemetry_path = tmp_path / "status_telemetry.json"
    telemetry_path.write_text('{"queue_depth": ', encoding="utf-8")
    provider = FileStatusTelemetryProvider(telemetry_path=telemetry_path)

    with caplog.at_level(logging.WARNING):
        queue = provider.read_queue_depth()
        rotation = provider.read_rotation()
        health = provider.read_service_health()

    assert queue.current_depth == 0
    assert rotation.last_successful_rotation_at.tzinfo is not None
    assert health.status == "healthy"
    assert "status telemetry payload unavailable; using safe defaults" in caplog.text


def test_invalid_timestamp_and_depth_use_defaults(tmp_path, caplog):
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from backend.status.telemetry import FileStatusTelemetryProvider, MAX_QUEUE_DEPTH_HISTORY_POINTS


def test_read_queue_depth_history_orders_and_limits_window(tmp_path: Path) -> None:
    now = datetime(2026, 3, 5, 12, 0, tzinfo=timezone.utc)
    history = [
        {
            "depth": index,
            "observed_at": (now + timedelta(minutes=index)).isoformat(),
        }
        for index in range(MAX_QUEUE_DEPTH_HISTORY_POINTS + 20)
    ]
    history.reverse()

    telemetry_path = tmp_path / "status_telemetry.json"
    telemetry_path.write_text(
        """
        {
            "observed_at": "bad-date",
            "queue_depth": {
                "current_depth": "not-an-int",
                "observed_at": "still-not-a-date"
            },
            "rotation": {
                "last_successful_rotation_at": "broken"
            },
            "service_health": {
                "observed_at": "missing-time",
                "status": "healthy",
                "reason": "ok"
            }
        }
        """,
        encoding="utf-8",
    )
    provider = FileStatusTelemetryProvider(telemetry_path=telemetry_path)

    with caplog.at_level(logging.WARNING):
        queue = provider.read_queue_depth()
        rotation = provider.read_rotation()
        health = provider.read_service_health()

    assert queue.current_depth == 0
    assert queue.observed_at.tzinfo is not None
    assert rotation.last_successful_rotation_at.tzinfo is not None
    assert health.observed_at.tzinfo is not None
    field_names = {getattr(record, "field_name", None) for record in caplog.records}
    assert "queue_depth.current_depth" in field_names
    assert "queue_depth.observed_at" in field_names
    assert "rotation.last_successful_rotation_at" in field_names


def test_invalid_service_health_fields_use_defaults(tmp_path, caplog):
          "queue_depth": {
            "current_depth": 99,
            "observed_at": "2026-03-05T14:00:00+00:00",
            "history": __HISTORY__
          }
        }
        """.replace("__HISTORY__", json.dumps(history)),
        encoding="utf-8",
    )

    snapshot = FileStatusTelemetryProvider(telemetry_path=telemetry_path).read_queue_depth()

    assert len(snapshot.history) == MAX_QUEUE_DEPTH_HISTORY_POINTS
    assert [point.depth for point in snapshot.history] == list(
        range(20, MAX_QUEUE_DEPTH_HISTORY_POINTS + 20)
    )
    assert snapshot.history[0].observed_at < snapshot.history[-1].observed_at


def test_read_queue_depth_history_falls_back_to_current_snapshot(tmp_path: Path) -> None:
    telemetry_path = tmp_path / "status_telemetry.json"
    telemetry_path.write_text(
        """
        {
            "service_health": {
                "status": 42,
                "reason": {"details": "bad type"}
            }
          "queue_depth": {
            "current_depth": 7,
            "observed_at": "2026-03-05T12:00:00+00:00"
          }
        }
        """,
        encoding="utf-8",
    )
    provider = FileStatusTelemetryProvider(telemetry_path=telemetry_path)

    with caplog.at_level(logging.WARNING):
        health = provider.read_service_health()

    assert health.status == "healthy"
    assert health.reason == "all services nominal"
    field_names = {getattr(record, "field_name", None) for record in caplog.records}
    assert "service_health.status" in field_names
    assert "service_health.reason" in field_names

    snapshot = FileStatusTelemetryProvider(telemetry_path=telemetry_path).read_queue_depth()

    assert len(snapshot.history) == 1
    assert snapshot.history[0].depth == 7
    assert snapshot.history[0].observed_at == datetime(2026, 3, 5, 12, 0, tzinfo=timezone.utc)
