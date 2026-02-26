# GUI Prompt Review: Agent Team Plan for Music Console Interface

Status: Drafted
Owner: Design Team (UI/UX Agent) with Management + QA + DevOps support
Date: 2026-02-25
Input prompt: "review the prompt through team, what does our gui need, how will the agent team complete a gui interface that users will see, understand, enjoy using"

## 1) Approach Summary

This plan converts the prompt into a production-ready delivery model:

1. Define what the GUI must do (functional + usability + reliability requirements).
2. Assign clear ownership per agent team with explicit completion gates.
3. Sequence delivery into short iterations with measurable evidence.

## 2) Assumptions

- Platform target is DGN-DJ desktop/web operator surfaces with dark, high-density console UX.
- Existing references remain authoritative: `docs/ui/radio_operator_ui_delivery_plan.md`, `docs/ui/dj_console_gui_todo_backlog.md`.
- Scope is implementation-ready design and delivery workflow; no runtime behavior changes in this document.

## 3) What the GUI Needs (User-facing requirements)

## 3.1 Understandable in under 30 seconds

- Immediate visual hierarchy: transport, deck state, master health, and queue status must be readable at a glance.
- Persistent state indicators: On Air/Auto/Manual/Fallback cannot be ambiguous.
- Action affordances: high-risk actions (stop output, force override) must be visually distinct.

## 3.2 Enjoyable for expert operators

- Low-friction control loops: load -> preview -> transition -> confirm should require minimal focus/context switching.
- Dense but stable layout: no modal churn for frequent operations.
- Fast feedback: waveform/meter/control acknowledgements should feel instant.

## 3.3 Reliable under pressure

- Degraded-state UX: lost stream, stalled scheduler, or telemetry lag must remain actionable.
- Keyboard-first parity for every critical control.
- Fail-safe interaction design: destructive actions require intent confirmation with reversible paths where possible.

## 3.4 Accessible and legible

- Contrast, focus visibility, reduced motion, and large text presets are mandatory.
- Full interaction path without mouse.
- Clear status messaging with action-oriented language.

## 4) Why the obvious solution fails (Critique)

The obvious path is to chase visual polish first from a DJ mockup. That fails for production because:

- It optimizes appearance over operational trust and incident handling.
- It hides system state complexity (scheduler conflicts, routing faults, fallback transitions).
- It delays keyboard and accessibility, causing expensive late rework.

## 5) Architecture Fit

The GUI should be treated as four separable but synchronized planes:

1. **Control plane:** deck, mixer, transport, cue/loop, FX controls.
2. **State plane:** scheduler events, automation mode, stream/encoder health.
3. **Feedback plane:** waveform, meters, cue states, warnings.
4. **Recovery plane:** diagnostics, fallback actions, incident hints.

This aligns with current system patterns: clear state ownership, modular components, and testable interaction contracts.

## 6) Edge Cases to design first

- Scheduler event arrives during manual transition.
- Deck source unloads mid-cue due to I/O stall.
- Meter updates lag while transport state continues.
- Hotkey collisions on global shortcuts.
- Operator has reduced-motion + large-text presets enabled simultaneously.

## 7) The 10% Twist (Inevitable UX improvement)

Introduce an **Operator Confidence Rail**: one compact, always-visible strip that fuses:

- current automation mode,
- next two scheduled actions,
- stream health,
- single recommended next action.

This reduces cognitive load and shortens error recovery time during live operations.

## 8) Agent Team Execution Plan (Who does what)

## 8.1 Intake + Planning

- **Management / Project Coordinator Agent**
  - Freeze scope and sequencing against GUI backlog IDs.
  - Gate: plan completeness = 100%.

- **Design / UI-UX Agent**
  - Produce interaction contracts for deck/mixer/browser/scheduler surfaces.
  - Gate: state map + control inventory + acceptance criteria complete.

## 8.2 Build + Integration

- **DevOps / Infrastructure Agent**
  - Implement shell modules and data wiring in small increments.
  - Gate: each increment ships with deterministic tests and no UI regressions.

- **SecOps / Compliance Agent**
  - Validate diagnostics and status payloads are redaction-safe.
  - Gate: zero policy violations in exposed UI state.

## 8.3 Verification + Hardening

- **QA / Regression Watcher Agent**
  - Run accessibility, keyboard, visual consistency, and integration checks.
  - Gate: no unresolved P0/P1 regressions.

- **QA / Performance Profiler Agent**
  - Validate responsiveness with concurrent waveform + meters + queue updates.
  - Gate: responsiveness and resource targets met.

- **Brutal Review / UX Auditor Agent**
  - Challenge clarity, dead-ends, and error recovery quality.
  - Gate: operator workflows pass strict usability review.

## 9) Delivery sequence (fast, maintainable)

1. **Week 1:** IA lock + component contracts + keyboard map baseline.
2. **Week 2:** Deck/mixer core with real state surfaces.
3. **Week 3:** Scheduler/queue/diagnostics integration + degraded-state UX.
4. **Week 4:** Accessibility + performance hardening + release packet.

## 10) Definition of Done

GUI is complete only when users can:

- run an entire broadcast cycle without confusion,
- recover from common failures without external support,
- operate critical controls fully by keyboard,
- maintain confidence from clear, stable system feedback.

## 11) Trade-offs

- Prioritizing reliability/a11y first may reduce early visual novelty.
- Adding confidence rail increases implementation complexity slightly but pays off in operator trust and incident speed.
- High-density layouts improve expert throughput but require disciplined spacing/token consistency.
