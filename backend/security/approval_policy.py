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
import json
from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Sequence


class ActionId(str, Enum):
    ACT_PUBLISH = "ACT-PUBLISH"
    ACT_DELETE = "ACT-DELETE"
    ACT_OVERRIDE = "ACT-OVERRIDE"
    ACT_KEY_ROTATION = "ACT-KEY-ROTATION"
    ACT_CONFIG_EDIT = "ACT-CONFIG-EDIT"


class ApproverRole(str, Enum):
    OPERATOR = "operator"
    PRODUCER = "producer"
    SECURITY = "security"
    ADMIN = "admin"


@dataclass(frozen=True)
class ApprovalRecord:
    principal: str
    role: ApproverRole
    approved_at_utc: str


@dataclass(frozen=True)
class ApprovalDecision:
    allowed: bool
    reason: str


ACTION_MINIMUM_APPROVER_ROLES: dict[ActionId, frozenset[ApproverRole]] = {
    ActionId.ACT_PUBLISH: frozenset({ApproverRole.OPERATOR, ApproverRole.PRODUCER}),
    ActionId.ACT_DELETE: frozenset({ApproverRole.ADMIN, ApproverRole.SECURITY}),
    ActionId.ACT_OVERRIDE: frozenset({ApproverRole.OPERATOR, ApproverRole.ADMIN}),
    ActionId.ACT_KEY_ROTATION: frozenset({ApproverRole.SECURITY, ApproverRole.ADMIN}),
    ActionId.ACT_CONFIG_EDIT: frozenset({ApproverRole.PRODUCER, ApproverRole.ADMIN}),
}


class ApprovalPolicyError(PermissionError):
    pass


def parse_approval_chain(raw_chain: Sequence[dict[str, str]] | str | None) -> list[ApprovalRecord]:
    if raw_chain is None:
        return []

    if isinstance(raw_chain, str):
        try:
            decoded = json.loads(raw_chain)
        except json.JSONDecodeError as exc:
            raise ApprovalPolicyError("approval_chain must be valid JSON") from exc
        if not isinstance(decoded, list):
            raise ApprovalPolicyError("approval_chain JSON must be a list")
        records: Iterable[object] = decoded
    else:
        records = raw_chain

    parsed: list[ApprovalRecord] = []
    for index, item in enumerate(records):
        if not isinstance(item, dict):
            raise ApprovalPolicyError(f"approval_chain[{index}] must be an object")
        try:
            role = ApproverRole(item["role"])
            principal = item["principal"]
            approved_at = item["approved_at_utc"]
        except KeyError as exc:
            raise ApprovalPolicyError(f"approval_chain[{index}] missing key: {exc.args[0]}") from exc
        except ValueError as exc:
            raise ApprovalPolicyError(f"approval_chain[{index}] has invalid role") from exc

        if not principal.strip():
            raise ApprovalPolicyError(f"approval_chain[{index}].principal must be non-empty")

        parsed.append(ApprovalRecord(principal=principal, role=role, approved_at_utc=approved_at))

    return parsed


def evaluate_approval_chain(action_id: ActionId, approval_chain: Sequence[ApprovalRecord]) -> ApprovalDecision:
    required_roles = ACTION_MINIMUM_APPROVER_ROLES[action_id]
    chain_roles = {entry.role for entry in approval_chain}
    missing_roles = sorted(role.value for role in required_roles - chain_roles)
    if missing_roles:
        return ApprovalDecision(
            allowed=False,
            reason=f"approval denied for {action_id.value}: missing roles {', '.join(missing_roles)}",
        )

    return ApprovalDecision(allowed=True, reason="approved")


def require_approval(action_id: ActionId, approval_chain: Sequence[ApprovalRecord]) -> None:
    decision = evaluate_approval_chain(action_id=action_id, approval_chain=approval_chain)
    if not decision.allowed:
        raise ApprovalPolicyError(decision.reason)
