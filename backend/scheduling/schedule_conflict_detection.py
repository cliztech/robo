from __future__ import annotations

from dataclasses import dataclass
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


@dataclass(frozen=True)
class TimeSegment:
    schedule_id: str
    day_of_week: str
    start_minute: int
    end_minute: int


def detect_schedule_conflicts(schedules: list[ScheduleRecord], timeline: list[TimelineBlock]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    conflicts.extend(_detect_duplicate_ids(schedules))
    conflicts.extend(_detect_duplicate_names(schedules))
    conflicts.extend(_detect_invalid_windows(schedules))
    conflicts.extend(_detect_template_ambiguity(schedules))
    conflicts.extend(_detect_ambiguous_dispatch_conflicts(schedules))
    conflicts.extend(_detect_timeline_overlaps(timeline, schedules))
    return sorted(conflicts, key=_conflict_sort_key)


def _conflict_sort_key(conflict: ScheduleConflict) -> tuple[str, tuple[str, ...], str]:
    return (conflict.conflict_type.value, tuple(sorted(conflict.schedule_ids)), conflict.message)


def _detect_duplicate_ids(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    seen: dict[str, str] = {}
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        first = seen.get(schedule.id)
        if first:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.duplicate_id,
                    schedule_ids=[first, schedule.id],
                    message=f"Duplicate id '{schedule.id}' detected. IDs must be unique.",
                    suggestions=[
                        ConflictSuggestion(action="rename_id", message="Assign a unique id to one schedule."),
                    ],
                )
            )
        else:
            seen[schedule.id] = schedule.id
    return conflicts


def _detect_duplicate_names(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
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
                message=f"Duplicate schedule name '{name_key}' detected (case-insensitive).",
                suggestions=[
                    ConflictSuggestion(
                        action="rename_schedule",
                        message="Rename one schedule so operators can distinguish entries quickly.",
                    )
                ],
            )
        )
    return conflicts


def _detect_invalid_windows(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        start_window = schedule.effective_start_window()
        end_window = schedule.effective_end_window()
        if not start_window or not end_window:
            continue
        start = datetime.fromisoformat(start_window.value.replace("Z", "+00:00"))
        end = datetime.fromisoformat(end_window.value.replace("Z", "+00:00"))
        if start <= end:
            continue
        conflicts.append(
            ScheduleConflict(
                conflict_type=ConflictType.invalid_window,
                schedule_ids=[schedule.id],
                message=f"{schedule.name}: start_window must be <= end_window.",
                suggestions=[
                    ConflictSuggestion(
                        action="swap_window_bounds",
                        message="Swap start/end values or widen the active window.",
                    )
                ],
            )
        )
    return conflicts


def _detect_template_ambiguity(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
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
                message=f"{schedule.name} defines {keys} at top-level and in overrides.",
                suggestions=[
                    ConflictSuggestion(
                        action="dedupe_override_keys",
                        message="Keep each runtime field in only one location.",
                    )
                ],
            )
        )
    return conflicts


def _detect_ambiguous_dispatch_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    sorted_schedules = sorted(schedules, key=lambda item: item.id)
    for index, left in enumerate(sorted_schedules):
        if not left.enabled or left.effective_ui_state() != UiState.active:
            continue

        for right in sorted_schedules[index + 1 :]:
            if not right.enabled or right.effective_ui_state() != UiState.active:
                continue
            if left.effective_timezone() != right.effective_timezone():
                continue
            if left.effective_priority() != right.effective_priority():
                continue

            left_spec = left.effective_schedule_spec()
            right_spec = right.effective_schedule_spec()
            if left_spec is None or right_spec is None or left_spec.model_dump() != right_spec.model_dump():
                continue

            left_start, left_end = _effective_bounds(left)
            right_start, right_end = _effective_bounds(right)
            if not all((left_start, left_end, right_start, right_end)):
                continue
            if left_start <= right_end and right_start <= left_end:
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.ambiguous_dispatch,
                        schedule_ids=sorted([left.id, right.id]),
                        message=(
                            "Active schedules have identical timezone, priority, schedule_spec, "
                            "and overlapping windows; dispatch precedence is ambiguous."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="change_priority",
                                message="Change one schedule priority to establish deterministic precedence.",
                            ),
                            ConflictSuggestion(
                                action="adjust_window",
                                message="Narrow one window to remove temporal overlap.",
                            ),
                        ],
                    )
                )
    return conflicts


def _detect_timeline_overlaps(timeline: list[TimelineBlock], schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    schedule_map = {schedule.id: schedule for schedule in schedules}
    by_day: dict[str, list[TimeSegment]] = {day: [] for day in WEEK_DAYS}

    for block in sorted(timeline, key=lambda item: (item.day_of_week, item.start_time, item.schedule_id)):
        for segment in _to_segments(block):
            by_day[segment.day_of_week].append(segment)

    conflicts: list[ScheduleConflict] = []
    for day, segments in by_day.items():
        ordered = sorted(segments, key=lambda item: (item.start_minute, item.end_minute, item.schedule_id))
        for index, left in enumerate(ordered):
            for right in ordered[index + 1 :]:
                if right.start_minute >= left.end_minute:
                    break
                if left.schedule_id == right.schedule_id:
                    continue
                overlap_start = max(left.start_minute, right.start_minute)
                overlap_end = min(left.end_minute, right.end_minute)
                left_name = schedule_map.get(left.schedule_id, left.schedule_id).name if left.schedule_id in schedule_map else left.schedule_id
                right_name = schedule_map.get(right.schedule_id, right.schedule_id).name if right.schedule_id in schedule_map else right.schedule_id
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.overlap,
                        schedule_ids=sorted([left.schedule_id, right.schedule_id]),
                        message=(
                            f"Overlap on {day.title()}: {left_name} conflicts with {right_name} during "
                            f"{_format_minutes(overlap_start)}-{_format_minutes(overlap_end)}."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="nudge_block",
                                message=f"Move one block so {day.title()} starts at or after {_format_minutes(overlap_end)}.",
                            ),
                            ConflictSuggestion(
                                action="shorten_duration",
                                message="Reduce one block duration to remove the overlap window.",
                            ),
                        ],
                    )
                )
    return conflicts


def _effective_bounds(schedule: ScheduleRecord) -> tuple[datetime | None, datetime | None]:
    start_window = schedule.effective_start_window()
    end_window = schedule.effective_end_window()
    if start_window is None or end_window is None:
        return (None, None)
    return (
        datetime.fromisoformat(start_window.value.replace("Z", "+00:00")),
        datetime.fromisoformat(end_window.value.replace("Z", "+00:00")),
    )


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
