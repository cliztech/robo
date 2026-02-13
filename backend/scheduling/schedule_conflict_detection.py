from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable

from .scheduler_models import (
    ConflictSuggestion,
    ConflictType,
    ScheduleConflict,
    ScheduleRecord,
    TimelineBlock,
    UiState,
    WEEK_DAYS,
)


@dataclass(frozen=True)
class TimeSegment:
    schedule_id: str
    day_of_week: str
    start_minute: int
    end_minute: int


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
    conflicts.extend(_detect_duplicate_ids(schedules))
    conflicts.extend(_detect_duplicate_names(schedules))
    conflicts.extend(_detect_invalid_windows(schedules))
    conflicts.extend(_detect_template_ambiguity(schedules))
    conflicts.extend(_detect_ambiguous_dispatch_conflicts(schedules))
    conflicts.extend(_detect_timeline_overlaps(timeline, schedules))
    return sorted(
        conflicts,
        key=lambda conflict: (conflict.conflict_type.value, tuple(conflict.schedule_ids), conflict.message),
    )


def _detect_duplicate_ids(schedules: Iterable[ScheduleRecord]) -> list[ScheduleConflict]:
    by_id: dict[str, list[ScheduleRecord]] = {}
    for schedule in schedules:
        by_id.setdefault(schedule.id, []).append(schedule)

    conflicts: list[ScheduleConflict] = []
    for schedule_id, group in sorted(by_id.items()):
        if len(group) < 2:
            continue
        conflicts.append(
            ScheduleConflict(
                conflict_type=ConflictType.duplicate_id,
                schedule_ids=[item.id for item in group],
                message=(
                    f"Duplicate schedule id '{schedule_id}' appears {len(group)} times. "
                    "Assign unique IDs before save/publish."
                ),
                suggestions=[
                    ConflictSuggestion(
                        action="assign_unique_id",
                        message="Rename one duplicated schedule id and retry publish.",
                    )
                ],
            )
        )
    return conflicts


def _detect_duplicate_names(schedules: Iterable[ScheduleRecord]) -> list[ScheduleConflict]:
    by_name: dict[str, list[ScheduleRecord]] = {}
    for schedule in schedules:
        by_name.setdefault(schedule.name.strip().lower(), []).append(schedule)

    conflicts: list[ScheduleConflict] = []
    for name_key, group in sorted(by_name.items()):
        if len(group) < 2:
            continue
        conflicts.append(
            ScheduleConflict(
                conflict_type=ConflictType.duplicate_name,
                schedule_ids=sorted(item.id for item in group),
                message=(
                    f"Duplicate schedule name '{name_key}' detected. Names are case-insensitive and must be unique."
                ),
                suggestions=[
                    ConflictSuggestion(
                        action="rename_schedule",
                        message="Rename one conflicting schedule for operator clarity.",
                    )
                ],
            )
        )
    return conflicts


def _detect_invalid_windows(schedules: Iterable[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        start_window = schedule.effective_start_window()
        end_window = schedule.effective_end_window()
        if start_window is None or end_window is None:
            continue
        start = datetime.fromisoformat(start_window.value.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_window.value.replace("Z", "+00:00"))
        if start <= end:
            continue
        conflicts.append(
            ScheduleConflict(
                conflict_type=ConflictType.invalid_window,
                schedule_ids=[schedule.id],
                message=f"{schedule.name} has start_window after end_window.",
                suggestions=[
                    ConflictSuggestion(
                        action="swap_window_bounds",
                        message="Swap start/end window values to restore a valid range.",
                    )
                ],
            )
        )
    return conflicts


def _detect_template_ambiguity(schedules: Iterable[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        duplicate_override_keys = schedule.duplicate_override_keys()
        if not duplicate_override_keys:
            continue
        keys = ", ".join(sorted(duplicate_override_keys))
        conflicts.append(
            ScheduleConflict(
                conflict_type=ConflictType.template_ambiguity,
                schedule_ids=[schedule.id],
                message=f"{schedule.name} defines {keys} in both top-level fields and overrides.",
                suggestions=[
                    ConflictSuggestion(
                        action="dedupe_override_keys",
                        message="Keep each runtime field in exactly one location (top-level or overrides).",
                    )
                ],
            )
        )
    return conflicts


def _detect_ambiguous_dispatch_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    sorted_schedules = sorted(schedules, key=lambda item: item.id)
    for index, left in enumerate(sorted_schedules):
        if not left.enabled or left.effective_ui_state() != "active":
            continue
        for right in sorted_schedules[index + 1 :]:
            if not right.enabled or right.effective_ui_state() != "active":
                continue
            left_timezone = left.effective_timezone()
            right_timezone = right.effective_timezone()
            if left_timezone is None or right_timezone is None or left_timezone != right_timezone:
                continue
            left_priority = left.effective_priority()
            right_priority = right.effective_priority()
            if left_priority is None or right_priority is None or left_priority != right_priority:
                continue
            left_spec = left.effective_schedule_spec()
            right_spec = right.effective_schedule_spec()
            if left_spec is None or right_spec is None or left_spec.model_dump() != right_spec.model_dump():
                continue
            left_start_window = left.effective_start_window()
            left_end_window = left.effective_end_window()
            right_start_window = right.effective_start_window()
            right_end_window = right.effective_end_window()
            if not all((left_start_window, left_end_window, right_start_window, right_end_window)):
                continue
            left_start = datetime.fromisoformat(left_start_window.value.replace("Z", "+00:00"))
            left_end = datetime.fromisoformat(left_end_window.value.replace("Z", "+00:00"))
            right_start = datetime.fromisoformat(right_start_window.value.replace("Z", "+00:00"))
            right_end = datetime.fromisoformat(right_end_window.value.replace("Z", "+00:00"))
            if left_start <= right_end and right_start <= left_end:
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.ambiguous_dispatch,
                        schedule_ids=[left.id, right.id],
                        message=(
                            "Active schedules share timezone, priority, trigger, and overlapping windows; "
                            "runtime dispatch is ambiguous."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="change_priority",
                                message="Raise one schedule priority to create deterministic precedence.",
                            ),
                            ConflictSuggestion(
                                action="adjust_window",
                                message="Narrow one activation window to remove overlap.",
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
def _detect_timeline_overlaps(
    timeline: list[TimelineBlock],
    schedules: list[ScheduleRecord],
) -> list[ScheduleConflict]:
    schedule_map = {schedule.id: schedule for schedule in schedules}
    by_day: dict[str, list[TimeSegment]] = {day: [] for day in WEEK_DAYS}

    for block in sorted(timeline, key=lambda item: (item.day_of_week, item.start_time, item.schedule_id)):
        for segment in _to_segments(block):
            by_day[segment.day_of_week].append(segment)

    conflicts: list[ScheduleConflict] = []
    for day, segments in by_day.items():
        ordered = sorted(segments, key=lambda seg: (seg.start_minute, seg.end_minute, seg.schedule_id))
        for idx, left in enumerate(ordered):
            for right in ordered[idx + 1 :]:
                if right.start_minute >= left.end_minute:
                    break
                if left.schedule_id == right.schedule_id:
                    continue
                left_name = schedule_map[left.schedule_id].name if left.schedule_id in schedule_map else left.schedule_id
                right_name = schedule_map[right.schedule_id].name if right.schedule_id in schedule_map else right.schedule_id
                overlap_start = max(left.start_minute, right.start_minute)
                overlap_end = min(left.end_minute, right.end_minute)
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.overlap,
                        schedule_ids=sorted([left.schedule_id, right.schedule_id]),
                        message=(
                            f"Overlap on {day.title()}: {left_name} and {right_name} conflict for "
                            f"{_format_minutes(overlap_start)}-{_format_minutes(overlap_end)}."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="nudge_block",
                                message=(
                                    f"Move one block so {day.title()} starts at or after "
                                    f"{_format_minutes(overlap_end)}."
                                ),
                            ),
                            ConflictSuggestion(
                                action="shorten_duration",
                                message="Reduce one block duration to remove the overlap window.",
                            ),
                        ],
                    )
                )
    return conflicts


def _to_segments(block: TimelineBlock) -> list[TimeSegment]:
    start = _minutes(block.start_time)
    end = _minutes(block.end_time)
    if block.overnight and end <= start:
        next_day = WEEK_DAYS[(WEEK_DAYS.index(block.day_of_week) + 1) % len(WEEK_DAYS)]
        return [
            TimeSegment(schedule_id=block.schedule_id, day_of_week=block.day_of_week, start_minute=start, end_minute=24 * 60),
            TimeSegment(schedule_id=block.schedule_id, day_of_week=next_day, start_minute=0, end_minute=end),
        ]
    if end < start:
        end = start
    return [TimeSegment(schedule_id=block.schedule_id, day_of_week=block.day_of_week, start_minute=start, end_minute=end)]


def _minutes(value: str) -> int:
    hours, minutes = value.split(":", maxsplit=1)
    return int(hours) * 60 + int(minutes)


def _format_minutes(total: int) -> str:
    return f"{(total // 60) % 24:02d}:{total % 60:02d}"
