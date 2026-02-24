---
title: "BMAD Sprint Plan — Phase 4 Initialization"
command: "bmad-bmm-sprint-planning"
date: "2026-02-24"
source_files:
  - _bmad-output/planning-artifacts/gui-console-epics-stories.md
output_location: "_bmad-output/implementation-artifacts"
scope_freeze: "enabled"
---

# Sprint Plan (Phase-4 Hardening Scope)

## Assumptions
1. "Phase-4" maps to Sprint 4 hardening from the approved backlog document.
2. Only approved stories from `E6` and `E7` are in scope; no net-new stories are allowed.
3. Story execution order is dependency-aware but permits parallel work where predecessors are complete.

## Scope lock (approved-only)
- **In scope:** `E6-S2`..`E6-S6`, `E7-S1`..`E7-S6`.
- **Out of scope:** Any story not explicitly listed above, including backlog expansion and architecture refactors not tied to listed acceptance criteria.

## Story plan with constraints

| Story | Acceptance criteria (summary) | Required validation commands | Rollback / fallback | Dependency predecessor(s) |
|---|---|---|---|---|
| E6-S2 Predictive queue risk cards | Risk cards show confidence + why + mitigation, and update with queue/context change. | `npm run test -- queue-risk-cards`<br>`npm run test -- decision-trace-panel` | Feature-flag queue risk cards off and fall back to static risk indicators. | E6-S1 telemetry/event baselines available. |
| E6-S3 Prompt variable diff + approval workflow | Any AI prompt variable change requires diff view + explicit approval before apply. | `npm run test -- prompt-variable-diff`<br>`python -m json.tool config/prompt_variables.json` | Revert to last approved prompt variable snapshot from backups and disable apply path. | E6-S2 (risk context surface), existing config backup mechanism. |
| E6-S4 Decision trace panel | Last 5 automation decisions show rationale + source links and are filterable by severity. | `npm run test -- decision-trace-panel`<br>`npm run lint` | Hide trace panel and revert to existing event log view. | E6-S2 (risk model annotations). |
| E6-S5 Alert center remediation copy | Each alert includes severity, impact, and actionable remediation CTA. | `npm run test -- alert-center`<br>`npm run test -- accessibility-alerts` | Restore previous alert renderer and fixed copy catalog. | E6-S4 decision metadata available. |
| E6-S6 Timeline conflict detection hints | Overlaps are marked with reason code + suggested fix path in timeline conflicts. | `npm run test -- schedule-conflicts`<br>`python -m json.tool config/schedules.json` | Disable enhanced hints and preserve existing conflict markers only. | E6-S5 (alert semantics), scheduler conflict model ready. |
| E7-S1 Global keyboard map | Keyboard-only operator can execute load/play/cue/mix/queue actions end-to-end. | `npm run test -- keyboard-map`<br>`npm run test -- focus-navigation` | Revert keymap manifest and retain prior shortcut subset. | E1-S4 command palette shortcut baseline, E6-S5 alert interactions. |
| E7-S2 Reduced-motion alternatives | With reduced-motion preference active, non-essential animation is removed while state remains clear. | `npm run test -- reduced-motion`<br>`npm run test -- animation-state` | Re-enable legacy animation profiles and keep reduced-motion warning in settings. | E7-S1 keyboard map and focus behavior stable. |
| E7-S3 Contrast audit pass | Critical console states pass WCAG AA contrast thresholds. | `npm run test -- contrast-audit`<br>`npm run lint:css` | Roll back token/theme delta to last passing contrast baseline. | E7-S2 motion-safe visual states complete. |
| E7-S4 Focus management consistency | Focus indicators are consistent and no traps exist across shell/palette/modal flows. | `npm run test -- focus-management`<br>`npm run test -- keyboard-map` | Revert focus ring/focus trap changes and keep old tabindex ordering. | E7-S1 global keyboard map. |
| E7-S5 Performance budgets | Waveform/mixer/browser interactions sustain 55+ FPS and avoid >50 ms long tasks. | `npm run test -- perf-interactions`<br>`npm run profile -- --suite=ui-interactions` | Disable heavy visual enhancements and return to previous render strategy. | E7-S2 reduced motion and E7-S4 focus updates merged. |
| E7-S6 Regression snapshot matrix | UI changes require reviewed snapshot diffs before merge across shell/decks/waveforms/browser/automation. | `npm run test -- ui-snapshots`<br>`npm run test -- visual-regression` | Pin to last approved snapshot baseline and quarantine flaky cases. | E7-S3 contrast tokens and E7-S5 perf baseline stabilized. |

## Quality gates (hard)
- **Plan completeness = 100%:** Every story includes acceptance criteria, validation commands, rollback note, and predecessors.
- **Evidence completeness = 100%:** Story execution packet must include code/test evidence, updated docs (if touched), and validation output.
- **Verification command list attached:** Commands are embedded per-story in table above; no story can start without executable command set.

## Change-control path (scope freeze)
New requests during this sprint follow one of three paths only:
1. **Defer:** Add to post-sprint backlog if no active blocker.
2. **Split:** If partially related, split into an in-scope subset + deferred remainder.
3. **Re-plan:** If request invalidates dependencies/AC, stop and run `bmad-bmm-correct-course` then regenerate sprint plan/status.

## Exit criteria for phase initialization
- Sprint scope frozen and acknowledged.
- All stories dependency-ordered.
- Baseline status file generated via `bmad-bmm-sprint-status` route.
