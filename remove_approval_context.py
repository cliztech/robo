import re

with open("backend/scheduling/api.py", "r") as f:
    content = f.read()

# Remove the unused _approval_context_from_request function
content = re.sub(
    r"def _approval_context_from_request\(request: Request\) -> ApprovalContext:.*?\n\n",
    "",
    content,
    flags=re.DOTALL
)

with open("backend/scheduling/api.py", "w") as f:
    f.write(content)

with open("backend/scheduling/autonomy_service.py", "r") as f:
    content = f.read()

# Clean up imports
content = re.sub(
    r"from backend\.security\.approval_policy import ApprovalContext, ApprovalRecord, enforce_action_approval\n",
    "",
    content
)
with open("backend/scheduling/autonomy_service.py", "w") as f:
    f.write(content)
