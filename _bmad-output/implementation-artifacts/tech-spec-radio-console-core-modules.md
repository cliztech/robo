---
title: 'Radio Console Core Modules Implementation Spec'
slug: 'radio-console-core-modules'
created: '2026-02-17'
status: 'ready-for-quick-dev'
stepsCompleted:
  - understand
  - investigate
  - generate
  - review
tech_stack:
  - React
  - TypeScript
  - Tokenized CSS variables
  - Playwright
  - Vitest
files_to_modify:
  - src/components/shell/waveform-rail.tsx
  - src/components/shell/deck-panel.tsx
  - src/components/shell/mixer-panel.tsx
  - src/components/shell/library-browser.tsx
  - src/components/shell/module-dock.tsx
  - src/components/shell/automation-timeline.tsx
  - src/components/shell/app-shell.tsx
  - src/styles/tokens.css
  - tests/e2e/console-core.spec.ts
  - tests/unit/shell/*.test.tsx
code_patterns:
  - Dense modular shell with three-zone layout
  - Deterministic control state contracts (idle/active/focused/latched/disabled/error)
  - Deck-specific semantic accents and token-only styling
  - Keyboard-first workflows and low-latency transport actions
test_patterns:
  - Unit coverage for transport/mixer/control-state transitions
  - Integration coverage for browser-to-deck queue flows
  - E2E keyboard-only and failure-state drills
---

# Tech-Spec: Radio Console Core Modules Implementation Spec

**Created:** 2026-02-17

## Overview

### Problem Statement

Current planning docs define the desired DJ-style broadcast console architecture, but implementation artifacts are not yet in quick-dev format and leave key module deltas implicit. This causes risk in Phase 1/2 handoff, especially for waveform rendering strategy, deterministic deck/mixer state behavior, and browser/timeline module contracts.

### Solution

Create an implementation-ready spec that translates the existing plan set into module-level stories for six target surfaces:
- waveform rail
- dual deck panels
- mixer
- browser workspace
- sampler/fx
- automation timeline

Each story in this spec includes explicit file targets, acceptance criteria, test requirements, dependencies, and out-of-scope boundaries to support immediate quick-dev execution.

### Scope

**In Scope:**
- Convert planning direction into executable stories for all six target modules.
- Capture explicit deltas between research, execution, and delivery plans.
- Define minimum acceptance criteria and test coverage for each story.
- Lock BMAD step semantics for quick-dev intake.

**Out of Scope:**
- Audio routing and device settings implementation.
- Diagnostics/incident center implementation.
- Full preset/layout manager and multi-deck Pro-4 expansion.
- Backend API redesign beyond mock contract alignment for UI consumption.

## Context for Development

### Codebase Patterns

- Build on the modular shell/component approach already called out in planning artifacts, rather than introducing a new workspace hierarchy.
- Keep tokenized theme semantics with deck-specific accents and high-density spacing.
- Use deterministic state feedback and keyboard-first interaction handling as first-class constraints.
- Preserve brand-safe “inspired by” approach: emulate layout/ergonomics but not vendor-identical skins.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `docs/ui/dj_console_ui_research_plan.md` | UI density, visual system, shell component map, waveform/rendering constraints, quality gates baseline. |
| `docs/ui/radio_broadcasting_ui_execution_plan.md` | Functional surface map, shared components, phased delivery and success metrics. |
| `docs/ui/radio_operator_ui_delivery_plan.md` | Phase ownership, module inventory, B1.1/B1.2 workflow header requirements, verification gates. |
| `_bmad/bmm/workflows/bmad-quick-flow/quick-spec/tech-spec-template.md` | Required quick-spec shape for BMAD quick-dev compatibility. |

### Technical Decisions

1. **Module-first sequencing for quick-dev:** implement waveform rail + dual deck + mixer as Console Core tranche, then browser workspace + automation timeline, then sampler/fx.
2. **State contract minimum:** all interactive controls must support idle/active/focused/latched/disabled/error before feature completion.
3. **Waveform renderer decision gate:** start with Canvas implementation and abstract rendering adapter to allow WebGL upgrade if perf gate fails.
4. **Testing floor:** no story complete without unit + integration/e2e evidence mapped below.

## Implementation Plan

### Tasks

#### Explicit Deltas from Current Plan Docs

- **Delta A — Planning → implementation artifact:** existing docs define phases and goals, but not quick-dev story packets with file-level targets and test obligations.
- **Delta B — Waveform strategy:** research plan flags Canvas/WebGL decision risk; this spec resolves execution start with Canvas-first + adapter fallback.
- **Delta C — B1.1/B1.2 integration:** delivery plan requires stage timeline + high-risk checkpoint card in Phase 1; this spec adds that as acceptance criteria within console shell story.
- **Delta D — Browser/timeline integration detail:** execution and delivery plans require queue + scheduler behavior; this spec defines deterministic drag/drop + conflict marker acceptance tests.

#### Story 1 — Waveform Rail Foundation

- **Module target:** waveform rail
- **File/module targets:**
  - `src/components/shell/waveform-rail.tsx`
  - `src/styles/tokens.css`
  - `tests/unit/shell/waveform-rail.test.tsx`
- **Acceptance criteria:**
  - Renders dual-lane overview with deck A/B semantic colors.
  - Supports playhead and cue marker layers with deterministic redraw.
  - Meets frame budget contract (<16ms render work under test harness baseline).
  - Reduced-motion mode preserves state signaling without positional animation.
- **Test requirements:**
  - Unit tests for cue marker rendering, playhead updates, and reduced-motion behavior.
  - Performance harness assertion for redraw budget in synthetic playback loop.
  - Visual snapshot for idle/playing/cue-active states.
- **Out of scope (story-level):** beat grid authoring tools, phrase intelligence overlays.

#### Story 2 — Dual Deck Panels + Transport Contract

- **Module target:** dual deck panels
- **File/module targets:**
  - `src/components/shell/deck-panel.tsx`
  - `src/components/shell/app-shell.tsx`
  - `tests/unit/shell/deck-panel.test.tsx`
  - `tests/e2e/console-core.spec.ts`
- **Acceptance criteria:**
  - Deck A/B render symmetric transport surfaces with one-glance status.
  - Keyboard actions: play/pause, load selected track to A/B, cue/sync triggers.
  - Visible state transitions for idle/active/focused/latched/disabled/error.
  - Non-blocking transport controls when non-critical network updates are delayed.
- **Test requirements:**
  - Unit coverage for button/focus/latched states and disabled safety behavior.
  - E2E keyboard-only transport workflow from browser selection to deck load.
  - Failure-path test verifying no UI lock on delayed metadata fetch.
- **Out of scope (story-level):** optional Deck C/D implementation.

#### Story 3 — Center Mixer + Meter Bridge

- **Module target:** mixer
- **File/module targets:**
  - `src/components/shell/mixer-panel.tsx`
  - `src/components/audio/channel-meter.tsx` (or equivalent meter primitive)
  - `tests/unit/shell/mixer-panel.test.tsx`
- **Acceptance criteria:**
  - Gain/EQ/filter/crossfader controls update deterministically with pointer capture.
  - Master output meter shows limiter/clip warning states.
  - Crossfader and cue controls reflect deck ownership colors.
  - Safety: destructive resets require explicit confirmation.
- **Test requirements:**
  - Unit tests for pointer-drag control stability and value clamping.
  - Unit/integration tests for limiter/clip alert thresholds.
  - Snapshot coverage for neutral, warning, and clip states.
- **Out of scope (story-level):** hardware MIDI mapping.

#### Story 4 — Browser Workspace + Queue Operations

- **Module target:** browser workspace
- **File/module targets:**
  - `src/components/shell/library-browser.tsx`
  - `src/components/shell/app-shell.tsx`
  - `tests/unit/shell/library-browser.test.tsx`
  - `tests/e2e/browser-queue.spec.ts`
- **Acceptance criteria:**
  - Left source tree + main track table + queue inspector render in one workspace.
  - Search/filter/sort operations are keyboard accessible and deterministic.
  - Drag/drop and keyboard enqueue support deck and queue insertion.
  - Queue timing estimates and ad break markers remain visible under dense data.
- **Test requirements:**
  - Unit tests for table sorting/filtering and focus traversal.
  - E2E coverage for drag/drop enqueue and keyboard enqueue parity.
  - Regression check for dense-data scrolling without interaction lag.
- **Out of scope (story-level):** external metadata enrichment services.

#### Story 5 — Sampler / FX Rack Safety Surface

- **Module target:** sampler/fx
- **File/module targets:**
  - `src/components/shell/module-dock.tsx`
  - `src/components/audio/fx-rack.tsx`
  - `tests/unit/shell/module-dock.test.tsx`
- **Acceptance criteria:**
  - Sampler banks support color-coded classes and trigger states.
  - FX slots support preset select, macro control, and one-click broadcast-neutral reset.
  - Lock mode prevents accidental activation during live operation.
  - State indicators expose bypass/active/error feedback clearly.
- **Test requirements:**
  - Unit tests for lock mode, reset semantics, and bypass state transitions.
  - Integration test for sampler trigger while deck playback is active.
- **Out of scope (story-level):** advanced stem separation workflow.

#### Story 6 — Automation Timeline Overlay

- **Module target:** automation timeline
- **File/module targets:**
  - `src/components/shell/automation-timeline.tsx`
  - `src/components/shell/app-shell.tsx`
  - `tests/unit/shell/automation-timeline.test.tsx`
  - `tests/e2e/timeline-conflict.spec.ts`
- **Acceptance criteria:**
  - Hour timeline visualizes scheduled blocks with now/next alignment.
  - Conflict/overlap markers are visible and actionable.
  - Manual override actions preserve rollback path and rationale capture.
  - B1.1/B1.2 workflow header displays stage + risk + next action without context switch.
- **Test requirements:**
  - Unit tests for conflict marker rendering and stage badge state updates.
  - E2E scenario for schedule conflict detection and rollback flow.
  - Accessibility test for timeline keyboard navigation and screen reader labels.
- **Out of scope (story-level):** full scheduler authoring UI.

### Acceptance Criteria

- All six stories have implementation-targeted files, acceptance criteria, and test requirements.
- BMAD steps are explicitly marked complete with `understand → investigate → generate → review` semantics.
- Quick-dev can execute without reopening planning docs for missing story-level constraints.
- Out-of-scope boundaries prevent unplanned routing/diagnostics/preset expansion in first execution pass.

## Additional Context

### Dependencies

- Token and primitive baseline from existing `src/styles/tokens.css` and shell component layer.
- API/state contract mapping aligned with `API_ROUTES.md` before live data integration.
- Accessibility checklist and keyboard map specs referenced by existing docs.

### Testing Strategy

- **Unit:** component state transitions, rendering states, keyboard behavior, control clamping.
- **Integration/E2E:** console transport flow, browser-to-queue operations, timeline conflict drill, sampler lock/reset safety.
- **Visual regression:** waveform rail, dual deck state matrix, mixer warning states, dense browser focus state.
- **Performance:** synthetic playback tests for waveform redraw and dense table interaction responsiveness.

### Notes

#### BMAD Step Semantics

- [x] **understand** — source plans reviewed, scope and constraints captured.
- [x] **investigate** — cross-doc deltas and module-level requirements resolved.
- [x] **generate** — implementation-ready stories produced from template sections.
- [x] **review** — scope, acceptance, tests, and out-of-scope boundaries validated for quick-dev handoff.

#### Quick-Dev Intake Hint

Use this spec as the parent artifact for quick-dev story slicing with one branch per story (`story-1-waveform-rail` … `story-6-automation-timeline`) and enforce test completion as a per-story merge gate.
