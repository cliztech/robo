from __future__ import annotations

import pytest

from backend.security.approval_policy import (
    ApprovalContext,
    ApprovalPolicyError,
    enforce_action_approval,
)

# Since ApprovalRecord is redefined at the bottom of approval_policy.py, we create a mock
class MockApprovalRecord:
    def __init__(self, approver_id, approver_roles, reason):
        self.approver_id = approver_id
        self.approver_roles = approver_roles
        self.reason = reason

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
            MockApprovalRecord(
                approver_id="admin-1",
                approver_roles=frozenset({"admin"}),
                reason="Change window approved",
            ),
        ),
    )

    enforce_action_approval("ACT-PUBLISH", context)

def test_enforce_action_approval_unknown_action():
    context = ApprovalContext(
        actor_id="admin-1",
        actor_roles=frozenset({"admin"}),
    )
    with pytest.raises(ApprovalPolicyError, match="Unknown protected action 'UNKNOWN-ACT'."):
        enforce_action_approval("UNKNOWN-ACT", context)


def test_enforce_action_approval_empty_actor_id():
    context = ApprovalContext(
        actor_id="",
        actor_roles=frozenset({"admin"}),
    )
    with pytest.raises(ApprovalPolicyError, match="Protected action requires a non-empty actor_id."):
        enforce_action_approval("ACT-PUBLISH", context)


def test_enforce_action_approval_unauthorized_actor_role():
    context = ApprovalContext(
        actor_id="guest-1",
        actor_roles=frozenset({"guest"}),
    )
    with pytest.raises(ApprovalPolicyError, match="cannot perform ACT-PUBLISH; allowed roles are"):
        enforce_action_approval("ACT-PUBLISH", context)
