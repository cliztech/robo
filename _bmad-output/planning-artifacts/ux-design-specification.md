---
stepsCompleted: [1,2,3,4,5]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-dgn-dj-2026-02-18.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/gui-console-epics-stories.md
---

# UX Design Specification DGN-DJ

**Author:** CLIZTECH  
**Date:** 2026-02-24

---

## 1. Approach Summary
Build a production-grade desktop DJ console UX for DGN-DJ that feels familiar to Rekordbox 7 users while optimized for radio automation workflows. The design targets 1440p/4K operators, minimizes cognitive load under live conditions, and preserves deterministic controls for scheduling and playout.

## 2. Assumptions
- Primary runtime is a Windows desktop operator station.
- Core personas: live operator, producer, and supervisor.
- Users are already familiar with dual-deck DJ metaphors and phrase/beat-centric browsing.
- Existing backend can expose low-latency status events for deck state, queue state, and scheduler conflicts.

## 3. Product Direction (UI/UX Team Output)
### 3.1 Design goals
1. **Familiarity:** Rekordbox-inspired visual hierarchy (library + decks + transport + performance pads).
2. **Operational safety:** hard confirmations for destructive actions and clear “on-air” indicators.
3. **High information density:** configurable panes for 2560×1440 and 3840×2160 without clutter.
4. **Low-latency interaction:** keyboard-first with optional pointer workflows.

### 3.2 Non-goals
- No direct imitation of proprietary layouts or branding assets.
- No mobile-first compromises in the main console viewport.

## 4. Information Architecture
### 4.1 Primary layout regions
- **Top status rail (persistent):** station clock, on-air state, latency budget, active automation mode, incident banner.
- **Center performance canvas (primary):** dual virtual decks + stacked waveforms + crossfader + transport controls.
- **Left library/nav:** source selectors (crates, playlists, tags, recent, AI suggestions).
- **Bottom queue/timeline:** upcoming cuts, jingles, ad markers, conflict warnings.
- **Right inspector panel:** selected track metadata, cue memory, content safety flags, AI-generated notes.

### 4.2 Resolution profiles
- **HD+ profile:** 1920×1080 min-supported (collapsed side inspector, two-row pads).
- **QHD profile:** 2560×1440 default (full deck telemetry, 8 performance pads, expanded browser).
- **UHD profile:** 3840×2160 pro mode (simultaneous dual waveform zoom, scheduler lane, larger metadata table).

## 5. Visual Language (Rekordbox-inspired, DGN-DJ branded)
### 5.1 Core style tokens
- **Background:** graphite-neutral with layered elevation steps.
- **Accent states:**
  - Cyan for active deck focus
  - Amber for pending/queued transitions
  - Red for on-air risk/conflict
  - Green for healthy sync/lock
- **Typography:** high-legibility sans, tabular numerals for timers/BPM.
- **Component shape:** low-radius controls with high-contrast focus ring.

### 5.2 Deck visuals
- Dual horizontal waveforms with phrase coloration and beat-grid markers.
- Clear cue point chips (A–H), memory loops, and loop in/out overlays.
- Deck state chips: `Loaded`, `Ready`, `Playing`, `Locked`, `On Air`.

## 6. Interaction Model
### 6.1 Primary workflows
1. **Load & prelisten**
   - Search in library -> preview -> load to deck A/B -> set cue/loop -> commit to queue.
2. **Live transition**
   - Trigger prepared deck -> crossfade/auto-mix -> monitor gain and limiter -> lock transition.
3. **Automation override**
   - Operator takes manual control -> system freezes auto substitutions -> supervisor confirmation for return-to-auto.

### 6.2 Keyboard map (first-class)
- `Space`: play/pause focused deck
- `Tab`: switch deck focus A/B
- `Q/W`: cue set / cue jump
- `1..8`: trigger performance pads
- `Ctrl+F`: global library search
- `Ctrl+Shift+A`: toggle automation/manual mode

### 6.3 Error prevention
- Two-step commit for deleting queue items on active hour.
- Inline diff warning when replacing a scheduled ad/ID element.
- “On-air protected” lock to avoid accidental deck unload.

## 7. Component Spec
### 7.1 High-priority components
- `DeckSurface`
- `WaveformStrip`
- `TransportCluster`
- `PerformancePadGrid`
- `LibraryTable`
- `QueueTimeline`
- `OnAirStatusBar`
- `ConflictBanner`

### 7.2 State requirements
Each component must support: `idle`, `focused`, `armed`, `active`, `warning`, `error`, `disabled`.

## 8. Performance and Responsiveness
- Deck input-to-UI feedback target: **<16ms** for local control echoes.
- Waveform scroll/render budget: **60 FPS target**, degrade gracefully to 30 FPS under load.
- Queue conflict check response target: **<=200ms p95**.
- Use virtualization for library tables >20k tracks.

## 9. Accessibility and Reliability
- Full keyboard navigation for all interactive controls.
- WCAG-aligned contrast for dark UI tokens.
- Reduced motion mode: disable waveform easing and animated transitions.
- Large text mode: +20% font and control sizing while preserving deck alignment.

## 10. Trade-offs
- **Dense UI vs onboarding simplicity:** optimized for expert operators; mitigate via layout presets.
- **High-fidelity waveform rendering vs CPU budget:** adaptive quality settings required.
- **Automation safety interlocks vs speed:** deliberate confirmation steps can add friction but reduce on-air incidents.

## 11. Delivery Plan
### Phase 1 (foundation)
- Implement shell layout + design tokens + status rail + library skeleton.

### Phase 2 (core mixing)
- Add dual decks, transport, waveform rendering, and cue/loop interactions.

### Phase 3 (radio automation integration)
- Integrate queue timeline, scheduler conflict banners, automation override controls.

### Phase 4 (polish)
- Accessibility presets, 4K refinement, performance profiling, UX validation.

## 12. Acceptance Criteria
- Operator can execute full load->mix->handoff without pointer use.
- On-air risk states are visually obvious and logged.
- QHD and UHD layouts pass usability review with no critical friction.
- Interaction latency and queue conflict targets are met in staging.
