# Operator Guide by Persona (Admin, Producer, Reviewer)

## Purpose
This guide defines role-specific responsibilities, safe actions, onboarding checklists, and escalation paths for DGN-DJ operations.

## Shared safety rules (all personas)
- Validate planned changes against the active story scope before editing.
- Use documented rollback procedures before manual hotfixes.
- Escalate security-impacting findings immediately.

References:
- Incident escalation policy: [`docs/reliability_incident_response.md`](../reliability_incident_response.md)
- Support triage workflow + SLAs: [`docs/support/support_triage_sla.md`](./support_triage_sla.md)
- Runbook index: [`docs/support/runbook_index.md`](./runbook_index.md)

## Admin Persona
### Responsibilities
- Own release readiness checks and approval gates.
- Manage role permissions and sensitive operational controls.
- Trigger escalations for incident severities Sev1/Sev2.

### Safe actions
- Update documentation, runbooks, and release checklists.
- Execute read-only diagnostics and validation commands.
- Approve rollback actions for config-level incidents.

### Minimum onboarding checklist
- Read `AGENTS.md` boundary rules and escalation model.
- Read `docs/reliability_incident_response.md` severity matrix.
- Run `git status --short` and `git diff --name-only` practice checks.

## Producer Persona
### Responsibilities
- Operate day-to-day scheduling/content workflows.
- Detect production-impacting content and schedule anomalies.
- Hand off high-risk incidents to Admin per triage flow.

### Safe actions
- Execute approved operator workflows and checklist-driven mitigations.
- Use runbook procedures for scheduling/persona/autonomy incidents.
- Document incident evidence and timestamps for support handoff.

### Minimum onboarding checklist
- Read `docs/support/runbook_index.md` and top-5 common failure runbooks.
- Practice severity classification using `docs/support/support_triage_sla.md`.
- Confirm rollback request path and evidence packet format.

## Reviewer Persona
### Responsibilities
- Validate quality gates, compliance notes, and handoff completeness.
- Ensure closure packets include verification and residual risks.
- Flag documentation drift and missing cross-links.

### Safe actions
- Perform read-only audits and checklist validation.
- Request corrective actions for incomplete evidence.
- Validate that rollback and escalation links resolve.

### Minimum onboarding checklist
- Read `docs/operations/agent_execution_commands.md` self-check + verification sections.
- Validate doc link consistency in support artifacts.
- Review closure packet template in `docs/exec-plans/active/story-closure-packets.md`.
