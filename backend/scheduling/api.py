from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Header, Query, HTTPException
from fastapi.responses import HTMLResponse

from backend.security.approval_policy import ActionId, ApprovalPolicyError, parse_approval_chain
from backend.security.auth import verify_api_key
from .autonomy_policy import (
    AutonomyPolicy,
    DecisionOrigin,
    DecisionType,
    PolicyAuditEvent,
    MODE_DEFINITIONS,
)
from .autonomy_service import AutonomyPolicyService, PolicyValidationError
from .observability import emit_scheduler_event

router = APIRouter(
    prefix="/api/v1/autonomy-policy",
    tags=["autonomy-policy"],
    dependencies=[Depends(verify_api_key)],
)

logger = logging.getLogger(__name__)


def _approval_context_from_request(request: Request) -> ApprovalContext:
    actor_id = request.headers.get("X-Actor-Id", "api-key-actor")
    actor_roles = {
        role.strip().lower()
        for role in request.headers.get("X-Actor-Roles", "").split(",")
        if role.strip()
    }
    approvals_header = request.headers.get("X-Approval-Chain", "[]")
    try:
        approvals_payload = json.loads(approvals_header)
    except json.JSONDecodeError:
        approvals_payload = []

    approvals = tuple(
        ApprovalRecord(
            approver_id=str(item.get("approver_id", "")).strip(),
            approver_roles=frozenset(role.strip().lower() for role in item.get("approver_roles", [])),
            reason=str(item.get("reason", "")).strip(),
        )
        for item in approvals_payload
        if isinstance(item, dict)
    )
    return ApprovalContext(actor_id=actor_id, actor_roles=frozenset(actor_roles), approvals=approvals)


_service_instance: Optional[AutonomyPolicyService] = None
_service_lock = threading.Lock()


def get_policy_service() -> AutonomyPolicyService:
    global _service_instance
    if _service_instance is None:
        with _service_lock:
            if _service_instance is None:
                service = AutonomyPolicyService()
                try:
                    service.get_policy()
                except Exception as error:
                    logger.exception("Autonomy policy preload failed; attempting crash recovery.")
                    policy_path = service.policy_path
                    recovery_stamp = datetime.now(timezone.utc).strftime(
                        "%Y%m%d_%H%M%S"
                    )
                    recovery_path = policy_path.with_name(
                        f"{policy_path.stem}.crash_recovery_{recovery_stamp}{policy_path.suffix}"
                    )
                    try:
                        if policy_path.exists():
                            policy_path.replace(recovery_path)

                        service.update_policy(AutonomyPolicy())
                        emit_scheduler_event(
                            event_name="scheduler.crash_recovery.activated",
                            level="critical",
                            message="Autonomy API crash recovery activated due to invalid policy state.",
                            metadata={
                                "trigger": type(error).__name__,
                                "recovery_plan": "rename_invalid_policy_and_bootstrap_defaults",
                                "last_known_checkpoint": str(recovery_path),
                            },
                        )
                    except Exception as recovery_error:
                        logger.exception(
                            "Autonomy crash recovery failed; entering degraded mode."
                        )
                        emit_scheduler_event(
                            event_name="scheduler.degraded_mode.activated",
                            level="critical",
                            message="Autonomy API entered degraded mode after crash recovery failure.",
                            metadata={
                                "trigger": type(error).__name__,
                                "recovery_plan": "degraded_mode",
                                "error_type": type(recovery_error).__name__,
                            },
                        )

                    try:
                        service.get_policy()
                    except Exception as preload_error:
                        logger.exception(
                            "Autonomy policy preload failed; entering degraded-mode handlers."
                        )
                        emit_scheduler_event(
                            event_name="scheduler.crash_recovery.activated",
                            level="critical",
                            message="Scheduler crash-recovery handlers activated during API startup.",
                            metadata={
                                "trigger": "policy_preload_failure",
                                "recovery_plan": "degraded_mode",
                                "last_known_checkpoint": "autonomy_policy_bootstrap",
                                "error_type": type(preload_error).__name__,
                            },
                        )

                _service_instance = service
    return _service_instance


@router.get("", response_model=AutonomyPolicy)
def read_policy(
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> AutonomyPolicy:
    try:
        return service.get_policy()
    except PolicyValidationError as error:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Stored autonomy policy has invalid/conflicting overrides.",
                "conflicts": [
                    conflict.to_error_detail() for conflict in error.conflicts
                ],
            },
        ) from error


@router.put("", response_model=AutonomyPolicy)
def write_policy(
    payload: AutonomyPolicy,
    request: Request,
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> AutonomyPolicy:
    try:
        return service.update_policy(payload, approval_context=_approval_context_from_request(request))
    approval_chain: str = Header(default="[]", alias="X-Approval-Chain"),
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> AutonomyPolicy:
    try:
        return service.update_policy(payload, approval_chain=parse_approval_chain(approval_chain))
    except PolicyValidationError as error:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Submitted autonomy policy has conflicting overrides.",
                "conflicts": [
                    conflict.to_error_detail() for conflict in error.conflicts
                ],
            },
        ) from error
    except ApprovalPolicyError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
        raise HTTPException(status_code=403, detail={"message": str(error)}) from error


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
    action_id: ActionId = Query(default=ActionId.ACT_OVERRIDE),
    target_ref: str = Query(default="autonomy-policy"),
    show_id: Optional[str] = Query(default=None),
    timeslot_id: Optional[str] = Query(default=None),
    notes: Optional[str] = Query(default=None),
    actor_principal: str = Header(default="unknown", alias="X-Actor-Principal"),
    approval_chain: str = Header(default="[]", alias="X-Approval-Chain"),
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> PolicyAuditEvent:
    try:
        return service.record_audit_event(
            decision_type=decision_type,
            origin=origin,
            action_id=action_id,
            actor_principal=actor_principal,
            target_ref=target_ref,
            approval_chain=parse_approval_chain(approval_chain),
            show_id=show_id,
            timeslot_id=timeslot_id,
            notes=notes,
        )
    except ApprovalPolicyError as error:
        raise HTTPException(status_code=403, detail={"message": str(error)}) from error




@router.post("/audit-events/export")
def export_audit_events(
    limit: int = Query(default=1000, ge=1, le=10000),
    batch_id: Optional[str] = Query(default=None),
    service: AutonomyPolicyService = Depends(get_policy_service),
):
    result = service.export_audit_events(limit=limit, batch_id=batch_id)
    return {
        "batch_id": result.batch_id,
        "line_count": result.line_count,
        "ndjson_path": str(result.ndjson_path),
        "sha256_path": str(result.sha256_path),
        "manifest_path": str(result.manifest_path),
        "digest_sha256": result.digest_sha256,
    }

@router.get("/audit-events", response_model=list[PolicyAuditEvent])
def get_audit_events(
    limit: int = Query(default=100, ge=1, le=1000),
    service: AutonomyPolicyService = Depends(get_policy_service),
) -> list[PolicyAuditEvent]:
    return service.list_audit_events(limit=limit)


@lru_cache(maxsize=1)
def _get_control_center_html() -> str:
    """
    Cache the control center HTML content to avoid disk I/O on every request.
    This optimization ensures faster response times by serving the static asset from memory.
    """
    html_path = Path(__file__).with_name("control_center.html")
    return html_path.read_text(encoding="utf-8")


@router.get("/control-center", response_class=HTMLResponse)
def get_control_center() -> HTMLResponse:
    return HTMLResponse(content=_get_control_center_html())
