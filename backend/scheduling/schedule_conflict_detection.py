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


def detect_schedule_conflicts(
    schedules: list[ScheduleRecord],
    timeline: list[TimelineBlock],
) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    conflicts.extend(_detect_duplicate_identity_conflicts(schedules))
    conflicts.extend(_detect_invalid_windows(schedules))
    conflicts.extend(_detect_timeline_overlaps(timeline, schedules))
    conflicts.extend(_detect_ambiguous_active_conflicts(schedules))
    return sorted(conflicts, key=lambda item: (item.conflict_type.value, tuple(item.schedule_ids), item.message))


def _detect_duplicate_identity_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    by_id: dict[str, str] = {}
    by_name: dict[str, str] = {}

    for schedule in sorted(schedules, key=lambda item: item.id):
        if schedule.id in by_id:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.duplicate_id,
                    schedule_ids=sorted([by_id[schedule.id], schedule.id]),
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
            by_id[schedule.id] = schedule.id

        normalized = schedule.name.strip().lower()
        if normalized in by_name:
            conflicts.append(
                ScheduleConflict(
                    conflict_type=ConflictType.duplicate_name,
                    schedule_ids=sorted([by_name[normalized], schedule.id]),
                    message=f"Duplicate name '{schedule.name}' detected (case-insensitive); names must be unique.",
                    suggestions=[
                        ConflictSuggestion(
                            action="rename_schedule",
                            message="Rename one schedule so operators can quickly distinguish entries.",
                        )
                    ],
                )
            )
        else:
            by_name[normalized] = schedule.id

    return conflicts


def _detect_invalid_windows(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    for schedule in sorted(schedules, key=lambda item: item.id):
        start_window = schedule.effective_start_window()
        end_window = schedule.effective_end_window()
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
                            message="Swap start/end values so start <= end.",
                        )
                    ],
                )
            )
    return conflicts


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
        ordered = sorted(segments, key=lambda item: (item.start_minute, item.end_minute, item.schedule_id))
        for index, left in enumerate(ordered):
            for right in ordered[index + 1 :]:
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
                            f"Overlap on {day.title()}: {left_name} and {right_name} overlap "
                            f"for {_format_minutes(overlap_start)}-{_format_minutes(overlap_end)}."
                        ),
                        suggestions=[
                            ConflictSuggestion(
                                action="nudge_block",
                                message="Move one block so it starts at or after the overlap end.",
                            ),
                            ConflictSuggestion(
                                action="shorten_duration",
                                message="Reduce one block duration to remove the overlap window.",
                            ),
                        ],
                    )
                )
    return conflicts


def _detect_ambiguous_active_conflicts(schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
    conflicts: list[ScheduleConflict] = []
    active = [
        schedule
        for schedule in sorted(schedules, key=lambda item: item.id)
        if schedule.enabled and schedule.template_ref is None and schedule.effective_ui_state() == UiState.active
    ]

    for index, left in enumerate(active):
        for right in active[index + 1 :]:
            if left.effective_timezone() != right.effective_timezone():
                continue
            if left.effective_priority() != right.effective_priority():
                continue
            if left.effective_schedule_spec() != right.effective_schedule_spec():
                continue

            left_start = left.effective_start_window()
            left_end = left.effective_end_window()
            right_start = right.effective_start_window()
            right_end = right.effective_end_window()
            if not all((left_start, left_end, right_start, right_end)):
                continue

            left_start_dt = datetime.fromisoformat(left_start.value.replace("Z", "+00:00"))
            left_end_dt = datetime.fromisoformat(left_end.value.replace("Z", "+00:00"))
            right_start_dt = datetime.fromisoformat(right_start.value.replace("Z", "+00:00"))
            right_end_dt = datetime.fromisoformat(right_end.value.replace("Z", "+00:00"))
            if left_start_dt <= right_end_dt and right_start_dt <= left_end_dt:
                conflicts.append(
                    ScheduleConflict(
                        conflict_type=ConflictType.ambiguous_active,
                        schedule_ids=sorted([left.id, right.id]),
                        message=(
                            "Ambiguous active schedules share timezone, priority, trigger, and overlapping windows."
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
