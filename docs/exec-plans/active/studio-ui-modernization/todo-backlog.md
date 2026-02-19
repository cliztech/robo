# Studio UI Modernization — Todo Backlog

## Initiative
- **Name:** `studio-ui-modernization`
- **Objective:** Deliver a production-ready studio interface refresh across theme tokens, layout shell, deck controls, browser/table interactions, waveform rendering, accessibility profiles, and QA regression coverage.

## Phase 1 — Foundation

### Workstream: Theme/tokens

#### Task T1.1 — Define semantic design tokens and theme contract
- **Priority:** P0
- **Estimate:** M
- **Sprint:** Sprint 1
- **Target file paths:** `src/styles/tokens.css`, `src/styles/theme.css`, `src/lib/theme/tokens.ts`
- **Definition of Done:**
  - Semantic color, spacing, typography, elevation, and motion tokens are documented and implemented.
  - Light/dark and high-contrast token sets compile and can be consumed by components.
  - No hardcoded color literals remain in `src/components/shell/*` and `src/components/deck/*` touched by this initiative.
- **Given/When/Then acceptance criteria:**
  - **Given** the app loads in default mode, **when** shell and deck components render, **then** all visual primitives resolve from semantic token variables.
  - **Given** high-contrast mode is enabled, **when** UI is re-rendered, **then** token values swap without layout regressions.
- **Required tests:** unit (token map validation), integration (theme switch behavior), visual (baseline token snapshots)
- **Dependencies:** None

#### Task T1.2 — Migrate shared component primitives to token usage
- **Priority:** P1
- **Estimate:** M
- **Sprint:** Sprint 1
- **Target file paths:** `src/components/common/*`, `src/components/shell/*`, `src/styles/tokens.css`
- **Definition of Done:**
  - Shared primitives (button, panel, badge, status chip) consume tokens only.
  - Legacy style constants are deprecated and references removed from migrated primitives.
- **Given/When/Then acceptance criteria:**
  - **Given** the primitive component catalog, **when** each variant is rendered, **then** spacing/color/typography align with semantic tokens.
  - **Given** theme toggling, **when** primitives are displayed in all states, **then** state styles remain accessible and consistent.
- **Required tests:** unit (className/token resolver), integration (variant rendering), visual (component state matrix)
- **Dependencies:** `T1.1`

### Workstream: Shell/layout

#### Task T1.3 — Implement responsive studio shell scaffold
- **Priority:** P0
- **Estimate:** M
- **Sprint:** Sprint 1
- **Target file paths:** `src/components/shell/StudioShell.tsx`, `src/components/shell/StudioHeader.tsx`, `src/components/shell/StudioSidebar.tsx`, `src/routes/studio.tsx`
- **Definition of Done:**
  - Shell includes header, primary workspace, optional sidebar, and persistent status region.
  - Layout supports desktop-first and tablet breakpoints without horizontal overflow.
- **Given/When/Then acceptance criteria:**
  - **Given** a desktop viewport, **when** studio route is opened, **then** shell regions are visible with stable hierarchy and no overlap.
  - **Given** a tablet viewport, **when** sidebar collapses, **then** workspace remains fully operable.
- **Required tests:** integration (route/layout), visual (desktop + tablet snapshots), perf (first render layout stability)
- **Dependencies:** `T1.1`

---

## Phase 2 — Core Interactions

### Workstream: Deck and mixer controls

#### Task T2.1 — Build deck transport and mixer control cluster
- **Priority:** P0
- **Estimate:** L
- **Sprint:** Sprint 2
- **Target file paths:** `src/components/deck/DeckTransportControls.tsx`, `src/components/deck/MixerControls.tsx`, `src/state/deckStore.ts`, `tests/ui/dj-controls.test.tsx`
- **Definition of Done:**
  - Transport (play/pause/cue/seek) and mixer (gain/crossfader) controls render with deterministic state transitions.
  - Keyboard shortcuts and pointer interactions produce identical state updates.
- **Given/When/Then acceptance criteria:**
  - **Given** deck is idle, **when** Play is triggered, **then** state transitions to playing and time counter advances.
  - **Given** mixer is active, **when** crossfader changes position, **then** channel output balances update in real-time.
- **Required tests:** unit (store reducers/actions), integration (control interactions), perf (interaction latency under 16ms budget)
- **Dependencies:** `T1.2`, `T1.3`

#### Task T2.2 — Add safety rails for destructive deck actions
- **Priority:** P1
- **Estimate:** S
- **Sprint:** Sprint 2
- **Target file paths:** `src/components/deck/DeckActionConfirm.tsx`, `src/components/deck/DeckTransportControls.tsx`, `tests/ui/dj-controls.test.tsx`
- **Definition of Done:**
  - Stop/eject/reset actions require explicit confirmation when playback is active.
  - Cancel path is instant and preserves prior deck state.
- **Given/When/Then acceptance criteria:**
  - **Given** live playback is active, **when** user selects Eject, **then** a confirmation dialog appears before action executes.
  - **Given** confirmation is dismissed, **when** user returns to controls, **then** playback remains unchanged.
- **Required tests:** unit (guard logic), integration (confirmation flow), visual (dialog states)
- **Dependencies:** `T2.1`

### Workstream: Browser/table interactions

#### Task T2.3 — Upgrade track browser table for fast keyboard-first operation
- **Priority:** P0
- **Estimate:** L
- **Sprint:** Sprint 2
- **Target file paths:** `src/components/browser/TrackBrowserTable.tsx`, `src/components/browser/BrowserFilters.tsx`, `src/hooks/useTableNavigation.ts`, `tests/ui/studio-page.test.tsx`
- **Definition of Done:**
  - Sorting, filtering, row focus, and quick-load actions support keyboard and pointer parity.
  - Row virtualization (if enabled) preserves focus and selection state.
- **Given/When/Then acceptance criteria:**
  - **Given** a populated browser table, **when** user applies filter text, **then** matching rows update within acceptable response time.
  - **Given** keyboard navigation is used, **when** Enter is pressed on focused row, **then** item loads into target deck.
- **Required tests:** unit (navigation hook), integration (table actions), visual (table states), perf (filter/sort responsiveness)
- **Dependencies:** `T1.3`, `T2.1`

#### Task T2.4 — Implement drag/drop and context actions for browser rows
- **Priority:** P2
- **Estimate:** M
- **Sprint:** Sprint 3
- **Target file paths:** `src/components/browser/TrackBrowserTable.tsx`, `src/components/browser/TrackRowContextMenu.tsx`, `tests/ui/studio-page.test.tsx`
- **Definition of Done:**
  - Rows can be drag-dropped to deck targets with clear affordances and fallback context actions.
  - Context menu actions map to same command handlers as keyboard shortcuts.
- **Given/When/Then acceptance criteria:**
  - **Given** user drags a row to deck A, **when** drop completes, **then** deck A queue updates with dropped track.
  - **Given** context menu is opened, **when** “Load to Deck B” is selected, **then** track is queued on Deck B.
- **Required tests:** integration (DnD + menu actions), visual (drag states, context menu), perf (DnD frame budget)
- **Dependencies:** `T2.3`

---

## Phase 3 — Playback Fidelity and Accessibility

### Workstream: Waveform rendering

#### Task T3.1 — Implement waveform canvas renderer and timeline sync
- **Priority:** P0
- **Estimate:** L
- **Sprint:** Sprint 3
- **Target file paths:** `src/components/waveform/WaveformCanvas.tsx`, `src/components/waveform/WaveformTimeline.tsx`, `src/lib/audio/waveform.ts`, `tests/ui/studio-page.test.tsx`
- **Definition of Done:**
  - Waveform renders progressively and syncs playback head to deck timeline.
  - Zoom and scrub interactions are smooth, bounded, and recover gracefully from missing peaks data.
- **Given/When/Then acceptance criteria:**
  - **Given** loaded audio peaks, **when** deck begins playback, **then** waveform playhead advances in sync with elapsed time.
  - **Given** user scrubs timeline, **when** scrub operation ends, **then** deck seeks to selected position.
- **Required tests:** unit (waveform utilities), integration (seek/sync behavior), visual (waveform snapshots), perf (render FPS + memory profile)
- **Dependencies:** `T2.1`

#### Task T3.2 — Add fallback waveform state and failure telemetry hooks
- **Priority:** P1
- **Estimate:** S
- **Sprint:** Sprint 3
- **Target file paths:** `src/components/waveform/WaveformCanvas.tsx`, `src/lib/telemetry/waveformTelemetry.ts`, `tests/ui/studio-page.test.tsx`
- **Definition of Done:**
  - Missing/corrupt waveform inputs show non-blocking fallback UI.
  - Telemetry event is emitted for waveform decode/render failures.
- **Given/When/Then acceptance criteria:**
  - **Given** invalid peak data, **when** waveform attempts rendering, **then** fallback placeholder appears with actionable message.
  - **Given** fallback is shown, **when** telemetry is inspected, **then** failure event is recorded with deck and source context.
- **Required tests:** unit (error mapping), integration (fallback rendering), visual (fallback UI)
- **Dependencies:** `T3.1`

### Workstream: Accessibility profiles

#### Task T3.3 — Deliver accessibility profile presets (contrast, density, text size, reduced motion)
- **Priority:** P0
- **Estimate:** M
- **Sprint:** Sprint 3
- **Target file paths:** `src/components/accessibility/AccessibilityProfilePanel.tsx`, `src/lib/accessibility/profilePresets.ts`, `src/styles/tokens.css`, `tests/ui/studio-page.test.tsx`
- **Definition of Done:**
  - Profile presets apply atomically and persist per user session.
  - Reduced motion mode disables non-essential animation in shell/deck/browser.
- **Given/When/Then acceptance criteria:**
  - **Given** accessibility panel is open, **when** “High Contrast” is selected, **then** token profile updates and contrast ratios remain compliant.
  - **Given** reduced motion is enabled, **when** user navigates studio controls, **then** non-essential transitions are suppressed.
- **Required tests:** unit (preset mapping), integration (profile application + persistence), visual (preset snapshots), perf (profile switch latency)
- **Dependencies:** `T1.1`, `T1.2`, `T1.3`

---

## Phase 4 — QA Hardening and Regression Safety

### Workstream: QA automation and regression

#### Task T4.1 — Expand UI integration suite for shell/deck/browser/waveform/a11y flows
- **Priority:** P0
- **Estimate:** M
- **Sprint:** Sprint 4
- **Target file paths:** `tests/ui/studio-page.test.tsx`, `tests/ui/dj-controls.test.tsx`, `tests/ui/accessibility-profiles.test.tsx`, `tests/ui/waveform.test.tsx`
- **Definition of Done:**
  - End-to-end-like UI integration coverage exists for top operator journeys.
  - Flaky selectors/timing are eliminated using stable test IDs and deterministic fixtures.
- **Given/When/Then acceptance criteria:**
  - **Given** seeded fixture data, **when** core studio journey executes in tests, **then** all checkpoints pass without retries.
  - **Given** keyboard-only journey, **when** test completes, **then** no blocked focus transitions occur.
- **Required tests:** integration (expanded UI suite), visual (critical route snapshots)
- **Dependencies:** `T2.1`, `T2.3`, `T3.1`, `T3.3`

#### Task T4.2 — Add visual regression + performance guardrails to CI
- **Priority:** P1
- **Estimate:** M
- **Sprint:** Sprint 4
- **Target file paths:** `tests/visual/studio-shell.visual.test.ts`, `tests/visual/deck-controls.visual.test.ts`, `tests/perf/studio-interactions.perf.test.ts`, `.github/workflows/ui-regression.yml`
- **Definition of Done:**
  - Visual baseline tests cover shell/deck/browser/a11y states and run in CI.
  - Performance checks gate regressions for interaction latency and render stability budgets.
- **Given/When/Then acceptance criteria:**
  - **Given** a pull request touching studio UI, **when** CI executes, **then** visual diffs and perf budgets are reported and enforce thresholds.
  - **Given** perf metric exceeds budget, **when** workflow completes, **then** CI marks check as failing with actionable output.
- **Required tests:** visual (CI snapshots), perf (automated interaction benchmarks), integration (workflow smoke)
- **Dependencies:** `T4.1`

## Dependency Map (Quick View)
- `T1.1` → `T1.2`, `T1.3`, `T3.3`
- `T1.2` + `T1.3` → `T2.1`
- `T2.1` → `T2.2`, `T2.3`, `T3.1`
- `T2.3` → `T2.4`
- `T3.1` → `T3.2`, `T4.1`
- `T3.3` → `T4.1`
- `T4.1` → `T4.2`
