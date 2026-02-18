# Style Signals

This document captures visual style cues from the benchmark set and translates them into reusable guidance.

## Typography

- Favor compact, high-legibility sans-serif labels for dense operator surfaces.
- Use heavier weight only for active transport/state indicators and section headers.
- Keep uppercase usage constrained to compact utility controls (FX modes, toggle chips, short deck labels).

## Spacing density

- Deck and mixer surfaces should feel dense-but-readable: tight vertical stacking with predictable horizontal alignment.
- Browser surfaces should preserve row rhythm and avoid uneven gutters between metadata columns.
- Use consistent spacing ladders so repeated controls (pads, knobs, playlist rows) scan quickly.

## Color accents

- Reserve saturated accents for state signaling (playing, armed, selected, warning) rather than decorative fill.
- Keep neutral dark bases for workspace surfaces to preserve waveform, meter, and cursor contrast.
- Apply accent colors consistently by control family (transport vs. browser selection vs. performance pads).

## Panel borders and containment

- Use panel borders to separate functional zones (deck, mixer, browser, sampler) rather than to decorate.
- Prefer subtle border contrast over heavy bevel effects.
- Keep nested borders shallow; avoid multi-ring framing that increases visual noise.

## Icon tone

- Icons should read as operational controls first: simple glyphs, high contrast, low ornamentation.
- Maintain a consistent icon stroke/fill treatment across transport, effects, and browser actions.
- Avoid mixing highly skeuomorphic icons with flat glyph systems in the same panel.

## Do / Don’t anchors

### Do

- `ProMarked.png`: use clear zone boundaries and restrained contrast jumps.
- `EssentialsMarked.png`: preserve reduced-complexity hierarchy for onboarding/entry modes.
- `MixerMain.png`: keep fader/knob affordances visually distinct with consistent control silhouettes.

### Don’t

- `StarterMarked.png`: do not let simplified layouts collapse crucial state visibility.
- `skins.png`: do not introduce custom skin flourishes that weaken consistency.
- `keyfeatures2.png`: do not over-highlight promotional callouts inside production operator surfaces.
