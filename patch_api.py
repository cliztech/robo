import re

with open("backend/scheduling/api.py", "r") as f:
    content = f.read()

# Fix syntax error in api.py introduced by previous git changes.
pattern = re.compile(
    r"@router\.put\(\"\", response_model=AutonomyPolicy\)\n"
    r"def write_policy\(\n"
    r"    payload: AutonomyPolicy,\n"
    r"    request: Request,\n"
    r"    service: AutonomyPolicyService = Depends\(get_policy_service\),\n"
    r"\) -> AutonomyPolicy:\n"
    r"    try:\n"
    r"        return service\.update_policy\(payload, approval_context=_approval_context_from_request\(request\)\)\n"
    r"    approval_chain: str = Header\(default=\"\[\]\", alias=\"X-Approval-Chain\"\),\n"
    r"    service: AutonomyPolicyService = Depends\(get_policy_service\),\n"
    r"\) -> AutonomyPolicy:\n"
    r"    try:\n"
    r"        return service\.update_policy\(payload, approval_chain=parse_approval_chain\(approval_chain\)\)\n"
)

replacement = (
    "@router.put(\"\", response_model=AutonomyPolicy)\n"
    "def write_policy(\n"
    "    payload: AutonomyPolicy,\n"
    "    approval_chain: str = Header(default=\"[]\", alias=\"X-Approval-Chain\"),\n"
    "    service: AutonomyPolicyService = Depends(get_policy_service),\n"
    ") -> AutonomyPolicy:\n"
    "    try:\n"
    "        return service.update_policy(payload, approval_chain=parse_approval_chain(approval_chain))\n"
)

content = pattern.sub(replacement, content)

with open("backend/scheduling/api.py", "w") as f:
    f.write(content)
