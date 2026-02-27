from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable


class ApprovalPolicyError(PermissionError):
    """Raised when a protected action fails approval policy checks."""


@dataclass(frozen=True)
class ApprovalRecord:
    approver_id: str
    approver_roles: frozenset[str]
    reason: str


@dataclass(frozen=True)
class ApprovalContext:
    actor_id: str
    actor_roles: frozenset[str]
    approvals: tuple[ApprovalRecord, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ActionPolicy:
    action_code: str
    allowed_actor_roles: frozenset[str]
    min_approvals: int
    allowed_approver_roles: frozenset[str]


ACTION_CATALOG: dict[str, ActionPolicy] = {
    "ACT-PUBLISH": ActionPolicy(
        action_code="ACT-PUBLISH",
        allowed_actor_roles=frozenset({"admin", "operator"}),
        min_approvals=1,
        allowed_approver_roles=frozenset({"admin"}),
    ),
    "ACT-DELETE": ActionPolicy(
        action_code="ACT-DELETE",
        allowed_actor_roles=frozenset({"admin"}),
        min_approvals=1,
        allowed_approver_roles=frozenset({"admin"}),
    ),
    "ACT-UPDATE-SCHEDULES": ActionPolicy(
        action_code="ACT-UPDATE-SCHEDULES",
        allowed_actor_roles=frozenset({"admin", "operator"}),
        min_approvals=0,
        allowed_approver_roles=frozenset({"admin", "operator"}),
    ),
    "ACT-UPDATE-AUTONOMY-POLICY": ActionPolicy(
        action_code="ACT-UPDATE-AUTONOMY-POLICY",
        allowed_actor_roles=frozenset({"admin"}),
        min_approvals=1,
        allowed_approver_roles=frozenset({"admin"}),
    ),
}


def _validate_roles(roles: Iterable[str]) -> frozenset[str]:
    cleaned = frozenset(role.strip().lower() for role in roles if role and role.strip())
    return cleaned


def normalize_context(*, actor_id: str, actor_roles: Iterable[str], approvals: Iterable[dict] | None = None) -> ApprovalContext:
    normalized_approvals: list[ApprovalRecord] = []
    for approval in approvals or ():
        normalized_approvals.append(
            ApprovalRecord(
                approver_id=str(approval.get("approver_id", "")).strip(),
                approver_roles=_validate_roles(approval.get("approver_roles", [])),
                reason=str(approval.get("reason", "")).strip(),
            )
        )

    return ApprovalContext(
        actor_id=actor_id.strip(),
        actor_roles=_validate_roles(actor_roles),
        approvals=tuple(normalized_approvals),
    )


def enforce_action_approval(action_code: str, context: ApprovalContext) -> None:
    policy = ACTION_CATALOG.get(action_code)
    if policy is None:
        raise ApprovalPolicyError(f"Unknown protected action '{action_code}'.")

    if not context.actor_id:
        raise ApprovalPolicyError("Protected action requires a non-empty actor_id.")

    if not (context.actor_roles & policy.allowed_actor_roles):
        raise ApprovalPolicyError(
            f"Actor roles {sorted(context.actor_roles)} cannot perform {action_code}; "
            f"allowed roles are {sorted(policy.allowed_actor_roles)}."
        )

    valid_approvers: set[str] = set()
    for approval in context.approvals:
        if not approval.approver_id:
            raise ApprovalPolicyError(f"Action {action_code} includes an approval with empty approver_id.")
        if approval.approver_id == context.actor_id:
            raise ApprovalPolicyError(f"Action {action_code} forbids self-approval by actor '{context.actor_id}'.")
        if not (approval.approver_roles & policy.allowed_approver_roles):
            raise ApprovalPolicyError(
                f"Approver '{approval.approver_id}' has roles {sorted(approval.approver_roles)} which are not allowed "
                f"for {action_code}."
            )
        valid_approvers.add(approval.approver_id)

    if len(valid_approvers) < policy.min_approvals:
        raise ApprovalPolicyError(
            f"Action {action_code} requires at least {policy.min_approvals} distinct approver(s); "
            f"received {len(valid_approvers)}."
        )
