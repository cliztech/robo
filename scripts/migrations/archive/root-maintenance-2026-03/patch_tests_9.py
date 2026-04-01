with open("backend/tests/test_autonomy_policy_service.py", "r") as f:
    content = f.read()

content = content.replace(
    '    with pytest.raises(ValidationError):\n        service.record_audit_event(\n            decision_type=DecisionType.track_selection,\n            origin="not-valid-origin",\n        )',
    '    with pytest.raises(ValidationError):\n        service.record_audit_event(\n            decision_type=DecisionType.track_selection,\n            origin="not-valid-origin",\n            action_id=ActionId.ACT_CONFIG_EDIT,\n            actor_principal="test-actor",\n            target_ref="test-ref",\n            approval_chain=[],\n        )'
)

with open("backend/tests/test_autonomy_policy_service.py", "w") as f:
    f.write(content)
