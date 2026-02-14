from __future__ import annotations

from datetime import datetime, time
from enum import Enum
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator, model_validator

WEEK_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]

SCHEDULE_OVERRIDE_FIELDS = (
    "timezone",
    "ui_state",
    "priority",
    "start_window",
    "end_window",
    "content_refs",
    "schedule_spec",
)


class UiState(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    archived = "archived"


class ScheduleSpecMode(str, Enum):
    one_off = "one_off"
    rrule = "rrule"
    cron = "cron"


class ScheduleWindow(BaseModel):
    type: Literal["datetime"] = "datetime"
    value: str

    @field_validator("value")
    @classmethod
    def validate_iso_datetime(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class ContentRef(BaseModel):
    type: Literal["prompt", "script", "playlist", "music_bed"]
    ref_id: str = Field(min_length=1)
    label: str | None = None
    weight: int | None = Field(default=None, ge=1, le=100)


class TemplateRef(BaseModel):
    id: str = Field(min_length=1)
    version: int = Field(ge=1)


class ScheduleSpec(BaseModel):
    mode: ScheduleSpecMode
    run_at: str | None = None
    rrule: str | None = None
    cron: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "ScheduleSpec":
        if self.mode == ScheduleSpecMode.one_off:
            if not self.run_at:
                raise ValueError("mode=one_off requires run_at")
            datetime.fromisoformat(self.run_at.replace("Z", "+00:00"))
            if self.rrule or self.cron:
                raise ValueError("mode=one_off only allows run_at")
        elif self.mode == ScheduleSpecMode.rrule:
            if not self.rrule or "FREQ=" not in self.rrule:
                raise ValueError("mode=rrule requires rrule containing FREQ=")
            if self.run_at or self.cron:
                raise ValueError("mode=rrule only allows rrule")
        elif self.mode == ScheduleSpecMode.cron:
            if not self.cron:
                raise ValueError("mode=cron requires cron")
            if self.run_at or self.rrule:
                raise ValueError("mode=cron only allows cron")
            if len(self.cron.split()) != 5:
                raise ValueError("cron must use five fields")
        return self


class ScheduleOverrides(BaseModel):
    timezone: str | None = None
    ui_state: UiState | None = None
    priority: int | None = Field(default=None, ge=0, le=100)
    start_window: ScheduleWindow | None = None
    end_window: ScheduleWindow | None = None
    content_refs: list[ContentRef] | None = Field(default=None, min_length=1)
    schedule_spec: ScheduleSpec | None = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown IANA timezone: {value}") from exc
        return value


class ScheduleRecord(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    enabled: bool

    timezone: str | None = None
    ui_state: UiState | None = None
    priority: int | None = Field(default=None, ge=0, le=100)
    start_window: ScheduleWindow | None = None
    end_window: ScheduleWindow | None = None
    content_refs: list[ContentRef] | None = Field(default=None, min_length=1)
    schedule_spec: ScheduleSpec | None = None

    template_ref: TemplateRef | None = None
    overrides: ScheduleOverrides | None = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown IANA timezone: {value}") from exc
        return value

    @model_validator(mode="after")
    def validate_shape(self) -> "ScheduleRecord":
        if self.overrides and not self.template_ref:
            raise ValueError("overrides cannot exist without template_ref")

        duplicate_keys = self.duplicate_override_keys()
        if duplicate_keys:
            joined = ", ".join(sorted(duplicate_keys))
            raise ValueError(f"ambiguous configuration: {joined} appears in both top-level and overrides")

        if self.template_ref is None:
            missing_fields = [field for field in SCHEDULE_OVERRIDE_FIELDS if getattr(self, field) is None]
            if missing_fields:
                raise ValueError("standalone schedule requires: " + ", ".join(missing_fields))

        start = self.effective_start_window()
        end = self.effective_end_window()
        if start and end:
            start_dt = datetime.fromisoformat(start.value.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end.value.replace("Z", "+00:00"))
            if start_dt > end_dt:
                raise ValueError("start_window.value must be <= end_window.value")

        return self

    def duplicate_override_keys(self) -> set[str]:
        if self.overrides is None:
            return set()
        return {
            key
            for key in SCHEDULE_OVERRIDE_FIELDS
            if getattr(self, key) is not None and getattr(self.overrides, key) is not None
        }

    def _effective(self, field_name: str):
        top_level = getattr(self, field_name)
        if top_level is not None:
            return top_level
        if self.overrides is not None:
            return getattr(self.overrides, field_name)
        return None

    def effective_timezone(self) -> str | None:
        return self._effective("timezone")

    def effective_ui_state(self) -> UiState | None:
        return self._effective("ui_state")

    def effective_priority(self) -> int | None:
        return self._effective("priority")

    def effective_start_window(self) -> ScheduleWindow | None:
        return self._effective("start_window")

    def effective_end_window(self) -> ScheduleWindow | None:
        return self._effective("end_window")

    def effective_content_refs(self) -> list[ContentRef] | None:
        return self._effective("content_refs")

    def effective_schedule_spec(self) -> ScheduleSpec | None:
        return self._effective("schedule_spec")


class ScheduleBlock(BaseModel):
    day_of_week: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    overnight: bool = False

    @model_validator(mode="after")
    def validate_block_window(self) -> "ScheduleBlock":
        start_obj = time.fromisoformat(self.start_time)
        end_obj = time.fromisoformat(self.end_time)
        if end_obj < start_obj and not self.overnight:
            raise ValueError("end_time must be after start_time unless overnight=true")
        return self


class ScheduleEnvelope(BaseModel):
    schema_version: int = 2
    schedules: list[ScheduleRecord] = Field(default_factory=list)


class TimelineBlock(BaseModel):
    schedule_id: str
    day_of_week: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    overnight: bool = False
    mode_hint: ScheduleSpecMode


class ConflictType(str, Enum):
    overlap = "overlap"
    invalid_window = "invalid_window"
    duplicate_id = "duplicate_id"
    duplicate_name = "duplicate_name"
    template_ambiguity = "template_ambiguity"
    ambiguous_dispatch = "ambiguous_dispatch"


class ConflictSuggestion(BaseModel):
    action: str
    message: str


class ScheduleConflict(BaseModel):
    conflict_type: ConflictType
    schedule_ids: list[str]
    message: str
    suggestions: list[ConflictSuggestion] = Field(default_factory=list)


class SchedulerUiState(BaseModel):
    schedule_file: ScheduleEnvelope
    timeline_blocks: list[TimelineBlock]
    conflicts: list[ScheduleConflict]


class SchedulerUiStateUpdate(BaseModel):
    schedules: list[ScheduleRecord]


class TemplateType(str, Enum):
    weekday = "weekday"
    weekend = "weekend"
    overnight = "overnight"


class ScheduleTemplatePrimitive(BaseModel):
    template: TemplateType
    blocks: list[ScheduleBlock]


class TemplateApplyRequest(BaseModel):
    template: TemplateType
    timezone: str = "UTC"
    start_window: ScheduleWindow = Field(default_factory=lambda: ScheduleWindow(value="1970-01-01T00:00:00Z"))
    end_window: ScheduleWindow = Field(default_factory=lambda: ScheduleWindow(value="9999-12-31T23:59:59Z"))
    content_refs: list[ContentRef] = Field(min_length=1)


class ScheduleSpecPreview(BaseModel):
    one_off: str
    rrule: str
    cron: str


class PreviewRequest(BaseModel):
    day_of_week: Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    timezone: str = "UTC"
    start_date: str = Field(description="ISO date, e.g. 2026-01-01")

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, value: str) -> str:
        datetime.fromisoformat(value + "T00:00:00")
        return value
