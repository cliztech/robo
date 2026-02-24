# 03 — Execution (Radio Operator UI Initiative)

## Workstreams and Owners

| Workstream | Scope | Delivery phase alignment | Accountable team | Accountable agent | Supporting teams |
| --- | --- | --- | --- | --- | --- |
| WS-1 Foundations & Interaction Spec | IA, component taxonomy, interaction states, keyboard-first behavior | Phase 0 | Design Team | UI/UX Agent | Management, Brutal Review |
| WS-2 Console Core Enablement | Build pipeline, lint/test gates, functional console shell | Phase 1 | DevOps Team | CI/CD Pipeline Agent | Design, QA |
| WS-3 Data Integration Surfaces | Browser/queue/scheduler integrations and environment plumbing | Phase 2 | DevOps Team | Infrastructure Agent | QA, AI Improvement |
| WS-4 Scenario Test Packs | Integration and regression scenarios for routing, timing, fallback | Phase 3 | QA Team | Test Generator Agent | DevOps, Brutal Review |
| WS-5 Release Orchestration | Readiness gates, evidence audit, release/no-release recommendation | Phase 4 | Management Team | Release Manager Agent | QA, DevOps, Design |

## Phase-4 Ongoing Review Hygiene Protocol (Not End-Loaded)

Apply this protocol as soon as the first implementable increment lands; do **not** wait for final handoff.

1. **Open/update Draft PR early**
   - Trigger: first implementable increment committed on working branch.
   - Action: open Draft PR (or update existing Draft PR) immediately and keep it as the canonical evidence ledger for phase-4.
2. **Attach validation command outputs continuously**
   - After each increment, append command output snippets and map each result to explicit story acceptance criteria IDs.
   - Any acceptance criterion without matching evidence keeps gate status at `Blocked`.
3. **Run workflow gate checklist on every increment**
   - Re-evaluate all hard gates (plan completeness, subagent evidence completeness, draft PR maturity, worktree hygiene) every update cycle.
4. **Enforce Ready-for-Review block**
   - Ready-for-Review remains prohibited until all checklist items are complete at 100% in the Draft PR body.
5. **Track unresolved follow-ups in PR body**
   - Maintain a `Follow-ups` table with: item, owner, target milestone, status, and unblock condition.

### Draft PR Evidence Block (Copy/Paste)

```md
## Incremental Verification Evidence

| Increment | Story / AC ID | Validation command | Result summary | Evidence link |
| --- | --- | --- | --- | --- |
| inc-01 | story-x / AC-1 | `pytest tests/...` | pass | <log or artifact> |

## Workflow Quality Gate Checklist
- [ ] Plan completeness = 100% (scope + constraints + rollback + verification)
- [ ] Subagent evidence completeness = 100% (all required fields present)
- [ ] Draft PR maturity checklist passed before Ready-for-Review
- [ ] Worktree hygiene passed (no stale branches, no detached worktree merges)
- [ ] Validation commands and outputs are documented in the PR
- [ ] Follow-up actions (if any) are explicitly tracked

## Follow-ups (Blocking/Non-blocking)
| Item | Owner | Target milestone | Status | Unblock condition |
| --- | --- | --- | --- | --- |
| example gap | QA Team | v1.2-m2 | open | attach regression evidence for AC-4 |
```

## Phase Workflow
1. Intake lock and artifact validation (`01-intake.md`).
2. Planning approval and dependency confirmation (`02-plan.md`).
3. Workstream execution tracking in this document.
4. Verification evidence collection (`04-verification.md`).
5. Handoff and readiness summary (`05-handoff.md`).

## Workstream Tracking Template

```md
### WS-X: <name>
- Status: Not Started / In Progress / Blocked / Done
- Owner Team:
- Owner Agent:
- Inputs:
- Outputs:
- Dependency blockers:
- Evidence links:
- Next action:
```

## Escalation Rules
- Any blocker older than 1 business day escalates to Management Team.
- Cross-team dependency conflicts escalate to Project Coordinator Agent.
- Quality gate failures escalate to QA + Brutal Review before proceeding.
