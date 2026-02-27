# Design Tokens v1

Version: `v1.1.0`  
Status: Active runtime contract for `src/styles/tokens.css`.

## Scope

This document defines the color token contract consumed by the DJ console UI. The runtime source of truth is `src/styles/tokens.css`.

## Token Model

`tokens.css` is split into two layers:

1. **Base semantic tokens** (`--color-*`) on `:root`.
2. **Skin overrides** in `[data-skin='...']` blocks that only override semantic roles.

Legacy aliases (`--bg`, `--accent`, `--deck-a`, etc.) are compatibility shims and must map to semantic roles in one canonical table.

## Required Token Set (Third-Party Skins)

Any third-party skin **must** provide values for this complete semantic set via `[data-skin='your-skin-name']`:

- `--color-bg`
- `--color-bg-elevated`
- `--color-surface`
- `--color-surface-2`
- `--color-surface-3`
- `--color-text`
- `--color-text-muted`
- `--color-text-dim`
- `--color-accent`
- `--color-accent-2`
- `--color-accent-3`
- `--color-danger`
- `--color-danger-bright`
- `--color-warning`
- `--color-warning-hot`
- `--color-deck-a`
- `--color-deck-b`
- `--color-deck-mic`
- `--color-deck-aux`
- `--color-deck-master`
- `--color-wave-a`
- `--color-wave-b`
- `--color-waveform-played-strong`
- `--color-waveform-played-mid`
- `--color-waveform-played-low`
- `--color-waveform-unplayed-strong`
- `--color-waveform-cue-default`
- `--color-waveform-cue-highlight`
- `--color-waveform-cue-info`
- `--color-control-border`
- `--color-control-border-strong`
- `--color-control-press`
- `--color-control-active`
- `--color-control-focus`
- `--color-control-disabled`
- `--color-grid-major`
- `--color-grid-minor`

### Skin authoring rules

- Override `--color-*` only; do not remap legacy aliases directly.
- Keep channel format compatible with `hsl(var(--token))` usage (HSL channels only).
- If a token is intentionally identical to another role, alias it explicitly (`--color-wave-a: var(--color-deck-a)`).
- Preserve contrast and accessibility for text, focus, and warning/danger states.

## Validation

Use token lint before commit:

```bash
npm run check:tokens
```

The check fails on unresolved `var(--*)` references so skins cannot reference missing tokens.

## Change Control

- **Minor:** additive token introduction with backwards-compatible aliases.
- **Major:** token removal/rename or alias contract break.
- All token contract changes must update this document and pass `npm run check:tokens`.
