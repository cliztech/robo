import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from backend.app import app
from backend.status.api import get_alert_repository, get_status_telemetry_provider, get_status_thresholds
from backend.status.evaluators import StatusThresholds
from backend.status.repository import SQLiteStatusAlertRepository
from backend.status.telemetry import QueueDepthSnapshot, RotationTelemetry, ServiceHealthTelemetry

client = TestClient(app)


class StubTelemetryProvider:
    def __init__(
        self,
        queue_depth: int,
        queue_observed_at: datetime,
        rotation_minutes_ago: int,
        service_status: str = "healthy",
        service_reason: str = "all good",
    ) -> None:
        self._queue = QueueDepthSnapshot(current_depth=queue_depth, observed_at=queue_observed_at)
        self._rotation = RotationTelemetry(
            last_successful_rotation_at=queue_observed_at - timedelta(minutes=rotation_minutes_ago)
        )
        self._service_health = ServiceHealthTelemetry(
            status=service_status,
            reason=service_reason,
            observed_at=queue_observed_at,
        )

    def read_queue_depth(self) -> QueueDepthSnapshot:
        return self._queue

    def read_rotation(self) -> RotationTelemetry:
        return self._rotation

    def read_service_health(self) -> ServiceHealthTelemetry:
        return self._service_health


def _set_dependency_overrides(
    tmp_path: Path,
    telemetry_provider: StubTelemetryProvider,
    thresholds: StatusThresholds,
) -> None:
    repo = SQLiteStatusAlertRepository(db_path=tmp_path / "status_alerts.db", default_alerts=[])
    app.dependency_overrides[get_alert_repository] = lambda: repo
    app.dependency_overrides[get_status_telemetry_provider] = lambda: telemetry_provider
    app.dependency_overrides[get_status_thresholds] = lambda: thresholds


def _clear_dependency_overrides() -> None:
    app.dependency_overrides.pop(get_alert_repository, None)
    app.dependency_overrides.pop(get_status_telemetry_provider, None)
    app.dependency_overrides.pop(get_status_thresholds, None)


def test_dashboard_status_no_auth():
    response = client.get("/api/v1/status/dashboard")
    assert response.status_code == 401
    assert response.json() == {"detail": "Missing API Key"}


def test_dashboard_status_invalid_auth():
    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "wrong-key"},
        )
        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid API Key"}


def test_dashboard_evaluator_warning_to_critical_transition(tmp_path: Path):
    now = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50, rotation_stale_after_minutes=45)

    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        _set_dependency_overrides(
            tmp_path,
            StubTelemetryProvider(queue_depth=35, queue_observed_at=now, rotation_minutes_ago=5),
            thresholds,
        )
        warning_response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"},
        )

        _set_dependency_overrides(
            tmp_path,
            StubTelemetryProvider(queue_depth=51, queue_observed_at=now + timedelta(minutes=1), rotation_minutes_ago=5),
            thresholds,
        )
        critical_response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"},
        )

    _clear_dependency_overrides()

    assert warning_response.status_code == 200
    assert warning_response.json()["queue_depth"]["state"] == "warning"
    warning_alert = warning_response.json()["alert_center"]["items"][0]
    assert warning_alert["alert_id"] == "alert-queue-depth"
    assert warning_alert["severity"] == "warning"

    assert critical_response.status_code == 200
    assert critical_response.json()["queue_depth"]["state"] == "critical"
    critical_alert = critical_response.json()["alert_center"]["items"][0]
    assert critical_alert["alert_id"] == "alert-queue-depth"
    assert critical_alert["severity"] == "critical"


def test_dashboard_rotation_stale_detection_boundary(tmp_path: Path):
    now = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50, rotation_stale_after_minutes=30)

    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        _set_dependency_overrides(
            tmp_path,
            StubTelemetryProvider(queue_depth=10, queue_observed_at=now, rotation_minutes_ago=30),
            thresholds,
        )
        boundary_response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"},
        )

        _set_dependency_overrides(
            tmp_path,
            StubTelemetryProvider(queue_depth=10, queue_observed_at=now + timedelta(minutes=1), rotation_minutes_ago=31),
            thresholds,
        )
        stale_response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"},
        )

    _clear_dependency_overrides()

    assert boundary_response.status_code == 200
    assert boundary_response.json()["rotation"]["is_stale"] is False
    assert boundary_response.json()["alert_center"]["items"] == []

    assert stale_response.status_code == 200
    assert stale_response.json()["rotation"]["is_stale"] is True
    stale_ids = {item["alert_id"] for item in stale_response.json()["alert_center"]["items"]}
    assert "alert-rotation-stale" in stale_ids


def test_alerts_and_acknowledge_endpoint_auth(tmp_path: Path):
    now = datetime.now(timezone.utc)
    thresholds = StatusThresholds(queue_warning=30, queue_critical=50, rotation_stale_after_minutes=30)

    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        _set_dependency_overrides(
            tmp_path,
            StubTelemetryProvider(queue_depth=55, queue_observed_at=now, rotation_minutes_ago=5),
            thresholds,
        )

        unauth_alerts = client.get("/api/v1/status/dashboard/alerts")
        assert unauth_alerts.status_code == 401

        seeded = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"},
        )
        assert seeded.status_code == 200

        alerts = client.get(
            "/api/v1/status/dashboard/alerts",
            headers={"X-API-Key": "test-secret-key"},
        )
        assert alerts.status_code == 200
        assert isinstance(alerts.json(), list)

        unauth_ack = client.post("/api/v1/status/dashboard/alerts/alert-queue-depth/ack")
        assert unauth_ack.status_code == 401

        ack = client.post(
            "/api/v1/status/dashboard/alerts/alert-queue-depth/ack",
            headers={"X-API-Key": "test-secret-key"},
        )
        assert ack.status_code == 200
        assert ack.json()["acknowledged"] is True

    _clear_dependency_overrides()
