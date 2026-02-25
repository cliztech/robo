import os
from unittest import mock
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_dashboard_status_no_auth():
    """Test accessing dashboard without API key fails."""
    response = client.get("/api/v1/status/dashboard")
    assert response.status_code == 401
    assert response.json() == {"detail": "Missing API Key"}

def test_dashboard_status_invalid_auth():
    """Test accessing dashboard with incorrect API key fails."""
    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "wrong-key"}
        )
        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid API Key"}

def test_dashboard_status_valid_auth():
    """Test accessing dashboard with correct API key succeeds."""
    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        response = client.get(
            "/api/v1/status/dashboard",
            headers={"X-API-Key": "test-secret-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "service_health" in data
        assert "queue_depth" in data

def test_alerts_endpoint_auth():
    """Test alerts endpoint enforces authentication."""
    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        # Unauthenticated
        response = client.get("/api/v1/status/dashboard/alerts")
        assert response.status_code == 401

        # Authenticated
        response = client.get(
            "/api/v1/status/dashboard/alerts",
            headers={"X-API-Key": "test-secret-key"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

def test_acknowledge_alert_auth():
    """Test acknowledge alert endpoint enforces authentication."""
    with mock.patch.dict(os.environ, {"ROBODJ_SECRET_KEY": "test-secret-key"}):
        # Unauthenticated
        response = client.post(
            "/api/v1/status/dashboard/alerts/alert-queue-critical/ack"
        )
        assert response.status_code == 401

        # Authenticated request to confirm auth passes (even if 404/success)
        # We use a known ID to get a 200 if possible, or check logic.
        # alert-queue-critical is in the _ALERTS dict in api.py
        response = client.post(
            "/api/v1/status/dashboard/alerts/alert-queue-critical/ack",
            headers={"X-API-Key": "test-secret-key"}
        )
        assert response.status_code == 200
        assert response.json()["acknowledged"] is True
