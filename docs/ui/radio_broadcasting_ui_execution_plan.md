# Radio Broadcasting UI Execution Plan (Inspired by DJ Console Workflows)

Version: `v0.1.0`  
Status: Prototype complete; Hardening in progress (Phase 4)  
Owner: Design + Product + Engineering

## 1) Goal and Scope

Build fully operational, production-ready interfaces (not static mockups) for DGN-DJ by DGNradio using the attached DJ-style references as **visual and interaction inspiration**.

This plan focuses on:

- End-to-end UI architecture for live radio operation
- The resources needed to implement and validate the UI
- Which agent teams should participate and in what order
- Skills and capabilities required to execute without design drift

## 1.1) Current implementation snapshot

The primary console prototype is already live in `src/app/page.tsx` with production-intent audio modules under `src/components/audio/`.

Completed modules:

- `DegenWaveform`
- `DegenMixer`
- `DegenTransport`
- `DegenTrackList`
- `DegenScheduleTimeline`
- Supporting deck modules: `DegenEffectRack`, `DegenBeatGrid`

Remaining hardening tasks:

- Replace demo/simulated state with engine-backed and scheduler-backed data contracts.
- Complete full keyboard map + ARIA validation for critical operator paths.
- Add deterministic regression tests for deck, mixer, browser, and scheduler flows.
- Validate performance and state consistency under prolonged live-update loads.
- Finalize incident/fallback affordances and operator safety confirmations.

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

## Phase 0 — Discovery and Contracting
State: Complete

- Confirm operator personas and mission-critical workflows
- Freeze core data contracts for live state and automation events
- Define acceptance criteria per screen

Deliverables:

- Functional requirements matrix
- UI data contract matrix
- Risk register and mitigation owner list

## Phase 1 — Foundation
State: Complete

- Implement tokenized primitives and base layout shell
- Build global top strip + system status model
- Wire command palette and base shortcuts

Deliverables:

- UI foundation package
- Keyboard map v1
- Baseline accessibility checks

## Phase 2 — Core Console
State: Prototype complete

- Implement dual-deck console + master strip + queue
- Add library browser with metadata table and drag/drop
- Add first version of automation timeline panel

Deliverables:

- Usable end-to-end studio MVP
- Smoke-tested loading/playback transitions

## Phase 3 — Advanced Ops
State: In progress (feature depth ongoing)

- Add sampler/hotcue/FX modules
- Add advanced routing and input matrix
- Add performance layout presets (Essentials/Performance/Pro-4)

Deliverables:

- Advanced operator toolkit
- Preset layout manager

## Phase 4 — Hardening & Launch Readiness
State: Hardening in progress

- Full keyboard and accessibility audit
- Incident and failure-state drills
- Final regression + performance + reliability signoff

Deliverables:

- Release readiness report
- Operator onboarding guide
- Known limitations + deferred backlog

Quality readiness exit criteria:

- 100% pass rate for scripted console smoke flows (load, play, seek, mix, schedule context switch).
- P95 transport response latency <100ms and no single control action >150ms in staging.
- Zero critical defects and zero unresolved blocker/critical accessibility findings.
- 55+ FPS sustained in composite console view with waveform, mixer meters, and browser activity.
- Keyboard-only completion rate ≥95% for defined on-air operator tasks.

## 10) Success Metrics
## 10) BMAD Team Packets

This section operationalizes Phases 0–4 with the repository BMAD stage gates: **Intake → Planner → Executor → Verifier → Handoff**.

### Phase 0 — Discovery and Contracting Packet

- **Primary team + accountable agent:** Management Team — Project Coordinator Agent
- **Supporting teams:** Design, DevOps, QA, Research
- **Entry criteria (Intake + Planner):**
  - Intake classification confirms this is a Change route with UI execution planning scope.
  - Applicable repository constraints and dependencies are enumerated.
  - Planner produces a minimal plan covering scope, constraints, rollback, and verification.
- **Artifacts produced (Executor + Verifier):**
  - Functional requirements matrix
  - UI data contract matrix
  - Risk register with mitigation owners
- **Exit criteria (Handoff):**
  - Cross-team acknowledgement of requirements and contract boundaries.
  - Phase 1 implementation backlog is decomposed and dependency-ordered.

### Phase 1 — Foundation Packet

- **Primary team + accountable agent:** Design Team — UI/UX Agent
- **Supporting teams:** DevOps, QA, Accessibility Auditor, Frontend implementation owners
- **Entry criteria (Intake + Planner):**
  - Phase 0 artifacts are approved and linked to sprint work packages.
  - Design tokens, keyboard behaviors, and baseline accessibility expectations are frozen for v1.
- **Artifacts produced (Executor + Verifier):**
  - UI foundation package (tokens-to-primitives mapping + shell specification)
  - Keyboard map v1
  - Baseline accessibility check report
- **Exit criteria (Handoff):**
  - Foundational component spec is implementation-ready with acceptance criteria.
  - QA verifies baseline checks and publishes pass/fail evidence.

### Phase 2 — Core Console Packet

- **Primary team + accountable agent:** DevOps/Implementation Team — CI/CD Pipeline Agent (delivery accountability)
- **Supporting teams:** Design, QA, Bug, Brutal Review
- **Entry criteria (Intake + Planner):**
  - Foundation packet exits cleanly with approved component contracts.
  - API contract mocks and preview environment are available for console development.
- **Artifacts produced (Executor + Verifier):**
  - Studio MVP implementation (dual deck + master strip + queue + library browser + timeline v1)
  - Smoke test evidence for load/playback transitions
  - Initial defect and risk log for operator-critical flows
- **Exit criteria (Handoff):**
  - End-to-end MVP workflows are demonstrable in preview.
  - Verifier gate confirms no blocker defects on core live-operation journeys.

### Phase 3 — Advanced Ops Packet

- **Primary team + accountable agent:** Design Team — Accessibility Auditor Agent (operability accountability)
- **Supporting teams:** DevOps/Implementation, QA, Bug, SecOps
- **Entry criteria (Intake + Planner):**
  - Core console packet has signed-off flows and known limits.
  - Advanced module specs (sampler, routing, presets) include explicit safety constraints.
- **Artifacts produced (Executor + Verifier):**
  - Advanced operator toolkit package
  - Preset layout manager specification and implementation notes
  - Accessibility and keyboard-first validation deltas for advanced modules
- **Exit criteria (Handoff):**
  - Advanced workflows meet accessibility and keyboard control gates.
  - Operational guardrails for high-risk actions are verified and documented.

### Phase 4 — Hardening & Launch Readiness Packet

- **Primary team + accountable agent:** QA Team — Regression Watcher Agent
- **Supporting teams:** DevOps, Bug, Incident Response, Brutal Review, Management
- **Entry criteria (Intake + Planner):**
  - All previous packet exits are complete with unresolved items explicitly tracked.
  - Release readiness checks and rollback paths are documented.
- **Artifacts produced (Executor + Verifier):**
  - Release readiness report
  - Incident/failure drill evidence
  - Operator onboarding guide + deferred backlog log
- **Exit criteria (Handoff):**
  - Final verification shows regression, performance, reliability, and accessibility gates pass.
  - Management receives launch recommendation with residual risk statement.

### Cross-Phase Dependency Matrix

| Dependency | Owner Team | Earliest Required Phase | Verification Gate | Blocking Impact if Missing |
| --- | --- | --- | --- | --- |
| Design tokens (`docs/ui/design_tokens_v1.md`) | Design | Phase 1 | Verifier (Foundation packet) | Prevents consistent primitives and layout implementation |
| API contracts (runtime state/events) | DevOps + Backend support | Phase 0 (frozen), Phase 2 (enforced) | Verifier (Core Console packet) | Blocks integration of live state, timeline, and health signals |
| Performance baseline | QA Performance Profiler + DevOps | Phase 2 | Verifier (Phase 4 hardening) | Launch risk due to unknown latency/jitter regressions |
| Accessibility baseline | Design Accessibility Auditor + QA | Phase 1 | Verifier (Phase 1 + Phase 4) | Fails keyboard-first and preset acceptance gates |
| Visual regression baseline | QA Regression Watcher + DevOps CI | Phase 2 | Verifier (Phase 4 hardening) | UI drift risk and unsafe release readiness signal |

### Escalation Path and Blocker Ownership

- Follow the normative escalation and reconciliation rules in `docs/operations/subagent_execution_playbook.md`.
- **Initial blocker owner:** accountable agent for the active phase packet.
- **Escalation level 1:** Management Team Project Coordinator Agent when a blocker crosses team boundaries or exceeds the phase SLA.
- **Escalation level 2:** Dependency Tracker Agent for unresolved external/system dependency chains.
- **Escalation level 3:** Incident Response + Release Manager Agent when blockers threaten launch safety, rollback viability, or production reliability.
- Every escalation must include: blocker description, impacted gate (Intake/Planner/Executor/Verifier/Handoff), owner, ETA, and mitigation/rollback options.

## 11) Success Metrics

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
