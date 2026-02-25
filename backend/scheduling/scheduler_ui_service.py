from __future__ import annotations

import json
import logging
import re
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from .observability import emit_scheduler_event
from .schedule_conflict_detection import detect_schedule_conflicts
from .scheduler_models import (
    ConflictType,
    PreviewRequest,
    ScheduleBlock,
    ScheduleConflict,
    ScheduleEnvelope,
    ScheduleRecord,
    ScheduleSpec,
    ScheduleSpecMode,
    ScheduleSpecPreview,
    ScheduleTemplatePrimitive,
    SchedulerUiState,
    TemplateApplyRequest,
    TemplateType,
    TimelineBlock,
    UiState,
    WEEK_DAYS,
)

DEFAULT_START = "1970-01-01T00:00:00Z"
DEFAULT_END = "9999-12-31T23:59:59Z"

TEMPLATE_PRIMITIVES: dict[TemplateType, list[tuple[str, str, str, bool]]] = {
    TemplateType.weekday: [(day, "09:00", "17:00", False) for day in WEEK_DAYS[:5]],
    TemplateType.weekend: [(day, "10:00", "14:00", False) for day in WEEK_DAYS[5:]],
    TemplateType.overnight: [(day, "22:00", "06:00", True) for day in WEEK_DAYS],
}

CRON_NUMERIC_RE = re.compile(r"^\d+$")

logger = logging.getLogger(__name__)


class SchedulerUiService:
    def __init__(
        self,
        schedules_path: Path = Path("config/schedules.json"),
        schema_path: Path = Path("config/schemas/schedules.schema.json"),
    ) -> None:
        self.schedules_path = schedules_path
        self.schema_path = schema_path
        self.schedules_path.parent.mkdir(parents=True, exist_ok=True)
        self._cached_envelope: ScheduleEnvelope | None = None
        self._cached_ui_state: SchedulerUiState | None = None
        self._last_mtime: float | None = None

    def get_ui_state(self) -> SchedulerUiState:
        envelope = self._load_and_migrate()

        # Optimization: If the loaded envelope is the exact same object as the one in our
        # cached UI state, we can return the cached state immediately without re-running
        # conflict detection and timeline building.
        if self._cached_ui_state is not None and self._cached_ui_state.schedule_file is envelope:
            return self._cached_ui_state

        timeline = self._build_timeline_blocks(envelope.schedules)
        conflicts = detect_schedule_conflicts(envelope.schedules, timeline)

        state = SchedulerUiState(schedule_file=envelope, timeline_blocks=timeline, conflicts=conflicts)
        self._cached_ui_state = state
        return state

    def update_schedules(self, schedules: list[ScheduleRecord]) -> SchedulerUiState:
        envelope = ScheduleEnvelope(schema_version=2, schedules=schedules)
        self._validate_schema(envelope)

        conflicts = self.validate_schedules(schedules)
        if conflicts:
            raise ValueError(self._format_conflict_error(conflicts))

        self.schedules_path.write_text(envelope.model_dump_json(indent=2), encoding="utf-8")
        timeline = self._build_timeline_blocks(schedules)

        # We don't update cache here immediately because we rely on mtime check in _load_and_migrate
        # to refresh the data on next read. The file write above changes mtime.
        return SchedulerUiState(schedule_file=envelope, timeline_blocks=timeline, conflicts=[])

    def publish_schedules(self, schedules: list[ScheduleRecord]) -> dict[str, object]:
        ui_state = self.update_schedules(schedules)
        return {
            "status": "published",
            "published_at": datetime.now(tz=ZoneInfo("UTC")).isoformat(),
            "schedule_count": len(ui_state.schedule_file.schedules),
            "timeline_block_count": len(ui_state.timeline_blocks),
        }

    def validate_schedules(self, schedules: list[ScheduleRecord]) -> list[ScheduleConflict]:
        timeline = self._build_timeline_blocks(schedules)
        return detect_schedule_conflicts(schedules, timeline)

    def template_primitives(self) -> dict[TemplateType, ScheduleTemplatePrimitive]:
        return {
            template: ScheduleTemplatePrimitive(
                template=template,
                blocks=[
                    ScheduleBlock(day_of_week=day, start_time=start, end_time=end, overnight=overnight)
                    for day, start, end, overnight in blocks
                ],
            )
            for template, blocks in TEMPLATE_PRIMITIVES.items()
        }

    def apply_template(self, request: TemplateApplyRequest) -> list[ScheduleRecord]:
        primitive = self.template_primitives()[request.template]
        schedules: list[ScheduleRecord] = []
        for block in primitive.blocks:
            spec = self._timeline_to_rrule(block.day_of_week, block.start_time)
            schedules.append(
                ScheduleRecord(
                    id=f"sch_{uuid4().hex[:12]}",
                    name=f"{request.template.value.title()} Template {block.day_of_week.title()}",
                    enabled=True,
                    template_ref={"id": f"tpl_{request.template.value}_baseline", "version": 1},
                    overrides={
                        "timezone": request.timezone,
                        "ui_state": UiState.active,
                        "priority": 50,
                        "start_window": request.start_window,
                        "end_window": request.end_window,
                        "content_refs": request.content_refs,
                        "schedule_spec": ScheduleSpec(mode=ScheduleSpecMode.rrule, rrule=spec),
                    },
                )
            )
        return schedules

    def preview_schedule_spec(self, request: PreviewRequest) -> ScheduleSpecPreview:
        one_off = f"{request.start_date}T{request.start_time}:00"
        one_off_with_tz = datetime.fromisoformat(one_off).replace(tzinfo=ZoneInfo(request.timezone)).isoformat()
        return ScheduleSpecPreview(
            one_off=one_off_with_tz,
            rrule=self._timeline_to_rrule(request.day_of_week, request.start_time),
            cron=self._timeline_to_cron(request.day_of_week, request.start_time),
        )

    def _load_and_migrate(self) -> ScheduleEnvelope:
        if not self.schedules_path.exists():
            envelope = ScheduleEnvelope(schema_version=2, schedules=[])
            self.schedules_path.write_text(envelope.model_dump_json(indent=2), encoding="utf-8")
            self._cached_envelope = envelope
            try:
                self._last_mtime = self.schedules_path.stat().st_mtime
            except OSError:
                self._last_mtime = None
            return envelope

        try:
            mtime = self.schedules_path.stat().st_mtime
            if self._cached_envelope is not None and self._last_mtime == mtime:
                return self._cached_envelope
        except OSError as error:
            logger.warning(
                "Scheduler schedule file stat failed during cache check.",
                extra={
                    "path": str(self.schedules_path),
                    "operation": "stat",
                    "error_type": type(error).__name__,
                    "error_message": str(error),
                },
            )
            emit_scheduler_event(
                logger,
                event_name="scheduler.schedule_file.stat.failed",
                level="warning",
                message="Schedule file stat failed during cache invalidation; continuing with fallback read path.",
                metadata={
                    "path": str(self.schedules_path),
                    "operation": "stat",
                    "error_type": type(error).__name__,
                    "error_message": str(error),
                },
            )

        content = self.schedules_path.read_text(encoding="utf-8")
        raw = json.loads(content)
        envelope = ScheduleEnvelope.model_validate(self._migrate_payload(raw))
        self._validate_schema(envelope)

        conflicts = self.validate_schedules(envelope.schedules)
        if conflicts:
            raise ValueError(self._format_conflict_error(conflicts))

        # Only write back if the content has changed or we want to enforce formatting/migration
        serialized = envelope.model_dump_json(indent=2)
        # Check if semantic content or formatting differs before writing
        if serialized != content:
            self.schedules_path.write_text(serialized, encoding="utf-8")

        self._cached_envelope = envelope
        try:
            self._last_mtime = self.schedules_path.stat().st_mtime
        except OSError:
            self._last_mtime = None

        return envelope

    def _validate_schema(self, envelope: ScheduleEnvelope) -> None:
        data = envelope.model_dump(mode="json")
        errors: list[str] = []

        if data.get("schema_version") != 2:
            errors.append("schema_version must be 2")

        schedules = data.get("schedules")
        if not isinstance(schedules, list):
            errors.append("schedules must be an array")
            schedules = []

        allowed_override_keys = {
            "timezone",
            "ui_state",
            "priority",
            "start_window",
            "end_window",
            "content_refs",
            "schedule_spec",
        }
        for index, schedule in enumerate(schedules):
            if not isinstance(schedule, dict):
                errors.append(f"schedules[{index}] must be an object")
                continue

            for key in ("id", "name", "enabled"):
                if key not in schedule:
                    errors.append(f"schedules[{index}] missing required field '{key}'")

            if not isinstance(schedule.get("id"), str) or not schedule.get("id", "").strip():
                errors.append(f"schedules[{index}].id must be a non-empty string")
            if not isinstance(schedule.get("name"), str) or not schedule.get("name", "").strip():
                errors.append(f"schedules[{index}].name must be a non-empty string")
            if not isinstance(schedule.get("enabled"), bool):
                errors.append(f"schedules[{index}].enabled must be a boolean")

            overrides = schedule.get("overrides")
            if overrides is not None:
                if not isinstance(overrides, dict):
                    errors.append(f"schedules[{index}].overrides must be an object")
                else:
                    unknown = set(overrides) - allowed_override_keys
                    if unknown:
                        errors.append(
                            f"schedules[{index}].overrides contains unsupported keys: {sorted(unknown)}"
                        )

        if errors:
            raise ValueError("Schema validation failed: " + "; ".join(errors[:5]))

    def _migrate_payload(self, raw: object) -> dict:
        if isinstance(raw, list):
            data = {"schema_version": 2, "schedules": raw}
        elif isinstance(raw, dict):
            data = {"schema_version": raw.get("schema_version", 2), "schedules": raw.get("schedules", [])}
        else:
            raise ValueError("Invalid schedules.json root. Expected array or object")

        normalized_schedules: list[dict] = []
        for schedule in data["schedules"]:
            item = dict(schedule)
            item.setdefault("priority", 50)
            item.setdefault("ui_state", "active" if item.get("enabled", False) else "paused")
            item.setdefault("start_window", {"type": "datetime", "value": DEFAULT_START})
            item.setdefault("end_window", {"type": "datetime", "value": DEFAULT_END})

            if "schedule_spec" not in item:
                if item.get("run_at"):
                    item["schedule_spec"] = {"mode": "one_off", "run_at": item["run_at"]}
                elif item.get("rrule"):
                    item["schedule_spec"] = {"mode": "rrule", "rrule": item["rrule"]}
                elif item.get("cron"):
                    item["schedule_spec"] = {"mode": "cron", "cron": item["cron"]}

            normalized_schedules.append(item)

        return {"schema_version": 2, "schedules": normalized_schedules}

    def _build_timeline_blocks(self, schedules: list[ScheduleRecord]) -> list[TimelineBlock]:
        blocks: list[TimelineBlock] = []
        for schedule in schedules:
            spec = schedule.effective_schedule_spec()
            if spec is None:
                continue

            if spec.mode == ScheduleSpecMode.one_off and spec.run_at:
                run_dt = datetime.fromisoformat(spec.run_at.replace("Z", "+00:00"))
                start_time = run_dt.strftime("%H:%M")
                blocks.append(
                    TimelineBlock(
                        schedule_id=schedule.id,
                        day_of_week=WEEK_DAYS[run_dt.weekday()],
                        start_time=start_time,
                        end_time=start_time,
                        overnight=False,
                        mode_hint=ScheduleSpecMode.one_off,
                    )
                )
            elif spec.mode == ScheduleSpecMode.cron and spec.cron:
                try:
                    minute, hour, _, _, day_of_week = spec.cron.split()
                    parsed_time = self._parse_numeric_cron_time(hour=hour, minute=minute, schedule_id=schedule.id, cron=spec.cron)
                    if parsed_time is None:
                        continue
                    time_val = f"{parsed_time[0]:02d}:{parsed_time[1]:02d}"
                    blocks.append(
                        TimelineBlock(
                            schedule_id=schedule.id,
                            day_of_week=self._cron_day_to_name(day_of_week),
                            start_time=time_val,
                            end_time=time_val,
                            overnight=False,
                            mode_hint=ScheduleSpecMode.cron,
                        )
                    )
                except ValueError as error:
                    logger.warning(
                        "Skipping timeline block for schedule_id=%s: %s",
                        schedule.id,
                        error,
                    )
            elif spec.mode == ScheduleSpecMode.rrule and spec.rrule:
                blocks.append(self._rrule_to_block(schedule.id, spec.rrule))
        return blocks

    def _parse_numeric_cron_time(
        self,
        *,
        hour: str,
        minute: str,
        schedule_id: str,
        cron: str,
    ) -> tuple[int, int] | None:
        """Return exact hour/minute for timeline blocks, else skip unsupported cron forms.

        Timeline blocks represent a single point-in-time anchor. Wildcard, step, or range
        expressions in minute/hour fields are valid cron, but not representable as one
        deterministic point. In those cases we emit a warning and skip timeline projection.
        """
        if not CRON_NUMERIC_RE.fullmatch(hour) or not CRON_NUMERIC_RE.fullmatch(minute):
            logger.warning(
                "Skipping timeline block for schedule_id=%s: unsupported cron time fields (%s)",
                schedule_id,
                cron,
            )
            return None

        parsed_hour = int(hour)
        parsed_minute = int(minute)
        if not (0 <= parsed_hour <= 23 and 0 <= parsed_minute <= 59):
            logger.warning(
                "Skipping timeline block for schedule_id=%s: out-of-range cron time fields (%s)",
                schedule_id,
                cron,
            )
            return None
        return parsed_hour, parsed_minute

    def _rrule_to_block(self, schedule_id: str, rrule: str) -> TimelineBlock:
        parts = dict(part.split("=", 1) for part in rrule.split(";") if "=" in part)
        by_day = parts.get("BYDAY", "MO").split(",")[0]
        day = {"MO": "monday", "TU": "tuesday", "WE": "wednesday", "TH": "thursday", "FR": "friday", "SA": "saturday", "SU": "sunday"}.get(by_day, "monday")
        hour = int(parts.get("BYHOUR", "0"))
        minute = int(parts.get("BYMINUTE", "0"))
        duration = int(parts.get("DURATION_MINUTES", "60"))

        end_total_minutes = (hour * 60) + minute + duration
        end_hour, end_minute = divmod(end_total_minutes % (24 * 60), 60)
        overnight = end_total_minutes >= 24 * 60

        return TimelineBlock(
            schedule_id=schedule_id,
            day_of_week=day,
            start_time=f"{hour:02d}:{minute:02d}",
            end_time=f"{end_hour:02d}:{end_minute:02d}",
            overnight=overnight,
            mode_hint=ScheduleSpecMode.rrule,
        )

    def _timeline_to_rrule(self, day_of_week: str, start_time: str) -> str:
        day_code = {
            "monday": "MO",
            "tuesday": "TU",
            "wednesday": "WE",
            "thursday": "TH",
            "friday": "FR",
            "saturday": "SA",
            "sunday": "SU",
        }[day_of_week]
        hour, minute = start_time.split(":")
        return f"FREQ=WEEKLY;INTERVAL=1;BYDAY={day_code};BYHOUR={int(hour)};BYMINUTE={int(minute)};BYSECOND=0"

    def _timeline_to_cron(self, day_of_week: str, start_time: str) -> str:
        cron_day = {
            "sunday": "0",
            "monday": "1",
            "tuesday": "2",
            "wednesday": "3",
            "thursday": "4",
            "friday": "5",
            "saturday": "6",
        }[day_of_week]
        hour, minute = start_time.split(":")
        return f"{int(minute)} {int(hour)} * * {cron_day}"

    def _cron_day_to_name(self, day_of_week: str) -> str:
        supported_desc = "single numeric day-of-week token in range 0-7"
        unsupported_pattern_tokens = ("*", ",", "-", "/")
        if any(token in day_of_week for token in unsupported_pattern_tokens):
            raise ValueError(
                "Unsupported cron day-of-week pattern "
                f"'{day_of_week}'. Scheduler UI supports only a {supported_desc}."
            )

        day_name = {
            "0": "sunday",
            "1": "monday",
            "2": "tuesday",
            "3": "wednesday",
            "4": "thursday",
            "5": "friday",
            "6": "saturday",
            "7": "sunday",
        }.get(day_of_week)

        if day_name is None:
            raise ValueError(
                "Unsupported cron day-of-week token "
                f"'{day_of_week}'. Scheduler UI supports only a {supported_desc}."
            )

        return day_name

    def _format_conflict_error(self, conflicts: list[ScheduleConflict]) -> str:
        hard_types = {
            ConflictType.overlap,
            ConflictType.invalid_window,
            ConflictType.duplicate_id,
            ConflictType.duplicate_name,
            ConflictType.template_ambiguity,
            ConflictType.ambiguous_dispatch,
        }
        blocking = [conflict for conflict in conflicts if conflict.conflict_type in hard_types]
        details = "; ".join(conflict.message for conflict in blocking[:3])
        return f"Cannot save/publish schedules due to conflicts: {details}"
