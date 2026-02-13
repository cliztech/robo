from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from .autonomy_policy import AutonomyPolicy, DecisionOrigin, DecisionType, PolicyAuditEvent
from .autonomy_service import AutonomyPolicyService

router = APIRouter(prefix="/api/v1/autonomy-policy", tags=["autonomy-policy"])

# TODO(observability): emit scheduler.crash_recovery.activated when API startup
# enters degraded-mode handlers after scheduler/runtime crash detection.


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
