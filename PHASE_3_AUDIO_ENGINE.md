# Phase 3 - Audio Engine (Day 5-7)

## Goal

Ship a robust browser-based audio engine with crossfading, DSP controls, and analyzer output.

## Components

- `AudioContext` lifecycle manager
- Dual deck playback pipeline (A/B decks)
- Crossfade scheduler and envelope curves
- 5-band EQ + compressor + limiter chain
- Analyzer node for visual metering

## Functional Requirements

- Gapless-ish transitions between tracks.
- Configurable crossfade duration (3s to 15s).
- Smart fade curves: linear, equal-power, energy-aware.
- Safe output ceiling to prevent clipping.

## Recommended Signal Chain

`Source -> Gain -> EQ -> Compressor -> Limiter -> Master Gain -> Destination`

## Edge Cases

- Browser autoplay policy suspends `AudioContext`.
- Decode failures for unsupported audio formats.
- Sample-rate mismatch during quick deck swaps.

## Validation

- Unit tests for crossfade timing and gain envelopes.
- Manual listening pass with varied genres.
- Meter verification for clipping prevention.

Last Updated: February 14, 2026
