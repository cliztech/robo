# DJ Console GUI TODO Backlog

Status: draft  
Audience: Design Team, DevOps Team, QA Team, Management Team  
Purpose: track executable GUI work items for the DJ console implementation with BMAD stage gating.

Design pod charter (ownership, cadence, decision rights, DoD): [`docs/ui/dj_console_design_pod.md`](./dj_console_design_pod.md).

Canonical status labels: **Not Started / In Progress / Blocked / Done**.

## Task Backlog by Epic/Module

### 1) Shell layout

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-001 | Intake | P0 | Design Team · UI/UX Agent | — | `docs/ui/radio_operator_ui_delivery_plan.md`, `docs/ui/design_tokens_v1.md` | Shell requirements are captured with desktop breakpoints (1280x720 min, 1920x1080 target) and approved by Design + Management. | S | Not Started |
| GUI-002 | Planner | P0 | DevOps Team · Infrastructure Agent | GUI-001 | `src/components/shell/app-shell.tsx`, `src/components/shell/app-shell.css` | Grid regions for top rail, deck row, browser row, utility dock are defined with no overlap at baseline resolutions. | M | Not Started |
| GUI-003 | Verifier | P1 | QA Team · Regression Watcher Agent | GUI-002 | `tests/ui/shell-layout.spec.ts`, `docs/visual_regression_token_checklist.md` | Visual regression snapshots pass for shell presets (`Pro`, `Performance`, `Essential`) and focus order remains deterministic. | M | Not Started |

### 2) Waveform rail

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-004 | Planner | P0 | AI Improvement Team · Model Evaluator Agent | GUI-002 | `src/components/shell/waveform-rail.tsx`, `src/components/audio/waveform-renderer.ts` | Rendering strategy is selected (Canvas/WebGL) with documented frame budget and fallback behavior. | S | Not Started |
| GUI-005 | Executor | P0 | DevOps Team · CI/CD Pipeline Agent | GUI-004 | `src/components/shell/waveform-rail.tsx`, `src/styles/tokens.css` | Dual-deck waveform lanes render cue markers, playhead, and beat grid with deck A/B semantic colors. | M | Not Started |
| GUI-006 | Verifier | P0 | QA Team · Performance Profiler Agent | GUI-005 | `tests/perf/waveform-rail.perf.ts`, `docs/readiness_scorecard.md` | Playback waveform rail sustains 60 FPS target on baseline profile and no frame stalls exceed 100ms p95. | M | Not Started |

### 3) Deck controls

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-007 | Planner | P0 | Design Team · UI/UX Agent | GUI-002 | `src/components/shell/deck-panel.tsx`, `docs/ui/radio_broadcasting_ui_execution_plan.md` | Control inventory is frozen for transport, sync, tempo, cue, loop, and telemetry without hidden critical actions. | S | Not Started |
| GUI-008 | Executor | P0 | DevOps Team · Infrastructure Agent | GUI-007 | `src/components/shell/deck-panel.tsx`, `src/components/primitives/button.tsx` | Deck controls support pointer + keyboard activation with visible active/armed/error states. | M | Not Started |
| GUI-009 | Verifier | P1 | Brutal Review Team · Code Critic Agent | GUI-008 | `src/components/shell/deck-panel.tsx`, `docs/QUALITY_SCORE.md` | Code quality review score is ≥4/5 across naming, state handling, and interaction clarity. | S | Not Started |

### 4) Mixer

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-010 | Planner | P0 | Design Team · Accessibility Auditor Agent | GUI-007 | `src/components/shell/mixer-panel.tsx`, `docs/FEATURE_HEAVY_ROADMAP_TODO.md` | Mixer interaction contract defines channel strips, EQ, gain, crossfader, and meter semantics. | S | Not Started |
| GUI-011 | Executor | P0 | DevOps Team · Infrastructure Agent | GUI-010 | `src/components/shell/mixer-panel.tsx`, `src/components/audio/channel-meter.tsx` | Mixer updates propagate without audible dropouts; clipping and limiter states are visually distinct. | M | Not Started |
| GUI-012 | Verifier | P0 | QA Team · Test Generator Agent | GUI-011 | `tests/ui/mixer-panel.spec.ts` | Automated tests validate crossfader law, mute/solo toggles, and meter threshold rendering. | M | Not Started |

### 5) Browser/queue

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-013 | Intake | P1 | Management Team · Project Coordinator Agent | GUI-002 | `docs/product-specs/new-user-onboarding.md`, `docs/ui/radio_operator_ui_delivery_plan.md` | Operator browse/load queue workflow is documented end-to-end with failure states. | S | Not Started |
| GUI-014 | Executor | P1 | DevOps Team · CI/CD Pipeline Agent | GUI-013 | `src/components/shell/library-browser.tsx`, `src/components/shell/queue-panel.tsx` | Source tree, track table, and queue operations (add/remove/reorder/load) are implemented with optimistic feedback. | L | Not Started |
| GUI-015 | Verifier | P1 | QA Team · Regression Watcher Agent | GUI-014 | `tests/ui/library-browser.spec.ts`, `tests/ui/queue-panel.spec.ts` | Keyboard-only browsing + queueing pass; regressions for load-to-deck flow remain zero. | M | Not Started |

### 6) Sampler/FX

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-016 | Planner | P1 | AI Improvement Team · Prompt Optimizer Agent | GUI-008, GUI-011 | `docs/ui/radio_broadcasting_ui_execution_plan.md`, `src/components/shell/module-dock.tsx` | Pad bank/FX slot UX states are specified for armed, active, latched, and bypassed states. | S | Not Started |
| GUI-017 | Executor | P1 | DevOps Team · Infrastructure Agent | GUI-016 | `src/components/shell/module-dock.tsx`, `src/components/audio/fx-slot.tsx`, `src/components/audio/sampler-pad.tsx` | Sampler pads and FX slots trigger with <50ms UI response and deterministic state rollback on failure. | M | Not Started |
| GUI-018 | Verifier | P1 | QA Team · Test Generator Agent | GUI-017 | `tests/ui/module-dock.spec.ts`, `tests/integration/audio-fx-routing.spec.ts` | FX chain and sampler triggers pass integration tests with no stuck active state after rapid toggling. | M | Not Started |

### 7) Scheduler overlay

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-019 | Planner | P1 | Management Team · Dependency Tracker Agent | GUI-013 | `docs/scheduler_clockwheel_spec.md`, `src/components/shell/scheduler-overlay.tsx` | Overlay contract maps scheduler events, countdowns, and manual override points to deck/mixer surfaces. | S | Not Started |
| GUI-020 | Executor | P1 | DevOps Team · Infrastructure Agent | GUI-019 | `src/components/shell/scheduler-overlay.tsx`, `src/components/shell/app-shell.tsx` | Overlay displays upcoming events and supports operator acknowledge/snooze actions without blocking transport controls. | M | Not Started |
| GUI-021 | Verifier | P1 | QA Team · Regression Watcher Agent | GUI-020 | `tests/ui/scheduler-overlay.spec.ts`, `docs/scheduling_alert_events.md` | Event timing and escalation badges match scheduler contracts in normal and degraded latency scenarios. | M | Not Started |

### 8) Routing/diagnostics

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-022 | Intake | P1 | SecOps Team · Compliance Agent | GUI-011 | `docs/RELIABILITY.md`, `docs/SECURITY.md`, `src/components/shell/diagnostics-panel.tsx` | Diagnostics data contract is redaction-safe and excludes secrets/PII while preserving operator actionability. | S | Not Started |
| GUI-023 | Executor | P1 | DevOps Team · Infrastructure Agent | GUI-022 | `src/components/shell/diagnostics-panel.tsx`, `src/components/audio/routing-matrix.tsx` | Routing matrix and stream diagnostics render source/sink health, underrun counters, and failover status live. | M | Not Started |
| GUI-024 | Verifier | P1 | Incident Response Team · Hotfix Coordinator Agent | GUI-023 | `tests/integration/routing-matrix.spec.ts`, `docs/reliability_incident_response.md` | Simulated fault drills confirm diagnostics support triage within SLA playbooks. | M | Not Started |

### 9) Accessibility and keyboard map

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-025 | Planner | P0 | Design Team · Accessibility Auditor Agent | GUI-002, GUI-008, GUI-011 | `docs/command_palette_and_shortcuts_spec.md`, `src/config/keyboard-map.ts` | Global shortcut map is conflict-free, includes reserved keys, and defines fallback sequences. | S | Not Started |
| GUI-026 | Executor | P0 | DevOps Team · Infrastructure Agent | GUI-025 | `src/config/keyboard-map.ts`, `src/components/shell/*.tsx` | All critical actions are keyboard reachable; focus indicator and ARIA roles are present for console modules. | M | Not Started |
| GUI-027 | Verifier | P0 | QA Team · Regression Watcher Agent | GUI-026 | `tests/a11y/dj-console.a11y.spec.ts`, `docs/visual_regression_token_checklist.md` | WCAG-focused checks pass for contrast, focus order, reduced motion, and large text presets. | M | Not Started |

### 10) QA/performance hardening

| ID | BMAD gate | Priority | Owner team/agent | Dependency IDs | File path targets | Acceptance checks | Estimate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GUI-028 | Planner | P0 | QA Team · Performance Profiler Agent | GUI-006, GUI-012, GUI-018, GUI-021, GUI-024, GUI-027 | `docs/readiness_scorecard.md`, `docs/PLANS.md` | End-to-end validation matrix is baselined for startup time, memory, CPU, and UI responsiveness targets. | S | Not Started |
| GUI-029 | Verifier | P0 | Brutal Review Team · Doc Reviewer Agent | GUI-028 | `docs/ui/dj_console_gui_todo_backlog.md`, `docs/PLANS.md` | Backlog, validation evidence, and cross-links are documentation-lint clean and traceable to implementation items. | S | Not Started |
| GUI-030 | Handoff | P0 | Management Team · Sprint Planner Agent | GUI-029 | `docs/FEATURE_HEAVY_ROADMAP_TODO.md`, `docs/readiness_scorecard.md` | Release packet includes completed checklist, signoffs, unresolved risk register, and go/no-go recommendation. | S | Not Started |

## Release-Readiness Checklist (Hard Gates + Signoff Owners)

All gates are mandatory before marking DJ Console GUI as Ready-for-Review/Release Candidate.

| Hard gate | Pass criteria | Evidence artifact | Signoff owner |
| --- | --- | --- | --- |
| Plan completeness = 100% | Scope, constraints, rollback, and verification are present for all P0/P1 GUI tasks. | `docs/PLANS.md` update + linked execution plan | Management Team · Project Coordinator Agent |
| Subagent evidence completeness = 100% | Every completed task records owner, command outputs, and acceptance proof. | `docs/operations/artifacts.md`-compliant artifact bundle | Management Team · Dependency Tracker Agent |
| Draft PR maturity checklist fully passed | Reviewer checklist has no unchecked items and includes validation commands/output. | PR template body + reviewer checklist | Brutal Review Team · Code Critic Agent |
| Worktree hygiene checks passed | No stale branches, no detached worktree merges, clean branch lineage. | `git status --short`, `git branch --all` logs in PR notes | DevOps Team · CI/CD Pipeline Agent |
| Accessibility gate passed | Keyboard map, focus order, contrast, reduced-motion, and large-text checks pass. | `tests/a11y/*` reports + visual evidence | Design Team · Accessibility Auditor Agent |
| Performance gate passed | Waveform, mixer, and queue interaction meet baseline perf targets without critical regressions. | Perf test report + `docs/readiness_scorecard.md` | QA Team · Performance Profiler Agent |
| Reliability + diagnostics gate passed | Routing faults and scheduler alerts are surfaced correctly during incident simulation. | Integration test logs + incident drill notes | Incident Response Team · Hotfix Coordinator Agent |
| Handoff completeness gate passed | Final release summary includes risk register, deferred items, and ownership for follow-ups. | Release handoff memo in `docs/PLANS.md` | Management Team · Sprint Planner Agent |
