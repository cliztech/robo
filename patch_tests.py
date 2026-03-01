import re

with open("backend/tests/test_autonomy_policy_service.py", "r") as f:
    content = f.read()

# Fix missing parameters in tests for record_audit_event
content = content.replace(
    '        decision_type=DecisionType.track_selection,\n        origin="ai",\n        notes="first",',
    '        decision_type=DecisionType.track_selection,\n        origin="ai",\n        action_id=ActionId.ACT_CONFIG_EDIT,\n        actor_principal="test-actor",\n        target_ref="test-ref",\n        approval_chain=[],\n        notes="first",'
)

content = content.replace(
    '        decision_type=DecisionType.script_generation,\n        origin="human",\n        notes="second",',
    '        decision_type=DecisionType.script_generation,\n        origin="human",\n        action_id=ActionId.ACT_CONFIG_EDIT,\n        actor_principal="test-actor",\n        target_ref="test-ref",\n        approval_chain=[],\n        notes="second",'
)

content = content.replace(
    '                decision_type=DecisionType.track_selection,\n                origin="not-valid-origin",',
    '                decision_type=DecisionType.track_selection,\n                origin="not-valid-origin",\n                action_id=ActionId.ACT_CONFIG_EDIT,\n                actor_principal="test-actor",\n                target_ref="test-ref",\n                approval_chain=[],\n'
)

with open("backend/tests/test_autonomy_policy_service.py", "w") as f:
    f.write(content)
