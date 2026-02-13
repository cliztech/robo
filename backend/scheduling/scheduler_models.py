from __future__ import annotations

from datetime import datetime, time
from enum import Enum
from typing import Literal, Optional

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
    type: str
    ref_id: str
    label: Optional[str] = None
    weight: Optional[int] = Field(default=None, ge=0, le=100)


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
            if not self.rrule:
                raise ValueError("mode=rrule requires rrule")
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


class ScheduleRecord(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=120)
    enabled: bool
    timezone: str
    ui_state: UiState
    priority: int = Field(ge=0, le=100)
    start_window: ScheduleWindow
    end_window: ScheduleWindow
    content_refs: list[ContentRef] = Field(min_length=1)
    schedule_spec: ScheduleSpec

    @model_validator(mode="after")
    def validate_windows(self) -> "ScheduleRecord":
        start_value = datetime.fromisoformat(self.start_window.value.replace("Z", "+00:00"))
        end_value = datetime.fromisoformat(self.end_window.value.replace("Z", "+00:00"))
        if start_value > end_value:
            raise ValueError("start_window.value must be <= end_window.value")
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
