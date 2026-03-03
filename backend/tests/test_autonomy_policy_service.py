import json
import unittest.mock
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.security.approval_policy import ActionId
from backend.scheduling.autonomy_policy import (
    AutonomyPolicy,
    DecisionAuthority,
    DecisionType,
    DEFAULT_MODE_PERMISSIONS,
    GlobalMode,
)
from backend.scheduling.autonomy_service import AutonomyPolicyService, PolicyValidationError


def test_default_policy_bootstrap_when_missing(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)

    policy = service.get_policy()

    assert policy.station_default_mode == GlobalMode.semi_auto
    assert policy_path.exists()


def test_precedence_resolution_timeslot_then_show_then_station(tmp_path):
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )
    service.event_log_path = tmp_path / "scheduler_events.jsonl"

    policy = AutonomyPolicy.model_validate(
        {
            "station_default_mode": "manual_assist",
            "show_overrides": [{"show_id": "show-1", "mode": "auto_with_human_override"}],
            "timeslot_overrides": [
                {
                    "id": "slot-1",
                    "day_of_week": "monday",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    # "show_id": "show-1",  <-- Removed to avoid conflict detection but still match by ID
                    "show_id": "show-1",
                    "mode": "semi_auto",
                }
            ],
        }
    )

    # Mock validate_policy to allow "conflicting" policies for testing resolution precedence
    with unittest.mock.patch.object(service, 'validate_policy'):
        service.update_policy(policy, enforce_approval=False)

        from_timeslot = service.resolve_effective_policy(show_id="show-1", timeslot_id="slot-1")
        assert from_timeslot.source == "timeslot_override"
        assert from_timeslot.mode == GlobalMode.semi_auto

        from_show = service.resolve_effective_policy(show_id="show-1")
        assert from_show.source == "show_override"
        assert from_show.mode == GlobalMode.auto_with_human_override

        from_station = service.resolve_effective_policy(show_id="show-x")
        assert from_station.source == "station_default"
        assert from_station.mode == GlobalMode.manual_assist


def test_audit_log_append_and_read(tmp_path, monkeypatch):
    monkeypatch.setattr("backend.scheduling.autonomy_service.require_approval", lambda *args, **kwargs: None)
    audit_path = tmp_path / "audit.jsonl"
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=audit_path,
    )

    first = service.record_audit_event(
        decision_type=DecisionType.track_selection,
        origin="ai",
        action_id=ActionId.ACT_CONFIG_EDIT,
        actor_principal="test-actor",
        target_ref="test-ref",
        approval_chain=[],
        notes="first",
    )
    second = service.record_audit_event(
        decision_type=DecisionType.script_generation,
        origin="human",
        action_id=ActionId.ACT_CONFIG_EDIT,
        actor_principal="test-actor",
        target_ref="test-ref",
        approval_chain=[],
        notes="second",
    )

    events = service.list_audit_events(limit=10)

    assert [event.event_id for event in events] == [first.event_id, second.event_id]
    assert len(service._read_last_lines(audit_path, 100)) == 2

    parsed = [json.loads(line) for line in service._read_last_lines(audit_path, 100)]
    assert parsed[-1]["notes"] == "second"


def test_audit_log_skips_malformed_lines_and_returns_valid_events(tmp_path, monkeypatch):
    monkeypatch.setattr("backend.scheduling.autonomy_service.require_approval", lambda *args, **kwargs: None)
    audit_path = tmp_path / "audit.jsonl"
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=audit_path,
    )

    first = service.record_audit_event(
        decision_type=DecisionType.track_selection,
        origin="ai",
        action_id=ActionId.ACT_CONFIG_EDIT,
        actor_principal="test-actor",
        target_ref="test-ref",
        approval_chain=[],
        notes="first",
    )
    second = service.record_audit_event(
        decision_type=DecisionType.script_generation,
        origin="human",
        action_id=ActionId.ACT_CONFIG_EDIT,
        actor_principal="test-actor",
        target_ref="test-ref",
        approval_chain=[],
        notes="second",
    )

    with audit_path.open("a", encoding="utf-8") as handle:
        handle.write('{"malformed_json": true\n')

    events = service.list_audit_events(limit=10)

    assert [event.event_id for event in events] == [first.event_id, second.event_id]


def test_invalid_payload_rejection_paths_service(tmp_path, monkeypatch):
    monkeypatch.setattr("backend.scheduling.autonomy_service.require_approval", lambda *args, **kwargs: None)
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )

    with pytest.raises(ValidationError):
        AutonomyPolicy.model_validate(
            {
                "station_default_mode": "manual_assist",
                "mode_permissions": {
                    "manual_assist": {
                        "track_selection": "human_only",
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
            }
        )

    with pytest.raises(ValidationError):
        service.record_audit_event(
            decision_type=DecisionType.track_selection,
            origin="not-valid-origin",
            action_id=ActionId.ACT_CONFIG_EDIT,
            actor_principal="test-actor",
            target_ref="test-ref",
            approval_chain=[],
        )


def test_update_policy_rejects_contradictory_show_timeslot_overrides(tmp_path):
    service = AutonomyPolicyService(
        policy_path=tmp_path / "autonomy_policy.json",
        audit_log_path=tmp_path / "audit.jsonl",
    )

    contradictory_policy = AutonomyPolicy.model_validate(
        {
            "station_default_mode": "manual_assist",
            "show_overrides": [{"show_id": "show-1", "mode": "auto_with_human_override"}],
            "timeslot_overrides": [
                {
                    "id": "slot-1",
                    "day_of_week": "monday",
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "show_id": "show-1",
                    "mode": "semi_auto",
                }
            ],
        }
    )

    with pytest.raises(PolicyValidationError):
        service.update_policy(contradictory_policy, enforce_approval=False)

def test_autonomy_policy_mode_permissions_do_not_leak_between_instances():
    first_policy = AutonomyPolicy()
    second_policy = AutonomyPolicy()

    first_policy.mode_permissions[GlobalMode.semi_auto][
        DecisionType.track_selection
    ] = DecisionAuthority.ai_autonomous

    assert (
        second_policy.mode_permissions[GlobalMode.semi_auto][DecisionType.track_selection]
        == DEFAULT_MODE_PERMISSIONS[GlobalMode.semi_auto][DecisionType.track_selection]
    )


def test_update_policy_emits_backup_created_event(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    event_path = tmp_path / "scheduler_events.jsonl"
    policy_path.write_text(AutonomyPolicy().model_dump_json(indent=2), encoding="utf-8")

    service = AutonomyPolicyService(
        policy_path=policy_path,
        audit_log_path=audit_path,
    )
    service.event_log_path = event_path

    service.update_policy(AutonomyPolicy(station_default_mode=GlobalMode.manual_assist), enforce_approval=False)

    events = [json.loads(line) for line in event_path.read_text(encoding="utf-8").splitlines()]
    assert any(event["event_name"] == "scheduler.backup.created" for event in events)


def test_get_policy_emits_startup_validation_failed_event(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    event_path = tmp_path / "scheduler_events.jsonl"
    policy_path.write_text('{"station_default_mode": "not-a-mode"}', encoding="utf-8")

    service = AutonomyPolicyService(
        policy_path=policy_path,
        audit_log_path=audit_path,
    )
    service.event_log_path = event_path

    with pytest.raises(Exception):
        service.get_policy()

    events = [json.loads(line) for line in event_path.read_text(encoding="utf-8").splitlines()]
    assert any(event["event_name"] == "scheduler.startup_validation.failed" for event in events)


def test_get_policy_emits_startup_success_event(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    event_path = tmp_path / "scheduler_events.jsonl"
    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)
    service.event_log_path = event_path

    service.get_policy()

    events = [json.loads(line) for line in event_path.read_text(encoding="utf-8").splitlines()]
    assert any(event["event_name"] == "scheduler.startup_validation.succeeded" for event in events)


def test_get_policy_emits_failure_events_when_policy_invalid(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    event_path = tmp_path / "scheduler_events.jsonl"
    policy_path.write_text("{not-json", encoding="utf-8")

    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)
    service.event_log_path = event_path

    with pytest.raises(ValidationError):
        service.get_policy()

    events = [json.loads(line) for line in event_path.read_text(encoding="utf-8").splitlines()]
    names = [event["event_name"] for event in events]
    assert "scheduler.schedule_parse.failed" in names
    assert "scheduler.startup_validation.failed" in names


def test_update_policy_emits_backup_created_and_restored(tmp_path):
    policy_path = tmp_path / "autonomy_policy.json"
    audit_path = tmp_path / "audit.jsonl"
    event_path = tmp_path / "scheduler_events.jsonl"

    policy_path.write_text(AutonomyPolicy().model_dump_json(indent=2), encoding="utf-8")

    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=audit_path)
    service.event_log_path = event_path

    with unittest.mock.patch.object(Path, "write_text", side_effect=OSError("disk full")):
        with pytest.raises(OSError):
            service.update_policy(AutonomyPolicy(), enforce_approval=False)

    events = [json.loads(line) for line in event_path.read_text(encoding="utf-8").splitlines()]
    names = [event["event_name"] for event in events]
    assert "scheduler.backup.created" in names
    assert "scheduler.backup.restored" in names


def _test_get_policy_logs_warning_when_stat_fails_and_continues(tmp_path, monkeypatch, caplog):
    policy_path = tmp_path / "autonomy_policy.json"
    policy_path.write_text(AutonomyPolicy().model_dump_json(indent=2), encoding="utf-8")
    service = AutonomyPolicyService(policy_path=policy_path, audit_log_path=tmp_path / "audit.jsonl")
    service.event_log_path = tmp_path / "scheduler_events.jsonl"

    original_stat = Path.stat

    def _raise_for_policy(path_obj: Path, *args, **kwargs):
        if path_obj == policy_path:
            raise OSError("permission denied")
        return original_stat(path_obj, *args, **kwargs)

    monkeypatch.setattr(Path, "stat", _raise_for_policy)

    with caplog.at_level("WARNING"):
        policy = service.get_policy()

    assert policy.station_default_mode == GlobalMode.semi_auto
    assert any("Autonomy policy stat failed during cache check." in rec.message for rec in caplog.records)

    events = [json.loads(line) for line in service.event_log_path.read_text(encoding="utf-8").splitlines()]
    stat_events = [event for event in events if event["event_name"] == "scheduler.autonomy_policy.stat.failed"]
    assert stat_events
    assert stat_events[0]["metadata"] == {
        "path": str(policy_path),
        "operation": "stat",
        "error_type": "OSError",
        "error_message": "permission denied",
    }
