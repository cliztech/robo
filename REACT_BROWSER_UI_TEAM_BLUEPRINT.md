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

## 9. Implementation Checklist
- [ ] Scaffold app shell and routing
- [ ] Add design token pipeline (CSS vars + Tailwind mapping)
- [ ] Add motion token module + shared animation presets
- [ ] Implement `prefers-reduced-motion` behavior
- [ ] Create core shell components (topbar/sidebar/tabs/workspace)
- [ ] Add keyboard shortcuts (`Cmd/Ctrl+L`, `Cmd/Ctrl+K`, tab cycling)
- [ ] Add profiling pass and animation budget fixes
- [ ] Complete accessibility audit and fixes

---

## 10. Definition of Done
A feature slice is complete only when:
1. UX acceptance criteria are met.
2. Motion behavior includes reduced-motion alternative.
3. Keyboard and screen-reader basics are validated.
4. Performance profile shows no obvious frame drops.
5. Handoff notes are recorded for downstream agents.
