# DJ Console Design Pod Charter

Status: Active charter
Scope type: Mission-specific execution template for DJ console GUI design
Primary audience: Design Team, QA Team, Management Team, DevOps Team

## Mission

Deliver a production-ready DJ console interaction system for DGN-DJ by DGNradio that is operator-fast, accessibility-compliant, and implementation-ready for engineering handoff.

## Scope

In scope:
- Define and iterate DJ console UX architecture (deck/mixer/browser/queue/scheduler/diagnostics surfaces).
- Produce implementation-ready design artifacts and acceptance criteria.
- Gate interaction quality for keyboard-first operations, accessibility, and operator latency expectations.
- Coordinate design decisions across Design, QA, PM/Architect, and implementation owners.

## Non-Goals

Out of scope for this pod:
- Writing production frontend code or backend services.
- Making release or deployment decisions.
- Changing product roadmap ownership or release cadence.
- Replacing global branding policy documents.

## Role Roster

| Role | Primary owner | Core responsibilities | Backup owner |
| --- | --- | --- | --- |
| UI/UX Agent | Design Team · UI/UX Agent | Wireframes, interaction states, workflow ergonomics, operator task-flow design | PM/Architect Liaison |
| Accessibility Auditor | Design Team · Accessibility Auditor Agent | Keyboard-first and assistive-technology criteria, ARIA/focus order, contrast and readability conformance | QA Visual/Regression Support |
| Brand Consistency Agent | Design Team · Brand Consistency Agent | Enforce DGN-DJ branding language, visual identity alignment, copy consistency | UI/UX Agent |
| QA Visual/Regression Support | QA Team · Regression Watcher Agent | Visual baseline checks, UI regression coverage expectations, pre-PR verification evidence | Accessibility Auditor |
| PM/Architect Liaison | Management Team · Project Coordinator Agent | Scope arbitration, dependency/risk tracking, cross-team handoff alignment, escalation owner | Sprint Planner Agent |

## Ownership and Cadence

- **Daily standup owner:** PM/Architect Liaison.
- **Daily standup cadence:** 15 minutes, business days, focused on blockers and artifact status.
- **Weekly design review gate owner:** UI/UX Agent.
- **Weekly design review cadence:** Once weekly, includes Accessibility Auditor + Brand Consistency + QA Visual/Regression sign-off.
- **Pre-PR quality gate owner:** QA Visual/Regression Support.
- **Pre-PR quality gate cadence:** Required before each PR opening and re-run before Ready-for-Review.

## Decision Rights and Escalation Path

### Decision rights

- **UI/UX Agent** decides interaction pattern proposals and state model drafts.
- **Accessibility Auditor** has veto rights on a11y/keyboard/focus/contrast non-compliance.
- **Brand Consistency Agent** has veto rights on branding/copy violations.
- **QA Visual/Regression Support** can block pre-PR handoff when regression evidence is missing.
- **PM/Architect Liaison** is final tie-breaker when trade-offs impact schedule, scope, or cross-team dependencies.

### Escalation path

1. Pod-level disagreement logged in design review notes with impacted artifact IDs.
2. PM/Architect Liaison triages within one business day.
3. If unresolved, escalate to Management Team (Project Coordinator + Sprint Planner) for scope/time decision.
4. If release risk is introduced, notify Release Manager Agent and QA Team before implementation merge.

## Required Artifacts

All artifacts are mandatory for handoff readiness:

1. **Wireframes**
   - Coverage: all primary console modules and critical states.
   - Fidelity: implementation-ready (layout, spacing, hierarchy, interaction cues).
2. **Interaction state map**
   - Coverage: idle, focused, active, latched, disabled, warning, error, degraded.
   - Includes transitions and rollback/recovery states.
3. **Keyboard map**
   - Global shortcuts, deck/mixer/browser local shortcuts, conflict rules, focus traversal order.
4. **Token spec**
   - Semantic tokens for color/contrast, spacing, typography, motion, and state indicators.
5. **Acceptance checklist**
   - Explicit pass/fail checks per module for UX behavior, accessibility, visual consistency, and regression evidence.

## Definition of Done

The DJ console design pod work item is Done only when all items below pass:

1. **Accessibility**
   - WCAG-conformant contrast for interactive and status-critical elements.
   - Screen-reader labeling strategy and landmark map documented.
2. **Keyboard-first operation**
   - Full operator-critical workflow completion without pointer input.
   - Focus order deterministic with visible focus treatment for all interactive controls.
3. **Contrast and readability**
   - High-density console remains legible across baseline display profiles and dark-theme operating contexts.
4. **Latency/performance UX constraints**
   - Interaction response budget documented and validated for operator-facing controls.
   - UI feedback timing constraints captured for transport, cueing, queue actions, and warning states.
5. **Quality gate evidence**
   - Required artifacts complete, reviewed, and signed off in weekly design review.
   - Pre-PR quality gate records attached and accepted by QA Visual/Regression Support.

## Linked Planning Documents

- Backlog linkage: [`docs/ui/dj_console_gui_todo_backlog.md`](./dj_console_gui_todo_backlog.md)
- Delivery plan linkage: [`docs/ui/radio_operator_ui_delivery_plan.md`](./radio_operator_ui_delivery_plan.md)
- Team policy linkage: [`AGENTS.md`](../../AGENTS.md)
