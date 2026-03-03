with open("backend/tests/test_autonomy_policy_service.py", "r") as f:
    content = f.read()

# Fix ActionId import
content = content.replace("from backend.scheduling.autonomy_policy import (", "from backend.security.approval_policy import ActionId\nfrom backend.scheduling.autonomy_policy import (")

# Fix update_policy call
content = content.replace("service.update_policy(AutonomyPolicy(station_default_mode=GlobalMode.manual_assist, enforce_approval=False))", "service.update_policy(AutonomyPolicy(station_default_mode=GlobalMode.manual_assist), enforce_approval=False)")

# Fix record_audit_event calls missing params
content = content.replace(
    '        with pytest.raises(ValidationError):\n            service.record_audit_event(\n                decision_type=DecisionType.track_selection,\n                origin="not-valid-origin",\n            )',
    '        with pytest.raises(ValidationError):\n            service.record_audit_event(\n                decision_type=DecisionType.track_selection,\n                origin="not-valid-origin",\n                action_id=ActionId.ACT_CONFIG_EDIT,\n                actor_principal="test-actor",\n                target_ref="test-ref",\n                approval_chain=[],\n            )'
)

with open("backend/tests/test_autonomy_policy_service.py", "w") as f:
    f.write(content)
