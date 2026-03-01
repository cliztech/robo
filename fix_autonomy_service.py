import re

with open("backend/scheduling/autonomy_service.py", "r") as f:
    content = f.read()

# Fix context variable in append_audit_record in update_policy
pattern = re.compile(
    r"        append_audit_record\(\n"
    r"            self\.security_audit_log_path,\n"
    r"            \{\n"
    r"                \"event_id\": str\(uuid4\(\)\),\n"
    r"                \"timestamp\": datetime\.now\(timezone\.utc\)\.isoformat\(\),\n"
    r"                \"action\": \"ACT-UPDATE-AUTONOMY-POLICY\",\n"
    r"                \"actor_id\": context\.actor_id,\n"
    r"                \"result\": \"success\",\n"
    r"                \"before_sha256\": before_hash,\n"
    r"                \"after_sha256\": config_hash\(serialized_payload\),\n"
    r"                \"approvals\": \[\n"
    r"                    \{\n"
    r"                        \"approver_id\": approval\.approver_id,\n"
    r"                        \"approver_roles\": sorted\(approval\.approver_roles\),\n"
    r"                        \"reason\": approval\.reason,\n"
    r"                    \}\n"
    r"                    for approval in context\.approvals\n"
    r"                \],\n"
    r"            \},\n"
    r"        \)\n"
)

replacement = (
    "        append_audit_record(\n"
    "            self.security_audit_log_path,\n"
    "            {\n"
    "                \"event_id\": str(uuid4()),\n"
    "                \"timestamp\": datetime.now(timezone.utc).isoformat(),\n"
    "                \"action\": \"ACT-UPDATE-AUTONOMY-POLICY\",\n"
    "                \"actor_id\": \"api-key-actor\",\n"
    "                \"result\": \"success\",\n"
    "                \"before_sha256\": before_hash,\n"
    "                \"after_sha256\": config_hash(serialized_payload),\n"
    "                \"approvals\": [\n"
    "                    {\n"
    "                        \"principal\": approval.principal,\n"
    "                        \"role\": approval.role.value,\n"
    "                        \"approved_at_utc\": approval.approved_at_utc,\n"
    "                    }\n"
    "                    for approval in (approval_chain or [])\n"
    "                ],\n"
    "            },\n"
    "        )\n"
)

content = pattern.sub(replacement, content)

with open("backend/scheduling/autonomy_service.py", "w") as f:
    f.write(content)
