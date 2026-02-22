from fastapi.testclient import TestClient

from backend.app import app
from backend.scheduling.api import get_policy_service
from backend.scheduling.autonomy_service import AutonomyPolicyService


def _override_service(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "autonomy_audit_events.jsonl"

    def _factory() -> AutonomyPolicyService:
        return AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)

    return _factory


def test_get_put_and_effective_policy_endpoints(tmp_path):
    app.dependency_overrides[get_policy_service] = _override_service(tmp_path)
    client = TestClient(app)

    try:
        get_response = client.get("/api/v1/autonomy-policy")
        assert get_response.status_code == 200
        baseline = get_response.json()
        assert baseline["station_default_mode"] == "assisted"

        updated_payload = {
            **baseline,
            "station_default_mode": "manual",
            "show_overrides": [{"show_id": "show-1", "mode": "autonomous"}],
            "timeslot_overrides": [
                {
                    "id": "slot-1",
                    "day_of_week": "monday",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "show_id": "show-1",
                    "mode": "assisted",
                }
            ],
        }

        put_response = client.put("/api/v1/autonomy-policy", json=updated_payload)
        assert put_response.status_code == 200
        assert put_response.json()["station_default_mode"] == "manual"

        effective_timeslot = client.get(
            "/api/v1/autonomy-policy/effective",
            params={"show_id": "show-1", "timeslot_id": "slot-1"},
        )
        assert effective_timeslot.status_code == 200
        assert effective_timeslot.json()["source"] == "timeslot_override"

        effective_show = client.get(
            "/api/v1/autonomy-policy/effective",
            params={"show_id": "show-1"},
        )
        assert effective_show.status_code == 200
        assert effective_show.json()["source"] == "show_override"
    finally:
        app.dependency_overrides.clear()


def test_audit_event_create_and_list_endpoints(tmp_path):
    app.dependency_overrides[get_policy_service] = _override_service(tmp_path)
    client = TestClient(app)

    try:
        create = client.post(
            "/api/v1/autonomy-policy/audit-events",
            params={
                "decision_type": "track_selection",
                "origin": "ai",
                "show_id": "show-1",
                "timeslot_id": "slot-1",
                "notes": "automated test",
            },
        )
        assert create.status_code == 200
        body = create.json()
        assert body["decision_type"] == "track_selection"
        assert body["origin"] == "ai"

        list_response = client.get(
            "/api/v1/autonomy-policy/audit-events",
            params={"limit": 10},
        )
        assert list_response.status_code == 200
        events = list_response.json()
        assert len(events) == 1
        assert events[0]["event_id"] == body["event_id"]
    finally:
        app.dependency_overrides.clear()


def test_invalid_payload_rejections_api(tmp_path):
    app.dependency_overrides[get_policy_service] = _override_service(tmp_path)
    client = TestClient(app)

    try:
        invalid_policy = {
            "station_default_mode": "manual",
            "mode_permissions": {
                "manual": {
                    "track_selection": "human_only"
                },
                "assisted": {
                    "track_selection": "human_with_ai_assist",
                    "script_generation": "ai_with_human_approval",
                    "voice_persona_selection": "human_with_ai_assist",
                    "caller_simulation_usage": "ai_with_human_approval",
                    "breaking_news_weather_interruption": "ai_with_human_approval",
                },
                "autonomous": {
                    "track_selection": "ai_autonomous",
                    "script_generation": "ai_autonomous",
                    "voice_persona_selection": "ai_autonomous",
                    "caller_simulation_usage": "ai_autonomous",
                    "breaking_news_weather_interruption": "ai_with_human_approval",
                },
            },
            "show_overrides": [],
            "timeslot_overrides": [],
        }
        put_response = client.put("/api/v1/autonomy-policy", json=invalid_policy)
        assert put_response.status_code == 422

        post_response = client.post(
            "/api/v1/autonomy-policy/audit-events",
            params={"decision_type": "track_selection", "origin": "robot"},
        )
        assert post_response.status_code == 422
    finally:
        app.dependency_overrides.clear()
