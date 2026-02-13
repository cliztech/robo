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

## 6. Design Tokens (starter)

Create `src/styles/tokens.css`:

```css
:root {
  --bg: 224 24% 7%;
  --surface: 224 20% 11%;
  --surface-2: 224 18% 14%;
  --text: 220 20% 96%;
  --text-muted: 220 12% 70%;
  --accent: 199 98% 58%;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;

  --shadow-soft: 0 6px 20px hsl(0 0% 0% / 0.25);
}
```

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

---

## 9. Definition of Done
A feature slice is complete only when:
1. UX acceptance criteria are met.
2. Motion behavior includes reduced-motion alternative.
3. Keyboard and screen-reader basics are validated.
4. Performance profile shows no obvious frame drops.
5. Handoff notes are recorded for downstream agents.
