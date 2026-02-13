import json

import pytest
from pydantic import ValidationError

from backend.scheduling.autonomy_policy import (
    AutonomyPolicy,
    DecisionType,
    GlobalMode,
)
from backend.scheduling.autonomy_service import AutonomyPolicyService


def test_default_policy_bootstrap_when_missing(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)

    policy = service.get_policy()

    assert policy.station_default_mode == GlobalMode.assisted
    assert policy_path.exists()


def test_precedence_resolution_timeslot_then_show_then_station(tmp_path):
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )

    policy = AutonomyPolicy.model_validate(
        {
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
    )
    service.update_policy(policy)

    from_timeslot = service.resolve_effective_policy(show_id="show-1", timeslot_id="slot-1")
    assert from_timeslot.source == "timeslot_override"
    assert from_timeslot.mode == GlobalMode.assisted

    from_show = service.resolve_effective_policy(show_id="show-1")
    assert from_show.source == "show_override"
    assert from_show.mode == GlobalMode.autonomous

    from_station = service.resolve_effective_policy(show_id="show-x")
    assert from_station.source == "station_default"
    assert from_station.mode == GlobalMode.manual


def test_audit_log_append_and_read(tmp_path):
    audit_path = tmp_path / "audit.jsonl"
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=audit_path,
    )

    first = service.record_audit_event(
        decision_type=DecisionType.track_selection,
        origin="ai",
        notes="first",
    )
    second = service.record_audit_event(
        decision_type=DecisionType.script_generation,
        origin="human",
        notes="second",
    )

    events = service.list_audit_events(limit=10)

    assert [event.event_id for event in events] == [first.event_id, second.event_id]
    assert len(audit_path.read_text(encoding="utf-8").splitlines()) == 2

    parsed = [json.loads(line) for line in audit_path.read_text(encoding="utf-8").splitlines()]
    assert parsed[-1]["notes"] == "second"


def test_invalid_payload_rejection_paths_service(tmp_path):
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )

    with pytest.raises(ValidationError):
        AutonomyPolicy.model_validate(
            {
                "station_default_mode": "manual",
                "mode_permissions": {
                    "manual": {
                        "track_selection": "human_only",
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
            }
        )

    with pytest.raises(ValidationError):
        service.record_audit_event(
            decision_type=DecisionType.track_selection,
            origin="not-valid-origin",
        )
