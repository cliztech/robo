# 04 — Verification (Radio Operator UI Initiative)

## Verification Objective
Confirm phase outputs are complete, evidence-backed, and compliant with repository workflow quality gates before Ready-for-Review.

## Quality Gates (Hard Requirements)

### Numeric Thresholds (Hard Gates)
1. **Plan completeness score** (scope, constraints, rollback, verification) must be **100%**.
2. **Subagent evidence completeness** (all required fields present) must be **100%**.
3. **Draft PR maturity checklist** must be fully passed before marking a PR **Ready-for-Review**.
4. **Worktree hygiene checks** must pass: no stale branches and no detached worktree merges.

## Workflow Quality Gate Checklist (Copy/Paste)

```md
## Workflow Quality Gate Checklist

- [ ] Plan completeness = 100% (scope + constraints + rollback + verification)
- [ ] Subagent evidence completeness = 100% (all required fields present)
- [ ] Draft PR maturity checklist passed before Ready-for-Review
- [ ] Worktree hygiene passed (no stale branches, no detached worktree merges)
- [ ] Validation commands and outputs are documented in the PR
- [ ] Follow-up actions (if any) are explicitly tracked
```

## Ready-for-Review Rule
- **Ready-for-Review is prohibited until checklist completion is 100%.**
- Any unchecked item keeps status at **Blocked**.

## Evidence Format
For each phase/workstream, capture:
- `phase_id`: `phase-0` … `phase-4`
- `owner_team` and `owner_agent`
- `gate_result`: pass/fail
- `validation_commands`: command + outcome
- `artifacts`: links to docs, logs, screenshots (if UI behavior changed)
- `open_risks`: unresolved items with owner + due date

## Verification Cadence
- Increment-level verification starts with the **first implementable increment** in phase-4 (Draft PR required).
- Phase-level verification on phase completion.
- Full initiative verification before handoff/release summary.

## Acceptance-Criteria Evidence Mapping Rule
- Every validation command output attached to the Draft PR must map to at least one explicit story acceptance criterion ID.
- Any acceptance criterion lacking mapped evidence is automatically `Fail` for verification and blocks Ready-for-Review.
