from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from .autonomy_policy import AutonomyPolicy, DecisionType, TimeslotOverride


@dataclass(frozen=True)
class PolicyConflict:
    conflict_type: str
    message: str
    override_ids: list[str]
    day_of_week: Optional[str] = None
    time_ranges: Optional[list[str]] = None
    show_id: Optional[str] = None
    suggested_resolution: str = ""

    def to_error_detail(self) -> dict[str, object]:
        return {
            "conflict_type": self.conflict_type,
            "message": self.message,
            "override_ids": self.override_ids,
            "day_of_week": self.day_of_week,
            "time_ranges": self.time_ranges or [],
            "show_id": self.show_id,
            "suggested_resolution": self.suggested_resolution,
        }


def detect_policy_conflicts(policy: AutonomyPolicy) -> list[PolicyConflict]:
    conflicts: list[PolicyConflict] = []
    conflicts.extend(_detect_duplicate_timeslot_ids(policy.timeslot_overrides))
    conflicts.extend(_detect_overlapping_timeslots(policy.timeslot_overrides))
    conflicts.extend(_detect_show_timeslot_contradictions(policy))
    return conflicts


def _detect_duplicate_timeslot_ids(overrides: Iterable[TimeslotOverride]) -> list[PolicyConflict]:
    by_id: dict[str, list[TimeslotOverride]] = {}
    for override in overrides:
        by_id.setdefault(override.id, []).append(override)

    conflicts: list[PolicyConflict] = []
    for override_id, duplicate_overrides in by_id.items():
        if len(duplicate_overrides) < 2:
            continue

        first = duplicate_overrides[0]
        conflicts.append(
            PolicyConflict(
                conflict_type="duplicate_timeslot_override_id",
                message=(
                    f"Timeslot override id '{override_id}' is duplicated {len(duplicate_overrides)} times. "
                    "Duplicate IDs make targeted updates ambiguous."
                ),
                override_ids=[item.id for item in duplicate_overrides],
                day_of_week=first.day_of_week,
                time_ranges=[f"{item.start_time}-{item.end_time}" for item in duplicate_overrides],
                show_id=first.show_id,
                suggested_resolution=(
                    "Assign a unique id to each timeslot override so operators can address conflicts "
                    "without affecting unrelated slots."
                ),
            )
        )
    return conflicts


def _detect_overlapping_timeslots(overrides: Iterable[TimeslotOverride]) -> list[PolicyConflict]:
    grouped: dict[tuple[str, Optional[str]], list[TimeslotOverride]] = {}
    for override in overrides:
        grouped.setdefault((override.day_of_week, override.show_id), []).append(override)

    conflicts: list[PolicyConflict] = []
    for (day_of_week, show_id), group in grouped.items():
        for index, left in enumerate(group):
            left_start = _minutes(left.start_time)
            left_end = _minutes(left.end_time)
            for right in group[index + 1 :]:
                right_start = _minutes(right.start_time)
                right_end = _minutes(right.end_time)
                if _overlaps(left_start, left_end, right_start, right_end):
                    conflicts.append(
                        PolicyConflict(
                            conflict_type="overlapping_timeslot_overrides",
                            message=(
                                "Timeslot overrides overlap within the same day/show scope, "
                                "which creates ambiguous runtime precedence."
                            ),
                            override_ids=[left.id, right.id],
                            day_of_week=day_of_week,
                            show_id=show_id,
                            time_ranges=[f"{left.start_time}-{left.end_time}", f"{right.start_time}-{right.end_time}"],
                            suggested_resolution=(
                                "Split or adjust these ranges so each minute is covered by exactly one "
                                "timeslot override for this day/show scope."
                            ),
                        )
                    )
    return conflicts


def _detect_show_timeslot_contradictions(policy: AutonomyPolicy) -> list[PolicyConflict]:
    show_overrides = {override.show_id: override for override in policy.show_overrides}
    conflicts: list[PolicyConflict] = []

    for timeslot in policy.timeslot_overrides:
        if not timeslot.show_id:
            continue

        show_override = show_overrides.get(timeslot.show_id)
        if show_override is None:
            continue

        timeslot_permissions = timeslot.permissions or policy.mode_permissions[timeslot.mode]
        show_permissions = show_override.permissions or policy.mode_permissions[show_override.mode]
        mode_conflict = timeslot.mode != show_override.mode
        permissions_conflict = any(
            timeslot_permissions[decision] != show_permissions[decision] for decision in DecisionType
        )
        if not mode_conflict and not permissions_conflict:
            continue

        conflicts.append(
            PolicyConflict(
                conflict_type="show_timeslot_intent_conflict",
                message=(
                    f"Timeslot override '{timeslot.id}' contradicts show override intent for show "
                    f"'{timeslot.show_id}'. Operators may expect a single behavior for this show."
                ),
                override_ids=[timeslot.id, f"show:{timeslot.show_id}"],
                day_of_week=timeslot.day_of_week,
                show_id=timeslot.show_id,
                time_ranges=[f"{timeslot.start_time}-{timeslot.end_time}"],
                suggested_resolution=(
                    "Align mode/permissions between show and timeslot overrides, or remove one layer "
                    "if the difference is not intentional."
                ),
            )
        )

    return conflicts


def _minutes(value: str) -> int:
    hours, minutes = value.split(":", maxsplit=1)
    return int(hours) * 60 + int(minutes)


def _overlaps(left_start: int, left_end: int, right_start: int, right_end: int) -> bool:
    return left_start < right_end and right_start < left_end
