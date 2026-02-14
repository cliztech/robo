# Phase 3 — Audio Engine (Day 5–7)

## Goals

- Build resilient browser audio pipeline
- Support gapless playback + crossfade

## Engine Design

- `AudioContext` lifecycle manager
- Dual-deck source architecture for crossfades
- Gain staging per deck + master bus
- 5-band EQ, compressor, limiter
- Analyser nodes for UI meters/visualizer

## Crossfade Modes

1. **Linear** — fast and predictable
2. **Equal Power** — smoother perceived loudness
3. **Energy-Aware** — uses track energy/BPM metadata

## Browser Constraints

- Resume suspended `AudioContext` on first user gesture.
- Preload next buffer to avoid decode stalls.

## Validation

```bash
pnpm test -- audio-engine
pnpm test -- crossfade
```

## Exit Criteria

- No audible gaps under normal network conditions
- Meter output and waveform updates in real time

_Last updated: 2026-02-14_
