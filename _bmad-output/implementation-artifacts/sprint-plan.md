---
title: "Phase-4 Sprint Plan Baseline — Approved Epics/Stories"
title: "BMAD Sprint Plan — Phase 4 Initialization"
command: "bmad-bmm-sprint-planning"
date: "2026-02-24"
source_files:
  - _bmad-output/planning-artifacts/gui-console-epics-stories.md
output_location: "_bmad-output/implementation-artifacts"
scope_freeze: "enabled"
---

# Phase-4 Sprint Plan Baseline

## Scope lock (approved backlog only)
- Scope source is **only** `_bmad-output/planning-artifacts/gui-console-epics-stories.md` (42 approved stories across E1-E7).
- No unscoped additions are allowed during execution; new requests must follow change-control.
- Sprint slicing reference from source: **E6 stories 2-6 + E7 stories 1-6 + defect burn-down.**.

## Hard quality gates
- Plan completeness: **100% required** (scope, constraints, rollback, verification on every story).
- Evidence completeness: **100% required** (acceptance criteria + validation commands + predecessor + rollback captured per story).
- Verification command list is attached to every story before it can enter `ready-for-dev`.

## Change-control path (scope freeze)
1. **Defer**: move request to post-sprint backlog if it does not block committed stories.
2. **Split**: carve only the blocking subset into a narrowly scoped story and keep remainder deferred.
3. **Re-plan**: if request invalidates critical assumptions, run `bmad-bmm-correct-course`, then regenerate sprint plan/status.

## Story execution matrix

| Story | Acceptance criteria | Required validation commands | Rollback/fallback note | Dependency predecessor(s) |
|---|---|---|---|---|
| E1-S1 — Theme token contract for console surfaces | Given the app shell loads, when console UI mounts, then all shell surfaces consume shared semantic tokens for bg/fg/border/accent. | `npm run lint`; `npm run test -- -t "E1-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E1-S2 — Responsive shell grid and docking regions | Given desktop and narrow widths, when viewport changes, then deck/mixer/browser/queue zones preserve readable hierarchy with no overlap. | `npm run lint`; `npm run test -- -t "E1-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E1-S1 |
| E1-S3 — Top navigation status strip with clock and mode badges | Given operator mode changes, when state toggles between live/auto/assist, then topbar badges update within one render and announce via aria-live. | `npm run lint`; `npm run test -- -t "E1-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E1-S2 |
| E1-S4 — Shell command palette entry points | Given focus is anywhere in shell, when user presses Ctrl/Cmd+K, then command palette opens and first actionable item is focused. | `npm run lint`; `npm run test -- -t "E1-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E1-S3 |
| E1-S5 — Persisted shell panel visibility preferences | Given user hides a panel, when app reloads, then prior visibility and region sizes are restored from persisted preferences. | `npm run lint`; `npm run test -- -t "E1-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E1-S4 |
| E1-S6 — Shell loading and empty states | Given no tracks are loaded, when app initializes, then shell shows actionable empty states for deck load and library navigation. | `npm run lint`; `npm run test -- -t "E1-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E1-S5 |
| E2-S1 — Dual deck transport controls (play/cue/sync) | Given tracks are loaded, when operator presses play/cue/sync, then deck state changes are reflected in UI and audio engine within 100 ms. | `npm run lint`; `npm run test -- -t "E2-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E2-S2 — Pitch fader and tempo range controls | Given a deck is active, when tempo slider moves, then BPM display and playback rate update consistently with selected tempo range. | `npm run lint`; `npm run test -- -t "E2-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E2-S1 |
| E2-S3 — Mixer channel strip (gain, EQ, filter) | Given deck A and B feed mixer, when user adjusts gain/EQ/filter, then channel output and knob state stay synchronized. | `npm run lint`; `npm run test -- -t "E2-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E2-S2 |
| E2-S4 — Crossfader curves and assignment switches | Given channels are assigned L/R/THRU, when crossfader moves, then output mix follows selected curve without signal drops. | `npm run lint`; `npm run test -- -t "E2-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E2-S3 |
| E2-S5 — Headphone cue and master preview routing | Given cue buttons are toggled, when operator monitors headphones, then cue source and master blend match UI state. | `npm run lint`; `npm run test -- -t "E2-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E2-S4 |
| E2-S6 — Gain reduction and clip warnings in mixer UI | Given channel/master approaches 0 dB, when levels clip, then warning indicators show and recover with hysteresis to prevent flicker. | `npm run lint`; `npm run test -- -t "E2-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E2-S5 |
| E3-S1 — Deck waveform render lanes with beat markers | Given analyzed track metadata is available, when waveform draws, then beat grid and phrase markers align with playback head. | `npm run lint`; `npm run test -- -t "E3-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E3-S2 — Needle/playhead and hot cue marker overlays | Given active playback, when position updates, then playhead and cue markers animate smoothly and remain frame-accurate. | `npm run lint`; `npm run test -- -t "E3-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E3-S1 |
| E3-S3 — Phrase and key/BPM telemetry chips | Given a track is loaded, when metadata is resolved, then key/BPM/phrase chips appear with fallback states for unknown values. | `npm run lint`; `npm run test -- -t "E3-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E3-S2 |
| E3-S4 — Beat jump and loop telemetry counters | Given loop/beat jump controls are used, when value changes, then loop size and jump counters update and stay in sync with engine timeline. | `npm run lint`; `npm run test -- -t "E3-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E3-S3 |
| E3-S5 — Live waveform zoom and detail scaling | Given waveform is visible, when user zooms via UI or keyboard shortcut, then lane detail scale changes without dropping playhead continuity. | `npm run lint`; `npm run test -- -t "E3-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E3-S4 |
| E3-S6 — Telemetry error and stale-data fallback UI | Given analyzer/telemetry feed errors, when data is stale beyond timeout, then UI shows stale badge and degrades gracefully. | `npm run lint`; `npm run test -- -t "E3-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E3-S5 |
| E4-S1 — Library pane with crates/playlists tree | Given library data loads, when user navigates tree nodes, then crates and playlists expand/collapse with persisted selection. | `npm run lint`; `npm run test -- -t "E4-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E4-S2 — Search/filter with instant result ranking | Given a populated library, when operator types search terms, then result list updates in under 150 ms with highlighted matches. | `npm run lint`; `npm run test -- -t "E4-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E4-S1 |
| E4-S3 — Queue list with drag reorder and lock states | Given queue has tracks, when user drags to reorder, then order persists and locked items cannot be moved. | `npm run lint`; `npm run test -- -t "E4-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E4-S2 |
| E4-S4 — Deck load interactions from browser rows | Given user selects a track row, when they trigger load-to-deck action, then selected track appears on target deck and metadata updates. | `npm run lint`; `npm run test -- -t "E4-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E4-S3 |
| E4-S5 — Cloud/library source status badges | Given external sources have sync states, when connectivity changes, then each source row shows healthy/degraded/offline badge. | `npm run lint`; `npm run test -- -t "E4-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E4-S4 |
| E4-S6 — Queue handoff to automation scheduler | Given queue item is marked auto-eligible, when handoff runs, then timeline receives item with deterministic start window and conflict flags. | `npm run lint`; `npm run test -- -t "E4-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E4-S5 |
| E5-S1 — Sampler bank grid with trigger modes | Given sampler banks are loaded, when pad is triggered, then one-shot or hold mode behavior follows configured sample slot mode. | `npm run lint`; `npm run test -- -t "E5-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E5-S2 — Performance pads for hot cue/roll/slicer | Given pad mode is selected, when operator taps pads, then assigned function executes with visible active state and quantization indicator. | `npm run lint`; `npm run test -- -t "E5-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E5-S1 |
| E5-S3 — FX unit routing per channel/master | Given FX unit is enabled, when routing toggles change, then selected channels receive effect processing and dry/wet reflects UI. | `npm run lint`; `npm run test -- -t "E5-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E5-S2 |
| E5-S4 — Macro FX presets and safe reset | Given macro preset is applied, when reset is pressed, then all dependent parameters return to neutral values without audio pops. | `npm run lint`; `npm run test -- -t "E5-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E5-S3 |
| E5-S5 — Pad page paging and bank color identity | Given multiple pad pages exist, when user changes page, then pad labels/colors update and current page is clearly announced. | `npm run lint`; `npm run test -- -t "E5-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E5-S4 |
| E5-S6 — Sampler recording and slot overwrite safeguards | Given record arm is active, when operator attempts overwrite on populated slot, then confirmation guard appears before replacing sample. | `npm run lint`; `npm run test -- -t "E5-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E5-S5 |
| E6-S1 — Timeline lane scaffolding with now marker | Given scheduler view opens, when current time advances, then now marker tracks timeline and remains visible during scroll. | `npm run lint`; `npm run test -- -t "E6-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E6-S2 — Event blocks with confidence and lock badges | Given events contain scoring metadata, when rendered, then confidence and lock badges are visible with tooltip explanations. | `npm run lint`; `npm run test -- -t "E6-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E6-S1 |
| E6-S3 — Status/health rail (audio, network, AI, queue depth) | Given health probes update, when a subsystem degrades, then rail status changes severity and links operator to next action. | `npm run lint`; `npm run test -- -t "E6-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E6-S2 |
| E6-S4 — Automation override and manual takeover controls | Given automation is active, when operator selects manual takeover, then pending auto actions pause and takeover state is explicit. | `npm run lint`; `npm run test -- -t "E6-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E6-S3 |
| E6-S5 — Alert center with actionable remediation copy | Given an alert is raised, when operator opens alert center, then each alert includes impact, severity, and remediation CTA. | `npm run lint`; `npm run test -- -t "E6-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E6-S4 |
| E6-S6 — Timeline conflict detection and resolution hints | Given overlapping events exist, when timeline computes conflicts, then affected blocks are marked with reason code and fix hint. | `npm run lint`; `npm run test -- -t "E6-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E6-S5 |
| E7-S1 — Global keyboard map for all primary console actions | Given operator is keyboard-only, when shortcut map is used, then all primary load/play/cue/mix/queue actions are reachable. | `npm run lint`; `npm run test -- -t "E7-S1"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | None (epic entry point) |
| E7-S2 — Reduced-motion alternatives for animated controls | Given OS reduced-motion preference is enabled, when UI animates, then non-essential animation is disabled and state changes remain clear. | `npm run lint`; `npm run test -- -t "E7-S2"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E7-S1 |
| E7-S3 — Contrast audit pass for status, waveform, pads, and alerts | Given critical UI states, when contrast is measured, then text/icons/controls meet WCAG AA thresholds. | `npm run lint`; `npm run test -- -t "E7-S3"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E7-S2 |
| E7-S4 — Focus management and visible focus ring consistency | Given keyboard navigation, when focus moves between modules, then visible focus indicator remains consistent and never trapped. | `npm run lint`; `npm run test -- -t "E7-S4"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E7-S3 |
| E7-S5 — Performance budgets for waveform/mixer/browser interactions | Given production-like data volume, when user performs frequent interactions, then UI keeps 55+ FPS and avoids long tasks >50 ms. | `npm run lint`; `npm run test -- -t "E7-S5"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E7-S4 |
| E7-S6 — Regression snapshot matrix and release checklist | Given a UI change lands, when CI runs snapshot jobs, then baseline diff is reviewed and approved before merge. | `npm run lint`; `npm run test -- -t "E7-S6"`; `npm run build` | Revert story PR commit(s); keep previous stable UI/API behavior via existing feature path. | E7-S5 |

## Verification checklist for planning artifact
- [x] Approved epics/stories only (no TODO.md or unapproved backlog injection).
- [x] Acceptance criteria included per story.
- [x] Validation commands attached per story.
- [x] Rollback/fallback note attached per story.
- [x] Dependency predecessor attached per story.
- [x] Scope freeze + change-control path documented.
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
