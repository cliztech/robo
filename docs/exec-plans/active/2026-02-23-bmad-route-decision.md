# BMAD Route Decision (Operator Prompt: "you decide")

Date: 2026-02-23  
Route: Proposal (BMAD planning path)  
Selected BMAD command: `bmad-bmm-create-prd`

## Intake Summary

- **Prompt context:** User asked for `bmad-method`, received the standard BMAD sequence, then replied "you decide".
- **Decision goal:** Choose one concrete next command (not another meta-routing step).
- **Constraint applied:** Follow canonical route selection and prerequisite sequencing rules.

## Decision Rationale

`bmad-bmm-create-prd` is the correct next command in this conversation because:

1. The user already entered BMAD-method context and asked for an explicit decision.
2. In `_bmad/_config/bmad-help.csv`, `Create PRD` is marked as a required planning step.
3. Canonical tie-break guidance says to prefer prerequisite phases first before later-phase commands.

## Recommended Next Command

```text
/bmad-bmm-create-prd
```

## Ordered Follow-on Sequence

After `/bmad-bmm-create-prd`, continue with required BMAD planning gates:

1. `/bmad-bmm-create-architecture`
2. `/bmad-bmm-create-epics-and-stories`
3. `/bmad-bmm-check-implementation-readiness`
4. `/bmad-bmm-sprint-planning`

## Evidence References

- `_bmad/_config/bmad-help.csv` lists `bmad-bmm-create-prd` as required in phase 2 planning.
- `_bmad/_config/bmad-help.csv` lists downstream required prerequisites and gates (architecture, epics/stories, readiness, sprint planning).
- `docs/operations/agent_execution_commands.md` tie-break rule #1: prefer prerequisite phases first.

## Verification Commands

- `git status --short`
- `git diff --name-only`
- `rg -n "Selected BMAD command|bmad-bmm-create-prd|Ordered Follow-on Sequence" docs/exec-plans/active/2026-02-23-bmad-route-decision.md`
- `rg -n "Create PRD|Create Architecture|Create Epics and Stories|Check Implementation Readiness|Sprint Planning" _bmad/_config/bmad-help.csv`
- `rg -n "Prefer prerequisite phases first" docs/operations/agent_execution_commands.md`

## Rollback

- Revert single commit if this route decision artifact is no longer needed.
