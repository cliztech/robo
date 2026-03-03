# Runbook Index for Common Failures

## Scope
This index maps common failures to authoritative remediation runbooks using symptom → action navigation.

## Ownership and cadence
- **Owner:** Support Operations Lead
- **Backup owner:** Reliability Lead
- **Cadence:** Weekly review (Friday), plus post-incident updates within 24 hours
- **Quality gate:** All links resolve and each entry includes trigger, diagnosis, and recovery steps

## Symptom → Action index

| Failure class | Symptom trigger | Primary runbook | Diagnosis | Recovery steps |
| --- | --- | --- | --- | --- |
| Scheduling | Missing/duplicated blocks, unresolved timeline conflicts | `docs/support/support_triage_sla.md#triage-workflow` | Verify scheduler state + recent config edits | Follow triage path; apply rollback assistant/manual rollback if needed |
| Persona | Persona drift, tone mismatch, inconsistent host output | `docs/conversation_orchestrator_spec.md` | Compare output against persona profile dimensions | Reapply persona profile baseline and validate with reviewer |
| Autonomy | Unexpected autonomous action, missing checkpoint approvals | `docs/autonomy_modes.md` | Inspect autonomy mode and approval checkpoints | Downgrade autonomy level; re-run task with HITL checkpoints |
| Release/Deployment | Gate failure, upgrade regression, failed startup readiness | `docs/reliability_incident_response.md` | Check release gate evidence and startup logs | Execute rollback plan, then escalate per severity matrix |

## Runbook entry schema (required)
Each runbook entry must provide:
1. **Trigger** (observable symptom and threshold)
2. **Diagnosis** (deterministic checks/commands)
3. **Recovery** (ordered remediation + rollback criteria)
4. **Owner** (primary + backup)
5. **Last reviewed date**
