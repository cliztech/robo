from __future__ import annotations

from datetime import datetime, time
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


WEEK_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


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
    ref_id: str
    label: Optional[str] = None
    weight: Optional[int] = Field(default=None, ge=1, le=100)


class TemplateRef(BaseModel):
    id: str = Field(min_length=1)
    version: int = Field(ge=1)


class ScheduleSpec(BaseModel):
    mode: ScheduleSpecMode
    run_at: Optional[str] = None
    rrule: Optional[str] = None
    cron: Optional[str] = None

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
                raise ValueError("mode=rrule requires RFC5545-like rrule containing FREQ=")
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
    timezone: Optional[str] = None
    ui_state: Optional[UiState] = None
    priority: Optional[int] = Field(default=None, ge=0, le=100)
    start_window: Optional[ScheduleWindow] = None
    end_window: Optional[ScheduleWindow] = None
    content_refs: Optional[list[ContentRef]] = None
    schedule_spec: Optional[ScheduleSpec] = None


class ScheduleRecord(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    enabled: bool
    timezone: Optional[str] = None
    ui_state: Optional[UiState] = None
    priority: Optional[int] = Field(default=None, ge=0, le=100)
    start_window: Optional[ScheduleWindow] = None
    end_window: Optional[ScheduleWindow] = None
    content_refs: Optional[list[ContentRef]] = Field(default=None, min_length=1)
    schedule_spec: Optional[ScheduleSpec] = None
    template_ref: Optional[TemplateRef] = None
    overrides: Optional[ScheduleOverrides] = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError(f"Unknown IANA timezone: {value}") from exc
        return value

    @model_validator(mode="after")
    def validate_record(self) -> "ScheduleRecord":
        if self.overrides and not self.template_ref:
            raise ValueError("overrides cannot be used without template_ref")

        if self.overrides:
            for key in self.overrides.model_dump(exclude_none=True):
                if getattr(self, key) is not None:
                    raise ValueError(f"ambiguous configuration: '{key}' appears both at top-level and in overrides")

        required_runtime_fields = (
            "timezone",
            "ui_state",
            "priority",
            "start_window",
            "end_window",
            "content_refs",
            "schedule_spec",
        )
        if not self.template_ref:
            for field_name in required_runtime_fields:
                if getattr(self, field_name) is None:
                    raise ValueError(f"standalone schedule requires '{field_name}'")

        start_window = self.start_window or (self.overrides.start_window if self.overrides else None)
        end_window = self.end_window or (self.overrides.end_window if self.overrides else None)
        if start_window and end_window:
            start_value = datetime.fromisoformat(start_window.value.replace("Z", "+00:00"))
            end_value = datetime.fromisoformat(end_window.value.replace("Z", "+00:00"))
            if start_value > end_value:
                raise ValueError("start_window.value must be <= end_window.value")

        return self


class ScheduleBlock(BaseModel):
    day_of_week: Literal[
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
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
    day_of_week: Literal[
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    overnight: bool = False
    mode_hint: ScheduleSpecMode

    @model_validator(mode="after")
    def validate_time_range(self) -> "TimelineBlock":
        start_obj = time.fromisoformat(self.start_time)
        end_obj = time.fromisoformat(self.end_time)
        if end_obj < start_obj and not self.overnight:
            raise ValueError("End time must be after start time unless overnight=true")
        return self


class ConflictType(str, Enum):
    overlap = "overlap"
    invalid_window = "invalid_window"
    duplicate_id = "duplicate_id"
    duplicate_name = "duplicate_name"
    ambiguous_active = "ambiguous_active"


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
    start_window: ScheduleWindow = Field(
        default_factory=lambda: ScheduleWindow(value="1970-01-01T00:00:00Z")
    )
    end_window: ScheduleWindow = Field(
        default_factory=lambda: ScheduleWindow(value="9999-12-31T23:59:59Z")
    )
    content_refs: list[ContentRef] = Field(min_length=1)


class ScheduleSpecPreview(BaseModel):
    one_off: str
    rrule: str
    cron: str


class PreviewRequest(BaseModel):
    day_of_week: Literal[
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    timezone: str = "UTC"
    start_date: str = Field(description="ISO date, e.g. 2026-01-01")

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, value: str) -> str:
        datetime.fromisoformat(value + "T00:00:00")
        return value
