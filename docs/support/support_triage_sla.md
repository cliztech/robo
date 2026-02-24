# Support Triage Workflow and SLA Targets

## Triage workflow
1. **Intake**
   - Capture timestamp, reporter, environment, and impacted workflow.
   - Record initial symptom and evidence links.
2. **Severity classification**
   - Assign severity using the matrix below.
3. **Routing + ownership**
   - Route to owning team and assign incident coordinator.
4. **Execution + checkpoints**
   - Execute remediation from runbook index.
   - Record customer/operator communications at required checkpoints.
5. **Closure**
   - Confirm recovery criteria, document residual risks, and schedule follow-up actions.

## Severity model and SLAs

| Severity | Description | Initial response SLA | Mitigation/restore target | Owner routing |
| --- | --- | --- | --- | --- |
| Sev1 | Production outage/security-critical failure | 15 minutes | 4 hours | Incident Response + SecOps + DevOps lead |
| Sev2 | Major user-impacting degradation with workaround | 30 minutes | 8 hours | DevOps + owning feature team |
| Sev3 | Moderate defect, limited scope impact | 4 hours | 2 business days | Owning team + QA |
| Sev4 | Minor issue/documentation gap | 1 business day | Next planned sprint | Product/Docs owner |

## Escalation checkpoints
- **Checkpoint A (classification):** confirm severity + route owner within response SLA.
- **Checkpoint B (mitigation start):** notify stakeholders once mitigation begins.
- **Checkpoint C (post-restore):** provide recovery summary + residual risks.

## Customer communication templates

### Initial acknowledgement
"We have received your report, classified it as **{severity}**, and started triage. Next update ETA: **{time}**."

### Mitigation in progress
"Mitigation is in progress for **{incident_id}**. Current status: **{status}**. Estimated restore time: **{eta}**."

### Resolution + follow-up
"The incident is resolved. Residual risk: **{risk_summary}**. Follow-up actions and timeline: **{follow_up_plan}**."
