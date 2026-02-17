# DJ Console UI/UX Research and Execution Plan

Status: draft  
Audience: product/design/frontend/audio teams  
Goal: reproduce the look-and-feel of the reference DJ images (VirtualDJ-like density and performance) while fitting the DGN-DJ stack and accessibility commitments.


## Progress Summary (2026-02-16)

Canonical status labels (use exactly): **Not Started / In Progress / Blocked / Done**.

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1 — Theme + shell scaffolding | In Progress | Research direction and shell/component targets are documented; implementation is queued. |
| Phase 2 — Interactive controls | Not Started | Waiting on Phase 1 shell baseline and interaction state primitives. |
| Phase 3 — Waveform + audio integration | Not Started | Depends on renderer choice and telemetry contract definition. |
| Phase 4 — Hardening and presets | Not Started | Validation gates are defined but execution has not started. |

### Phase Ownership (Accountable Team/Agent)

| Phase | Accountable team | Accountable agent |
| --- | --- | --- |
| Phase 1 — Theme + shell scaffolding | Design Team | UI/UX Agent |
| Phase 2 — Interactive controls | DevOps Team | Infrastructure Agent |
| Phase 3 — Waveform + audio integration | AI Improvement Team | Model Evaluator Agent |
| Phase 4 — Hardening and presets | QA Team | Regression Watcher Agent |

### Completion Evidence (Checked Items)

| Item | Status | Evidence |
| --- | --- | --- |
| Reference pattern analysis captured | ✅ Done | #1-target-experience-what-the-references-are-doing |
| Quality gates and measurable definition of “perfect” recorded | ✅ Done | #11-quality-gates-perfect--measurable |

### Current Risks/Blockers

- Blocked on confirmed rendering approach (Canvas vs WebGL profile by target hardware tier) before Phase 3 can be staffed.
- Baseline React source paths referenced in this plan may diverge from current repo reality and need reconciliation before execution.

**Next milestone date:** 2026-02-23 (Phase 1 execution handoff with finalized shell backlog)

## Reference Catalog Metadata and Consumption Policy

All reference assets must be cataloged with one of the following tiers.

| Tier | Purpose | Minimum metadata | Example |
| --- | --- | --- | --- |
| Tier A | Full-layout benchmark for shell architecture and primary information hierarchy. | `tier`, `justification`, `resolution`, `source`, `imported_at` | 1920x1080 full-console reference |
| Tier B | Component-level detail references used for control treatment and micro-interactions. | `tier`, `justification`, `component_scope`, `source`, `imported_at` | EQ knob strip, transport cluster close-up |
| Tier C | Marketing/ancillary inspiration only; not authoritative for architecture or control fidelity. | `tier`, `justification`, `usage_notes`, `source`, `imported_at` | Promo renders, hero shots, social screenshots |

### Per-tier consumption rules

- Tier A:
  - Allowed for shell architecture decisions (deck/mixer/browser zoning, module placement, density targets).
  - Allowed for cross-panel spacing rhythm and baseline scan-path assumptions.
  - Not allowed for direct branding/icon/logo reuse.
- Tier B:
  - Allowed for control styling only (button states, fader tracks, meter framing, waveform annotation details).
  - Allowed for interaction details that do not conflict with accessibility and keyboard requirements.
  - Not allowed to override Tier A layout structure.
- Tier C:
  - Allowed for mood, storytelling, and non-functional visual inspiration.
  - Not allowed for shell architecture or critical control behavior decisions.
  - Must always be treated as optional and subordinate to Tier A and Tier B evidence.

### Minimum readable detail threshold (required before import)

Every candidate reference must pass this checklist before entering the catalog:

- [ ] Text legibility: key labels are readable at 100% zoom without inference.
- [ ] Control separation: individual controls are visually separable (no merged silhouettes for adjacent controls).
- [ ] Waveform visibility: waveform lanes, playhead, and beat/cue cues are distinguishable.
- [ ] Contrast sanity: control foreground/background boundaries are clear enough to extract intent.
- [ ] Cropping integrity: the captured region preserves context needed for interpretation.

### New asset intake requirement

Any new reference asset is non-compliant unless it includes both:

1. Explicit tier assignment (`Tier A`, `Tier B`, or `Tier C`), and
2. A short justification describing why that tier is appropriate and what decisions it may influence.

## 1. Target Experience (What the references are doing)

The references consistently use these patterns:

1. Dark graphite control surface with low-gloss panels.
2. Strong dual-deck symmetry around a centered mixer.
3. High-information density (many controls visible at once) with strict grouping.
4. Continuous waveform strips at top (deck A/B color separation).
5. Fast scanability through color coding:
   - blue/cyan for deck A
   - red/magenta for deck B
   - amber/green for utility/status
6. Flat rectangular controls, thin borders, and subtle glow accents.
7. Table-heavy media browser with left tree navigation and right details.
8. Module-based UI (FX, pads, stems, sampler, browser, sideview) that can expand/collapse.

Key interaction impression from references:

- Transport and tempo controls are always one glance away.
- Waveform and cue markers communicate beat structure instantly.
- Controls prioritize function over decoration.
- Motion is minimal; perceived speed comes from immediate response.

## 2. Do Not Copy vs What to Emulate

Emulate:

- Spatial model (dual deck + mixer + browser).
- Visual rhythm (dense rows, dark surfaces, color-coded accents).
- Interaction model (single-click execution, keyboard shortcuts, low-latency updates).

Do not copy:

- Vendor logos, trademarks, brand names, exact icon sets.
- Pixel-identical panel skins.
- Proprietary layout presets by name.

Use original branding: **DGN-DJ by DGNradio**.

## 3. Gap Analysis vs Current Repo UI

Current baseline in `src/` is an early scaffold:

- `src/components/shell/*.tsx` are placeholder wrappers.
- `src/components/audio/AudioPlayer.tsx` is functional but generic.
- `src/styles/tokens.css` includes a basic dark/light token layer.
- `src/components/primitives/primitives.css` uses soft rounded controls unlike DJ hardware UI.

Conclusion: this is a foundation-build task, not a polish task.

## 4. Visual System Specification (DJ Theme)

## 4.1 Color roles

Add deck-specific semantic accents on top of existing tokens:

- `--color-deck-a`: cyan/blue emphasis for left deck.
- `--color-deck-b`: red/pink emphasis for right deck.
- `--color-grid-major`: beat/grid guides.
- `--color-grid-minor`: sub-beat guides.
- `--color-wave-a`: waveform fill/line for deck A.
- `--color-wave-b`: waveform fill/line for deck B.

Keep accessibility profiles from `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` active.

## 4.2 Typography

Use two families:

- UI labels/body: compact geometric sans (example: `Barlow`, `Rajdhani`, `Sora`).
- Numeric telemetry (BPM, key, timer): mono/tech style (example: `JetBrains Mono`, `IBM Plex Mono`).

Rules:

- Uppercase for module titles and transport labels.
- Tabular numerals for BPM/time to prevent jitter.
- Tight spacing, but minimum 12px equivalent for dense controls.

## 4.3 Component shape and depth

- Reduce roundness (`--radius-sm` dominant, `--radius-md` limited).
- Replace soft card shadows with subtle inset/edge contrast.
- Use 1px internal separators extensively.
- Reserve glow for active deck cues and critical status only.

## 5. Layout Architecture

Use a modular shell with fixed regions:

1. Top rail:
   - global waveform overview
   - session CPU/audio meters
   - profile/layout selector
2. Deck row:
   - deck A panel
   - center mixer panel
   - deck B panel
3. Browser row:
   - left source tree
   - main track table
   - optional side panel (sidelist/history)
4. Optional utility docks:
   - pads/sampler/fx panes
   - diagnostics/recording/broadcast status

Desktop first:

- 1280x720 minimum operational layout.
- 1920x1080 target for full module density.

Responsive strategy:

- `Pro` mode: all panels visible.
- `Performance` mode: larger waveforms, reduced browser height.
- `Essential` mode: fewer secondary controls, larger touch targets.

## 6. Component Build Plan (Mapped to `src/`)

Create dedicated shell components:

- `src/components/shell/app-shell.tsx`
- `src/components/shell/deck-panel.tsx`
- `src/components/shell/mixer-panel.tsx`
- `src/components/shell/waveform-rail.tsx`
- `src/components/shell/library-browser.tsx`
- `src/components/shell/module-dock.tsx`

Upgrade primitives:

- `button`: rectangular hardware-style states.
- `icon-button`: compact square controls.
- `input/select`: table/filter bar style with thin borders.
- `tabs`: module tabs with deck-color active indicators.
- `table-row`: dense selectable rows with strong keyboard focus.

Audio-specific widgets:

- hotcue grid
- stems pads
- fx slots (dropdown + amount)
- channel meters
- crossfader

## 7. Waveform and Rendering Strategy

For “works perfectly” behavior, waveform rendering must be explicit:

- Use Canvas or WebGL for waveform layers (avoid DOM-heavy SVG for continuous redraw).
- Precompute waveform peaks server-side where possible; stream progressive detail.
- Render layers:
  - background grid
  - beat markers
  - cue markers
  - playhead
  - phrase/energy overlays (optional)
- Keep redraw isolated to active viewport region.

Performance constraints:

- 60 FPS target while playing.
- <16ms render budget per frame for active waveform lane.
- Avoid layout thrash by absolute-positioned canvas layers.

## 8. Motion and Feedback

Motion style:

- Short opacity and color transitions (80ms to 180ms).
- No decorative movement during active mixing.
- Hardware-like tactile press feedback on controls.

Critical feedback moments:

- deck load success
- cue trigger hit
- sync lock changes
- limiter/clip warnings
- stream status changes

Reduced-motion support:

- Keep the same information, remove positional animation.
- Preserve all state indications via color/icon/text.

## 9. Interaction Model and Shortcuts

Minimum keyboard support:

- play/pause per deck
- load selected track to deck A/B
- sync/cue/hotcue triggers
- library search focus
- tree navigation and table row activation

Mouse/touch support:

- low-latency fader/knob drag.
- no accidental text selection on drag surfaces.
- pointer capture on faders/knobs for stable control.

## 10. Data and State Model Requirements

Recommended stores:

- `uiLayoutStore`: mode (`pro/performance/essential`), panel visibility.
- `deckStore`: per-deck state (track, bpm, key, playhead, cues, fx).
- `mixerStore`: gains, EQ, filter, crossfader, master meters.
- `libraryStore`: tree nodes, table rows, selection, search query, side panels.

Rules:

- audio clock is source of truth for elapsed/remaining times.
- UI polling should be frame-safe and batched.
- never block transport controls on non-critical network calls.

## 11. Quality Gates (“Perfect” = measurable)

Define “perfect” as passing all gates below:

1. Performance
   - steady 60fps in deck/waveform views on target hardware
   - no interaction >100ms for transport controls
2. Reliability
   - no UI lock during track load/crossfade
   - recoverable error states for missing audio/device changes
3. Accessibility
   - keyboard-complete critical flow
   - WCAG AA contrast for core controls
   - reduced-motion parity
4. Consistency
   - all colors/spacing/radius from tokens only
   - zero hardcoded one-off styles in migrated surfaces
5. Regression safety
   - visual snapshot matrix per theme/profile
   - interaction tests for deck controls/library operations

Use existing checklist:

- `docs/visual_regression_token_checklist.md`

Extend it with DJ-specific snapshots:

- top waveform rail active playback
- dual deck loaded/unloaded states
- mixer clipping warning
- dense browser selection and keyboard focus

## 12. Execution Phases

Phase 1: Theme + shell scaffolding (1-2 sprints)

- implement DJ token extension in `src/styles/tokens.css`
- build `app-shell`, `waveform-rail`, `deck/mixer/browser` containers
- ship static layout with placeholder data

Phase 2: Interactive controls (1-2 sprints)

- faders/knobs/hotcues/pads controls
- keyboard shortcuts
- state wiring and deterministic focus order

Phase 3: Waveform + audio integration (2-3 sprints)

- high-performance waveform renderer
- meter bridge, cue markers, sync indicators
- connect to `useAudioEngine` and engine telemetry

Phase 4: hardening and presets (1-2 sprints)

- accessibility profiles and reduced-motion parity
- visual regression + interaction tests
- latency/perf tuning and release checklist

## 13. Immediate Next Tasks (Recommended)

1. Approve one visual direction variant:
   - `industrial dark` (closest to references)
   - `neon performance` (more vibrant accents)
   - `broadcast studio` (cleaner, less club-oriented)
2. Implement DJ token expansion in `src/styles/tokens.css`.
3. Replace placeholder shell components with grid-based DJ shell.
4. Build a static mock page with fake deck/mixer/library data to validate information hierarchy before wiring live audio.
5. Add baseline screenshots for dark/light/high-contrast/reduced-motion profiles.

## 14. Acceptance Summary

If the plan above is executed, DGN-DJ will match the reference style in:

- visual density
- deck-centric workflow
- waveform-driven decision support
- performance-first interaction behavior

while still preserving:

- product branding
- accessibility requirements
- maintainable token/component architecture.
