# Radio Broadcasting UI Execution Plan (Inspired by DJ Console Workflows)

Version: `v0.1.0`  
Status: Planning draft for implementation kickoff  
Owner: Design + Product + Engineering

## Execution Status Tracker

- Current phase: Phase 0 — Discovery and Contracting
- Owner: Design + Product + Engineering
- Last updated: 2026-02-16
- Release target: DGN-DJ Operator Console v1.0
- Rollout status source of truth: This document (see [Execution Status Source of Truth](#execution-status-source-of-truth)).

## Execution Status Source of Truth

This document is the canonical rollout tracker for the operator UI program. Update status here first, then synchronize summary-only deltas to:

- [`docs/ui/radio_operator_ui_delivery_plan.md`](radio_operator_ui_delivery_plan.md)
- [`docs/ui/dj_console_ui_research_plan.md`](dj_console_ui_research_plan.md)

## 1) Goal and Scope

Build fully operational, production-ready interfaces (not static mockups) for DGN-DJ by DGNradio using the attached DJ-style references as **visual and interaction inspiration**.

This plan focuses on:

- End-to-end UI architecture for live radio operation
- The resources needed to implement and validate the UI
- Which agent teams should participate and in what order
- Skills and capabilities required to execute without design drift

## 2) Product Experience Goals

### Operator outcomes

The UI must let an operator:

1. Prepare and queue content quickly (music, voice, ad breaks, segments)
2. Control and monitor live output with low cognitive overhead
3. Recover from failures quickly (device issue, track issue, timing drift)
4. Run confidently in both manual and high-autonomy modes

### UX quality bar

- Fast scanning: critical values visible at a glance (on-air state, level meters, next event, conflicts)
- Keyboard-first control for power users
- Strong contrast in dark mode, with optional accessibility presets
- Clear separation of destructive and safe controls
- Deterministic state feedback: every action has visible status

## 3) Visual Direction from Reference Set

The provided mockups suggest these design principles:

- **Dark, high-density workstation layout** with modular panels
- **Waveform-first hierarchy** where playback state is the dominant visual signal
- **Dual-deck and multi-deck mental model** for concurrent playback lanes
- **Color-coded semantic channels** (deck A/B/C/D, stems, warnings, cue markers)
- **Compact control clusters** (FX, loop, transport, cue, sync)
- **Professional tool ergonomics** over consumer app spaciousness

### Adaptation rules for DGN-DJ

To keep style inspiration but avoid blind copying:

- Reframe DJ "decks" into **Radio Decks** (Music Deck, VO Deck, Ad Deck, Emergency Deck)
- Retain waveform + meters + browser pattern, but map controls to radio operations
- Use existing token strategy from `docs/ui/design_tokens_v1.md`
- Enforce brand and accessibility requirements while preserving pro-console feel

## 4) Functional Surface Map (What Must Be Built)

## 4.1 Core workbench screens

1. **Live Studio Console**
   - Master output strip + limiter/ducking indicators
   - Active/Next timeline
   - Deck transport controls
   - Quick scene switching (manual/assisted/autonomous)

2. **Library & Crate Browser**
   - Folder/tree + search + filter facets
   - Metadata grid with sortable columns
   - Preview and prelisten routing
   - Drag/drop to deck or schedule slots

3. **Automation Timeline / Clockwheel**
   - Hour wheel visualization
   - Conflict and overlap markers
   - Segment templates (music sweep, news bed, ad block)

4. **Sampler / Hotcue / FX Rack**
   - Trigger pads for jingles, sweepers, IDs
   - Quantization and timing alignment controls
   - Effect lanes with safe defaults

5. **Audio Routing & Device Settings**
   - Interface selection and channel assignment
   - Monitor/headphone routing
   - Input source map (mic, line-in, remote feed)

6. **Health & Incident Panel**
   - Stream health, latency, CPU, failover state
   - Actionable alerts and one-click mitigations

## 4.2 Shared system components

- Waveform component family (overview + zoom + cue markers)
- Deck card with transport primitives
- VU/peak/loudness meter stack
- Command palette + shortcut map
- Toast/alert system with severity design
- Permissioned action components for high-risk operations

## 5) Information Architecture and Layout Strategy

Use a three-zone shell:

- **Top strip:** global timing, on-air state, waveform overviews, system health
- **Middle console:** active decks, transport, FX, routing, meters
- **Bottom workspace:** library, queue, automation, logs, diagnostics

Support layout presets inspired by the references:

- **Starter:** low complexity, guided controls
- **Essentials:** two-deck + compact browser + automation summary
- **Performance:** high-density control for expert operators
- **Pro-4:** multi-deck + advanced routing + sampler expansion

## 6) Resource Plan (What We Need Before Building)

## 6.1 People/roles

- Product owner (broadcast workflow decisions)
- UI/UX lead (interaction architecture)
- Frontend engineers (component implementation)
- Audio pipeline engineer (device/routing contracts)
- QA + accessibility specialist
- DevOps support for preview environments

## 6.2 Technical inputs

- Finalized design tokens (`docs/ui/design_tokens_v1.md`)
- Component checklist (`docs/ui/design_system_implementation_checklist.md`)
- Keyboard and command behavior (`docs/command_palette_and_shortcuts_spec.md`)
- Clockwheel and schedule semantics (`docs/scheduler_clockwheel_spec.md`)
- Autonomy behavior levels (`docs/autonomy_modes.md`)
- API contract alignment for runtime state and events

## 6.3 Tooling

- Figma (or equivalent) for interaction prototypes
- React component library and tokenized CSS variables
- Visual regression snapshots in CI
- Playwright e2e for critical workflows
- Realistic synthetic audio/session data for testing

## 7) Agent Team Plan (Who Does What)

The work should follow a staged handoff pipeline.

1. **Management Team**
   - Converts this plan into sprint-sized work packages
   - Defines milestones, dependencies, and release cut criteria

2. **Design Team (UI/UX + Accessibility + Brand)**
   - Produces screen specs for all core workbench views
   - Defines interaction states, keyboard flows, and accessibility presets
   - Verifies brand consistency in copy and visual hierarchy

3. **DevOps + Architecture/Backend Support**
   - Provides preview environment and contract mocks
   - Ensures event/state APIs can supply all required UI data

4. **Implementation Team (Frontend)**
   - Builds tokenized primitives and composite workstation layouts
   - Implements command palette, deck controls, and browser modules

5. **QA Team**
   - Runs regression, keyboard-only, and accessibility validation
   - Verifies critical timings and operational safety states

6. **Brutal Review Team**
   - Enforces high bar on interaction clarity and maintainability
   - Rejects ambiguous controls or undocumented workflow shortcuts

7. **Bug Team + Incident Response**
   - Triage and harden edge-case failures before release candidate

## 8) Skills and Capabilities Required

## 8.1 Design/system skills

- Dense console IA and dashboard composition
- Token-based theming and dark-mode ergonomics
- Accessibility for pro tools (focus order, reduced motion, high contrast)
- Data-rich table and timeline UX

## 8.2 Engineering skills

- Audio-state visualization (waveforms, meters, transport status)
- Real-time event rendering without jitter
- Robust keyboard shortcut architecture
- Latency-aware UI updates for live operation

## 8.3 QA skills

- Visual regression with dynamic waveform/meter surfaces
- Keyboard-first task coverage
- Failure-mode validation (device drop, stream fail, schedule conflict)

## 9) Delivery Phases

### Phase 0 — Discovery and Contracting

- [ ] Confirm operator personas and mission-critical workflows.
- [ ] Freeze core data contracts for live state and automation events.
- [ ] Define acceptance criteria per screen.

Objective completion criteria:

- [ ] Functional requirements matrix is approved and versioned.
- [ ] UI data contract matrix has named owners for every feed.
- [ ] Risk register includes mitigation owners and escalation path.

### Phase 1 — Foundation

- [ ] Implement tokenized primitives and base layout shell.
- [ ] Build global top strip + system status model.
- [ ] Wire command palette and base shortcuts.

Objective completion criteria:

- [ ] UI foundation package is merged behind a feature flag.
- [ ] Keyboard map v1 is published and validated in smoke tests.
- [ ] Baseline accessibility checks pass for top strip and navigation.

### Phase 2 — Core Console

- [ ] Implement dual-deck console + master strip + queue.
- [ ] Add library browser with metadata table and drag/drop.
- [ ] Add first version of automation timeline panel.

Objective completion criteria:

- [ ] End-to-end studio MVP is usable for real operator drills.
- [ ] Loading/playback transitions are smoke-tested and documented.
- [ ] Queue integrity checks pass for manual and automated insertions.

### Phase 3 — Advanced Ops

- [ ] Add sampler/hotcue/FX modules.
- [ ] Add advanced routing and input matrix.
- [ ] Add performance layout presets (Essentials/Performance/Pro-4).

Objective completion criteria:

- [ ] Advanced operator toolkit is validated in failure drills.
- [ ] Preset layout manager persists/reloads without state drift.
- [ ] Routing rollback path is tested with diagnostic logs captured.

### Phase 4 — Hardening & Launch Readiness

- [ ] Run full keyboard and accessibility audit.
- [ ] Execute incident and failure-state drills.
- [ ] Complete final regression + performance + reliability signoff.

Objective completion criteria:

- [ ] Release readiness report is approved by Management, QA, and Design.
- [ ] Operator onboarding guide and known limitations are published.
- [ ] Deferred backlog is triaged with owner and target release.

## 10) Success Metrics

Operational metrics:

- Time-to-load-and-play first item
- Time-to-recover from route/device failure
- Scheduling conflict detection and resolution time
- Error rate in live session operations

UX metrics:

- Keyboard-only task completion rate
- Critical control discoverability score
- Operator confidence score after onboarding

Quality metrics:

- Visual regression pass rate
- Accessibility acceptance matrix pass rate
- Critical incident escape defects (target: zero)

## 11) Quality Gate Evidence

- Implemented modules (current baseline):
  - [`src/components/audio/DegenWaveform.tsx`](../../src/components/audio/DegenWaveform.tsx)
  - [`src/components/audio/DegenVUMeter.tsx`](../../src/components/audio/DegenVUMeter.tsx)
  - [`src/components/shell/topbar.tsx`](../../src/components/shell/topbar.tsx)
- Tests and validation references:
  - [`docs/visual_regression_token_checklist.md`](../visual_regression_token_checklist.md)
  - [`docs/ui/design_system_implementation_checklist.md`](design_system_implementation_checklist.md)
  - [`docs/command_palette_and_shortcuts_spec.md`](../command_palette_and_shortcuts_spec.md)
- Screenshot evidence linkage:
  - Attach milestone captures to PRs and reference them from this section using phase-prefixed filenames.
- Validation command set (log outputs each phase):
  - `pnpm lint`
  - `pnpm test`
  - `pnpm playwright test`

## 12) Immediate Next Steps (Week 1)

1. Approve this execution plan and lock scope for Phase 0/1
2. Produce "Live Studio Console" low-fidelity interaction map
3. Define API contract checklist for console state sync
4. Stand up preview environment for component development
5. Start token-to-component mapping for deck, meters, and browser grid

---

If you want, next I can convert this into:

- a milestone-based sprint board,
- a screen-by-screen component inventory,
- and a detailed acceptance checklist for each panel (Console, Browser, Timeline, Sampler, Routing, Health).

For status synchronization, update this source-of-truth document first and then mirror concise updates to [`docs/ui/radio_operator_ui_delivery_plan.md`](radio_operator_ui_delivery_plan.md) and [`docs/ui/dj_console_ui_research_plan.md`](dj_console_ui_research_plan.md).
