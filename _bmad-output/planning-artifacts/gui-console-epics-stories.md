# GUI Console Backlog: Epics and Stories

## Sprint slicing suggestions

- **Sprint 1 (foundational shell):** E1 stories 1-6 + E6 story 1.
- **Sprint 2 (controls):** E2 stories 1-6 + E5 stories 1-2.
- **Sprint 3 (waveforms/browser):** E3 stories 1-6 + E4 stories 1-6.
- **Sprint 4 (hardening):** E6 stories 2-6 + E7 stories 1-6 + defect burn-down.

---

## E1 — Theme tokens + shell scaffolding

### E1-S1 Theme token contract for console surfaces
- **Targets:** `src/styles/globals.css`, `src/components/primitives/primitives.css`, `src/app/layout.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given the app shell loads, when console UI mounts, then all shell surfaces consume shared semantic tokens for bg/fg/border/accent.
- **Risk notes:** token naming drift can create duplicate color systems.
- **Test expectations:** visual token smoke in `tests/ui`; CSS variable presence check.
- **Reference source:** [`images/ProMarked.png`](images/ProMarked.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E1-S2 Responsive shell grid and docking regions
- **Targets:** `src/components/shell/workspace.tsx`, `src/components/shell/sidebar.tsx`, `src/components/shell/topbar.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given desktop and narrow widths, when viewport changes, then deck/mixer/browser/queue zones preserve readable hierarchy with no overlap.
- **Risk notes:** layout thrash during resize can hurt performance.
- **Test expectations:** responsive snapshot set for 1280/1024/768 widths.
- **Reference source:** [`images/05_Performance.jpg`](images/05_Performance.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E1-S3 Top navigation status strip with clock and mode badges
- **Targets:** `src/components/shell/topbar.tsx`, `src/components/shell/address-bar.tsx`, `src/components/shell/tab-strip.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given operator mode changes, when state toggles between live/auto/assist, then topbar badges update within one render and announce via aria-live.
- **Risk notes:** badge state may desync from engine state if props are stale.
- **Test expectations:** component unit test for badge rendering + ARIA label assertions.
- **Reference source:** [`images/keyfeatures2.png`](images/keyfeatures2.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E1-S4 Shell command palette entry points
- **Targets:** `src/components/shell/topbar.tsx`, `src/components/primitives/input.tsx`, `src/hooks/useKeyboardShortcuts.ts` (new)
- **Acceptance criteria (Given/When/Then):**
  - Given focus is anywhere in shell, when user presses Ctrl/Cmd+K, then command palette opens and first actionable item is focused.
- **Risk notes:** shortcut collisions with browser defaults.
- **Test expectations:** keyboard integration test for open/close/focus trap.
- **Reference source:** [`images/sandbox.png`](images/sandbox.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E1-S5 Persisted shell panel visibility preferences
- **Targets:** `src/components/shell/workspace.tsx`, `src/lib/utils.ts`, `src/app/page.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given user hides a panel, when app reloads, then prior visibility and region sizes are restored from persisted preferences.
- **Risk notes:** corrupted local storage payloads can break first render.
- **Test expectations:** restore/fallback unit tests for malformed preference payload.
- **Reference source:** [`images/skins.png`](images/skins.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E1-S6 Shell loading and empty states
- **Targets:** `src/app/page.tsx`, `src/components/shell/workspace.tsx`, `src/components/primitives/DegenButton.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given no tracks are loaded, when app initializes, then shell shows actionable empty states for deck load and library navigation.
- **Risk notes:** unclear empty states may increase first-use friction.
- **Test expectations:** snapshot coverage for loading + empty + ready shell variants.
- **Reference source:** [`images/StarterMarked.png`](images/StarterMarked.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E2 — Deck + mixer core controls

### E2-S1 Dual deck transport controls (play/cue/sync)
- **Targets:** `src/components/audio/DegenTransport.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given tracks are loaded, when operator presses play/cue/sync, then deck state changes are reflected in UI and audio engine within 100 ms.
- **Risk notes:** event ordering bugs can cause false transport state.
- **Test expectations:** transport action tests with mocked engine callbacks.
- **Reference source:** [`images/04_Pro_4decks.jpg`](images/04_Pro_4decks.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E2-S2 Pitch fader and tempo range controls
- **Targets:** `src/components/audio/DegenKnob.tsx`, `src/components/audio/DegenTransport.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given a deck is active, when tempo slider moves, then BPM display and playback rate update consistently with selected tempo range.
- **Risk notes:** floating-point drift can produce BPM mismatch.
- **Test expectations:** precision tests for ±6/10/16 tempo ranges.
- **Reference source:** [`images/05_Performance.jpg`](images/05_Performance.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E2-S3 Mixer channel strip (gain, EQ, filter)
- **Targets:** `src/components/audio/DegenMixer.tsx`, `src/components/audio/DegenKnob.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given deck A and B feed mixer, when user adjusts gain/EQ/filter, then channel output and knob state stay synchronized.
- **Risk notes:** gain staging errors can clip master bus.
- **Test expectations:** unit tests for knob bounds + mixer value propagation.
- **Reference source:** [`images/MixerMain.png`](images/MixerMain.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E2-S4 Crossfader curves and assignment switches
- **Targets:** `src/components/audio/DegenMixer.tsx`, `src/lib/audio/engine.ts`, `src/lib/audio/analyzer.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given channels are assigned L/R/THRU, when crossfader moves, then output mix follows selected curve without signal drops.
- **Risk notes:** assignment matrix bugs can mute active deck.
- **Test expectations:** matrix tests for L/R/THRU routing combinations.
- **Reference source:** [`images/06_PerformanceFX.jpg`](images/06_PerformanceFX.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E2-S5 Headphone cue and master preview routing
- **Targets:** `src/components/audio/DegenMixer.tsx`, `src/components/audio/DegenVUMeter.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given cue buttons are toggled, when operator monitors headphones, then cue source and master blend match UI state.
- **Risk notes:** platform audio output routing inconsistencies.
- **Test expectations:** engine routing tests with mocked output buses.
- **Reference source:** [`images/soundengine.png`](images/soundengine.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E2-S6 Gain reduction and clip warnings in mixer UI
- **Targets:** `src/components/audio/DegenVUMeter.tsx`, `src/components/audio/DegenMixer.tsx`, `src/styles/globals.css`
- **Acceptance criteria (Given/When/Then):**
  - Given channel/master approaches 0 dB, when levels clip, then warning indicators show and recover with hysteresis to prevent flicker.
- **Risk notes:** over-sensitive thresholds create alert fatigue.
- **Test expectations:** threshold tests for warning entry/exit behavior.
- **Reference source:** [`images/06_PerformanceFX (1).jpg`](images/06_PerformanceFX%20(1).jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E3 — Waveform and transport telemetry

### E3-S1 Deck waveform render lanes with beat markers
- **Targets:** `src/components/audio/DegenWaveform.tsx`, `src/components/audio/DegenBeatGrid.tsx`, `src/lib/audio/analyzer.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given analyzed track metadata is available, when waveform draws, then beat grid and phrase markers align with playback head.
- **Risk notes:** analyzer latency can desync markers.
- **Test expectations:** rendering tests with fixed waveform fixture payload.
- **Reference source:** [`images/07_Vertical_waveforms.jpg`](images/07_Vertical_waveforms.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E3-S2 Needle/playhead and hot cue marker overlays
- **Targets:** `src/components/audio/DegenWaveform.tsx`, `src/components/audio/DegenTransport.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given active playback, when position updates, then playhead and cue markers animate smoothly and remain frame-accurate.
- **Risk notes:** expensive animation can reduce FPS.
- **Test expectations:** animation timing test under throttled CPU profile.
- **Reference source:** [`images/remote.png`](images/remote.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E3-S3 Phrase and key/BPM telemetry chips
- **Targets:** `src/components/audio/DegenTransport.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/components/primitives/tooltip.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given a track is loaded, when metadata is resolved, then key/BPM/phrase chips appear with fallback states for unknown values.
- **Risk notes:** missing metadata paths can cause null UI labels.
- **Test expectations:** unit tests for metadata fallback rendering.
- **Reference source:** [`images/link.png`](images/link.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E3-S4 Beat jump and loop telemetry counters
- **Targets:** `src/components/audio/DegenTransport.tsx`, `src/lib/audio/engine.ts`, `src/components/audio/DegenBeatGrid.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given loop/beat jump controls are used, when value changes, then loop size and jump counters update and stay in sync with engine timeline.
- **Risk notes:** off-by-one beat math can drift loop boundaries.
- **Test expectations:** deterministic beat-math tests for 1/2/4/8/16 beats.
- **Reference source:** [`images/05_Performance.jpg`](images/05_Performance.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E3-S5 Live waveform zoom and detail scaling
- **Targets:** `src/components/audio/DegenWaveform.tsx`, `src/components/primitives/icon-button.tsx`, `src/hooks/useKeyboardShortcuts.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given waveform is visible, when user zooms via UI or keyboard shortcut, then lane detail scale changes without dropping playhead continuity.
- **Risk notes:** redraw pressure may spike CPU.
- **Test expectations:** performance check for sustained zoom interactions.
- **Reference source:** [`images/08_video_mix.jpg`](images/08_video_mix.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E3-S6 Telemetry error and stale-data fallback UI
- **Targets:** `src/components/audio/DegenWaveform.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/app/page.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given analyzer/telemetry feed errors, when data is stale beyond timeout, then UI shows stale badge and degrades gracefully.
- **Risk notes:** silent telemetry failures hide operator risk.
- **Test expectations:** timeout and stale-state tests with mocked clock.
- **Reference source:** [`images/geniousdj.png`](images/geniousdj.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E4 — Browser/library and queue workflows

### E4-S1 Library pane with crates/playlists tree
- **Targets:** `src/components/audio/DegenTrackList.tsx`, `src/components/shell/sidebar.tsx`, `src/lib/utils.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given library data loads, when user navigates tree nodes, then crates and playlists expand/collapse with persisted selection.
- **Risk notes:** deep tree rendering can degrade responsiveness.
- **Test expectations:** tree navigation tests with keyboard and pointer input.
- **Reference source:** [`images/library.png`](images/library.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E4-S2 Search/filter with instant result ranking
- **Targets:** `src/components/audio/DegenTrackList.tsx`, `src/components/primitives/input.tsx`, `src/lib/utils.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given a populated library, when operator types search terms, then result list updates in under 150 ms with highlighted matches.
- **Risk notes:** broad filtering may block main thread.
- **Test expectations:** benchmark-style test for filter latency on large fixture set.
- **Reference source:** [`images/playlists.png`](images/playlists.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E4-S3 Queue list with drag reorder and lock states
- **Targets:** `src/components/audio/DegenTrackList.tsx`, `src/components/schedule/DegenScheduleTimeline.tsx`, `src/app/page.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given queue has tracks, when user drags to reorder, then order persists and locked items cannot be moved.
- **Risk notes:** drag-and-drop edge cases on touch/trackpad.
- **Test expectations:** reorder tests including locked item constraints.
- **Reference source:** [`images/tracklists.png`](images/tracklists.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E4-S4 Deck load interactions from browser rows
- **Targets:** `src/components/audio/DegenTrackList.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given user selects a track row, when they trigger load-to-deck action, then selected track appears on target deck and metadata updates.
- **Risk notes:** accidental load could interrupt live deck.
- **Test expectations:** confirmation flow tests for replacing active deck track.
- **Reference source:** [`images/EssentialsMarked.png`](images/EssentialsMarked.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E4-S5 Cloud/library source status badges
- **Targets:** `src/components/audio/DegenTrackList.tsx`, `src/components/shell/topbar.tsx`, `src/styles/globals.css`
- **Acceptance criteria (Given/When/Then):**
  - Given external sources have sync states, when connectivity changes, then each source row shows healthy/degraded/offline badge.
- **Risk notes:** stale status cache can mislead operators.
- **Test expectations:** status mapping unit tests for all source states.
- **Reference source:** [`images/clouddrive.png`](images/clouddrive.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E4-S6 Queue handoff to automation scheduler
- **Targets:** `src/components/schedule/DegenScheduleTimeline.tsx`, `src/app/page.tsx`, `backend/scheduling` modules (integration contract only)
- **Acceptance criteria (Given/When/Then):**
  - Given queue item is marked auto-eligible, when handoff runs, then timeline receives item with deterministic start window and conflict flags.
- **Risk notes:** contract drift between UI payload and scheduler schema.
- **Test expectations:** contract tests for queue-to-scheduler payload schema.
- **Reference source:** [`images/automix.png`](images/automix.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E5 — Sampler/FX/pads modules

### E5-S1 Sampler bank grid with trigger modes
- **Targets:** `src/components/audio/DegenEffectRack.tsx`, `src/components/primitives/button.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given sampler banks are loaded, when pad is triggered, then one-shot or hold mode behavior follows configured sample slot mode.
- **Risk notes:** rapid triggering can cause voice stealing artifacts.
- **Test expectations:** sampler mode tests for one-shot/loop/hold.
- **Reference source:** [`images/sampler.png`](images/sampler.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E5-S2 Performance pads for hot cue/roll/slicer
- **Targets:** `src/components/audio/DegenTransport.tsx`, `src/components/audio/DegenEffectRack.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given pad mode is selected, when operator taps pads, then assigned function executes with visible active state and quantization indicator.
- **Risk notes:** mode confusion can trigger wrong action live.
- **Test expectations:** mode-switch and pad-action tests with cue quantization fixtures.
- **Reference source:** [`images/pads.png`](images/pads.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E5-S3 FX unit routing per channel/master
- **Targets:** `src/components/audio/DegenEffectRack.tsx`, `src/components/audio/DegenMixer.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given FX unit is enabled, when routing toggles change, then selected channels receive effect processing and dry/wet reflects UI.
- **Risk notes:** routing race conditions can bypass intended channel.
- **Test expectations:** routing matrix tests channel A/B/master.
- **Reference source:** [`images/effects.png`](images/effects.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E5-S4 Macro FX presets and safe reset
- **Targets:** `src/components/audio/DegenEffectRack.tsx`, `src/components/primitives/DegenButton.tsx`, `src/lib/utils.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given macro preset is applied, when reset is pressed, then all dependent parameters return to neutral values without audio pops.
- **Risk notes:** incomplete reset leaves hidden parameter residue.
- **Test expectations:** preset apply/reset snapshot + value baseline tests.
- **Reference source:** [`images/06_PerformanceFX.jpg`](images/06_PerformanceFX.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E5-S5 Pad page paging and bank color identity
- **Targets:** `src/components/audio/DegenEffectRack.tsx`, `src/styles/globals.css`, `src/components/primitives/primitives.css`
- **Acceptance criteria (Given/When/Then):**
  - Given multiple pad pages exist, when user changes page, then pad labels/colors update and current page is clearly announced.
- **Risk notes:** color-only cues can fail accessibility.
- **Test expectations:** accessibility test verifying non-color page indicator.
- **Reference source:** [`images/scratchdna.png`](images/scratchdna.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E5-S6 Sampler recording and slot overwrite safeguards
- **Targets:** `src/components/audio/DegenEffectRack.tsx`, `src/components/audio/AudioPlayer.tsx`, `src/lib/audio/engine.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given record arm is active, when operator attempts overwrite on populated slot, then confirmation guard appears before replacing sample.
- **Risk notes:** accidental overwrite destroys live stingers.
- **Test expectations:** confirmation dialog tests for overwrite allow/cancel paths.
- **Reference source:** [`images/record.png`](images/record.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E6 — Automation timeline + status/health

### E6-S1 Timeline lane scaffolding with now marker
- **Targets:** `src/components/schedule/DegenScheduleTimeline.tsx`, `src/app/page.tsx`, `src/styles/globals.css`
- **Acceptance criteria (Given/When/Then):**
  - Given scheduler view opens, when current time advances, then now marker tracks timeline and remains visible during scroll.
- **Risk notes:** time-zone conversion errors can misplace now marker.
- **Test expectations:** deterministic clock tests for marker position.
- **Reference source:** [`images/broadcast.png`](images/broadcast.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E6-S2 Event blocks with confidence and lock badges
- **Targets:** `src/components/schedule/DegenScheduleTimeline.tsx`, `src/components/primitives/tooltip.tsx`, `src/lib/utils.ts`
- **Acceptance criteria (Given/When/Then):**
  - Given events contain scoring metadata, when rendered, then confidence and lock badges are visible with tooltip explanations.
- **Risk notes:** badge overload may obscure timeline density.
- **Test expectations:** render tests for low/medium/high confidence badges.
- **Reference source:** [`images/askthedj.png`](images/askthedj.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E6-S3 Status/health rail (audio, network, AI, queue depth)
- **Targets:** `src/components/shell/topbar.tsx`, `src/components/ai/DegenAIHost.tsx`, `src/app/page.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given health probes update, when a subsystem degrades, then rail status changes severity and links operator to next action.
- **Risk notes:** noisy probes can trigger false positives.
- **Test expectations:** health mapping tests for green/yellow/red states.
- **Reference source:** [`images/videobroadcast.png`](images/videobroadcast.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E6-S4 Automation override and manual takeover controls
- **Targets:** `src/components/shell/topbar.tsx`, `src/components/audio/DegenTransport.tsx`, `src/components/schedule/DegenScheduleTimeline.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given automation is active, when operator selects manual takeover, then pending auto actions pause and takeover state is explicit.
- **Risk notes:** takeover race could dispatch stale automation action.
- **Test expectations:** integration tests for pause/resume/takeover state machine.
- **Reference source:** [`images/automix.png`](images/automix.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E6-S5 Alert center with actionable remediation copy
- **Targets:** `src/components/ai/DegenAIHost.tsx`, `src/components/primitives/tooltip.tsx`, `src/components/shell/sidebar.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given an alert is raised, when operator opens alert center, then each alert includes impact, severity, and remediation CTA.
- **Risk notes:** vague alert copy slows operator recovery.
- **Test expectations:** content tests for mandatory alert fields.
- **Reference source:** [`images/keyfeatures2.png`](images/keyfeatures2.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E6-S6 Timeline conflict detection and resolution hints
- **Targets:** `src/components/schedule/DegenScheduleTimeline.tsx`, `backend/scheduling`, `config/schedules.json`
- **Acceptance criteria (Given/When/Then):**
  - Given overlapping events exist, when timeline computes conflicts, then affected blocks are marked with reason code and fix hint.
- **Risk notes:** false conflicts can erode trust in automation.
- **Test expectations:** scheduler conflict fixture tests (overlap, lock, blackout).
- **Reference source:** [`images/playlists (1).png`](images/playlists%20(1).png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

---

## E7 — Accessibility, keyboard, and performance hardening

### E7-S1 Global keyboard map for all primary console actions
- **Targets:** `src/hooks/useKeyboardShortcuts.ts`, `src/components/shell/workspace.tsx`, `src/components/audio/DegenTransport.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given operator is keyboard-only, when shortcut map is used, then all primary load/play/cue/mix/queue actions are reachable.
- **Risk notes:** undocumented shortcuts reduce discoverability.
- **Test expectations:** keyboard traversal integration tests across shell regions.
- **Reference source:** [`images/remote.png`](images/remote.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E7-S2 Reduced-motion alternatives for animated controls
- **Targets:** `src/motion`, `src/components/audio/DegenWaveform.tsx`, `src/components/primitives/tooltip.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given OS reduced-motion preference is enabled, when UI animates, then non-essential animation is disabled and state changes remain clear.
- **Risk notes:** removing motion can hide state transitions.
- **Test expectations:** prefers-reduced-motion test suite for key interactions.
- **Reference source:** [`images/08_video_mix_rack.jpg`](images/08_video_mix_rack.jpg)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E7-S3 Contrast audit pass for status, waveform, pads, and alerts
- **Targets:** `src/styles/globals.css`, `src/components/primitives/primitives.css`, `src/components/audio/*`
- **Acceptance criteria (Given/When/Then):**
  - Given critical UI states, when contrast is measured, then text/icons/controls meet WCAG AA thresholds.
- **Risk notes:** dynamic overlays can break contrast in edge states.
- **Test expectations:** automated contrast checks + manual spot audit.
- **Reference source:** [`images/ProMarked.png`](images/ProMarked.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E7-S4 Focus management and visible focus ring consistency
- **Targets:** `src/components/primitives/button.tsx`, `src/components/primitives/input.tsx`, `src/components/shell/sidebar.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given keyboard navigation, when focus moves between modules, then visible focus indicator remains consistent and never trapped.
- **Risk notes:** focus traps in modal/palette interactions.
- **Test expectations:** focus order tests and tab-loop escape assertions.
- **Reference source:** [`images/StarterMarked.png`](images/StarterMarked.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E7-S5 Performance budgets for waveform/mixer/browser interactions
- **Targets:** `src/components/audio/DegenWaveform.tsx`, `src/components/audio/DegenMixer.tsx`, `src/components/audio/DegenTrackList.tsx`
- **Acceptance criteria (Given/When/Then):**
  - Given production-like data volume, when user performs frequent interactions, then UI keeps 55+ FPS and avoids long tasks >50 ms.
- **Risk notes:** coupled renders across modules can exceed budget.
- **Test expectations:** performance profile checks and interaction benchmarks.
- **Reference source:** [`images/Virtual DJ 2026 is Finally HERE! + Download Links.mp4`](images/Virtual%20DJ%202026%20is%20Finally%20HERE!%20+%20Download%20Links.mp4)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated

### E7-S6 Regression snapshot matrix and release checklist
- **Targets:** `tests/ui`, `docs/QUALITY_SCORE.md`, `docs/operations/artifacts.md`
- **Acceptance criteria (Given/When/Then):**
  - Given a UI change lands, when CI runs snapshot jobs, then baseline diff is reviewed and approved before merge.
- **Risk notes:** flaky snapshots may block valid changes.
- **Test expectations:** stable snapshot pipeline for shell/decks/waveforms/browser/automation.
- **Reference source:** [`images/keyfeatures2.png`](images/keyfeatures2.png)
- **DoD checklist:** ☐ keyboard accessible ☐ reduced-motion compliant ☐ contrast validated ☐ regression snapshot updated ☐ docs updated
