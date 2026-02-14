# RoboDJ TODO List

This checklist converts the current product-readiness plan into a practical execution queue.


## Autopilot Loop Helper

Use the roadmap helper to continuously surface the next open tasks while you work:

- `python scripts/roadmap_autopilot.py --limit 10`
- `python scripts/roadmap_autopilot.py --loop --interval 60 --limit 10`

## P0 — Foundations (Start Here)

- [ ] Create tracked issues for all Track A/B/C/D tasks from `PRODUCT_READINESS_PLAN.md`.
- [ ] Add a versioned readiness scorecard in `docs/` and define update cadence.
- [ ] Publish runtime/deployment matrix (`dev`, `staging`, `prod`) with compatibility constraints.
- [ ] Define API/config contract versioning policy and breaking-change checklist.
- [ ] Create a release checklist with hard gates for security, contracts, and rollback docs.

## P1 — Security & Compliance

- [ ] Add role-aware settings visibility model (`admin`, `operator`, `viewer`).
- [ ] Implement idle timeout + re-auth requirements for sensitive actions.
- [ ] Implement key-rotation workflow CLI + operator checklist integration.
- [ ] Add redaction policy contract tests for logs/API responses.
- [ ] Add a pre-release security gate in release documentation.

## P1 — Reliability & Observability

- [ ] Define SLOs for schedule success, latency, and autonomy throughput.
- [ ] Add alert thresholds and escalation policy documentation.
- [ ] Publish incident runbook + postmortem template.

## P2 — UX & Operator Experience

- [ ] Build stage timeline UI (Intake → Plan → Execute → Verify → Handoff).
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
- [ ] Bi-weekly: remove blocked items or split oversized tasks.
- [ ] Monthly: reassess roadmap variation (Security-first, UX-first, Scale-first, Balanced).
