from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from .schedule_conflict_detection import detect_schedule_conflicts
from .scheduler_models import (
    ContentRef,
    PreviewRequest,
    ScheduleBlock,
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


class SchedulerUiService:
    def __init__(self, schedules_path: Path = Path("config/schedules.json")) -> None:
        self.schedules_path = schedules_path
        self.schedules_path.parent.mkdir(parents=True, exist_ok=True)

    def get_ui_state(self) -> SchedulerUiState:
        envelope = self._load_and_migrate()
        timeline = self._build_timeline_blocks(envelope.schedules)
        conflicts = detect_schedule_conflicts(envelope.schedules, timeline)
        return SchedulerUiState(schedule_file=envelope, timeline_blocks=timeline, conflicts=conflicts)

    def update_schedules(self, schedules: list[ScheduleRecord]) -> SchedulerUiState:
        envelope = ScheduleEnvelope(schema_version=2, schedules=schedules)
        timeline = self._build_timeline_blocks(schedules)
        conflicts = detect_schedule_conflicts(schedules, timeline)
        if conflicts:
            messages = "; ".join(conflict.message for conflict in conflicts[:3])
            raise ValueError(f"Cannot save schedules while conflicts exist: {messages}")

        self.schedules_path.write_text(envelope.model_dump_json(indent=2), encoding="utf-8")
        return SchedulerUiState(schedule_file=envelope, timeline_blocks=timeline, conflicts=[])

    def validate_schedules(self, schedules: list[ScheduleRecord]):
        timeline = self._build_timeline_blocks(schedules)
        return detect_schedule_conflicts(schedules, timeline)

    def template_primitives(self) -> dict[TemplateType, ScheduleTemplatePrimitive]:
        return {
            TemplateType.weekday: ScheduleTemplatePrimitive(
                template=TemplateType.weekday,
                blocks=[
                    ScheduleBlock(day_of_week=day, start_time="09:00", end_time="17:00")
                    for day in WEEK_DAYS[:5]
                ],
            ),
            TemplateType.weekend: ScheduleTemplatePrimitive(
                template=TemplateType.weekend,
                blocks=[
                    ScheduleBlock(day_of_week=day, start_time="10:00", end_time="14:00")
                    for day in WEEK_DAYS[5:]
                ],
            ),
            TemplateType.overnight: ScheduleTemplatePrimitive(
                template=TemplateType.overnight,
                blocks=[
                    ScheduleBlock(day_of_week=day, start_time="22:00", end_time="06:00", overnight=True)
                    for day in WEEK_DAYS
                ],
            ),
        }

    def apply_template(self, request: TemplateApplyRequest) -> list[ScheduleRecord]:
        primitive = self.template_primitives()[request.template]

        schedules: list[ScheduleRecord] = []
        for block in primitive.blocks:
            spec = self._timeline_to_rrule(block.day_of_week, block.start_time)
            schedules.append(
                ScheduleRecord(
                    id=f"sch_{uuid4()}",
                    name=f"{request.template.value.title()} Template {block.day_of_week.title()}",
                    enabled=True,
                    timezone=request.timezone,
                    ui_state=UiState.active,
                    priority=50,
                    start_window=request.start_window,
                    end_window=request.end_window,
                    content_refs=[ContentRef.model_validate(ref.model_dump()) for ref in request.content_refs],
                    schedule_spec=ScheduleSpec(mode=ScheduleSpecMode.rrule, rrule=spec),
                )
            )
        return schedules

    def preview_schedule_spec(self, request: PreviewRequest) -> ScheduleSpecPreview:
        one_off = f"{request.start_date}T{request.start_time}:00"
        one_off_with_tz = datetime.fromisoformat(one_off).replace(
            tzinfo=ZoneInfo(request.timezone)
        ).isoformat()
        rrule = self._timeline_to_rrule(request.day_of_week, request.start_time)
        cron = self._timeline_to_cron(request.day_of_week, request.start_time)
        return ScheduleSpecPreview(one_off=one_off_with_tz, rrule=rrule, cron=cron)

    def _load_and_migrate(self) -> ScheduleEnvelope:
        if not self.schedules_path.exists():
            envelope = ScheduleEnvelope(schema_version=2, schedules=[])
            self.schedules_path.write_text(envelope.model_dump_json(indent=2), encoding="utf-8")
            return envelope

        raw = json.loads(self.schedules_path.read_text(encoding="utf-8"))
        migrated = self._migrate_payload(raw)
        envelope = ScheduleEnvelope.model_validate(migrated)

        timeline = self._build_timeline_blocks(envelope.schedules)
        conflicts = detect_schedule_conflicts(envelope.schedules, timeline)
        if conflicts:
            messages = "\n".join(f"- {conflict.message}" for conflict in conflicts)
            raise ValueError(f"schedules.json contains conflicts:\n{messages}")

        self.schedules_path.write_text(envelope.model_dump_json(indent=2), encoding="utf-8")
        return envelope

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
            spec = schedule.schedule_spec or (schedule.overrides.schedule_spec if schedule.overrides else None)
            if spec is None:
                continue

            if spec.mode == ScheduleSpecMode.one_off and spec.run_at:
                run_dt = datetime.fromisoformat(spec.run_at.replace("Z", "+00:00"))
                day = WEEK_DAYS[run_dt.weekday()]
                start_time = run_dt.strftime("%H:%M")
                blocks.append(
                    TimelineBlock(
                        schedule_id=schedule.id,
                        day_of_week=day,
                        start_time=start_time,
                        end_time=start_time,
                        overnight=False,
                        mode_hint=ScheduleSpecMode.one_off,
                    )
                )
            elif spec.mode == ScheduleSpecMode.cron and spec.cron:
                minute, hour, _, _, day_of_week = spec.cron.split()
                day = self._cron_day_to_name(day_of_week)
                blocks.append(
                    TimelineBlock(
                        schedule_id=schedule.id,
                        day_of_week=day,
                        start_time=f"{hour.zfill(2)}:{minute.zfill(2)}",
                        end_time=f"{hour.zfill(2)}:{minute.zfill(2)}",
                        overnight=False,
                        mode_hint=ScheduleSpecMode.cron,
                    )
                )
            elif spec.mode == ScheduleSpecMode.rrule and spec.rrule:
                blocks.append(self._rrule_to_block(schedule.id, spec.rrule))
        return blocks

    def _rrule_to_block(self, schedule_id: str, rrule: str) -> TimelineBlock:
        parts = dict(part.split("=", 1) for part in rrule.split(";") if "=" in part)
        by_day = parts.get("BYDAY", "MO").split(",")[0]
        day = {
            "MO": "monday",
            "TU": "tuesday",
            "WE": "wednesday",
            "TH": "thursday",
            "FR": "friday",
            "SA": "saturday",
            "SU": "sunday",
        }.get(by_day, "monday")
        hour = int(parts.get("BYHOUR", "0"))
        minute = int(parts.get("BYMINUTE", "0"))
        duration = int(parts.get("DURATION_MINUTES", "60"))
        end_hour = (hour * 60 + minute + duration) // 60
        end_minute = (hour * 60 + minute + duration) % 60
        overnight = end_hour >= 24
        end_hour = end_hour % 24

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
        return {
            "0": "sunday",
            "1": "monday",
            "2": "tuesday",
            "3": "wednesday",
            "4": "thursday",
            "5": "friday",
            "6": "saturday",
            "7": "sunday",
        }.get(day_of_week, "monday")
