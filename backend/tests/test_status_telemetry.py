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
          "queue_depth": {
            "current_depth": 7,
            "observed_at": "2026-03-05T12:00:00+00:00"
          }
        }
        """,
        encoding="utf-8",
    )

    snapshot = FileStatusTelemetryProvider(telemetry_path=telemetry_path).read_queue_depth()

    assert len(snapshot.history) == 1
    assert snapshot.history[0].depth == 7
    assert snapshot.history[0].observed_at == datetime(2026, 3, 5, 12, 0, tzinfo=timezone.utc)
