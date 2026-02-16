from __future__ import annotations

import copy
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class GlobalMode(str, Enum):
    manual_assist = "manual_assist"
    semi_auto = "semi_auto"
    auto_with_human_override = "auto_with_human_override"
    full_auto_guardrailed = "full_auto_guardrailed"
    lights_out_overnight = "lights_out_overnight"


class DecisionType(str, Enum):
    track_selection = "track_selection"
    script_generation = "script_generation"
    voice_persona_selection = "voice_persona_selection"
    caller_simulation_usage = "caller_simulation_usage"
    breaking_news_weather_interruption = "breaking_news_weather_interruption"


class DecisionAuthority(str, Enum):
    human_only = "human_only"
    human_with_ai_assist = "human_with_ai_assist"
    ai_with_human_approval = "ai_with_human_approval"
    ai_autonomous = "ai_autonomous"


PermissionMatrix = Dict[DecisionType, DecisionAuthority]


DEFAULT_MODE_PERMISSIONS: Dict[GlobalMode, PermissionMatrix] = {
    GlobalMode.manual_assist: {
        DecisionType.track_selection: DecisionAuthority.human_only,
        DecisionType.script_generation: DecisionAuthority.human_with_ai_assist,
        DecisionType.voice_persona_selection: DecisionAuthority.human_only,
        DecisionType.caller_simulation_usage: DecisionAuthority.human_only,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.human_only,
    },
    GlobalMode.semi_auto: {
        DecisionType.track_selection: DecisionAuthority.ai_with_human_approval,
        DecisionType.script_generation: DecisionAuthority.ai_with_human_approval,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_with_human_approval,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_with_human_approval,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_with_human_approval,
    },
    GlobalMode.auto_with_human_override: {
        DecisionType.track_selection: DecisionAuthority.ai_autonomous,
        DecisionType.script_generation: DecisionAuthority.ai_autonomous,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_autonomous,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_autonomous,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_with_human_approval,
    },
    GlobalMode.full_auto_guardrailed: {
        DecisionType.track_selection: DecisionAuthority.ai_autonomous,
        DecisionType.script_generation: DecisionAuthority.ai_autonomous,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_autonomous,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_autonomous,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_autonomous,
    },
    GlobalMode.lights_out_overnight: {
        DecisionType.track_selection: DecisionAuthority.ai_autonomous,
        DecisionType.script_generation: DecisionAuthority.ai_autonomous,
        DecisionType.voice_persona_selection: DecisionAuthority.ai_autonomous,
        DecisionType.caller_simulation_usage: DecisionAuthority.ai_with_human_approval,
        DecisionType.breaking_news_weather_interruption: DecisionAuthority.ai_with_human_approval,
    },
}


class PolicyOverride(BaseModel):
    mode: GlobalMode
    permissions: Optional[PermissionMatrix] = None


class TimeslotOverride(PolicyOverride):
    id: str = Field(..., description="Unique identifier for this timeslot override")
    day_of_week: Literal[
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]
    start_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    show_id: Optional[str] = Field(
        default=None,
        description="Optional show-scoped override. If omitted, applies station-wide for the slot.",
    )


class ShowOverride(PolicyOverride):
    show_id: str


class AutonomyPolicy(BaseModel):
    station_default_mode: GlobalMode = GlobalMode.semi_auto
    mode_permissions: Dict[GlobalMode, PermissionMatrix] = Field(
        default_factory=lambda: copy.deepcopy(DEFAULT_MODE_PERMISSIONS)
    )
    show_overrides: List[ShowOverride] = Field(default_factory=list)
    timeslot_overrides: List[TimeslotOverride] = Field(default_factory=list)
    conflict_resolution: str = Field(
        default="timeslot_override > show_override > station_default",
        description="Policy precedence order.",
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @model_validator(mode="after")
    def validate_mode_permissions(self) -> "AutonomyPolicy":
        expected_decisions = {decision for decision in DecisionType}
        for mode in GlobalMode:
            if mode not in self.mode_permissions:
                self.mode_permissions[mode] = DEFAULT_MODE_PERMISSIONS[mode]

        for mode, matrix in self.mode_permissions.items():
            missing = expected_decisions - set(matrix.keys())
            if missing:
                missing_display = ", ".join(sorted(item.value for item in missing))
                raise ValueError(f"Mode '{mode}' is missing permissions for: {missing_display}")
        return self


class EffectivePolicyDecision(BaseModel):
    show_id: Optional[str] = None
    timeslot_id: Optional[str] = None
    mode: GlobalMode
    permissions: PermissionMatrix
    source: Literal["station_default", "show_override", "timeslot_override"]


class DecisionOrigin(str, Enum):
    ai = "ai"
    human = "human"


class PolicyAuditEvent(BaseModel):
    event_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    decision_type: DecisionType
    origin: DecisionOrigin
    mode: GlobalMode
    source: Literal["station_default", "show_override", "timeslot_override"]
    show_id: Optional[str] = None
    timeslot_id: Optional[str] = None
    notes: Optional[str] = None
