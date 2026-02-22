from fastapi.testclient import TestClient
import pytest
import os
from unittest import mock
from backend.app import app
from backend.scheduling.scheduler_ui_api import get_scheduler_service
from backend.scheduling.scheduler_ui_service import SchedulerUiService

TEST_API_KEY = "valid_api_key_for_testing"

def _override_service(tmp_path):
    schedules_path = tmp_path / "schedules.json"
    def _factory() -> SchedulerUiService:
        return SchedulerUiService(schedules_path=schedules_path)
    return _factory

def _sample_schedule(schedule_id="sch_1", name="Test Show"):
    return {
        "id": schedule_id,
        "name": name,
        "enabled": True,
        "timezone": "UTC",
        "ui_state": "active",
        "priority": 50,
        "start_window": {"type": "datetime", "value": "2026-01-01T00:00:00Z"},
        "end_window": {"type": "datetime", "value": "2026-12-31T23:59:59Z"},
        "content_refs": [{"type": "script", "ref_id": "script:1", "weight": 100}],
        "schedule_spec": {"mode": "cron", "cron": "0 9 * * 1"}
    }

@pytest.fixture(autouse=True)
def mock_env_api_key():
    with mock.patch.dict(os.environ, {"ROBODJ_SCHEDULER_API_KEY": TEST_API_KEY}):
        yield

def test_unauthenticated_request(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        response = client.get("/api/v1/scheduler-ui/state")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()

def test_get_scheduler_state(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        response = client.get("/api/v1/scheduler-ui/state", headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        data = response.json()
        assert "schedule_file" in data
        assert "timeline_blocks" in data
        assert "conflicts" in data
    finally:
        app.dependency_overrides.clear()

def test_put_scheduler_state(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        payload = {"schedules": [_sample_schedule()]}
        response = client.put("/api/v1/scheduler-ui/state", json=payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        data = response.json()
        assert len(data["schedule_file"]["schedules"]) == 1
        assert data["schedule_file"]["schedules"][0]["id"] == "sch_1"

        # Test validation error with conflicting schedules
        invalid_payload = {
            "schedules": [
                _sample_schedule("sch_1", "Show A"),
                _sample_schedule("sch_2", "Show B") # Same cron will cause conflict
            ]
        }
        response = client.put("/api/v1/scheduler-ui/state", json=invalid_payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()

def test_validate_scheduler_state(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        payload = {"schedules": [_sample_schedule("sch_1"), _sample_schedule("sch_2")]}
        response = client.post("/api/v1/scheduler-ui/validate", json=payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        conflicts = response.json()
        assert len(conflicts) > 0
    finally:
        app.dependency_overrides.clear()

def test_publish_scheduler_state(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        payload = {"schedules": [_sample_schedule()]}
        response = client.post("/api/v1/scheduler-ui/publish", json=payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "published"
        assert data["schedule_count"] == 1
    finally:
        app.dependency_overrides.clear()

def test_apply_template(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        payload = {
            "template": "weekday",
            "timezone": "UTC",
            "content_refs": [{"type": "script", "ref_id": "script:1", "weight": 100}]
        }
        response = client.post("/api/v1/scheduler-ui/templates/apply", json=payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        data = response.json()
        assert data["template"] == "weekday"
        assert len(data["schedules"]) == 5
    finally:
        app.dependency_overrides.clear()

def test_preview_schedule_spec(tmp_path):
    app.dependency_overrides[get_scheduler_service] = _override_service(tmp_path)
    client = TestClient(app)
    try:
        payload = {
            "day_of_week": "monday",
            "start_time": "09:00",
            "timezone": "UTC",
            "start_date": "2026-01-01"
        }
        response = client.post("/api/v1/scheduler-ui/preview", json=payload, headers={"X-API-Key": TEST_API_KEY})
        assert response.status_code == 200
        data = response.json()
        assert "one_off" in data
        assert "rrule" in data
        assert "cron" in data
    finally:
        app.dependency_overrides.clear()
