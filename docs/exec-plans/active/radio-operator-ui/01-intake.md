# 01 — Intake (Radio Operator UI Initiative)

## Scope
- Create and maintain the stage-gated execution artifact set for the **Radio Operator UI** program under `docs/exec-plans/active/radio-operator-ui/`.
- Align execution artifacts with the delivery phases defined in `docs/ui/radio_operator_ui_delivery_plan.md`:
  - Phase 0 — Foundations
  - Phase 1 — Console Core (Functional)
  - Phase 2 — Browser + Queue + Scheduler Integration
  - Phase 3 — FX/Sampler + Routing + Diagnostics
  - Phase 4 — Hardening + Release Readiness
- Map accountable teams and agents directly from the repository team model in `AGENTS.md` and the phase ownership table in the delivery plan.

## Constraints
- Documentation-only change; no code, runtime, dependency, or deployment changes.
- Preserve existing phase names and ownership language from canonical docs.
- Use stage-gated BMAD flow documents (`01` to `05`) with explicit handoff criteria.
- Keep workflow quality gates as hard requirements and block Ready-for-Review until all hard gates are complete.

## Non-Goals
- No implementation of UI/backend features.
- No edits to `backend/`, executable assets, or database files.
- No restructuring of the existing delivery plan document.

## Source Assets
- `AGENTS.md` (team model, workflow quality gates, checklist text)
- `docs/ui/radio_operator_ui_delivery_plan.md` (delivery phases and accountable team/agent mapping)
- `docs/exec-plans/tech-debt-tracker.md` (existing exec-plan area context)

## Intake Classification
- **Route:** Proposal/Change (documentation planning artifacts)
- **Primary teams involved:** Management, Design, DevOps, QA, AI Improvement, Brutal Review
- **Completion gate for intake:** Scope + constraints + source references confirmed
