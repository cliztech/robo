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
- [ ] Add a pre-release security gate in release documentation ([TI-006](docs/exec-plans/active/tracked-issues/TI-006.md)).

## P1 — Reliability & Observability

- [x] Define SLOs for schedule success, latency, and autonomy throughput.
- [x] Add alert thresholds and escalation policy documentation.
- [x] Publish incident runbook + postmortem template.

## P2 — UX & Operator Experience

- [x] Build stage timeline UI (Intake → Plan → Execute → Verify → Handoff).
- [ ] Add human-in-the-loop checkpoints for high-impact decisions.
- [ ] Add task route templates (QA / Change / Proposal).
- [ ] Add one-click rollback assistant for config-level changes.
- [ ] Add guided troubleshooting for schedules/personas/autonomy policies.

## P2 — Productization

- [ ] Publish operator guides by persona (Admin, Producer, Reviewer).
- [ ] Build runbook index for common failures.
- [ ] Define support triage workflow + SLA targets.
- [ ] Document packaging tiers and feature-gate boundaries.
- [ ] Define telemetry ethics + opt-in policy.

## Tracking Cadence

- [ ] Weekly: update readiness percentages by category.
- [ ] Weekly backlog hygiene review owner/date: Project Coordinator — every Friday.
- [ ] Bi-weekly: remove blocked items or split oversized tasks.
- [ ] Monthly: reassess roadmap variation (Security-first, UX-first, Scale-first, Balanced).
