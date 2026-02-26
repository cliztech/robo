# Next Unfinished Phase Build Plan (P1 Security)

Date: 2026-02-25  
Route: Change  
Source queue: `docs/exec-plans/active/unfinished-task-build-plan.md`

## Why this plan

The generated unfinished-task queue now shows only **3 phased items**, all in **P1 Security & Compliance**. This plan converts those items into an execution packet with dependency order, validation gates, and rollback strategy.

## Next unfinished items (execution order)

1. **TI-039** — per-action approval workflows + immutable audit export  
   File: `docs/exec-plans/active/tracked-issues/TI-039.md`
2. **TI-040** — config-at-rest encryption for high-risk JSON fields  
   File: `docs/exec-plans/active/tracked-issues/TI-040.md`
3. **TI-041** — security smoke script (authN/authZ + lockout checks)  
   File: `docs/exec-plans/active/tracked-issues/TI-041.md`

## Dependency logic

- **TI-039 first**: approval/audit policy defines security events that later checks must validate.
- **TI-040 second**: encryption controls must align with TI-039 audit requirements.
- **TI-041 last**: smoke checks verify both policy controls (TI-039) and data protection controls (TI-040).

## Build packets

### Packet A — TI-039
- Confirm action catalog (`publish`, `delete`, `override`, `key-rotation`, `config-edit`) and required approver roles.
- Define immutable audit export contract (event id, actor, target, before/after hash, approval chain, timestamp).
- Add acceptance checks in tracked-issue artifact and link to release gate docs.

### Packet B — TI-040
- Enumerate high-risk JSON fields and redaction/encryption policy.
- Define encryption envelope format and key provenance requirements.
- Update operator runbook references for rotation + restore behavior.

### Packet C — TI-041
- Define smoke script checks for authN failure, authZ denial, lockout trigger, and privileged action blocking.
- Add expected pass/fail signatures and incident escalation mapping.
- Attach command examples and output evidence requirements.

## Verification gates

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --build-plan docs/exec-plans/active/unfinished-task-build-plan.md --limit 10`
- `rg -n "TI-039|TI-040|TI-041" docs/exec-plans/active/unfinished-task-build-plan.md docs/exec-plans/active/2026-02-25-next-unfinished-phase-build.md`
- `git diff --name-only`

## Rollback

- Revert this plan artifact and the generated build-plan update in a single commit rollback.
