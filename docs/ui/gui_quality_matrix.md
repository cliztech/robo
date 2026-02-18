# GUI Quality Matrix

This matrix defines measurable GUI quality checks for operator-facing surfaces and maps each check to traceable stories, test coverage, and accountable owners.

## 1) Visual fidelity

| Check ID | Measurable check | Target / threshold | Related story IDs | Test type | Owner role |
| --- | --- | --- | --- | --- | --- |
| VF-01 | Panel density (controls + data widgets per viewport) | Default layout: 8–14 primary interactive elements visible at 1440x900 without overlap or clipping | UI-SCHED-01, UI-DIAG-02 | visual, e2e | UI/UX Agent |
| VF-02 | Spacing rhythm consistency | 100% of audited screens use approved spacing scale; no ad-hoc spacing deltas above 4px from token steps | UI-DS-03 | visual | Brand Consistency Agent |
| VF-03 | Cue and meter state visibility | Cue, live, warning, and fault states remain visually distinct in both light/dark themes with non-color reinforcement (icon or label) | UI-CONSOLE-04, UI-DIAG-05 | visual, integration | Accessibility Auditor Agent |
| VF-04 | Critical control prominence | Incident-state controls (mute all, failover, stop automation) remain visible above first fold at 1366x768 | UI-OPS-06 | e2e, visual | UX Auditor Agent |

## 2) Functional fidelity

| Check ID | Measurable check | Target / threshold | Related story IDs | Test type | Owner role |
| --- | --- | --- | --- | --- | --- |
| FF-01 | Core flow completion rate (happy path) | 100% pass for schedule edit, cue trigger, and emergency override flows in regression suite | UI-SCHED-07, UI-OPS-06 | e2e | Test Generator Agent |
| FF-02 | State transition correctness | No invalid transition accepted for cue/meter states (idle -> cued -> live -> complete/fault) | UI-CONSOLE-08 | unit, integration | Code Critic Agent |
| FF-03 | Incident-state control behavior | All incident controls execute intended action and emit auditable state/event logs | UI-OPS-09 | integration, e2e | Incident Response |
| FF-04 | Draft-save and restore reliability | Unsaved edits are recoverable after restart/crash simulation with zero silent data loss | UI-SCHED-10, UI-PROMPTS-11 | integration | Regression Watcher Agent |

## 3) Accessibility

| Check ID | Measurable check | Target / threshold | Related story IDs | Test type | Owner role |
| --- | --- | --- | --- | --- | --- |
| AX-01 | Keyboard-only completion for core workflows | 100% completion for scheduler update, cue launch, diagnostics acknowledge, and library search without pointer input | UI-A11Y-12 | e2e | Accessibility Auditor Agent |
| AX-02 | Focus order and visibility | No keyboard trap; visible focus indicator present for every actionable control | UI-A11Y-13 | e2e, visual | UX Auditor Agent |
| AX-03 | Contrast and non-color signaling | WCAG AA contrast met for text and interactive states; warning/error states not color-only | UI-A11Y-14 | visual | Accessibility Auditor Agent |
| AX-04 | Assistive technology semantics | Screen reader announces control names, state changes, and live-region updates for cue/meter events | UI-A11Y-15 | integration, e2e | Compliance Agent |

## 4) Runtime performance

| Check ID | Measurable check | Target / threshold | Related story IDs | Test type | Owner role |
| --- | --- | --- | --- | --- | --- |
| RP-01 | Waveform/render update smoothness | >= 55 FPS median and >= 45 FPS p95 during active playback timeline updates | UI-PERF-16 | e2e, performance | Performance Profiler Agent |
| RP-02 | Meter refresh latency | Audio meter reflects input level changes within <= 120 ms p95 | UI-PERF-17 | integration, performance | Performance Profiler Agent |
| RP-03 | Control response latency | Operator actions (cue, pause, failover) acknowledge in <= 200 ms p95 | UI-PERF-18 | integration, e2e | QA Team |
| RP-04 | Recovery after degraded runtime state | UI remains interactive with <= 1 dropped critical control action during fault-injection scenario | UI-PERF-19, UI-OPS-09 | e2e | Incident Response |

## Release gate criteria (QA-aligned)

A release candidate is blocked unless all conditions below are true:

1. **No critical regressions:** zero unresolved critical or blocker regressions across visual, functional, and performance checks in this matrix.
2. **Accessibility blockers resolved:** no open accessibility issues classified as blocking for keyboard operation, contrast compliance, or assistive technology workflows.
3. **Incident-state controls verified:** all incident-state controls pass verification in latest integration/e2e runs, including audit-event emission checks.
4. **Evidence completeness:** each failed check has owner assignment, mitigation date, and explicit go/no-go decision recorded before release status can change.

## Known compromises

Document intentional deviations from reference behavior here so they remain visible and auditable.

| Compromise ID | Area | Intentional deviation | Reason / constraint | Mitigation plan | Owner |
| --- | --- | --- | --- | --- | --- |
| KC-01 | Visual fidelity | Diagnostics density allowed to exceed standard target on 4K layouts | Operator feedback prioritized one-screen observability for on-air incidents | Add density toggle and progressive disclosure controls in next UI cycle | UI/UX Agent |
| KC-02 | Accessibility | Waveform canvas summary exposed as periodic text updates instead of full semantic waveform model | Current rendering stack cannot provide low-cost semantic segment map | Add segmented waveform accessibility layer behind feature flag | Accessibility Auditor Agent |
| KC-03 | Runtime performance | Meter refresh relaxed under CPU saturation mode | Protects control responsiveness during incident handling | Introduce adaptive rendering policy with explicit operator indicator | Performance Profiler Agent |
