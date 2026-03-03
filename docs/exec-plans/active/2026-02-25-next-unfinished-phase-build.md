# Next Unfinished Phase Build Plan (P1 Security)

Date: 2026-02-25  
Route: Change  
Source queue: `docs/exec-plans/active/unfinished-task-build-plan.md`
As-of date: 2026-03-03  
Upstream authority reference: `docs/exec-plans/active/sprint-status.yaml` (`last_reconciled: 2026-02-27`, blob `fa0026d55b4dc4a45681381ac5b2a30dc856d5ac`)

## Why this plan

The generated unfinished-task queue now shows only **3 phased items**, all in **P1 Security & Compliance**. This plan converts those items into an execution packet with dependency order, validation gates, and rollback strategy.

## Current unresolved sequence

1. **TI-040** — config-at-rest encryption for high-risk JSON fields  
   File: `docs/exec-plans/active/tracked-issues/TI-040.md`

> Freshness note: TI-039 (`Closed`) and TI-041 (`Complete`) have moved to completed evidence references in this packet based on tracked-issue status acceptance.

## P1 Security Lane

Execution lane source of truth for unresolved P1 Security work. Do not close `done` until the required evidence artifacts exist at the referenced paths.

### Completed evidence references (accepted as done)

- [x] **TI-039 — per-action approval workflows + immutable audit export** (`closed`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-039.md`](docs/exec-plans/active/tracked-issues/TI-039.md)
  - Evidence references: `artifacts/security/logs/ti-039-approval-enforcement.log`, `artifacts/security/reports/ti-039-immutable-audit-export.md`, `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.sha256`
- [x] **TI-041 — security smoke script (authN/authZ + lockout + privileged action checks)** (`complete`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-041.md`](docs/exec-plans/active/tracked-issues/TI-041.md)
  - Evidence references: `artifacts/security/logs/ti-041-security-smoke.log`, `artifacts/security/reports/ti-041-smoke-matrix-report.md`, `artifacts/security/hashes/ti-041-smoke-output.sha256`

### Active remaining work

- [ ] **TI-040 — config-at-rest encryption for high-risk JSON fields** (`ready`)
  - Tracking issue: [`docs/exec-plans/active/tracked-issues/TI-040.md`](docs/exec-plans/active/tracked-issues/TI-040.md)
  - Owner: **Security Engineer**
  - Target date: **2026-03-05**
  - State gates: [x] ready · [ ] in-progress · [ ] done
  - Required evidence before `done`: `artifacts/security/logs/ti-040-config-encryption.log`, `artifacts/security/reports/ti-040-high-risk-field-inventory.md`, `artifacts/security/hashes/ti-040-config-before-after.sha256`

### Dependency gates (explicit)

- **Gate G1 (TI-039 → TI-041 privileged-action checks):** TI-039 action catalog + immutable audit export outputs must be present before TI-041 can execute `SMK-PRIV-01` privileged-action blocking checks.
- **Gate G2 (TI-040 → TI-041 authz tests):** TI-040 encrypted-field inventory/envelope coverage must be complete before TI-041 can finalize authz denial scenarios for encrypted-field mutation attempts.

## Dependency logic (current unresolved scope)

- **TI-040 active**: encryption controls remain the unresolved implementation item.
- **TI-039/TI-041 complete context**: treat as upstream satisfied controls/evidence references for TI-040 compatibility checks.

## Build packets (remaining)

### Packet A — TI-040
- Enumerate high-risk JSON fields and redaction/encryption policy.
- Define encryption envelope format and key provenance requirements.
- Update operator runbook references for rotation + restore behavior.

## Verification gates

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --build-plan docs/exec-plans/active/unfinished-task-build-plan.md --limit 10 && git diff --quiet docs/exec-plans/active/unfinished-task-build-plan.md`
- `rg -n "TI-039|TI-040|TI-041|As-of date|Upstream authority reference" docs/exec-plans/active/unfinished-task-build-plan.md docs/exec-plans/active/2026-02-25-next-unfinished-phase-build.md`
- `git diff --name-only`

## Rollback

- Revert this plan artifact and the generated build-plan update in a single commit rollback.
