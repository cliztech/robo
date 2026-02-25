# RoboDJ TODO List

This checklist converts the current product-readiness plan into a practical execution queue.


## Autopilot Loop Helper

Use the roadmap helper to continuously surface the next open tasks while you work:

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --loop --interval 60 --limit 10`

## P0 — Foundations (Start Here)

- [ ] Create tracked issues for all Track A/B/C/D tasks from `PRODUCT_READINESS_PLAN.md` ([TI-001](docs/exec-plans/active/tracked-issues/TI-001.md)).
- [x] Add a versioned readiness scorecard in `docs/` and define update cadence.
- [x] Publish runtime/deployment matrix (`dev`, `staging`, `prod`) with compatibility constraints.
- [x] Define API/config contract versioning policy and breaking-change checklist.
- [x] Create a release checklist with hard gates for security, contracts, and rollback docs.

## P1 — Security & Compliance

- [ ] Add role-aware settings visibility model (`admin`, `operator`, `viewer`) ([TI-002](docs/exec-plans/active/tracked-issues/TI-002.md)).
- [ ] Implement idle timeout + re-auth requirements for sensitive actions ([TI-003](docs/exec-plans/active/tracked-issues/TI-003.md)).
- [ ] Implement key-rotation workflow CLI + operator checklist integration ([TI-004](docs/exec-plans/active/tracked-issues/TI-004.md)).
- [ ] Add redaction policy contract tests for logs/API responses ([TI-005](docs/exec-plans/active/tracked-issues/TI-005.md)).
- [x] Add a pre-release security gate in release documentation ([TI-006](docs/exec-plans/active/tracked-issues/TI-006.md)).

## P1 — Reliability & Observability

- [x] Define SLOs for schedule success, latency, and autonomy throughput.
- [x] Add alert thresholds and escalation policy documentation.
- [x] Publish incident runbook + postmortem template.

## P2 — UX & Operator Experience

- [x] Build stage timeline UI (Intake → Plan → Execute → Verify → Handoff).
<<<<<<< HEAD
- [ ] Add human-in-the-loop checkpoints for high-impact decisions.
- [x] Add task route templates (QA / Change / Proposal).
- [ ] Add one-click rollback assistant for config-level changes.
- [ ] Add guided troubleshooting for schedules/personas/autonomy policies.

## P2 — Productization

- [ ] Publish operator guides by persona (Admin, Producer, Reviewer).
- [x] Build runbook index for common failures.
- [x] Define support triage workflow + SLA targets.
- [ ] Document packaging tiers and feature-gate boundaries.
- [x] Define telemetry ethics + opt-in policy.
=======
- [ ] Add human-in-the-loop checkpoints for high-impact decisions ([TI-011](docs/exec-plans/active/tracked-issues/TI-011.md)).
- [ ] Add task route templates (QA / Change / Proposal) ([TI-013](docs/exec-plans/active/tracked-issues/TI-013.md)).
- [ ] Add one-click rollback assistant for config-level changes ([TI-014](docs/exec-plans/active/tracked-issues/TI-014.md)).
- [ ] Add guided troubleshooting for schedules/personas/autonomy policies ([TI-015](docs/exec-plans/active/tracked-issues/TI-015.md)).

## P2 — Productization

- [x] Publish operator guides by persona (Admin, Producer, Reviewer) ([TI-030](docs/exec-plans/active/tracked-issues/TI-030.md)).
- [x] Build runbook index for common failures ([TI-031](docs/exec-plans/active/tracked-issues/TI-031.md)).
- [x] Define support triage workflow + SLA targets ([TI-032](docs/exec-plans/active/tracked-issues/TI-032.md)).
- [ ] Document packaging tiers and feature-gate boundaries ([TI-033](docs/exec-plans/active/tracked-issues/TI-033.md)).
- [ ] Define telemetry ethics + opt-in policy ([TI-034](docs/exec-plans/active/tracked-issues/TI-034.md)).


## P1 — v1.2 Scheduler UI Execution

- [ ] Start drag/drop weekly timeline implementation on normalized scheduler contracts ([TI-007](docs/exec-plans/active/tracked-issues/TI-007.md)) — **In Progress**.
- [ ] Implement inline conflict rendering + backend fix actions ([TI-008](docs/exec-plans/active/tracked-issues/TI-008.md)).
- [ ] Add keyboard parity for move/resize/resolve interactions ([TI-009](docs/exec-plans/active/tracked-issues/TI-009.md)).
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581

## Dev Build Task Queue

- [ ] Execute build-focused checklist in `docs/exec-plans/active/dev-build-todo-tasks.md`.

## Tracking Cadence

- [ ] Weekly: update readiness percentages by category ([TI-035](docs/exec-plans/active/tracked-issues/TI-035.md)).
- [ ] Weekly backlog hygiene review owner/date: Project Coordinator — every Friday (next review: 2026-02-27) ([TI-036](docs/exec-plans/active/tracked-issues/TI-036.md)).
- [ ] Bi-weekly: remove blocked items or split oversized tasks ([TI-037](docs/exec-plans/active/tracked-issues/TI-037.md)).
- [ ] Monthly: reassess roadmap variation (Security-first, UX-first, Scale-first, Balanced) ([TI-038](docs/exec-plans/active/tracked-issues/TI-038.md)).
- [ ] 2026-02-24 (Owner: Management Team — Project Coordinator): Weekly readiness metric refresh posted in `docs/readiness_scorecard.md` (next due: 2026-03-03).
- [ ] 2026-02-27 (Owner: Management Team — Project Coordinator): Weekly backlog hygiene review completed and stale-track escalations logged per `docs/operations/execution_index.md`.
- [ ] 2026-03-10 (Owner: Planner Agent): Bi-weekly blocked-item pruning complete (remove blocked items or split oversized tasks).
- [ ] 2026-03-31 (Owner: Management Team — Sprint Planner): Monthly roadmap-variant reassessment recorded (Security-first / UX-first / Scale-first / Balanced).
