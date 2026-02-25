# DJ Broadcasting System GUI Prototype (Draft)

## Context

This document captures the React prototype provided for a **desktop-first broadcast console UI** inspired by Rekordbox-style workflows. The prototype is intentionally UI-only scaffolding (no audio engine wiring).

## Prototype intent

- Dual deck transport (`Deck A` / `Deck B`) with waveform placeholders
- Mixer channel strips with EQ, gain, HPF, fader, and duck-send
- Broadcast control strip (`On Air`, `Record`, `Panic Mute`, loudness readouts)
- Rundown/segment timing with auto-advance
- Dock tabs (`Library`, `Cart Wall`, `Event Log`)
- Hotkeys (Space, M, Shift+M, Ctrl+Enter, F)

## Integration notes for this repository

The pasted prototype references `@/components/ui/*` (shadcn-style primitives) that do not currently exist in this codebase. Existing UI primitives live under:

- `src/components/primitives/`
- `src/components/shell/`
- `src/components/console/`

Before implementation, either:

1. Add compatible `src/components/ui/*` components, or
2. Port prototype to existing `primitives` + `shell` component stack.

## Syntax normalization checklist

The provided snippet included formatting loss from transport (template literal interpolation and className strings). The following corrections are required when implementing:

- `return ${mm}:${ss};` → ``return `${mm}:${ss}`;``
- `style={{ width: ${v * 100}% }}` → ``style={{ width: `${v * 100}%` }}``
- `style={{ left: ${p * 100}% }}` → ``style={{ left: `${p * 100}%` }}``
- `className={h-3 w-3 ${ok ? ...}}` → ``className={`h-3 w-3 ${ok ? ...}`}``
- `setLog((l) => [Recording ${!recording ? ...}` → ``setLog((l) => [`Recording ${!recording ? ...}`])``
- `items.filter((x) => ${x.title} ... )` → ``items.filter((x) => `${x.title} ...`)``

## Status

- Prototype source captured and scoped for later implementation.
- No runtime/frontend wiring changes were applied in this commit.
