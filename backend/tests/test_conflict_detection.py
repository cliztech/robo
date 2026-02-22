from __future__ import annotations

import pytest

from backend.scheduling.autonomy_policy import (
    AutonomyPolicy,
    DecisionAuthority,
    DecisionType,
    GlobalMode,
    ShowOverride,
    TimeslotOverride,
)
from backend.scheduling.conflict_detection import PolicyConflict, detect_policy_conflicts


def test_detect_duplicate_timeslot_ids():
    """Test that duplicate timeslot override IDs are detected."""
    policy = AutonomyPolicy(
        timeslot_overrides=[
            TimeslotOverride(
                id="duplicate-id",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:00",
                mode=GlobalMode.manual_assist,
            ),
            TimeslotOverride(
                id="duplicate-id",
                day_of_week="tuesday",
                start_time="11:00",
                end_time="12:00",
                mode=GlobalMode.semi_auto,
            ),
        ]
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 1
    assert conflicts[0].conflict_type == "duplicate_timeslot_override_id"
    assert conflicts[0].override_ids == ["duplicate-id", "duplicate-id"]


def test_detect_overlapping_timeslots():
    """Test detection of overlapping timeslot overrides within the same day/show scope."""
    policy = AutonomyPolicy(
        timeslot_overrides=[
            TimeslotOverride(
                id="slot-1",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:30",
                show_id="show-A",
                mode=GlobalMode.manual_assist,
            ),
            TimeslotOverride(
                id="slot-2",
                day_of_week="monday",
                start_time="10:00",
                end_time="11:00",
                show_id="show-A",
                mode=GlobalMode.semi_auto,
            ),
        ]
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 1
    assert conflicts[0].conflict_type == "overlapping_timeslot_overrides"
    assert set(conflicts[0].override_ids) == {"slot-1", "slot-2"}


def test_detect_overlapping_timeslots_no_overlap_adjacent():
    """Test that adjacent timeslots (one ends when the next starts) do not conflict."""
    policy = AutonomyPolicy(
        timeslot_overrides=[
            TimeslotOverride(
                id="slot-1",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:00",
                show_id="show-A",
                mode=GlobalMode.manual_assist,
            ),
            TimeslotOverride(
                id="slot-2",
                day_of_week="monday",
                start_time="10:00",
                end_time="11:00",
                show_id="show-A",
                mode=GlobalMode.semi_auto,
            ),
        ]
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 0


def test_detect_show_timeslot_contradictions_mode_mismatch():
    """Test conflict when timeslot mode contradicts show override mode."""
    policy = AutonomyPolicy(
        show_overrides=[
            ShowOverride(show_id="show-A", mode=GlobalMode.semi_auto),
        ],
        timeslot_overrides=[
            TimeslotOverride(
                id="slot-1",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:00",
                show_id="show-A",
                mode=GlobalMode.manual_assist,  # Different mode
            ),
        ],
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 1
    assert conflicts[0].conflict_type == "show_timeslot_intent_conflict"
    assert conflicts[0].show_id == "show-A"


def test_detect_show_timeslot_contradictions_permission_mismatch():
    """Test conflict when timeslot permissions contradict show override permissions."""
    # Semi-auto usually has AI_WITH_HUMAN_APPROVAL for track selection.
    # We'll explicitly set show to AI_AUTONOMOUS and timeslot to HUMAN_ONLY (via default map or explicit)

    # Let's be explicit to avoid relying on defaults too much in test logic
    show_permissions = {
        DecisionType.track_selection: DecisionAuthority.ai_autonomous,
        DecisionType.script_generation: DecisionAuthority.ai_autonomous,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_autonomous,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_autonomous,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_autonomous,
    }

    timeslot_permissions = {
        DecisionType.track_selection: DecisionAuthority.human_only, # Conflict here
        DecisionType.script_generation: DecisionAuthority.ai_autonomous,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_autonomous,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_autonomous,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_autonomous,
    }

    policy = AutonomyPolicy(
        show_overrides=[
            ShowOverride(
                show_id="show-A",
                mode=GlobalMode.semi_auto,
                permissions=show_permissions
            ),
        ],
        timeslot_overrides=[
            TimeslotOverride(
                id="slot-1",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:00",
                show_id="show-A",
                mode=GlobalMode.semi_auto,
                permissions=timeslot_permissions,
            ),
        ],
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 1
    assert conflicts[0].conflict_type == "show_timeslot_intent_conflict"


def test_no_conflicts_valid_policy():
    """Test a policy with multiple overrides that are consistent."""
    policy = AutonomyPolicy(
        show_overrides=[
            ShowOverride(show_id="show-A", mode=GlobalMode.semi_auto),
        ],
        timeslot_overrides=[
            TimeslotOverride(
                id="slot-1",
                day_of_week="monday",
                start_time="09:00",
                end_time="10:00",
                show_id="show-A",
                mode=GlobalMode.semi_auto,
            ),
            TimeslotOverride(
                id="slot-2",
                day_of_week="tuesday",
                start_time="09:00",
                end_time="10:00",
                show_id="show-B", # Different show, no override
                mode=GlobalMode.manual_assist,
            ),
        ],
    )

    conflicts = detect_policy_conflicts(policy)
    assert len(conflicts) == 0
