# React Browser UI Team Blueprint

## 1. Objective
Build a smooth, modern, browser-like UI shell with a simple mental model, fluid motion, and production-ready React architecture.

Success criteria:
- Initial load feels lightweight and immediate.
- Navigation, tabs, and panel transitions feel intentional and calm.
- Motion remains performant on mid-range devices.
- Accessibility and reduced-motion behavior are first-class.

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

### Working Agreement
- Each agent provides: **what changed / why / acceptance checks / open questions**.
- PRs are feature-sliced by shell areas (topbar, sidebar, workspace, overlays).
- No animation ships without a reduced-motion equivalent.

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

### `AppShell`
Purpose: structural frame for all core navigation and content.

Props:
- `children: ReactNode`

Behavior:
- Renders topbar + sidebar + workspace regions.
- Handles responsive collapse states.
- Preserves sidebar width and selected tab per user preference.

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

## 7. Delivery Plan (Two Sprints)

### Sprint 1 (Foundation)
- Build app shell regions and responsive breakpoints.
- Implement tab strip, address bar, and sidebar v1.
- Integrate motion tokens and reduced-motion guardrails.
- Wire baseline keyboard interactions.

Exit criteria:
- Route changes and tab switching are functional.
- 60fps on common interactions in Chrome profiler.

### Sprint 2 (Polish + Reliability)
- Add command palette and notification center.
- Improve hover/focus/pressed interaction details.
- Add visual regression checks for key layouts.
- Final a11y pass: focus order, ARIA landmarks, contrast.

Exit criteria:
- Lighthouse performance and accessibility targets met.
- No high-severity a11y findings.

---

## 8. Implementation Checklist
- [ ] Scaffold app shell and routing
- [ ] Add design token pipeline (CSS vars + Tailwind mapping)
- [ ] Add motion token module + shared animation presets
- [ ] Implement `prefers-reduced-motion` behavior
- [ ] Create core shell components (topbar/sidebar/tabs/workspace)
- [ ] Add keyboard shortcuts (`Cmd/Ctrl+L`, `Cmd/Ctrl+K`, tab cycling)
- [ ] Add profiling pass and animation budget fixes
- [ ] Complete accessibility audit and fixes

---

## 9. Definition of Done
A feature slice is complete only when:
1. UX acceptance criteria are met.
2. Motion behavior includes reduced-motion alternative.
3. Keyboard and screen-reader basics are validated.
4. Performance profile shows no obvious frame drops.
5. Handoff notes are recorded for downstream agents.
