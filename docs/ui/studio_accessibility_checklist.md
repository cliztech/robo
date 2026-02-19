# Studio Accessibility Checklist (Interactive Controls)

## Keyboard interaction checks

### Deck controls (`decks` + dashboard waveform/effect/beat controls)
- Tab to each waveform cue button and trigger with `Enter`/`Space`.
- Tab to each FX knob and adjust with:
  - `ArrowUp` / `ArrowRight` to increase
  - `ArrowDown` / `ArrowLeft` to decrease
  - `Home` to set min, `End` to set max
- Tab through beat-grid cells and verify each step toggles with `Space` and exposes `aria-pressed`.
- Tab to mode buttons (`SNGL`, `CONT`) and verify pressed state via `aria-pressed`.

### Mixer / faders (`mixer`)
- Tab through each EQ knob, PAN knob, vertical fader, Mute, Solo in channel order.
- Verify all slider controls can be adjusted with arrow keys.
- Verify Mute and Solo announce state changes via `aria-pressed`.
- Verify crossfader is keyboard adjustable and labeled as `Crossfader`.

### Timeline selection (`schedule` + dashboard schedule panel)
- Tab to timeline navigation buttons and activate with keyboard.
- Tab through visible segments and select with `Enter`/`Space`.
- While focused on a segment, press `ArrowLeft`/`ArrowRight` to move focus/selection to adjacent segments.
- Confirm selected segment exposes pressed state (`aria-pressed=true`).

### Transport actions (bottom transport bar)
- Tab through Shuffle, Previous, Play/Pause, Next, Repeat, and Mute.
- Verify shuffle/repeat/mute/play-pause controls expose pressed state via `aria-pressed`.
- Verify progress and volume sliders are keyboard-adjustable and explicitly labeled.

## Expected focus order by view

### Global shell
1. Sidebar nav icons (top-to-bottom)
2. Sidebar utility icons (`Monitor`, `Settings`)
3. Topbar alert button
4. On-air toggle
5. Active view content
6. Bottom transport controls

### Decks view
1. Deck A waveform + cue buttons
2. Deck A FX controls (lock/reset, knobs, presets)
3. Deck B waveform + cue buttons
4. Deck B FX controls
5. Beat Grid steps, then mode buttons
6. Transport bar controls

### Mixer view
1. Channel strip controls left-to-right (EQ knobs → fader → pan → mute/solo)
2. Master strip controls
3. Crossfader
4. Transport bar controls

### Schedule view
1. Timeline range navigation buttons
2. Timeline segments in visual left-to-right order
3. Detail panel content (read-only)
4. Transport bar controls

