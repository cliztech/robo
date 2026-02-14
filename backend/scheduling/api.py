from __future__ import annotations

import threading
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException

from .autonomy_policy import AutonomyPolicy, DecisionOrigin, DecisionType, PolicyAuditEvent
from .autonomy_service import AutonomyPolicyService, PolicyValidationError

router = APIRouter(prefix="/api/v1/autonomy-policy", tags=["autonomy-policy"])

# TODO(observability): emit scheduler.crash_recovery.activated when API startup
# enters degraded-mode handlers after scheduler/runtime crash detection.


_service_instance: Optional[AutonomyPolicyService] = None
_service_lock = threading.Lock()


def get_policy_service() -> AutonomyPolicyService:
    global _service_instance
    if _service_instance is None:
        with _service_lock:
            if _service_instance is None:
                _service_instance = AutonomyPolicyService()
    return _service_instance


@router.get("", response_model=AutonomyPolicy)
def read_policy(service: AutonomyPolicyService = Depends(get_policy_service)) -> AutonomyPolicy:
    try:
        return service.get_policy()
    except PolicyValidationError as error:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Stored autonomy policy has invalid/conflicting overrides.",
                "conflicts": [conflict.to_error_detail() for conflict in error.conflicts],
            },
        ) from error


@router.put("", response_model=AutonomyPolicy)
def write_policy(
    payload: AutonomyPolicy,
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> AutonomyPolicy:
    try:
        return service.update_policy(payload)
    except PolicyValidationError as error:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Submitted autonomy policy has conflicting overrides.",
                "conflicts": [conflict.to_error_detail() for conflict in error.conflicts],
            },
        ) from error


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
