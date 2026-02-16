# Radio Operator UI Delivery Plan (Functional, Not Mockup-Only)

Status: Prototype complete; Hardening in progress (Phase 4)
Owner: Design + DevOps + QA + AI Improvement + Management
Primary reference style: user-provided DJ/radio console mockups (dark, high-density, deck-centric)

## 1) Outcome

## 1.1) Current implementation snapshot

The operator UI is already partially implemented in `src/app/page.tsx` and the audio component set in `src/components/audio/`, with scheduling context from `src/components/schedule/DegenScheduleTimeline.tsx`.

Completed modules:
- `DegenWaveform`
- `DegenMixer`
- `DegenTransport`
- `DegenTrackList`
- `DegenScheduleTimeline`
- Supporting modules in current console: `DegenEffectRack`, `DegenBeatGrid`

Remaining hardening tasks:
- Replace simulated/randomized UI telemetry with backend/audio-engine streams.
- Strengthen keyboard-first and screen-reader behavior across all deck and mixer controls.
- Add deterministic coverage for transport, browser filtering/loading, and timeline interactions.
- Complete reliability behavior for reconnect, stale state, and fallback visualization flows.
- Validate sustained performance for concurrent waveform, meters, and table updates.

Design and implement **fully operational** operator interfaces (not static images) for the DGN-DJ radio platform by translating the visual language of the provided mockups into a production-ready interaction system.

This document defines:
- UI architecture and screen modules
- Required backend/contracts/resources
- Agent team responsibilities and handoffs
- Skill stack to execute the work with controlled scope
- Stage-gated implementation plan with verification criteria

## 2) Style Translation from Mockups (What to Keep vs Adapt)

### Keep from inspiration
- Dark, low-glare control-room foundation
- High information density with rapid scan hierarchy
- Deck-centric interaction model (A/B/C/D playback contexts)
- Distinct accent channels for left/right deck focus states
- Embedded waveform + meters + browser in one workspace
- Quick-access pads/hot cues/FX and compact parameter controls

### Adapt for DGN-DJ operations
- Replace nightclub/DJ-first terminology with broadcast operations language where needed
- Prioritize radio automation flows (scheduler, voice links, ad breaks, live override)
- Enforce accessibility and keyboard-first workflows
- Keep tokenized semantic colors from `docs/ui/design_tokens_v1.md`
- Preserve consistency with existing operator surfaces (Scheduler, Prompts, Diagnostics, Library)

## 3) Functional Screen Inventory

### 3.1 On-Air Console (Primary)
Purpose: run live/automated broadcast with immediate confidence.

Core modules:
- Deck A/B transport and waveform strips
- Optional Deck C/D utility channels (beds/stingers/emergency)
- Mixer strip (gain, EQ profile, filter, cue, master out)
- Crossfade/transition controls with automation hooks
- Voice channel module (mic gate, ducking, monitor)
- Master output meter + limiter state + clip alerts
- Live status rail (On Air, AutoDJ, Fallback, Recording)

### 3.2 FX + Sampler Rack
Purpose: trigger production-safe enhancements without complexity overload.

Core modules:
- Sampler grid with banks and color-coded classes (IDs, stings, risers, SFX)
- FX slots per deck (preset + macro knobs + reset)
- One-click safe reset to “broadcast neutral” state
- Lock mode for accidental-touch prevention

### 3.3 Broadcast Browser + Queue Workspace
Purpose: fast media discovery and deterministic playout queue building.

Core modules:
- Folder/source tree
- Track table with sort/filter/search
- Metadata lanes (BPM/key optional, plus broadcast attributes: mood/daypart/content flags)
- Queue inspector panel with timing estimates and ad break markers
- Drag/drop and keyboard enqueue actions

### 3.4 Scheduler + Clockwheel Overlay
Purpose: unify manual console operation with automation schedule intent.

Core modules:
- Hour clock visualization with segment blocks
- Scheduled events timeline (music, voice, ads, IDs, legal)
- Conflict/warning chips with remediation actions
- Live now/next state aligned to currently playing deck

### 3.5 Audio Routing & Device Settings
Purpose: predictable hardware/IO behavior for real-world studios.

Core modules:
- Output routing presets (master/cue/stream/record)
- Input assignments (mic, line, remote feed, timecode optional)
- Driver profile and channel map UI
- Apply/test/rollback workflow with diagnostic logs

### 3.6 Diagnostics & Reliability Center
Purpose: reduce time-to-detection/time-to-recovery.

Core modules:
- Health cards (audio engine, stream uplink, AI pipeline, queue integrity)
- Event timeline and severity badges
- Quick actions: restart module, switch fallback, capture debug bundle
- SLO indicator strip and incident mode banner

## 4) Interaction Architecture (Operational)

### Primary workspace zones
1. **Top strip:** global status, clock, CPU/audio health, profile/layout
2. **Deck + mixer canvas:** real-time playout controls
3. **Context rail:** tabs (Browser / Scheduler / Sampler / Diagnostics)
4. **Bottom workspace:** data-dense table/panels with keyboard navigation

### Interaction principles
- 1-click for urgent actions; 2-step confirmation for destructive/high-risk actions
- All transport/queue actions keyboard-accessible
- No hidden state: if automation is active, show clear ownership (human vs system)
- Degraded mode visualization must be unmistakable and action-oriented

## 5) Component System Needed for Real Implementation

Build a reusable component library (React UI path) with these primitives first:
- `DeckHeader`, `WaveformStrip`, `TransportCluster`
- `MixerStrip`, `MeterBridge`, `Crossfader`
- `PadGrid`, `FxRack`, `KnobControl`, `ToggleLatch`
- `LibraryTree`, `MediaTable`, `QueueTimeline`
- `Clockwheel`, `ScheduleEventCard`, `ConflictBadge`
- `RouteMatrix`, `DeviceProfileCard`, `HealthTile`, `IncidentBanner`

Each component requires state contracts for:
- idle/active/focused/latched/disabled/error
- optimistic updates + rollback feedback
- keyboard focus and shortcut registration

## 6) Data, APIs, and Runtime Resources Required

### Data contracts (minimum)
- Deck state stream (track, position, tempo/key, cue points, transport state)
- Mixer/FX state stream (knob values, preset IDs, bypass/lock)
- Queue + scheduler feed (now/next, conflicts, insertion windows)
- Device routing schema (available devices/channels/profiles)
- Diagnostics events feed (severity, subsystem, recovery status)

### Backend/API resources
- Existing route catalog in `API_ROUTES.md` should be mapped to UI module ownership
- New/extended websocket channels for low-latency transport and meter updates
- Persisted layout presets per operator profile
- Audit log hooks for high-risk actions (routing changes, emergency overrides)

### Non-code resources
- Accessibility audit matrix and keyboard map spec
- Broadcast-safe sample asset set for QA scenarios
- Reproducible demo datasets for queue/scheduler conflict testing

## 7) Agent Team Plan (Who Does What)

### 7.1 Management Team
- Finalize phased scope and milestone ownership
- Track dependency chain across UI, backend, QA, and release

### 7.2 Design Team
- Derive final visual/interaction specs from mockup language
- Produce component behavior spec (not only visual snapshots)
- Validate accessibility presets and keyboard-first flows

### 7.3 DevOps Team
- Stand up environment for React UI delivery and integration pipelines
- Add CI checks for lint, tests, visual diff, and accessibility smoke checks

### 7.4 AI Improvement Team
- Define operator-assist patterns (contextual suggestions, not autopilot surprises)
- Ensure AI-generated recommendations fit broadcast constraints and confidence labels

### 7.5 QA Team
- Create scenario-based test packs (live show, emergency fallback, ad break insertion)
- Run regression checks on transport timing, queue integrity, and routing persistence

### 7.6 Brutal Review Team
- Enforce quality score gates (architecture, naming, error states, usability clarity)
- Reject incomplete state handling or inaccessible interaction patterns

## 8) Skill Stack to Use (Execution Order)

From `SKILLS.md`, recommended stack:
1. `scope-resolver` — enforce instruction boundaries by target paths
2. `intake-router` — keep request in Proposal/Change lanes per phase
3. `docs-pipeline-designer` — produce implementation-ready design specs
4. `performance-profiler` — define audio/meter latency budgets and guardrails
5. `security-scanner` + `broadcast-compliance-auditor` — validate safety/compliance constraints
6. `brutal-reviewer` — quality gate before implementation merge
7. `pr-writer` — consistent PR evidence and validation summary

## 9) Phased Delivery Plan (From Spec to Working UI)

### Phase 0 — Foundations
State: Complete
- Finalize IA + component taxonomy
- Lock design tokens and contrast profiles
- Define keyboard command map and ARIA landmarks

Exit criteria:
- Approved spec package with acceptance criteria per module

### Phase 1 — Console Core (Functional)
State: Prototype complete
- Implement deck, waveform, transport, mixer, meter bridge
- Integrate live state feeds (read + control)
- Add fail-safe indicators and transport confirmations

Exit criteria:
- End-to-end control of A/B playout in dev/staging with deterministic state sync

### Phase 2 — Browser + Queue + Scheduler Integration
State: Prototype complete
- Implement media browser and queue operations
- Integrate scheduler overlay and conflict handling
- Add now/next and break-window intelligence

Exit criteria:
- Operator can run a full hour with mixed manual and automated transitions

### Phase 3 — FX/Sampler + Routing + Diagnostics
State: In progress
- Add FX/sampler module with safety locks and reset semantics
- Add routing/device settings with apply/test/rollback
- Integrate diagnostics command center

Exit criteria:
- Failure drills pass (routing change rollback, stream fallback, incident mode)

### Phase 4 — Hardening + Release Readiness
State: Hardening in progress
- Performance tuning for real-time visual updates
- Accessibility and keyboard completion
- Full QA regression, release checklist, and operator training aids

Exit criteria:
- Release candidate passes all quality gates in `PRE_RELEASE_CHECKLIST.md`

Quality readiness exit criteria:
- 100% pass rate for defined on-air operator regression scenarios in CI.
- P95 transport and cue interaction latency <100ms in staging.
- Zero unresolved blocker/critical defects and zero critical accessibility issues.
- Keyboard-only completion rate ≥95% for deck, queue, and scheduler workflows.
- 55+ FPS sustained in composite operator view during active meter + waveform updates.

## 10) Verification and Quality Gates

Mandatory verification before production rollout:
- Functional checks: transport control, queue ordering, scheduler sync, routing apply/rollback
- Reliability checks: fallback behavior, reconnect logic, stale state detection
- UX checks: keyboard-only operation, focus order, reduced-motion compatibility
- Accessibility checks: contrast and screen-reader labels for critical controls
- Performance checks: waveform + meters + table scrolling under load

## 11) Immediate Next Actions (Execution Starter)

1. Approve this delivery plan as the working UI program charter.
2. Produce two detailed specs next:
   - On-Air Console interaction spec
   - Browser/Queue/Scheduler integration spec
3. Create API/state contract table per component before coding.
4. Start Phase 1 implementation behind a feature flag with weekly demo cadence.

---

This plan intentionally treats the provided images as **style inspiration**, while the deliverable remains a fully operational, testable, and maintainable broadcast UI system.
