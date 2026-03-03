import re

with open("backend/scheduling/api.py", "r") as f:
    content = f.read()

# Fix syntax error in api.py
pattern = re.compile(
    r"    approvals = tuple\(\n"
    r"        ApprovalRecord\(\n"
    r"            approver_id=str\(item\.get\(\"approver_id\", \"\"\)\)\.strip\(\),\n"
    r"            approver_roles=frozenset\(role\.strip\(\)\.lower\(\) for role in item\.get\(\"approver_roles\", \[\]\)\),\n"
    r"            reason=str\(item\.get\(\"reason\", \"\"\)\)\.strip\(\),\n"
    r"        \)\n"
    r"        for item in approvals_payload\n"
    r"        if isinstance\(item, dict\)\n"
    r"    \)\n"
    r"    return ApprovalContext\(actor_id=actor_id, actor_roles=frozenset\(actor_roles\), approvals=approvals\)\n"
)

content = pattern.sub("", content)

with open("backend/scheduling/api.py", "w") as f:
    f.write(content)
