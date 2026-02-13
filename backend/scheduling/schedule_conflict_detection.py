from __future__ import annotations

from datetime import datetime

from .scheduler_models import (
    ConflictSuggestion,
    ConflictType,
    ScheduleConflict,
    ScheduleRecord,
    TimelineBlock,
    UiState,
    WEEK_DAYS,
)


def detect_schedule_conflicts(
    schedules: list[ScheduleRecord],
    timeline: list[TimelineBlock],
) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    conflicts.extend(_detect_duplicate_identity_conflicts(schedules))
    conflicts.extend(_detect_invalid_windows(schedules))
    conflicts.extend(_detect_timeline_overlaps(schedules, timeline))
    conflicts.extend(_detect_ambiguous_active_conflicts(schedules))
    return conflicts


def _detect_duplicate_identity_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    ids: dict[str, str] = {}
    names: dict[str, str] = {}

    for schedule in sorted(schedules, key=lambda item: item.id):
        if schedule.id in ids:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.duplicate_id,
                    schedule_ids=[ids[schedule.id], schedule.id],
                    message=f"Duplicate id '{schedule.id}' detected; ids must be unique.",
                    suggestions=[
                        ConflictSuggestion(
                            action="rename_id",
                            message="Assign a unique id to one of the schedules.",
                        )
                    ],
                )
            )
        else:
            ids[schedule.id] = schedule.id

        normalized_name = schedule.name.strip().lower()
        if normalized_name in names:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.duplicate_name,
                    schedule_ids=[names[normalized_name], schedule.id],
                    message=(
                        f"Duplicate name '{schedule.name}' detected (case-insensitive); "
                        "names must be unique for operator clarity."
                    ),
                    suggestions=[
                        ConflictSuggestion(
                            action="rename_schedule",
                            message="Rename one schedule so operators can quickly distinguish entries.",
                        )
                    ],
                )
            )
        else:
            names[normalized_name] = schedule.id

    return conflicts


def _detect_invalid_windows(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        start_window = _effective_field(schedule, "start_window")
        end_window = _effective_field(schedule, "end_window")
        if start_window is None or end_window is None:
            continue

        start = datetime.fromisoformat(start_window.value.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_window.value.replace("Z", "+00:00"))
        if start > end:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.invalid_window,
                    schedule_ids=[schedule.id],
                    message=f"Schedule '{schedule.name}' has start_window after end_window.",
                    suggestions=[
                        ConflictSuggestion(
                            action="swap_window_bounds",
                            message="Swap the bounds or widen the window so start <= end.",
                        )
                    ],
                )
            )
    return conflicts


def _detect_timeline_overlaps(
    schedules: list[ScheduleRecord],
    timeline: list[TimelineBlock],
) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    schedule_map = {schedule.id: schedule for schedule in schedules}

    day_blocks: dict[str, list[TimelineBlock]] = {day: [] for day in WEEK_DAYS}
    for block in timeline:
        day_blocks[block.day_of_week].append(block)

    for day in WEEK_DAYS:
        blocks = sorted(day_blocks[day], key=lambda item: (item.start_time, item.end_time, item.schedule_id))
        for left, right in zip(blocks, blocks[1:]):
            if left.overnight:
                continue
            if right.start_time >= left.end_time:
                continue
            left_name = schedule_map[left.schedule_id].name if left.schedule_id in schedule_map else left.schedule_id
            right_name = schedule_map[right.schedule_id].name if right.schedule_id in schedule_map else right.schedule_id
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.overlap,
                    schedule_ids=[left.schedule_id, right.schedule_id],
                    message=(
                        f"Overlap on {day.title()}: {left_name} ({left.start_time}-{left.end_time}) "
                        f"and {right_name} ({right.start_time}-{right.end_time})."
                    ),
                    suggestions=[
                        ConflictSuggestion(
                            action="raise_priority",
                            message="Raise priority on the preferred block for deterministic dispatch.",
                        ),
                        ConflictSuggestion(
                            action="nudge_block",
                            message="Move or resize one block to remove overlap.",
                        ),
                    ],
                )
            )

    return conflicts


def _detect_ambiguous_active_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    standalone_active = [
        schedule
        for schedule in schedules
        if schedule.template_ref is None
        and schedule.enabled
        and _effective_field(schedule, "ui_state") == UiState.active
    ]
    ordered = sorted(standalone_active, key=lambda item: item.id)
    for left_index, left in enumerate(ordered):
        for right in ordered[left_index + 1 :]:
            if _effective_field(left, "timezone") != _effective_field(right, "timezone"):
                continue
            if _effective_field(left, "priority") != _effective_field(right, "priority"):
                continue
            if _effective_field(left, "schedule_spec") != _effective_field(right, "schedule_spec"):
                continue
            left_start, left_end = _effective_bounds(left)
            right_start, right_end = _effective_bounds(right)
            if not all((left_start, left_end, right_start, right_end)):
                continue
            if left_start <= right_end and right_start <= left_end:
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.ambiguous_active,
                        schedule_ids=[left.id, right.id],
                        message=(
                            "Ambiguous active schedules share timezone, priority, trigger, and overlapping windows. "
                            "Publish is blocked until one of these fields diverges."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="adjust_priority",
                                message="Change priority on one schedule to establish clear precedence.",
                            ),
                            ConflictSuggestion(
                                action="narrow_window",
                                message="Reduce one schedule window to remove overlap.",
                            ),
                        ],
                    )
                )
    return conflicts


def _effective_field(schedule: ScheduleRecord, field_name: str):
    top_level = getattr(schedule, field_name)
    if top_level is not None:
        return top_level
    if schedule.overrides:
        return getattr(schedule.overrides, field_name)
    return None


def _effective_bounds(schedule: ScheduleRecord):
    start_window = _effective_field(schedule, "start_window")
    end_window = _effective_field(schedule, "end_window")
    if start_window is None or end_window is None:
        return (None, None)
    return (
        datetime.fromisoformat(start_window.value.replace("Z", "+00:00")),
        datetime.fromisoformat(end_window.value.replace("Z", "+00:00")),
    )
