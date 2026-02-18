# Design Tokens v1

Version: `v1.0.0`  
Status: Draft source of truth for React browser UI migration.

This token spec is anchored to the baseline token guidance and implementation checklist in `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` (Sections 6 and 8), and is intended to be the canonical token contract until `src/styles/tokens.css` exists in-app.

## 1) Color Roles

Use semantic roles, not raw color names, in component APIs.

### Light theme

| Token | HSL value | Usage |
|---|---|---|
| `--color-bg` | `220 23% 97%` | App/page background |
| `--color-surface` | `220 20% 100%` | Cards, panels |
| `--color-surface-2` | `220 18% 95%` | Nested surfaces, hovers |
| `--color-text` | `224 30% 12%` | Primary text |
| `--color-text-muted` | `220 12% 40%` | Secondary labels |
| `--color-border` | `220 16% 84%` | Dividers and outlines |
| `--color-accent` | `199 98% 46%` | Primary interactive emphasis |
| `--color-success` | `152 66% 35%` | Success status |
| `--color-warning` | `36 92% 45%` | Warning status |
| `--color-danger` | `0 72% 50%` | Error/destructive actions |
| `--color-focus-ring` | `199 98% 46%` | Focus-visible ring |
| `--color-overlay` | `224 40% 8% / 0.45` | Modal/sheet backdrop |

### Dark theme

| Token | HSL value | Usage |
|---|---|---|
| `--color-bg` | `224 24% 7%` | App/page background |
| `--color-surface` | `224 20% 11%` | Cards, panels |
| `--color-surface-2` | `224 18% 14%` | Nested surfaces, hovers |
| `--color-text` | `220 20% 96%` | Primary text |
| `--color-text-muted` | `220 12% 70%` | Secondary labels |
| `--color-border` | `224 14% 24%` | Dividers and outlines |
| `--color-accent` | `199 98% 58%` | Primary interactive emphasis |
| `--color-success` | `152 62% 48%` | Success status |
| `--color-warning` | `36 96% 58%` | Warning status |
| `--color-danger` | `0 85% 64%` | Error/destructive actions |
| `--color-focus-ring` | `199 98% 58%` | Focus-visible ring |
| `--color-overlay` | `224 40% 2% / 0.62` | Modal/sheet backdrop |

## 2) Typography Scale

| Token | Value |
|---|---|
| `--font-family-sans` | `Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif` |
| `--font-size-100` | `12px` |
| `--font-size-200` | `14px` |
| `--font-size-300` | `16px` |
| `--font-size-400` | `18px` |
| `--font-size-500` | `20px` |
| `--font-size-600` | `24px` |
| `--font-size-700` | `30px` |
| `--line-height-tight` | `1.2` |
| `--line-height-regular` | `1.4` |
| `--line-height-relaxed` | `1.6` |
| `--font-weight-regular` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |

## 3) Spacing Scale

4px base grid.

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

## 4) Radius

| Token | Value |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` |
| `--radius-pill` | `999px` |

## 5) Elevation

| Token | Value | Usage |
|---|---|---|
| `--elevation-0` | `none` | Flat background |
| `--elevation-1` | `0 2px 8px hsl(220 30% 10% / 0.12)` | Inputs and low emphasis cards |
| `--elevation-2` | `0 6px 20px hsl(220 30% 8% / 0.18)` | Popovers and dropdowns |
| `--elevation-3` | `0 14px 34px hsl(220 30% 6% / 0.28)` | Modals and command palette |

## 6) Interaction States

State model applies to all interactive primitives (`button`, `tab`, `input`, `row`, `card-action`).

| State | Tokenized behavior |
|---|---|
| Default | Surface + text + border tokens only |
| Hover | Shift to `surface-2`; optional +2–4% contrast boost |
| Focus-visible | 2px focus ring using `--color-focus-ring`; do not rely on color-only changes |
| Active/Pressed | 1px translate down or contrast bump; preserve ring if keyboard-focused |
| Disabled | 40–55% content opacity + blocked pointer interactions |
| Error | Border/text/icon move to `--color-danger`; helper text always visible |

## 7) Versioning + Change Control

- File path: `docs/ui/design_tokens_v1.md`
- Versioning rule: semantic version; additive token updates are minor, renamed/removed tokens are major.
- Migration rule: components may not introduce one-off hex/HSL values once mapped to this token set.
- Next implementation step: mirror this file to runtime `src/styles/tokens.css` when React UI scaffold lands.
