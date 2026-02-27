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

## P1 Security Lane

Execution lane source of truth for TI-039 → TI-040 → TI-041. Do not close `done` until the required evidence artifacts exist at the referenced paths.

- [ ] **TI-039 — per-action approval workflows + immutable audit export** (`in-progress`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-039.md`](docs/exec-plans/active/tracked-issues/TI-039.md)
  - Owner: **Security Architect**
  - Target date: **2026-03-03**
  - State gates: [x] ready · [x] in-progress · [ ] done
  - Required evidence before `done`: `artifacts/security/logs/ti-039-approval-enforcement.log`, `artifacts/security/reports/ti-039-immutable-audit-export.md`, `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.sha256`

- [ ] **TI-040 — config-at-rest encryption for high-risk JSON fields** (`ready`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-040.md`](docs/exec-plans/active/tracked-issues/TI-040.md)
  - Owner: **Security Engineer**
  - Target date: **2026-03-05**
  - State gates: [x] ready · [ ] in-progress · [ ] done
  - Required evidence before `done`: `artifacts/security/logs/ti-040-config-encryption.log`, `artifacts/security/reports/ti-040-high-risk-field-inventory.md`, `artifacts/security/hashes/ti-040-config-before-after.sha256`

- [ ] **TI-041 — security smoke script (authN/authZ + lockout + privileged action checks)** (`blocked`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-041.md`](docs/exec-plans/active/tracked-issues/TI-041.md)
  - Owner: **QA Engineer**
  - Target date: **2026-03-07**
  - State gates: [ ] ready · [ ] in-progress · [ ] done
  - Required evidence before `done`: `artifacts/security/logs/ti-041-security-smoke.log`, `artifacts/security/reports/ti-041-smoke-matrix-report.md`, `artifacts/security/hashes/ti-041-smoke-output.sha256`

### Dependency gates (explicit)

- **Gate G1 (TI-039 → TI-041 privileged-action checks):** TI-039 action catalog + immutable audit export outputs must be present before TI-041 can execute `SMK-PRIV-01` privileged-action blocking checks.
- **Gate G2 (TI-040 → TI-041 authz tests):** TI-040 encrypted-field inventory/envelope coverage must be complete before TI-041 can finalize authz denial scenarios for encrypted-field mutation attempts.

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
- Implement smoke script checks for authN failure, authZ denial, lockout trigger, and privileged action blocking via `pnpm test:security`.
- Define deterministic pass/fail signatures, artifact paths, and TI-039/TI-040 control markers.
- Attach command examples and escalation mapping to release/security incident gates (`PRE_RELEASE_CHECKLIST.md`, `docs/runbooks/index.md`, `docs/reliability_incident_response.md`).

## Verification gates

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --build-plan docs/exec-plans/active/unfinished-task-build-plan.md --limit 10 && git diff --quiet docs/exec-plans/active/unfinished-task-build-plan.md`
- `rg -n "TI-039|TI-040|TI-041" docs/exec-plans/active/unfinished-task-build-plan.md docs/exec-plans/active/2026-02-25-next-unfinished-phase-build.md`
- `git diff --name-only`

## Rollback

- Revert this plan artifact and the generated build-plan update in a single commit rollback.
