from __future__ import annotations

import threading
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from backend.security.auth import get_scheduler_api_key
from backend.security.approval_policy import ApprovalContext, ApprovalPolicyError, ApprovalRecord

from .scheduler_models import (
    PreviewRequest,
    ScheduleConflict,
    SchedulerUiState,
    SchedulerUiStateUpdate,
    TemplateApplyRequest,
)
from .scheduler_ui_service import SchedulerUiService

router = APIRouter(
    prefix="/api/v1/scheduler-ui",
    tags=["scheduler-ui"],
    dependencies=[Depends(get_scheduler_api_key)]
)

_service_instance: Optional[SchedulerUiService] = None
_service_lock = threading.Lock()


def get_scheduler_service() -> SchedulerUiService:
    global _service_instance
    if _service_instance is None:
        with _service_lock:
            if _service_instance is None:
                _service_instance = SchedulerUiService()
    return _service_instance


def _approval_context_from_request(request: Request) -> ApprovalContext:
    actor_id = request.headers.get("X-Actor-Id", "api-key-actor")
    actor_roles = {
        role.strip().lower()
        for role in request.headers.get("X-Actor-Roles", "admin").split(",")
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


@router.get("/state", response_model=SchedulerUiState)
def read_scheduler_state(service: SchedulerUiService = Depends(get_scheduler_service)) -> SchedulerUiState:
    return service.get_ui_state()


@router.put("/state", response_model=SchedulerUiState)
def write_scheduler_state(
    payload: SchedulerUiStateUpdate,
    request: Request,
    service: SchedulerUiService = Depends(get_scheduler_service),
) -> SchedulerUiState:
    try:
        return service.update_schedules(payload.schedules, approval_context=_approval_context_from_request(request))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ApprovalPolicyError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/validate", response_model=list[ScheduleConflict])
def validate_scheduler_state(
    payload: SchedulerUiStateUpdate,
    service: SchedulerUiService = Depends(get_scheduler_service),
) -> list[ScheduleConflict]:
    return service.validate_schedules(payload.schedules)


@router.post("/publish")
def publish_scheduler_state(
    payload: SchedulerUiStateUpdate,
    request: Request,
    service: SchedulerUiService = Depends(get_scheduler_service),
):
    try:
        return service.publish_schedules(payload.schedules, approval_context=_approval_context_from_request(request))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ApprovalPolicyError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/templates/apply")
def apply_schedule_template(
    payload: TemplateApplyRequest,
    service: SchedulerUiService = Depends(get_scheduler_service),
):
    return {"template": payload.template, "schedules": service.apply_template(payload)}


@router.post("/preview")
def preview_schedule_spec(
    payload: PreviewRequest,
    service: SchedulerUiService = Depends(get_scheduler_service),
):
    return service.preview_schedule_spec(payload)
