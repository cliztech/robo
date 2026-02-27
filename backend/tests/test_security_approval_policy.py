from __future__ import annotations

import pytest

from backend.security.approval_policy import (
    ApprovalContext,
    ApprovalPolicyError,
    ApprovalRecord,
    enforce_action_approval,
)


def test_publish_requires_admin_approval():
    context = ApprovalContext(
        actor_id="operator-1",
        actor_roles=frozenset({"operator"}),
        approvals=tuple(),
    )

    with pytest.raises(ApprovalPolicyError):
        enforce_action_approval("ACT-PUBLISH", context)


def test_publish_accepts_valid_actor_and_approver_chain():
    context = ApprovalContext(
        actor_id="operator-1",
        actor_roles=frozenset({"operator"}),
        approvals=(
            ApprovalRecord(
                approver_id="admin-1",
                approver_roles=frozenset({"admin"}),
                reason="Change window approved",
            ),
        ),
    )

    enforce_action_approval("ACT-PUBLISH", context)
