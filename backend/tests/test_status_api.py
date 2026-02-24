from fastapi.testclient import TestClient

from backend.app import app
from backend.status.api import _default_alerts, get_alert_repository
from backend.status.repository import SQLiteStatusAlertRepository


def _override_repository(tmp_path):
    db_path = tmp_path / "status_alerts.db"

    def _factory() -> SQLiteStatusAlertRepository:
        return SQLiteStatusAlertRepository(db_path=db_path, default_alerts=_default_alerts())

    return _factory


def test_acknowledge_alert_is_idempotent(tmp_path):
    app.dependency_overrides[get_alert_repository] = _override_repository(tmp_path)
    client = TestClient(app)
    try:
        first = client.post("/api/v1/status/dashboard/alerts/alert-queue-critical/ack")
        assert first.status_code == 200
        first_data = first.json()
        assert first_data["acknowledged"] is True
        first_ack = first_data["acknowledged_at"]

        second = client.post("/api/v1/status/dashboard/alerts/alert-queue-critical/ack")
        assert second.status_code == 200
        second_data = second.json()
        assert second_data["acknowledged"] is True
        assert second_data["acknowledged_at"] == first_ack
    finally:
        app.dependency_overrides.clear()


def test_ack_persists_across_repository_recreation(tmp_path):
    app.dependency_overrides[get_alert_repository] = _override_repository(tmp_path)
    client = TestClient(app)
    try:
        ack_response = client.post("/api/v1/status/dashboard/alerts/alert-rotation-stale/ack")
        assert ack_response.status_code == 200

        app.dependency_overrides[get_alert_repository] = _override_repository(tmp_path)

        alerts_response = client.get("/api/v1/status/dashboard/alerts")
        assert alerts_response.status_code == 200
        alerts = {item["alert_id"]: item for item in alerts_response.json()}
        assert alerts["alert-rotation-stale"]["acknowledged"] is True
        assert alerts["alert-rotation-stale"]["acknowledged_at"] is not None
    finally:
        app.dependency_overrides.clear()


def test_read_alerts_with_severity_filter(tmp_path):
    app.dependency_overrides[get_alert_repository] = _override_repository(tmp_path)
    client = TestClient(app)
    try:
        response = client.get("/api/v1/status/dashboard/alerts", params={"severity": "critical"})
        assert response.status_code == 200
        alerts = response.json()
        assert len(alerts) == 1
        assert alerts[0]["alert_id"] == "alert-queue-critical"
        assert alerts[0]["severity"] == "critical"
    finally:
        app.dependency_overrides.clear()
