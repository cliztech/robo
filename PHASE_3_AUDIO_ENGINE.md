# Phase 3 - Audio Engine (Day 5-7)

## Goal

Implement production-grade browser audio playback with seamless transitions, DSP controls, and reliability under continuous playback.

## Deliverables

- `AudioEngine` class (`src/lib/audio/engine.ts`)
- Crossfade algorithms (`src/lib/audio/crossfade.ts`)
- Analyzer + metering (`src/lib/audio/analyzer.ts`)
- React hook wrapper (`src/hooks/useAudioEngine.ts`)
- UI components for mixer, EQ, meters, waveform

## Audio Graph

Recommended node chain:

`Source -> Trim Gain -> EQ(5 bands) -> Compressor -> Limiter -> Master Gain -> Destination`

Parallel taps:
- `AnalyserNode` for FFT/scope visualizations
- Level meter node for RMS/peak

## Crossfade Algorithms

## 1) Equal-power fade (default)
- Use cosine/sine gain curves.
- Avoid perceived dip at midpoint.

## 2) Linear fade (compatibility)
- Simpler, less natural.

## 3) Beat-aware fade (advanced)
- Align incoming track to nearest beat grid using BPM + downbeat offset.
- Expand fade window for mismatched BPM.

## Engine Requirements

- Preload next track before transition starts.
- Schedule transitions using `AudioContext.currentTime`.
- Handle decoding errors with fallback skip logic.
- Resume suspended contexts on user interaction.
- Track playback state (`idle`, `buffering`, `playing`, `crossfading`, `error`).

## DSP Defaults

- EQ bands: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
- Compressor: threshold -18dB, ratio 3:1, attack 0.003s, release 0.25s
- Limiter: threshold -1dB (ceiling)
- Master headroom target: -6dB

## Performance Targets

- Initial start latency < 250ms after user interaction.
- Crossfade drift < 20ms.
- CPU utilization acceptable on mid-tier laptops.
- No audible clicks/pops during transitions.

## Test Plan

Unit tests:
- Gain curve correctness
- Crossfade timing math
- State machine transitions

Integration tests:
- Queue handoff across 10 consecutive tracks
- Engine recovery after decode error

Manual QA:
- Browser autoplay constraints (Chrome/Safari/Firefox)
- Headphone and speaker output consistency

## Verification

```bash
pnpm test -- audio-engine
pnpm test -- crossfade
pnpm type-check
```

## Exit Criteria

- Stable continuous playback for 4+ hours in QA run.
- All planned DSP controls exposed in UI.
- Crossfade modes selectable per station or playlist.

Last Updated: February 14, 2026
