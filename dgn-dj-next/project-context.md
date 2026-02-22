---
project_name: 'DGN-DJ STUDIO'
user_name: 'DGNradio'
date: '2026-02-22'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns', 'domain_rules']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in DGN-DJ STUDIO. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|---|---|---|
| **React** | 19.2.0 | Functional components only, `React.FC` typed |
| **TypeScript** | 5.9.3 | Strict mode ON (see rules below) |
| **Vite** | 7.3.1 | Dev server, HMR, ESM modules |
| **TailwindCSS** | 4.2.0 | **v4 syntax** — uses `@theme {}` NOT `tailwind.config.js` |
| **Tauri CLI** | 2.10.0 | Desktop native wrapper (Rust backend) |
| **Radix UI** | 1.2.4 | `react-slot` only — headless primitives |
| **clsx** | 2.1.1 | Class name conditional utility |
| **tailwind-merge** | 3.5.0 | TW class deduplication |
| **class-variance-authority** | 0.7.1 | Component variant system |
| **lucide-react** | 0.575.0 | Icon library |
| **ESLint** | 9.39.1 | + `react-hooks`, `react-refresh` plugins |
| **PostCSS** | 8.5.6 | + Autoprefixer 10.4.24 |

---

## Critical Implementation Rules

### TypeScript Rules

- **Strict mode is ON** — `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`
- **`erasableSyntaxOnly: true`** — enum, namespace, parameter properties are FORBIDDEN; use `as const` objects and `type` imports
- **`verbatimModuleSyntax: true`** — must use `import type { X }` for type-only imports
- **Target ES2022** — optional chaining, nullish coalescing, `at()` are safe
- **Module: ESNext with bundler resolution** — `allowImportingTsExtensions` is enabled
- Every unused variable/import will fail the build — clean up before committing

### React & Framework Rules

- **Components must be `React.FC` typed** — exported as named exports, PascalCase filenames
- **`cn()` utility is mandatory** for class merging — import from `../../lib/utils` (clsx + tailwind-merge)
- **Never call `setState` synchronously inside `useEffect`** — use factory initializer for `useState`, or wrap in `setTimeout`/`useCallback`
- **`useRef` values must NOT be read during render** — derive values via `useMemo` or compute inside callbacks
- **Props must use TypeScript interfaces** — defined above the component, named `{ComponentName}Props`
- **No `useReducer` or Redux** — local `useState` + prop drilling is the current pattern
- **No React Router** — single-page app with conditional panels, no URL routing
- **Toast system** — use `ToastNotification` component via state in `App.tsx`

### TailwindCSS v4 Rules (CRITICAL — agents get this wrong)

- **`@theme {}` directive** replaces `tailwind.config.js` — ALL design tokens live in `index.css`
- **No `theme.extend`** — directly declare CSS custom properties inside `@theme {}`
- **Keyframes go inside `@theme {}`** — not in a separate `@keyframes` block at root
- **Color tokens** use `--color-*` prefix: `--color-deck-a: #0091FF`, etc.
- **Animation tokens** use `--animate-*` prefix
- **`@import "tailwindcss"` is the only import** — no `@tailwind base/components/utilities`

### Layout Architecture Rules

- **5-row proportional layout** based on 3840×2160 reference:
  - TopNav: `--layout-nav-h: 2.96%`
  - Waveform: `--layout-waveform-h: 37.59%`
  - Decks: `--layout-decks-h: 24.07%`
  - Pads/FX: `--layout-pads-h: 15.93%`
  - Browser: `--layout-browser-h: 19.44%`
- **Mixer width**: `--layout-mixer-w: 26%`, centered between decks
- **Grid unit**: `--layout-grid-unit: 8px` — all spacing should be multiples of 8
- **Gutter**: `--layout-gutter: 24px`, **Padding**: `--layout-padding: 16px`

### Design System Rules

- **Material simulation classes**: `bg-brushed-metal`, `bg-anodized-aluminum`, `bg-silicone-pad`, `noise-grain` — always combine with `noise-grain` for texture
- **Glass morphism**: use `.glass-panel` for backdrop blur panels
- **Typography**: `font-sans` = Inter, `font-mono` = JetBrains Mono
- **Micro-typographic classes**: `.text-xxs` (10px), `.tracking-title` (-0.2px), `.tracking-meta` (0), `.tracking-micro` (0.3px)
- **Color palette**: Deck A = `#0091FF` (blue), Deck B = `#FF5500` (orange), Deck C = `#2ECC71` (green), Deck D = `#9B59B6` (purple)
- **Meter colors**: Green `#2ECC71`, Yellow `#F1C40F`, Red `#E54848`
- **Section labels**: 9px mono uppercase with color-coded borders for waveform overlays
- **Numeric displays**: always use `tabular-nums` (via `font-feature-settings: 'tnum' 1`)

### Component Directory Structure

```
src/components/
├── broadcast/    # StreamStatus, ListenerMonitor, ScheduleTimeline, RecordingControls, BroadcastPanel
├── browser/      # BrowserPanel (track library, search, key compat)
├── deck/         # JogWheel, WaveformStrip, WaveformCanvas, DeckInfoPanel, DeckContainer, TransportControls
├── fx/           # FXRack (4-slot, beat-sync, dry/wet)
├── layout/       # MainLayout, TopNavBar
├── mixer/        # MixerChannel (4-ch), Crossfader, StemControls, VUMeter
├── pads/         # PerformancePadGrid (8-mode)
└── ui/           # Button, Fader, Knob, ToastNotification (shared primitives)
```

- **Domain components** go in their domain folder
- **Shared UI primitives** go in `ui/`
- **One component per file** — filename matches export name

### Code Quality & Style Rules

- **Naming**: PascalCase for components and types, camelCase for functions/variables, UPPER_SNAKE for constants
- **File naming**: PascalCase `.tsx` for components, camelCase `.ts` for utilities
- **CSS classes**: kebab-case following BEM-like conventions (`.bg-brushed-metal`, `.animate-rec-pulse`)
- **No inline styles unless values are dynamic** (computed from props/state) — prefer Tailwind classes
- **Box shadows must use `rgba()`** — Tailwind's shadow utilities are not used
- **6px scrollbar width** with custom accent-colored thumb
- **Focus rings**: cyan outline on `:focus-visible` for accessibility

### Development Workflow Rules

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`
- **Dev command**: `npm run dev` (Vite HMR)
- **Build command**: `npm run build` (tsc + vite build — TypeScript MUST pass)
- **Type check**: `npx tsc --noEmit` — run before committing, zero errors required
- **Lint check**: `npm run lint` — ESLint with react-hooks and react-refresh rules
- **Never commit with unused imports** — TS strict will fail the build

---

## DJ Domain Knowledge

AI agents working on this project must understand these domain-specific concepts:

### Audio & Mixing

- **BPM**: Beats per minute — always display with 2 decimal places (`128.00`)
- **Pitch/Tempo**: Percentage deviation from original BPM, displayed as `+0.0%` or `-1.2%`
- **Crossfader**: 0-100 range, 50 = center, controls mix blend between Deck A and B
- **Stems**: Isolated tracks (vocals, drums, bass, melody) for stem separation
- **Phase alignment**: Drift state between two playing tracks — `aligned`, `drift`, `misaligned`

### Musical Key System (Camelot Wheel)

- Keys are displayed in Camelot notation: `1A`–`12A` (minor) and `1B`–`12B` (major)
- **Compatible keys**: same number (A↔B), ±1 position on the wheel
- Key compatibility highlighting in browser: compatible = green, incompatible = dim

### Performance Pads

- 8 modes: HOT CUE, LOOP, ROLL, SLICER, SAMPLER, BEAT JUMP, KEY SHIFT, FX TRIGGER
- 2×4 grid layout, 68px tall pads with contextual labels per mode

### Broadcasting

- **Dayparts**: Morning (6-10), Midday (10-14), Afternoon (14-18), Evening (18-22), Overnight (22-6)
- **Segment types**: Music, Talk, Ad, ID, News, Jingle — each has a CSS class (`.segment-music`, etc.)
- **Legal IDs**: Station identification required at regular intervals
- **60/40 split**: Browser panel (60%) + Broadcast panel (40%) in bottom row

---

## Critical Don't-Miss Rules

### Anti-Patterns to AVOID

- ❌ **Never use `tailwind.config.js`** — all tokens are in `@theme {}` inside `index.css`
- ❌ **Never use `@tailwind base/components/utilities`** — use `@import "tailwindcss"`
- ❌ **Never use enums** — `erasableSyntaxOnly` forbids them; use `as const` objects
- ❌ **Never mutate state directly** — always use setter functions
- ❌ **Never use `useEffect` for synchronous state init** — use `useState(() => initialValue)` factory
- ❌ **Never read `useRef.current` during render** — it can be stale
- ❌ **Never use string colors inline** when a design token exists — use the `--color-*` system
- ❌ **Never hardcode layout heights** — use the `--layout-*-h` CSS variables
- ❌ **Never add a dependency without checking version compatibility** with React 19 and TS 5.9

### Edge Cases

- `@theme` CSS rule generates an expected "unknown at-rule" warning in IDEs — this is NOT an error
- Tauri's `#[command]` macros require Rust backend — frontend mocks audio operations
- The app is designed for 3840×2160 reference but uses percentage-based responsive layout
- `font-feature-settings: 'tnum' 1, 'lnum' 1` is set globally — all numbers are tabular

---

## Usage Guidelines

**For AI Agents:**

- Read this file BEFORE implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Check `index.css` for existing design tokens before creating new ones

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-22
