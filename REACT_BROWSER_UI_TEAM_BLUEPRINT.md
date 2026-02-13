# React Browser UI Team Blueprint

## 1. Objective
Build a smooth, modern, browser-like UI shell with a simple mental model, fluid motion, and production-ready React architecture.

Success criteria:
- Initial load feels lightweight and immediate.
- Navigation, tabs, and panel transitions feel intentional and calm.
- Motion remains performant on mid-range devices.
- Accessibility and reduced-motion behavior are first-class.
- Preset profiles ship and can be toggled without page reload:
  - high contrast
  - large text
  - reduced motion
  - simplified workspace density

---

## 2. Team Operating Model

### Agent Roles
1. **UX Architect (owner: flow + usability)**
   - Defines information architecture and user journeys.
   - Sets acceptance criteria for each interaction.
2. **UI Designer (owner: visual consistency)**
   - Creates tokens and component states.
   - Ensures light/dark parity.
3. **Motion Designer (owner: motion system)**
   - Defines easing/duration/stagger primitives.
   - Documents micro-interactions with fallback behavior.
4. **React Engineer (owner: implementation)**
   - Builds composable app shell and components.
   - Integrates motion tokens and accessibility patterns.
5. **Performance Engineer (owner: frame stability)**
   - Profiles runtime and interaction latency.
   - Removes jank and costly paint/layout operations.
6. **A11y QA Engineer (owner: inclusive quality)**
   - Verifies keyboard flow, semantic structure, and reduced motion.
   - Verifies profile presets and profile-specific acceptance checks.

### Working Agreement
- Each agent provides: **what changed / why / acceptance checks / open questions**.
- PRs are feature-sliced by shell areas (topbar, sidebar, workspace, overlays).
- No animation ships without a reduced-motion equivalent.

Cross-app accessibility guardrails (required for shell, tabs, scheduler, and overlays):
- Publish and maintain a keyboard navigation map alongside every shell-area PR.
- Ensure visible `:focus-visible` treatment for all interactive controls and composite widgets.
- Implement semantic landmarks (`header`, `nav`, `main`, `aside`, `section[aria-labelledby]`, `dialog`) before visual polish tasks.
- Validate theme-token contrast and text hierarchy before merge.

Acceptance criteria from Working Agreement:
- Keyboard map includes entry, traversal, and exit commands for shell, tabs, scheduler, and overlays.
- Focus ring is perceivable in light/dark themes and never removed without replacement.
- Landmark regions are discoverable via screen-reader rotor/landmark navigation.
- Contrast checks pass WCAG AA for body text and non-text UI components.

---

## 3. System Architecture (React)

### Folder Structure
```txt
src/
  app/
    providers/
      app-provider.tsx
      theme-provider.tsx
      motion-provider.tsx
    router/
      routes.tsx
    layout/
      app-shell.tsx
  components/
    shell/
      topbar.tsx
      tab-strip.tsx
      address-bar.tsx
      sidebar.tsx
      workspace.tsx
    overlays/
      command-palette.tsx
      notification-center.tsx
      modal-root.tsx
    primitives/
      button.tsx
      icon-button.tsx
      input.tsx
      tooltip.tsx
  features/
    tabs/
      tabs.store.ts
      tabs.selectors.ts
      use-tab-actions.ts
    navigation/
      nav.store.ts
    preferences/
      preferences.store.ts
  motion/
    tokens.ts
    presets.ts
    reduced-motion.ts
  styles/
    globals.css
    tokens.css
  lib/
    a11y/
      focus-manager.ts
    perf/
      frame-budget.ts
```

###+ Stack
- React + TypeScript
- React Router
- Zustand (state)
- Tailwind CSS + CSS variables for tokens
- Framer Motion for interaction animation
- shadcn/ui or Radix primitives for accessible building blocks

---

## 4. Component Contracts

### Interaction Specs
- Command palette + shortcut architecture: `docs/command_palette_and_shortcuts_spec.md`


### `AppShell`
Purpose: structural frame for all core navigation and content.

Props:
- `children: ReactNode`

Behavior:
- Renders topbar + sidebar + workspace regions.
- Handles responsive collapse states.
- Preserves sidebar width and selected tab per user preference.
- Exposes semantic regions: `header` (topbar), `nav` (sidebar/tab strip), `main` (workspace), optional `aside` (context panels).

Accessibility contract:
- Supports skip link to `main` content target.
- Maintains deterministic tab order: topbar -> sidebar -> tabs -> workspace -> utilities.
- Applies shell-level keyboard map registration for help overlays and QA fixtures.

### `TabStrip`
Purpose: browser-like tab management with smooth switching.

State contract:
- `tabs: Tab[]`
- `activeTabId: string`
- actions: `openTab`, `closeTab`, `activateTab`, `reorderTabs`

Animation contract:
- Reordering uses spring with low bounce.
- Tab activation uses fade + subtle x-translation.
- Closing animates width to zero and fades.

Accessibility contract:
- Uses `role="tablist"` with child `role="tab"` and `aria-controls` linkage.
- Keyboard: `ArrowLeft/ArrowRight` move focus, `Home/End` jump, `Enter/Space` activate, `Delete/Backspace` close (if closable).
- Active tab state is represented via `aria-selected` and synchronized with visible focus styling.

### `AddressBar`
Purpose: command/search/location surface.

Behavior:
- Keyboard shortcut: `Ctrl/Cmd + L` focuses bar.
- Supports inline suggestion popover.
- Shows loading indicator when route data is pending.

### `Workspace`
Purpose: routed content host.

Behavior:
- Route transitions use shared layout animations.
- Skeleton state appears for data loading >120ms.
- Preserves scroll position per tab.

### Accessibility Preset Profiles
Purpose: give operators quick, reliable UX modes for different accessibility needs.

State contract:
- `accessibilityProfile: 'default' | 'high_contrast' | 'large_text' | 'reduced_motion' | 'simplified_density'`
- Action: `setAccessibilityProfile(profile)`
- Persistence: save in user preferences and apply on initial app shell hydration.

Profile behavior:
- **high_contrast**
  - Raises text/background contrast beyond base theme targets.
  - Ensures focus ring and active selection use high-visibility colors.
- **large_text**
  - Increases root type scale and minimum control label sizes.
  - Preserves layout stability (no clipped labels in topbar/sidebar/workspace).
- **reduced_motion**
  - Uses opacity-only transitions and removes parallax/continuous loops.
  - Keeps state-change feedback with non-motion affordances (icon/state text).
- **simplified_density**
  - Increases row heights and click targets.
  - Reduces simultaneous panels and visual clutter in dashboard/studio work areas.
Accessibility contract:
- Route host uses `main`/`region` with accessible name sourced from active tab/page heading.
- Announces route changes through polite live region when tab activation changes content.
- Scheduler views expose grid semantics with keyboard navigation (`Arrow` traversal, `PageUp/PageDown` interval jumps).

### `Overlays` (command palette, notification center, modal root)
Purpose: interruptive and non-interruptive layered interactions.

Accessibility contract:
- Modal overlays use `role="dialog"` + `aria-modal="true"`, trap focus, and restore origin focus on close.
- Non-modal overlays (e.g., notification center) remain reachable by keyboard without stealing focus unexpectedly.
- `Escape` closes dismissible overlays unless an inner control has higher-priority handling.
- Overlay launch shortcuts are documented in keyboard map and avoid collisions with shell navigation keys.

---

## 5. Motion Token File (starter)

Create `src/motion/tokens.ts`:

```ts
export const motion = {
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    accelerate: [0.3, 0, 0.8, 0.15] as const,
    decelerate: [0.05, 0.7, 0.1, 1] as const,
  },
  durationMs: {
    micro: 140,
    quick: 200,
    standard: 280,
    route: 420,
  },
  spring: {
    gentle: { type: 'spring', stiffness: 280, damping: 30, mass: 0.9 },
    snappy: { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 },
  },
};
```

Reduced motion strategy:
- Replace movement with opacity-only transitions.
- Set durations to 80–140ms.
- Disable continuous decorative loops.

Acceptance criteria from reduced motion strategy:
- `@media (prefers-reduced-motion: reduce)` removes x/y transforms and scale transitions from shell, tabs, scheduler timeline, and overlays.
- Reduced mode keeps only opacity transitions with capped duration (<=140ms) and linear/standard easing.
- Auto-scrolling and parallax-like effects are disabled or replaced with instant updates.
- QA verifies no interaction requires motion cues alone to communicate state.

---

## 6. Design Tokens + Frontend Config Appearance Mapping

Create `src/styles/tokens.css`:

```css
:root {
  /* default/light baseline */
  --bg: 220 20% 98%;
  --surface: 0 0% 100%;
  --surface-2: 220 20% 96%;
  --text: 224 24% 10%;
  --text-muted: 220 10% 40%;

  /* runtime-driven appearance controls */
  --accent: 199 98% 58%; /* from config.ui.accent_color */
  --font-scale: 1;       /* from config.ui.font_scale */
  --density-scale: 1;    /* 1 (comfortable) | 0.875 (compact) */

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --space-1: calc(4px * var(--density-scale));
  --space-2: calc(8px * var(--density-scale));
  --space-3: calc(12px * var(--density-scale));
  --space-4: calc(16px * var(--density-scale));
  --space-6: calc(24px * var(--density-scale));

  --elevation-shadow: 0 6px 20px hsl(220 30% 12% / 0.15);
  --surface-border: hsl(220 16% 88%);
}

/* dark parity */
[data-theme='dark'] {
  --bg: 224 24% 7%;
  --surface: 224 20% 11%;
  --surface-2: 224 18% 14%;
  --text: 220 20% 96%;
  --text-muted: 220 12% 70%;
  --elevation-shadow: 0 6px 20px hsl(0 0% 0% / 0.25);
  --surface-border: hsl(224 12% 28%);
}

/* high-contrast variants (must exist for both light + dark) */
[data-contrast='high'][data-theme='light'] {
  --bg: 0 0% 100%;
  --surface: 0 0% 100%;
  --surface-2: 0 0% 97%;
  --text: 0 0% 0%;
  --text-muted: 0 0% 16%;
  --surface-border: hsl(0 0% 10%);
}

[data-contrast='high'][data-theme='dark'] {
  --bg: 0 0% 0%;
  --surface: 0 0% 4%;
  --surface-2: 0 0% 10%;
  --text: 0 0% 100%;
  --text-muted: 0 0% 88%;
  --surface-border: hsl(0 0% 86%);
}

/* surface style mapping */
[data-surface-style='flat'] {
  --elevation-shadow: none;
}

[data-surface-style='elevated'] {
  --elevation-shadow: 0 6px 20px hsl(220 30% 12% / 0.15);
}
```

### Config-to-token mapping contract
- `config.ui.theme` -> sets `data-theme` (`light`/`dark`) with `auto` resolved from OS preference.
- `config.ui.accent_color` -> `--accent` (convert hex to HSL once at app boot/update).
- `config.ui.density` -> `--density-scale` (`comfortable=1`, `compact=0.875`).
- `config.ui.font_scale` -> `--font-scale`; root font-size should use `calc(16px * var(--font-scale))`.
- `config.ui.surface_style` -> `data-surface-style` (`flat` disables shadow, `elevated` enables it).

### Light/dark parity + high-contrast requirements
- Every semantic token used by shell components must define light and dark values.
- High-contrast variants must be provided for both light and dark modes.
- Accent usage must continue to pass contrast checks against both surface modes.

### Migration defaults (backward compatibility)
When loading existing configs that only provide `theme`, frontend should apply schema defaults:
- `accent_color`: `#2AA9FF`
- `density`: `comfortable`
- `font_scale`: `1`
- `surface_style`: `elevated`

This keeps older saved configs valid without edits while enabling progressive rollout of new appearance controls.

---

## 7. Micro-State Matrix + Service Status Mapping

Use this matrix to keep state UX consistent across major surfaces: **Dashboard, Studio View, Scheduler, Library**.

### Shared Micro-States (all major surfaces)

| Micro-state | UX intent | Trigger guidance | Primary primitive(s) | `frontend_status_response.service_status` behavior |
| --- | --- | --- | --- | --- |
| Loading (short) | Keep perceived latency low without layout shift. | Data expected quickly (<= 400ms). | Inline spinner + subtle skeleton rows/cards. | `healthy`: default; `degraded`: show lightweight “slower than usual” inline hint; `down`: skip spinner loop after timeout and move to error treatment. |
| Loading (long) | Preserve trust during multi-second fetches. | Data pending > 400ms or progressive pagination. | Placeholder card set + global/in-panel banner with status copy. | `healthy`: neutral progress copy; `degraded`: warning banner (“limited backend performance”); `down`: escalate to transient error with retry CTA. |
| Empty-first-run | Teach next step rather than show blank space. | No user-created content yet, first session or first feature visit. | Placeholder card with onboarding CTA(s). | `healthy`: standard getting-started copy; `degraded`: keep onboarding visible but include warning inline alert for delayed writes; `down`: disable mutating CTA and explain dependency outage. |
| No-results search | Confirm query executed and suggest recovery path. | Query returns zero matches with active filter/search term. | Inline alert + placeholder card with clear actions (reset filters, broaden search). | `healthy`: informational tone; `degraded`: add note that some indexes may be stale; `down`: message that search backend is unavailable and fallback list may be incomplete. |
| Transient error with retry | Recover quickly from intermittent failures. | Timeout, 5xx, websocket drop, network blip. | Inline alert + Retry button (idempotent action). | `healthy`: single retry prompt with exponential backoff after repeated failures; `degraded`: show “service unstable” warning banner + retry; `down`: stop auto-retry after capped attempts and offer manual retry only. |
| Degraded backend mode | Keep app usable with reduced capability. | `service_status` reports partial outage / dependency lag. | Persistent banner + inline alerts on impacted widgets. | `degraded`: activate degraded UX mode; `healthy`: clear all degraded warnings; `down`: switch from degraded to outage handling states. |

### Surface-level Application Matrix

| Surface | Loading (short vs long) | Empty-first-run | No-results search | Transient error with retry | Degraded backend mode |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Short: skeleton KPI chips. Long: skeleton panels + top banner. | Placeholder card with “Connect sources” / “Create first show”. | Inline alert over widget area with “Clear filters”. | Inline alert per failed widget + panel retry button. | Persistent top banner; impacted widgets show inline degraded tags. |
| Studio View | Short: waveform/queue skeleton. Long: full panel placeholders + status note. | Placeholder card prompting first segment/track setup. | Inline alert in segment list with query suggestions. | Transport-safe retry (never interrupts active playout state). | Sticky banner near transport controls; disable risky mutating actions when status worsens. |
| Scheduler | Short: calendar cell shimmer. Long: full-grid placeholder + ETA copy. | Placeholder card: “Schedule your first block”. | Inline alert above grid + quick reset filters action. | Retry button on failed fetch/save region with optimistic rollback notice. | Banner indicates delayed sync; highlight stale cells with inline alerts. |
| Library | Short: row/card skeleton. Long: section placeholder + progress hint. | Placeholder card: “Import your first asset”. | Inline alert in results header with “Remove filters” + “Show all”. | Retry button on list fetch and metadata enrich failures. | Banner warns metadata/search may be incomplete; show stale badge on affected items. |

### Reusable UI Primitives

1. **Banner**
   - Purpose: global/persistent communication at app or surface top.
   - Variants: `info`, `warning`, `error`.
   - `service_status` mapping:
     - `healthy`: hidden by default.
     - `degraded`: `warning` banner with scope + expected impact.
     - `down` (or equivalent outage state): `error` banner with clear fallback text.

2. **Inline Alert**
   - Purpose: localized contextual guidance in a panel/list/section.
   - Variants: `info`, `warning`, `error`.
   - `service_status` mapping:
     - `healthy`: mostly `info` (empty/no-results guidance).
     - `degraded`: `warning` for stale/partial data.
     - `down`: `error` for unavailable section-level operations.

3. **Placeholder Card**
   - Purpose: non-jarring content substitute for loading/empty states.
   - Variants: `loading`, `empty`, `empty_search`.
   - `service_status` mapping:
     - `healthy`: standard instructional/neutral copy.
     - `degraded`: add compact warning subtext (“results may lag”).
     - `down`: disable dependent CTA controls and expose fallback action.

4. **Retry Button**
   - Purpose: explicit user-controlled recovery from transient failures.
   - Behavior:
     - Idempotent actions only.
     - Debounced click handling.
     - Optional countdown/backoff label after repeated failures.
   - `service_status` mapping:
     - `healthy`: visible on transient errors only.
     - `degraded`: visible + paired with warning copy about instability.
     - `down`: visible but paired with “service unavailable” text; no aggressive auto-retry loops.

Implementation note:
- Normalize `frontend_status_response.service_status` into a UI enum (`healthy | degraded | down`) at the boundary layer so all surfaces consume one predictable contract.

---

## 8. Delivery Plan (Two Sprints)

### Sprint 1 (Foundation)
- Build app shell regions and responsive breakpoints.
- Implement tab strip, address bar, and sidebar v1.
- Integrate motion tokens and reduced-motion guardrails.
- Wire baseline keyboard interactions.
- Add accessibility profile selector with persistence.

Exit criteria:
- Route changes and tab switching are functional.
- 60fps on common interactions in Chrome profiler.
- All four accessibility preset profiles can be enabled and persist across reload.

### Sprint 2 (Polish + Reliability)
- Add command palette and notification center.
- Improve hover/focus/pressed interaction details.
- Add visual regression checks for key layouts.
- Final a11y pass: focus order, ARIA landmarks, contrast, and preset-specific behavior.

Exit criteria:
- Lighthouse performance and accessibility targets met.
- No high-severity a11y findings.
- Preset acceptance checks pass for high contrast, large text, reduced motion, and simplified density.

---

## 9. Implementation Checklist
- [ ] Scaffold app shell and routing
- [ ] Add design token pipeline (CSS vars + Tailwind mapping)
- [ ] Add motion token module + shared animation presets
- [ ] Implement `prefers-reduced-motion` behavior
- [ ] Implement accessibility profile store + persistence
- [ ] Add profile token overrides (`high_contrast`, `large_text`, `reduced_motion`, `simplified_density`)
- [ ] Create core shell components (topbar/sidebar/tabs/workspace)
- [ ] Add keyboard shortcuts (`Cmd/Ctrl+L`, `Cmd/Ctrl+K`, tab cycling)
- [ ] Add keyboard-first workflows for queue control, schedule edits, and prompt approvals
- [ ] Define and implement default focus order + landmarks for dashboard and studio pages
- [ ] Add profiling pass and animation budget fixes

---

## 9. Accessibility QA Matrix (Release-Blocking)

Run this matrix for every release candidate. A failed blocking item must be fixed before ship.

| Component category | Required checks | Pass criteria | Fail criteria | Blocking severity |
| --- | --- | --- | --- | --- |
| Shell (topbar, sidebar, workspace, tab strip) | Keyboard-only flow; focus visibility + logical focus order; screen-reader naming/landmarks; color contrast; reduced-motion behavior; zoom/reflow at 200%+ | All primary actions are operable without pointer; visible focus ring in all states; tab order follows reading/task order; controls expose accessible name/role/value; text + UI contrast meets WCAG AA; `prefers-reduced-motion` removes motion-heavy transitions; layout reflows without horizontal loss of critical controls at 1280px and 200% zoom. | Any primary flow blocked by keyboard; hidden/ambiguous focus; non-semantic or unnamed controls; contrast failures on default themes; motion cannot be reduced; clipped/overlapping controls during zoom/reflow. | **Blocker (P0)** for keyboard/focus/semantics, **High (P1)** for contrast and reflow regressions. |
| Overlays (command palette, modal dialogs, notifications, popovers) | Keyboard-only flow; focus trap/restore + focus visibility/order; screen-reader naming and state announcements; color contrast; reduced-motion entry/exit; zoom/reflow | Overlay opens, navigates, confirms, and closes by keyboard; focus is trapped while open and restored on close; dialog/popup has programmatic label and live announcements where needed; contrast remains AA in overlay layers; reduced-motion variant uses opacity or instant state change; overlay content remains usable at 200% zoom without off-screen dead zones. | Focus escapes modal; ESC/close not keyboard-accessible; missing `aria-label`/`aria-labelledby`/`aria-describedby`; unreadable dimmed content; animated transitions cannot be reduced; overlay content inaccessible at zoom. | **Blocker (P0)** for trap/restore and naming issues, **High (P1)** for contrast/reflow/motion issues that obscure content. |
| Scheduler interactions (timeline blocks, drag/drop scheduling, time-grid edits) | Keyboard-only flow with non-pointer parity; focus visibility/order across grid; screen-reader naming/instructions for time slots/events; color contrast for status chips; reduced-motion updates; zoom/reflow in dense timelines | Every drag/drop action has keyboard equivalent (select, move, resize, confirm/cancel); active slot/event is visibly focused; SR announces item, time range, and result of move; status colors preserve AA with text/icons; animated timeline shifts respect reduced motion; dense views remain navigable at 200% zoom with wrapping/reflow strategy. | Scheduling task requires mouse/touch only; no keyboard move/resize; unclear focus in dense grid; SR cannot identify event/time changes; color-only status cues; motion-heavy timeline updates with no fallback; timeline becomes unusable when zoomed. | **Blocker (P0)** for lack of keyboard or SR parity, **High (P1)** for contrast/reflow/motion regressions. |

### No-Ship Rule: Custom Widget Fallbacks

Do not ship custom interactive widgets without complete keyboard + ARIA equivalents.

- Applies to: drag/drop zones, tab strips, timeline blocks, and any custom composite widget.
- Minimum fallback requirements:
  - Keyboard operation for all primary and destructive actions.
  - Semantic role mapping (`button`, `tablist`/`tab`, `listbox`/`option`, `grid`, etc.) plus accessible names.
  - State exposure via ARIA (`aria-selected`, `aria-expanded`, `aria-pressed`, `aria-current`, `aria-live`, etc.) as appropriate.
  - Non-drag alternative path for move/reorder (menu actions, shortcuts, stepper controls).
- If fallback parity is missing, mark release as **No Ship** until parity is implemented and verified.
- [ ] Complete accessibility audit and fixes
- [ ] Publish keyboard navigation map for shell/tabs/scheduler/overlays
- [ ] Validate semantic landmarks and focus-visible states across shell contracts
- [ ] Run contrast and text hierarchy checks against theme tokens

### Keyboard Navigation Map (cross-app contract)

| Area | Entry | Traverse | Action | Exit |
| --- | --- | --- | --- | --- |
| Shell (topbar/sidebar/workspace) | `Tab` from browser chrome or skip link | `Tab` / `Shift+Tab` | `Enter` / `Space` on focused control | `Shift+Tab` to previous region |
| Tab Strip | `Ctrl/Cmd + 1..9` or `Tab` into strip | `ArrowLeft` / `ArrowRight`, `Home`, `End` | `Enter`/`Space` activate, `Delete` close | `Tab` into workspace |
| Scheduler | `G then S` (app shortcut) or route entry | Arrow keys for cell/block movement; `PageUp/PageDown` period jump | `Enter` open block, `E` edit, `N` new item | `Escape` close editor / return focus |
| Overlays | `Ctrl/Cmd + K` (palette), `Ctrl/Cmd + Shift + N` (notifications) | `Tab` cycle within overlay; arrow keys in lists | `Enter` select/confirm | `Escape` dismiss + restore origin focus |

### Theme Contrast + Text Hierarchy Guardrails
- Theme tokens must maintain at least 4.5:1 contrast for body text and 3:1 for large text/UI icons.
- Interactive focus indicators must achieve 3:1 contrast against adjacent colors.
- Text hierarchy checks ensure heading/subheading/body/caption tiers remain visually distinct in both themes.
- CI or QA script should fail when token changes regress contrast below agreed thresholds.

---

## 9. Interaction Frame + Latency Budgets

Use this budget table as the source of truth for motion acceptance and QA sign-off on mid-range hardware.

| Interaction | Frame Budget | Interaction Latency Budget | Primary Animation Constraints |
| --- | --- | --- | --- |
| Tab switch | 16.7ms/frame (target 60fps), max 2 dropped frames | Input-to-visual response <=100ms | Keep transform + opacity only; avoid layout-affecting width/height animation on active panel.
| Panel open/close (sidebar, notification center) | 16.7ms/frame, max 3 dropped frames | Trigger-to-stable-state <=180ms | Use translate + opacity; no expensive backdrop filters on low-power devices.
| Route transition | 16.7ms/frame, max 4 dropped frames | Navigation start-to-first-transition-frame <=120ms | Shared element transitions only for above-the-fold regions; defer secondary motion.
| Command palette open | 16.7ms/frame, zero long tasks >50ms during open | Shortcut press-to-first-visible-pixel <=90ms | Animate overlay opacity and palette scale/translate lightly; preload palette structure.

### Budget Exceeded Fallback Policy
If any interaction exceeds the budgets above in profiling or QA runs, apply fallbacks in this exact order until the interaction returns within budget:

1. **Disable blur/backdrop filters** on animated layers and overlays.
2. **Reduce parallax depth** (cut translation distance by >=50%, disable multi-layer drift).
3. **Shorten animation chain** by removing secondary/tertiary staggered elements and using single-step enter/exit transitions.

Ship-blocking rule:
- Any interaction that still misses budget after step 3 must default to reduced-motion behavior for that component until optimized.

---

## 10. Reduced-Motion Compliance Checklist

All movement-based interactions must provide a verified reduced-motion equivalent before merge.

- [ ] Every movement animation has an **opacity-only fallback** (no translate/scale/parallax required in reduced mode).
- [ ] Critical workflows (navigation, save/confirm, command palette, dialog actions) include an **instant-state shortcut** (0ms or effectively immediate transition).
- [ ] `prefers-reduced-motion: reduce` is honored across shell, overlays, and route transitions.
- [ ] Decorative continuous motion (ambient parallax, shimmer loops) is disabled in reduced mode.
- [ ] Focus visibility and reading order remain stable when motion is removed.

---

## 11. Profiling Checklist (Interaction-Linked)

Run this checklist on at least one mid-range device profile before sign-off (e.g., 4x CPU throttle equivalent or representative hardware).

| Interaction Name | How to Trigger | Metrics to Capture | Pass Criteria |
| --- | --- | --- | --- |
| `tab_switch` | Click inactive tab, then keyboard cycle tabs | FPS, dropped frames, input delay, long tasks | Meets tab-switch budget; no visible hitch in active content swap.
| `panel_toggle` | Open/close sidebar and notification center 5x each | FPS, style/layout cost, paint time | Meets panel budget; no escalating frame cost across repeated toggles.
| `route_transition` | Navigate between two heavy routes repeatedly | Navigation timing, first transition frame, dropped frames | Meets route budget; skeleton appears only when pending >120ms.
| `command_palette_open` | `Cmd/Ctrl+K` from idle and busy UI states | Shortcut latency, scripting time, long tasks | Meets palette budget in both states; input remains responsive.

QA logging requirements:
- Record profiler trace filename with interaction name prefix (example: `tab_switch_2025-02-10.json`).
- Document hardware profile + browser version for every run.
- Mark each interaction as Pass / Needs fallback / Blocked with notes tied to the fallback policy.

### Keyboard-first workflows

#### Queue control
- Open queue panel: `Cmd/Ctrl+Shift+Q`.
- Move focus into queue list from anywhere: `g` then `q`.
- Reorder selected item: `Alt+Up` / `Alt+Down`.
- Toggle hold/release on selected item: `Space`.
- Start next item: `Enter` on primary queue action.

#### Schedule edits
- Jump to scheduler: `g` then `s`.
- Move timeslot focus: arrow keys.
- Create/edit block: `Enter`.
- Save draft: `Cmd/Ctrl+S`.
- Resolve next conflict: `Shift+N`.

#### Prompt approvals
- Jump to approvals inbox: `g` then `p`.
- Open focused prompt details: `Enter`.
- Approve prompt: `a`.
- Request changes: `r`.
- Move to next pending prompt: `j` / `k`.

### Default focus order and landmarks

#### Dashboard page
- Landmarks (in order): `header` (topbar), `nav` (primary sidebar), `main` (dashboard content), `aside` (notifications/activity).
- Default tab sequence inside `main`:
  1. Global status banner
  2. Queue summary card actions
  3. Schedule snapshot quick actions
  4. Prompt approvals summary actions
  5. Recent alerts list

#### Studio page
- Landmarks (in order): `header` (transport + timers), `nav` (studio sections), `main` (active workspace), `aside` (inspector/tools).
- Default tab sequence inside `main`:
  1. Now playing / current segment panel
  2. Queue list and item actions
  3. Prompt review panel actions
  4. Audio controls (preview/publish)
  5. Studio activity log

### Preset-specific acceptance checks
- **high_contrast:** key text, interactive controls, and focus indicators meet elevated contrast targets in dashboard and studio.
- **large_text:** no truncation or overlap for topbar/sidebar/workspace labels at increased text scale.
- **reduced_motion:** route transitions, tab switching, and panel open/close use reduced-motion variants.
- **simplified_density:** row heights/hit targets expand and non-essential secondary chrome is suppressed in workspace-heavy views.

---

## 12. Definition of Done
A feature slice is complete only when:
1. UX acceptance criteria are met.
2. Motion behavior includes reduced-motion alternative.
3. Keyboard and screen-reader basics are validated.
4. Performance profile shows no obvious frame drops.
5. Accessibility preset profile checks pass in dashboard and studio.
6. Handoff notes are recorded for downstream agents.
