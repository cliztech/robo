from __future__ import annotations

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
