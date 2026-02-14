# Phase 3 — Audio Engine (Day 5–7)

## Objectives

- Build a robust browser playback engine
- Support crossfades, EQ, compression, and metering
- Expose reliable hooks for UI controls

## Architecture

- `AudioContext` lifecycle managed in a dedicated engine class
- Node chain per deck: source -> gain -> EQ -> compressor -> limiter -> destination
- Analyser nodes for frequency/time-domain visualizations

## Crossfade Modes

- **Linear**: basic gain ramp
- **Equal Power**: perceptually smoother transition
- **Beat-Aware (optional)**: align transition windows near beat boundaries

## Key Implementation Notes

- Resume suspended contexts on first user interaction
- Preload next track to avoid decode gaps
- Use short scheduler lookahead (e.g., 100–250ms)
- Clamp gain automation to prevent clipping

## Validation

```bash
pnpm test tests/unit/audio-engine.test.ts
pnpm test tests/unit/crossfade.test.ts
```

## Exit Criteria

- Gapless transitions under nominal conditions
- Crossfade mode selectable at runtime
- Metering/visualizer updates in near real-time
