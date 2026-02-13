from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import HTMLResponse

from .autonomy_policy import AutonomyPolicy, DecisionOrigin, DecisionType, PolicyAuditEvent
from .autonomy_service import AutonomyPolicyService

router = APIRouter(prefix="/api/v1/autonomy-policy", tags=["autonomy-policy"])

MODE_DEFINITIONS = [
    {
        "mode": "manual_assist",
        "label": "Manual Assist",
        "summary": "AI drafts recommendations, but live writes and mode changes need operator approval.",
        "risk": "low",
        "anchor": "docs/autonomy_modes.md#1-manual-assist",
        "requires_approval": [
            "Any write to active playlist/rotation schedule",
            "Any live TTS playout action",
            "Any ad insertion into the on-air log",
            "Any caller simulation segment that is broadcast",
            "Any modification of schedule windows, policy, or mode",
        ],
    },
    {
        "mode": "semi_auto",
        "label": "Semi-Auto",
        "summary": "AI prepares scripts/playlists in staging, while operators approve each live promotion.",
        "risk": "moderate",
        "anchor": "docs/autonomy_modes.md#2-semi-auto-user-approved-scripts",
        "requires_approval": [
            "Promotion of generated scripts from staging to live",
            "Playlist commits affecting upcoming on-air blocks",
            "Ad insertion finalization for each break window",
            "Any caller simulation execution on-air",
            "Policy changes, mode changes, or overrides beyond configured bounds",
        ],
    },
    {
        "mode": "auto_with_human_override",
        "label": "Auto with Human Override",
        "summary": "AI operates autonomously within guardrails; operators can pause or override instantly.",
        "risk": "elevated",
        "anchor": "docs/autonomy_modes.md#3-auto-with-human-override",
        "requires_approval": [
            "Actions exceeding guardrails (risk/category/quota)",
            "New ad campaigns, voices/personas, or sponsors",
            "Hard transitions, emergency cut-ins, or policy edits",
        ],
    },
    {
        "mode": "full_auto_guardrailed",
        "label": "Full Auto Guardrailed",
        "summary": "End-to-end automation runs continuously; only compliance and anomaly exceptions require human approval.",
        "risk": "high",
        "anchor": "docs/autonomy_modes.md#4-full-auto-guardrailed",
        "requires_approval": [
            "Any change to guardrail policy or compliance constraints",
            "Use of assets outside approved catalogs",
            "Any high-severity anomaly flagged by policy engine",
        ],
    },
    {
        "mode": "lights_out_overnight",
        "label": "Lights-Out Overnight",
        "summary": "Fully autonomous overnight operation with strict windows and conservative fallback behavior.",
        "risk": "high",
        "anchor": "docs/autonomy_modes.md#5-lights-out-overnight",
        "requires_approval": [
            "Any operation outside defined overnight window",
            "Any content class marked high sensitivity",
            "Any non-approved live human-call simulation",
            "Escalation to daypart pools or non-overnight sponsor inventory",
        ],
    },
]


def get_policy_service() -> AutonomyPolicyService:
    return AutonomyPolicyService()


@router.get("", response_model=AutonomyPolicy)
def read_policy(service: AutonomyPolicyService = Depends(get_policy_service)) -> AutonomyPolicy:
    return service.get_policy()


@router.put("", response_model=AutonomyPolicy)
def write_policy(
    payload: AutonomyPolicy,
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> AutonomyPolicy:
    return service.update_policy(payload)


@router.get("/effective")
def read_effective_policy(
    show_id: Optional[str] = Query(default=None),
    timeslot_id: Optional[str] = Query(default=None),
    service: AutonomyPolicyService = Depends(get_policy_service),
):
    return service.resolve_effective_policy(show_id=show_id, timeslot_id=timeslot_id)


@router.get("/mode-definitions")
def get_mode_definitions():
    return {"source": "docs/autonomy_modes.md", "modes": MODE_DEFINITIONS}


@router.post("/audit-events", response_model=PolicyAuditEvent)
def create_audit_event(
    decision_type: DecisionType,
    origin: DecisionOrigin,
    show_id: Optional[str] = Query(default=None),
    timeslot_id: Optional[str] = Query(default=None),
    notes: Optional[str] = Query(default=None),
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> PolicyAuditEvent:
    return service.record_audit_event(
        decision_type=decision_type,
        origin=origin,
        show_id=show_id,
        timeslot_id=timeslot_id,
        notes=notes,
    )


@router.get("/audit-events", response_model=list[PolicyAuditEvent])
def get_audit_events(
    limit: int = Query(default=100, ge=1, le=1000),
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> list[PolicyAuditEvent]:
    return service.list_audit_events(limit=limit)


@router.get("/control-center", response_class=HTMLResponse)
def get_control_center() -> HTMLResponse:
    html_path = Path(__file__).with_name("control_center.html")
    return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
