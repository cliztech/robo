with open("backend/tests/test_autonomy_policy_service.py", "r") as f:
    content = f.read()

content = content.replace("service.update_policy(AutonomyPolicy(, enforce_approval=False))", "service.update_policy(AutonomyPolicy(), enforce_approval=False)")

with open("backend/tests/test_autonomy_policy_service.py", "w") as f:
    f.write(content)
