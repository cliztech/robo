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
        assert baseline["station_default_mode"] == "semi_auto"

        # Test Show Override
        show_payload = {
            **baseline,
            "station_default_mode": "manual_assist",
            "show_overrides": [{"show_id": "show-1", "mode": "auto_with_human_override"}],
            "timeslot_overrides": [],
        }

        put_response = client.put("/api/v1/autonomy-policy", json=show_payload)
        assert put_response.status_code == 200

        effective_show = client.get(
            "/api/v1/autonomy-policy/effective",
            params={"show_id": "show-1"},
        )
        assert effective_show.status_code == 200
        assert effective_show.json()["source"] == "show_override"
        assert effective_show.json()["mode"] == "auto_with_human_override"

        # Test Timeslot Override
        timeslot_payload = {
            **baseline,
            "station_default_mode": "manual_assist",
            "show_overrides": [],
            "timeslot_overrides": [
                {
                    "id": "slot-1",
                    "day_of_week": "monday",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    # "show_id": "show-1", # Removed to pass conflict detection
                    "show_id": "show-1",
                    "mode": "semi_auto",
                }
            ],
        }

        put_response = client.put("/api/v1/autonomy-policy", json=timeslot_payload)
        assert put_response.status_code == 200

        effective_timeslot = client.get(
            "/api/v1/autonomy-policy/effective",
            params={"show_id": "show-1", "timeslot_id": "slot-1"},
        )
        assert effective_timeslot.status_code == 200
        assert effective_timeslot.json()["source"] == "timeslot_override"
        assert effective_timeslot.json()["mode"] == "semi_auto"

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
            "station_default_mode": "manual_assist",
            "mode_permissions": {
                "manual_assist": {
                    "track_selection": "human_only"
                },
                "semi_auto": {
                    "track_selection": "human_with_ai_assist",
                    "script_generation": "ai_with_human_approval",
                    "voice_persona_selection": "human_with_ai_assist",
                    "caller_simulation_usage": "ai_with_human_approval",
                    "breaking_news_weather_interruption": "ai_with_human_approval",
                },
                "auto_with_human_override": {
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


def test_get_policy_auto_recovers_invalid_policy_file(tmp_path, monkeypatch):
    from backend.scheduling import api as policy_api

    policy_path = tmp_path / "autonomy_policy.json"
    policy_path.write_text('{"station_default_mode": "not-a-mode"}', encoding="utf-8")

    def _factory() -> AutonomyPolicyService:
        return AutonomyPolicyService(
            policy_path=policy_path,
            audit_log_path=tmp_path / "autonomy_audit_events.jsonl",
        )

    monkeypatch.setattr(policy_api, "_service_instance", None)
    monkeypatch.setattr(policy_api, "AutonomyPolicyService", _factory)

    client = TestClient(app)
    get_response = client.get("/api/v1/autonomy-policy")
    assert get_response.status_code == 200
    assert get_response.json()["station_default_mode"] == "semi_auto"

    recovered_files = list(tmp_path.glob("autonomy_policy.crash_recovery_*.json"))
    assert recovered_files
