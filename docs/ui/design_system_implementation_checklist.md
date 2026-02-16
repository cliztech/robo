# Design-System Implementation Checklist (Operator Surfaces)

Anchor document: `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` (Objective, Team Model, Design Tokens, Delivery Plan, and Implementation Checklist sections).


## Progress Summary (2026-02-16)

Canonical status labels (use exactly): **Not Started / In Progress / Blocked / Done**.

| Phase | Status | Notes |
| --- | --- | --- |
| Intake + Scope | Done | Scope and constraints are explicitly documented in this checklist. |
| Stage-Gated Planning | Done | Intake/planner/executor/verifier/handoff stages are documented and completed for planning output. |
| Minimal Token Set Adoption | In Progress | Token checklist exists; implementation evidence across surfaces is still pending. |
| Operator Surface Migration | Not Started | Per-surface migration tasks are defined but not yet executed in UI source. |
| Verification + Sign-Off | Not Started | Verification procedure is defined but has no run artifacts yet. |

### Phase Ownership (Accountable Team/Agent)

| Phase | Accountable team | Accountable agent |
| --- | --- | --- |
| Intake + Scope | Management Team | Project Coordinator Agent |
| Stage-Gated Planning | Management Team | Sprint Planner Agent |
| Minimal Token Set Adoption | Design Team | Brand Consistency Agent |
| Operator Surface Migration | DevOps Team | Infrastructure Agent |
| Verification + Sign-Off | QA Team | Performance Profiler Agent |

### Completion Evidence (Checked Items)

| Item | Status | Evidence |
| --- | --- | --- |
| Intake scope and out-of-scope boundaries documented | ✅ Done | `docs/ui/design_system_implementation_checklist.md#1-intake--scope` |
| Stage-gated plan recorded with completed planning stages | ✅ Done | `docs/ui/design_system_implementation_checklist.md#2-stage-gated-plan-aligned-to-repository-agents-flow` |

### Current Risks/Blockers

- Blocked on implementation artifacts for tokenized surfaces; this checklist currently tracks planning-only progress.
- Verification steps require runnable UI components and screenshots that are not yet present in this repository.

**Next milestone date:** 2026-02-23 (first migrated surface evidence added to checklist)

## 1) Intake + Scope

Request type: documentation + migration planning (no executable/binary modifications).

In-scope operator-facing surfaces:
- Scheduler
- Prompts
- Diagnostics
- Library

Out of scope:
- Editing `.exe` artifacts
- Editing SQLite `.db` files

## 2) Stage-Gated Plan (Aligned to Repository AGENTS Flow)

1. **Intake** ✅: map requested surfaces and token requirements.
2. **Planner** ✅: define minimal token source of truth and migration order.
3. **Executor** ✅: add versioned token spec and this implementation checklist.
4. **Verifier** ✅: check markdown structure and alignment to acceptance checks.
5. **Handoff** ✅: provide migration sequencing and validation gates.

## 3) Minimal Token Set Adoption Checklist

Reference source of truth: `docs/ui/design_tokens_v1.md`.

- [ ] Adopt semantic color roles (`bg`, `surface`, `text`, `border`, `accent`, status roles, focus ring).
- [ ] Adopt typography scale (`100`–`700`) and line-height roles.
- [ ] Adopt spacing grid (`space-1` through `space-12`) for layout and component padding.
- [ ] Adopt radius scale (`sm`, `md`, `lg`, `pill`) for all rounded elements.
- [ ] Adopt elevation tokens (`0`–`3`) for depth hierarchy.
- [ ] Enforce interaction states across primitives: default, hover, focus-visible, active, disabled, error.

## 4) Operator Surface Mapping + Legacy Divergence

> Current state: this repository contains planning/config artifacts and Windows runtime artifacts; React component source has not yet been committed. Divergence therefore focuses on legacy desktop/operator UX conventions vs upcoming tokenized React shell.

### Scheduler surface

Primary artifacts today:
- `config/schedules.json`
- `docs/scheduler_clockwheel_spec.md`
- `backend/scheduling/*`

Likely divergence from tokens:
- Legacy forms/tables likely use fixed spacing and non-semantic status colors.
- Priority/status chips likely inconsistent across normal vs degraded scheduling modes.
- Focus states likely not normalized to a single ring token.

Migration tasks:
- [ ] Shell containers first: scheduler page frame, header actions, filter bar.
- [ ] Shared primitives second: table row, status badge, button, input/select, validation helper.
- [ ] Feature screen third: timeline/clockwheel visualization and rule editor states.

### Prompts surface

Primary artifacts today:
- `config/prompt_variables.json`
- `config/prompts/` content structure
- `docs/conversation_orchestrator_spec.md`

Likely divergence from tokens:
- Editor and variable list likely mix ad-hoc typography sizes.
- Error/warning colors likely coupled to legacy palette rather than semantic tokens.
- Disabled and read-only states likely inconsistent in opacity and border treatment.

Migration tasks:
- [ ] Shell first: prompt workspace frame, breadcrumb/context bar.
- [ ] Shared primitives second: textarea/editor shell, key/value row, badge, inline alert.
- [ ] Feature screen third: prompt preview, variable validation, and publish/rollback flows.

### Diagnostics surface

Primary artifacts today:
- `config/scripts/instrumentation/*`
- `config/scripts/SLOS.md`
- `docs/autonomy_modes.md`

Likely divergence from tokens:
- Severity signaling may overuse raw red/yellow/green without contrast validation.
- Dense dashboards may use inconsistent elevation or border hierarchy.
- Hover/focus parity on charts, rows, and controls likely incomplete.

Migration tasks:
- [ ] Shell first: diagnostics dashboard frame and global filters.
- [ ] Shared primitives second: metric card, status pill, event row, segmented control.
- [ ] Feature screen third: traces, alert drilldowns, and anomaly explainers.

### Library surface

Primary artifacts today:
- `config/music_beds/` (runtime media library area)
- `config/scripts/segment_engine.py` (content orchestration logic)
- `ONLINE_RADIO_DJ_DESIGN.md` context

Likely divergence from tokens:
- Card/list density likely varies between browse/search/detail views.
- Selection and drag/drop affordances may not share a unified active/focus state model.
- Empty/loading/error placeholders likely stylistically inconsistent.

Migration tasks:
- [ ] Shell first: library frame, split panes, toolbar.
- [ ] Shared primitives second: media row/card, tags, toggle chips, search/filter controls.
- [ ] Feature screen third: queue management, metadata editor, and audition/player states.

## 5) Global Migration Order (Cross-Surface)

1. **App shell first**
   - Topbar/sidebar/workspace regions
   - Theme switch and base light/dark tokens
2. **Shared primitives second**
   - Buttons, inputs, selects, tabs, tables, badges, alerts, modals
3. **Feature screens third**
   - Scheduler, Prompts, Diagnostics, Library screens and all feature-specific states

## 6) Acceptance Checks (Required)

### A) Light/Dark parity
- [ ] Every tokenized component supports both light and dark themes.
- [ ] No hardcoded hex/HSL values in component-level styles.
- [ ] Visual hierarchy (surface/elevation) remains equivalent across themes.

### B) Contrast thresholds
- [ ] Body text >= WCAG AA (4.5:1).
- [ ] Large text/UI labels >= 3:1.
- [ ] Focus ring contrast >= 3:1 against adjacent background.
- [ ] Status colors (success/warning/error/info) validated in both themes.

### C) State consistency
For each interactive primitive and each surface:
- [ ] Default state uses base tokens only.
- [ ] Hover state uses predictable semantic delta.
- [ ] Focus-visible state always shows tokenized ring (keyboard discoverable).
- [ ] Disabled state is visually distinct and non-interactive.
- [ ] Error state is semantically and textually explicit (not color-only).

## 7) Verification Procedure Before Screen Sign-Off

- [ ] Run a token-usage review to confirm no raw color literals on migrated screens.
- [ ] Run keyboard-only walkthrough on each operator surface.
- [ ] Run light/dark screenshot diff on shell + core primitives + each feature screen.
- [ ] Run contrast scan and record exceptions with owner + fix date.
- [ ] Confirm reduced-motion behavior parity for interaction feedback.

## 8) Deliverables Produced by This Request

- Versioned token source of truth: `docs/ui/design_tokens_v1.md`
- Surface-mapped implementation checklist: `docs/ui/design_system_implementation_checklist.md`
