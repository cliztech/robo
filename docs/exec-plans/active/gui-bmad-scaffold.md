# GUI BMAD Scaffold Plan

## Purpose
Provide a stage-gated execution scaffold for GUI delivery using BMAD phases while aligning ownership, artifacts, and handoffs to the repository agent organization and pipeline defined in `AGENTS.md`.

## B — Business / Brief

### User outcomes
- Operators can run a complete show workflow (deck prep, mixer balancing, browser lookup, sampler triggering) in one coherent GUI without context switching.
- New operators reach first successful live-assist session quickly via guided workflows and predictable controls.
- Experienced operators can execute time-critical actions with low cognitive load and keyboard-first affordances.

### Operator personas
- **Live Host Operator:** Prioritizes speed, confidence, and error recovery during on-air transitions.
- **Producer / Scheduler Operator:** Prioritizes planning visibility, queue consistency, and smooth handoffs to live sessions.
- **QA / Training Operator:** Prioritizes repeatable scenarios, accessibility presets, and observability of decision traces.

### Success metrics
- **Task completion:** ≥95% successful completion for critical workflows (load deck, mix transition, trigger sample, open browser reference).
- **Time to action:** p95 ≤30s for first meaningful action in each surface after app open.
- **Error recovery:** ≥90% of user errors recoverable within 2 guided steps.
- **Accessibility readiness:** 100% pass on keyboard-only and high-contrast acceptance checks.
- **Quality gate readiness:** All stage-gated checkpoints pass before release candidate labeling.

## M — Model

### Information architecture
- **Decks surface:** Track queue, waveform/transport controls, cue state, transition intent.
- **Mixer surface:** Channel strips, gain/EQ/fader state, monitoring route, safety limits.
- **Browser surface:** Search/filter library, metadata preview, drag-to-load interaction.
- **Sampler surface:** Pad bank, category presets, trigger mode (latch/momentary), cooldown indicators.
- **Global shell:** Session status, alerts, shortcut hints, accessibility mode selector, audit trail entry points.

### Interaction model
- **Primary flow:** Browser discovery → deck load → mixer prep → sampler augmentation → publish/log outcome.
- **Keyboard-first pathways:** Deterministic focus order, command palette hooks, visible focus treatment.
- **Failure paths:** Missing assets, deck conflicts, and routing conflicts return actionable guidance with safe defaults.
- **Cross-surface synchronization:** State badges and event toasts keep deck/mixer/browser/sampler context aligned.

## A — Architecture

### Component boundaries
- **Presentation layer:** Surface-specific components (`DeckPane`, `MixerPane`, `BrowserPane`, `SamplerPane`) with strict prop contracts.
- **Domain state layer:** Centralized session store for transport/mixer/sampler intent; local UI state stays component-scoped.
- **Orchestration layer:** Event bus / command handlers for cross-surface actions, undo-safe commands, and telemetry hooks.
- **Verification hooks:** Structured events and snapshots for regression watchers and acceptance suite replay.

### State ownership
- **Global state:** Session mode, loaded assets, active deck, mixer routing, sampler bank assignment, accessibility preset.
- **Local state:** Temporary input edits, panel expansion, transient hover/preview states.
- **Derived state:** Read-only selectors for health indicators, conflict warnings, and shortcut affordance hints.

### Performance constraints
- UI interaction response target: ≤100ms for local control interactions.
- Scheduler/mixer conflict signaling target: ≤200ms p95 for warning propagation.
- Rendering discipline: avoid unnecessary re-renders on transport ticks through memoization/selectors.

### Accessibility constraints
- Full keyboard operation across all GUI surfaces with no pointer-only requirement.
- High contrast, large text, reduced motion, and simplified density presets supported.
- Actionable ARIA labels/landmarks and deterministic focus restoration after modal flows.

## D — Delivery

### Milestone plan
1. **M0 — Discovery and alignment**
   - Lock BMAD intent, personas, and measurable acceptance criteria.
2. **M1 — Model and spec freeze**
   - Finalize IA, interaction contracts, keyboard map, and accessibility matrix.
3. **M2 — Architecture implementation window**
   - Build surface boundaries, state ownership model, and telemetry hooks.
4. **M3 — Integrated verification**
   - Run regression, performance, and accessibility acceptance suite.
5. **M4 — Release readiness and rollout**
   - Pass build/release gates, publish rollout guide, and monitor launch scorecards.

### Verification gates
- **Plan gate:** Plan completeness = 100% (scope + constraints + rollback + verification).
- **Evidence gate:** Subagent evidence completeness = 100%.
- **Quality gate:** Draft PR maturity checklist fully passed before Ready-for-Review.
- **Hygiene gate:** Worktree hygiene checks pass with no stale branches/detached merges.

### Rollout strategy
- **Phase 1:** Internal operator pilot with scripted scenarios and telemetry baselines.
- **Phase 2:** Controlled cohort rollout with regression/perf watch and rollback trigger thresholds.
- **Phase 3:** Broad release after Brutal Review quality score and QA acceptance sign-off.

## Team ownership and required artifacts

### Design Team (UI/UX + Accessibility + Brand)
- **Ownership:** UX flows, interaction specs, visual consistency, accessibility acceptance criteria.
- **Required artifacts:**
  - GUI interaction spec (decks/mixer/browser/sampler)
  - Accessibility preset checklist and keyboard navigation map
  - Brand consistency scorecard for UI copy/states
  - Design review log with resolved issues

### QA Team (regression + perf + acceptance suite)
- **Ownership:** Regression prevention, performance profiling, end-to-end acceptance.
- **Required artifacts:**
  - Regression baseline matrix and diff report
  - Performance benchmark log (latency and responsiveness targets)
  - Acceptance suite results with pass/fail traceability
  - Defect triage sheet linked to severity and owner

### DevOps Team (build/release gates)
- **Ownership:** Build integrity, release gate automation, deployment readiness.
- **Required artifacts:**
  - Build/release gate checklist
  - CI validation logs and failure diagnostics
  - Release candidate readiness report
  - Rollback validation log

### Management Team (dependency/sprint control)
- **Ownership:** Scope control, dependency mapping, sprint sequencing.
- **Required artifacts:**
  - Sprint plan with ownership and dependencies
  - Dependency risk register with mitigation actions
  - Milestone status dashboard
  - Blocker escalation log

### Brutal Review Team (quality gate enforcement)
- **Ownership:** Hard quality review on code/docs/UX before merge readiness.
- **Required artifacts:**
  - Code quality scorecard (architecture, naming, testing, docs)
  - Documentation quality checklist (completeness/link validity/actionability)
  - UX critique report with actionable remediations
  - Final gate recommendation memo (approve/defer with rationale)

## RACI matrix

| Workstream | Design | QA | DevOps | Management | Brutal Review |
| --- | --- | --- | --- | --- | --- |
| BMAD brief + persona definition | **R** | C | I | **A** | C |
| Interaction + IA specification | **R/A** | C | I | C | C |
| Architecture/state contract definition | C | C | **R** | **A** | C |
| Accessibility/performance acceptance criteria | **R** | **R/A** | C | I | C |
| Regression/perf/acceptance execution | I | **R/A** | C | I | C |
| Build/release gate execution | I | C | **R/A** | C | C |
| Quality review and Ready-for-Review recommendation | C | C | I | I | **R/A** |
| Rollout decision and dependency risk sign-off | C | C | C | **R/A** | C |

**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed.

## Stage-gated handoff checkpoints

1. **Intake → Planner checkpoint**
   - Inputs: Request classification, scope boundaries, applicable constraints.
   - Outputs: Scoped task packet with BMAD phase targets and in-scope teams.
2. **Planner → Executor checkpoint**
   - Inputs: Minimal plan, rollback intent, allowed operations.
   - Outputs: Execution-ready work items with artifact expectations per team.
3. **Executor → Verifier checkpoint**
   - Inputs: Delivered artifacts, change log, validation evidence.
   - Outputs: Verification packet (tests/checklists/results) mapped to BMAD milestones.
4. **Verifier → Handoff checkpoint**
   - Inputs: Gate outcomes, unresolved risks, compliance status.
   - Outputs: Final summary, release recommendation, and follow-up tracker.

## Completion criteria
- BMAD sections approved by accountable teams in RACI.
- Required artifacts produced and linked from milestone records.
- All stage-gated checkpoints completed with documented evidence.
- Ready-for-Review recommendation issued only after quality and hygiene gates pass.
