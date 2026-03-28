# Agent Governance Canonical

Single source of truth for agent governance across the repository.

## Changelog

| Version | Date | Owner | Reason |
| --- | --- | --- | --- |
| 1.0.0 | 2026-03-04 | DevOps + Management | Established canonical governance baseline and drift-validation contract. |

## Scope and usage

- This file is authoritative for: team topology, route selection policy, completion gates, escalation flow, and personality/communication rules.
- Derived docs MUST reference this file rather than duplicating normative content.
- Drift checks are enforced by `scripts/validate_agent_governance_consistency.py`.

## Team topology <!-- GOV:team-topology -->

- Management Team orchestrates execution priorities and cross-team dependencies.
- Functional teams: DevOps, SecOps, Design, Research, QA, Brutal Review & Feedback, Bug, Incident Response.
- Sub-teams and role responsibilities remain defined in `AGENTS.md` under **Agent Team Organization**.
- Any topology change must update both this section and the changelog table.

## Route selection policy <!-- GOV:route-selection -->

- Canonical BMAD startup policy and deterministic route-to-command mapping live in `docs/operations/agent_execution_commands.md`.
- Intake route categories are fixed:
  - `QA` = read-only analysis and validation.
  - `Proposal` = design/spec/planning artifacts.
  - `Change` = scoped implementation with mandatory verification.
- Tie-break order is fixed: prerequisite phase first, then highest-risk intent, then mandatory verification.

## Completion gates <!-- GOV:completion-gates -->

- Required hard gates:
  1. Plan completeness = 100%.
  2. Subagent evidence completeness = 100%.
  3. Draft PR maturity checklist fully passed before Ready-for-Review.
  4. Worktree hygiene checks pass.
- Every delivery change must include explicit validation command evidence.

## Escalation flow <!-- GOV:escalation-flow -->

1. Executor blocks on policy/scope ambiguity.
2. Escalate to Planner for scope reconciliation.
3. Escalate to Management Team for cross-team dependency/risk decision.
4. Escalate to SecOps immediately for security/compliance breach indicators.
5. Escalate to Incident Response for production-impacting reliability or security incidents.

Escalations must include: trigger, impact, owner, decision, and rollback path.

## Personality and communication rules <!-- GOV:communication-rules -->

- Communicate as senior engineer operators: precise, concise, evidence-first.
- Prefer deterministic language over aspirational wording.
- State assumptions explicitly when inputs are incomplete.
- Always include runnable validation commands for claims.
- Preserve DGN-DJ branding conventions in operator-facing communication.

## Canonical references

- Repository-wide execution policy: `AGENTS.md`
- BMAD command routing and operational commands: `docs/operations/agent_execution_commands.md`
- Subagent execution protocol: `docs/operations/subagent_execution_playbook.md`
