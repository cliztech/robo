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
    telemetry_path = tmp_path / "status_telemetry.json"
    telemetry_path.write_text(
        """
        {
            "service_health": {
                "status": 42,
                "reason": {"details": "bad type"}
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
