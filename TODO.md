# RoboDJ TODO List

> **State authority:** When execution artifacts disagree, `docs/exec-plans/active/sprint-status.yaml` is the canonical state for epic/story status, and this checklist must be reconciled to match it during weekly hygiene.

This checklist converts the current product-readiness plan into a practical execution queue.


## Autopilot Loop Helper

Use the roadmap helper to continuously surface the next open tasks while you work:

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --loop --interval 60 --limit 10`
- `python scripts/roadmap_autopilot.py --limit 25 --build-plan docs/exec-plans/active/unfinished-task-build-plan.md` (regenerates unfinished queue + dated cadence due-date reminders)

## P0 — Foundations (Start Here)

- [x] Create tracked issues for all Track A/B/C/D tasks from `PRODUCT_READINESS_PLAN.md` ([TI-001](docs/exec-plans/active/tracked-issues/TI-001.md)).
- [x] Add a versioned readiness scorecard in `docs/` and define update cadence.
- [x] Publish runtime/deployment matrix (`dev`, `staging`, `prod`) with compatibility constraints.
- [x] Define API/config contract versioning policy and breaking-change checklist.
- [x] Create a release checklist with hard gates for security, contracts, and rollback docs.

## P1 — Security & Compliance

- [x] Add role-aware settings visibility model (`admin`, `operator`, `viewer`) ([TI-002](docs/exec-plans/active/tracked-issues/TI-002.md)).
- [x] Implement idle timeout + re-auth requirements for sensitive actions ([TI-003](docs/exec-plans/active/tracked-issues/TI-003.md)).
- [x] Implement key-rotation workflow CLI + operator checklist integration ([TI-004](docs/exec-plans/active/tracked-issues/TI-004.md)).
- [x] Add redaction policy contract tests for logs/API responses ([TI-005](docs/exec-plans/active/tracked-issues/TI-005.md)).
- [x] Add a pre-release security gate in release documentation ([TI-006](docs/exec-plans/active/tracked-issues/TI-006.md)).
- [ ] Add per-action approval workflows and immutable audit trail export ([TI-039](docs/exec-plans/active/tracked-issues/TI-039.md)).
- [ ] Add config-at-rest encryption for high-risk fields in JSON configs ([TI-040](docs/exec-plans/active/tracked-issues/TI-040.md)).
- [ ] Add security smoke script (authN/authZ checks, lockout checks) ([TI-041](docs/exec-plans/active/tracked-issues/TI-041.md)).

## P1 — Reliability & Observability

- [x] Define SLOs for schedule success, latency, and autonomy throughput.
- [x] Add alert thresholds and escalation policy documentation.
- [x] Publish incident runbook + postmortem template.

## P2 — UX & Operator Experience

- [x] Build stage timeline UI (Intake → Plan → Execute → Verify → Handoff).
- [x] Add human-in-the-loop checkpoints for high-impact decisions ([TI-011](docs/exec-plans/active/tracked-issues/TI-011.md)).
- [x] Add task route templates (QA / Change / Proposal) ([TI-013](docs/exec-plans/active/tracked-issues/TI-013.md)).
- [x] Add one-click rollback assistant for config-level changes ([TI-014](docs/exec-plans/active/tracked-issues/TI-014.md)).
- [x] Add guided troubleshooting for schedules/personas/autonomy policies ([TI-015](docs/exec-plans/active/tracked-issues/TI-015.md)).

## P2 — Productization

- [x] Publish operator guides by persona (Admin, Producer, Reviewer) ([TI-030](docs/exec-plans/active/tracked-issues/TI-030.md)).
- [x] Build runbook index for common failures ([TI-031](docs/exec-plans/active/tracked-issues/TI-031.md)).
- [x] Define support triage workflow + SLA targets ([TI-032](docs/exec-plans/active/tracked-issues/TI-032.md)).
- [x] Document packaging tiers and feature-gate boundaries ([TI-033](docs/exec-plans/active/tracked-issues/TI-033.md)).
- [x] Define telemetry ethics + opt-in policy ([TI-034](docs/exec-plans/active/tracked-issues/TI-034.md)).


## P1 — v1.2 Scheduler UI Execution

- [x] Start drag/drop weekly timeline implementation on normalized scheduler contracts ([TI-007](docs/exec-plans/active/tracked-issues/TI-007.md)) — **In Progress**.
- [x] Implement inline conflict rendering + backend fix actions ([TI-008](docs/exec-plans/active/tracked-issues/TI-008.md)).
- [x] Add keyboard parity for move/resize/resolve interactions ([TI-009](docs/exec-plans/active/tracked-issues/TI-009.md)).

## Dev Build Task Queue

- [ ] Execute build-focused checklist in `docs/exec-plans/active/dev-build-todo-tasks.md`.

## Tracking Cadence

- [ ] Weekly: update readiness percentages by category ([TI-035](docs/exec-plans/active/tracked-issues/TI-035.md)).
- [ ] Weekly backlog hygiene review owner/date: Project Coordinator — every Friday (next review: 2026-03-01) ([TI-036](docs/exec-plans/active/tracked-issues/TI-036.md)).
- Status sync note: For closed tracked issues, `TODO.md` checkbox state must mirror each TI `Status` field during weekly hygiene reconciliation.
- [ ] Bi-weekly: remove blocked items or split oversized tasks ([TI-037](docs/exec-plans/active/tracked-issues/TI-037.md)).
- [ ] Monthly: reassess roadmap variation (Security-first, UX-first, Scale-first, Balanced) ([TI-038](docs/exec-plans/active/tracked-issues/TI-038.md)).
- [x] 2026-02-24 (Owner: Management Team — Project Coordinator): Weekly readiness metric refresh posted in `docs/readiness_scorecard.md` (Outcome: completed 2026-02-27 with refreshed weighted score + blocker status; next due 2026-03-03).
- [ ] 2026-03-01 (Owner: Management Team — Project Coordinator): Weekly backlog hygiene review + stale-track escalation log posted in `docs/operations/execution_index.md` (Outcome: 2026-02-27 window formally deferred due to Phase 5 stabilization priority; defer rationale logged in execution index cadence table).
- [ ] 2026-03-10 (Owner: Planner Agent): Bi-weekly blocked-item pruning complete (remove blocked items or split oversized tasks).
- [ ] 2026-03-31 (Owner: Management Team — Sprint Planner): Monthly roadmap-variant reassessment recorded (Security-first / UX-first / Scale-first / Balanced).

### Sprint-close guardrail

- No sprint may be closed unless all dated cadence items within the sprint window are either marked complete or formally deferred with explicit rationale, owner, and replacement due date.
