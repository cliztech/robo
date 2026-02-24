import os
from unittest import mock
from fastapi.testclient import TestClient
from backend.app import app
from backend.scheduling.scheduler_ui_service import SchedulerUiService
from backend.scheduling.scheduler_ui_api import get_scheduler_service

# Mock dependencies
def _override_service():
    mock_service = mock.Mock(spec=SchedulerUiService)
    mock_service.get_ui_state.return_value = {
        "schedule_file": {
            "schema_version": 1,
            "schedules": []
        },
        "timeline_blocks": [],
        "conflicts": []
    }
    return mock_service

app.dependency_overrides[get_scheduler_service] = _override_service

def test_scheduler_ui_enforces_specific_key():
    """
    Verifies that the Scheduler UI now requires the specific ROBODJ_SCHEDULER_API_KEY
    and rejects the global ROBODJ_SECRET_KEY.
    """
    global_key = "global-secret-key"
    scheduler_key = "scheduler-secret-key"

    # Set distinct keys
    with mock.patch.dict(os.environ, {
        "ROBODJ_SECRET_KEY": global_key,
        "ROBODJ_SCHEDULER_API_KEY": scheduler_key
    }):
        client = TestClient(app)

        # 1. Attempt with Global Key (New behavior: SHOULD FAIL)
        response_global = client.get(
            "/api/v1/scheduler-ui/state",
            headers={"X-API-Key": global_key}
        )
        assert response_global.status_code == 401, f"Global key should be rejected now. Got {response_global.status_code}"

        # 2. Attempt with Scheduler Key (New behavior: SHOULD SUCCEED)
        response_scheduler = client.get(
            "/api/v1/scheduler-ui/state",
            headers={"X-API-Key": scheduler_key}
        )
        assert response_scheduler.status_code == 200, f"Scheduler key should be accepted now. Got {response_scheduler.status_code}"
