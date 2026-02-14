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


class ScheduleTemplateRef(BaseModel):
    id: str = Field(min_length=1)
    version: int = Field(ge=1)


class ScheduleOverrides(BaseModel):
    timezone: Optional[str] = None
    ui_state: Optional[UiState] = None
    priority: Optional[int] = Field(default=None, ge=0, le=100)
    start_window: Optional[ScheduleWindow] = None
    end_window: Optional[ScheduleWindow] = None
    content_refs: Optional[list[ContentRef]] = Field(default=None, min_length=1)
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

        duplicate_keys = self.duplicate_override_keys()
        if duplicate_keys:
            joined = ", ".join(sorted(duplicate_keys))
            raise ValueError(f"Ambiguous fields present in top-level and overrides: {joined}")

        if self.template_ref is None:
            missing_fields = [
                field_name for field_name in SCHEDULE_OVERRIDE_FIELDS if getattr(self, field_name) is None
            ]
            if missing_fields:
                raise ValueError("Standalone schedules require runtime fields: " + ", ".join(missing_fields))

        start = self.effective_start_window()
        end = self.effective_end_window()
        if start and end:
            start_value = datetime.fromisoformat(start.value.replace("Z", "+00:00"))
            end_value = datetime.fromisoformat(end.value.replace("Z", "+00:00"))
            if start_value > end_value:
                raise ValueError("start_window.value must be <= end_window.value")

        return self

    def duplicate_override_keys(self) -> set[str]:
        if self.overrides is None:
            return set()
        duplicates: set[str] = set()
        for key in SCHEDULE_OVERRIDE_FIELDS:
            if getattr(self, key) is not None and getattr(self.overrides, key) is not None:
                duplicates.add(key)
        return duplicates

    def _effective(self, field_name: str):
        value = getattr(self, field_name)
        if value is not None:
            return value
        if self.overrides is not None:
            return getattr(self.overrides, field_name)
        return None

    def effective_timezone(self):
        return self._effective("timezone")

    def effective_ui_state(self):
        return self._effective("ui_state")

    def effective_priority(self):
        return self._effective("priority")

    def effective_start_window(self):
        return self._effective("start_window")

    def effective_end_window(self):
        return self._effective("end_window")

    def effective_content_refs(self):
        return self._effective("content_refs")

    def effective_schedule_spec(self):
        return self._effective("schedule_spec")


class ScheduleEnvelope(BaseModel):
    schema_version: int = 2
    schedules: list[ScheduleRecord] = Field(default_factory=list)


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


class ScheduleTemplatePrimitive(BaseModel):
    template: str
    blocks: list[ScheduleBlock] = Field(default_factory=list)


class TemplateType(str, Enum):
    weekday = "weekday"
    weekend = "weekend"
    overnight = "overnight"


class TemplateApplyRequest(BaseModel):
    template: TemplateType
    timezone: str
    content_refs: list[ContentRef] = Field(min_length=1)
    start_window: ScheduleWindow = Field(default_factory=lambda: ScheduleWindow(value="1970-01-01T00:00:00Z"))
    end_window: ScheduleWindow = Field(default_factory=lambda: ScheduleWindow(value="9999-12-31T23:59:59Z"))


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
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    timezone: str
    start_date: str

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, value: str) -> str:
        datetime.fromisoformat(value)
        return value


class ScheduleSpecPreview(BaseModel):
    one_off: str
    rrule: str
    cron: str


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


class SchedulerUiStateUpdate(BaseModel):
    schedules: list[ScheduleRecord]


class SchedulerUiState(BaseModel):
    schedule_file: ScheduleEnvelope
    timeline_blocks: list[TimelineBlock]
    conflicts: list[ScheduleConflict] = Field(default_factory=list)
