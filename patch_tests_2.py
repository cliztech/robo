import re

with open("backend/tests/test_autonomy_policy_service.py", "r") as f:
    content = f.read()

# Add enforce_approval=False to update_policy calls in tests
content = re.sub(
    r"service\.update_policy\((.*?)\)",
    r"service.update_policy(\1, enforce_approval=False)",
    content
)

# Fix duplicate arguments if we already had enforce_approval=False
content = content.replace(", enforce_approval=False, enforce_approval=False)", ", enforce_approval=False)")

with open("backend/tests/test_autonomy_policy_service.py", "w") as f:
    f.write(content)
