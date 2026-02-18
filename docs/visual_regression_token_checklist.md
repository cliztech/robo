# Visual Regression Checklist: Token Usage Consistency

Use this checklist when reviewing browser UI snapshots to ensure primitives and shell surfaces only consume approved token variables.

## Token Coverage Checks
- [ ] Backgrounds use `hsl(var(--color-bg|--color-surface|--color-surface-2))` and do not use hard-coded color values.
- [ ] Text uses `hsl(var(--color-text))` or `hsl(var(--color-text-muted))` only.
- [ ] Interactive accents use `hsl(var(--color-accent))` only.
- [ ] Spacing uses `var(--space-*)` tokens only.
- [ ] Corner rounding uses `var(--radius-sm|--radius-md|--radius-lg)` only.
- [ ] Elevation uses `var(--shadow-soft)` only.

## Theme Mapping Checks
- [ ] `data-theme="light"` snapshots match light semantic values.
- [ ] `data-theme="dark"` snapshots match dark semantic values.
- [ ] `data-theme="auto"` snapshots are captured under both system light and system dark preferences.
- [ ] Focus rings and hover states preserve contrast in all themes.

## Primitive Component Checks
- [ ] `button` renders with accent background, token spacing, and token radius.
- [ ] `icon-button` renders with token surface/background, token shadow, and square token-based dimensions.
- [ ] `input` renders with token border, text, placeholder, and spacing.
- [ ] `tooltip` renders with token surface layering, token border, and token shadow.

## Motion Token Consistency Checks
- [ ] Motion durations map to `motion.durationMs` values.
- [ ] Easing curves map to `motion.easing` values.
- [ ] Reduced-motion mode uses opacity-only transitions and 80–140ms durations.

## Snapshot Matrix
Capture at minimum:
1. Primitives gallery in dark theme.
2. Primitives gallery in light theme.
3. Primitives gallery in auto theme with system dark.
4. Primitives gallery in auto theme with system light.
5. Focus-visible states for each primitive.
6. Hover and disabled states for buttons.
