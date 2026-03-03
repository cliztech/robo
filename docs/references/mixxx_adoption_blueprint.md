# Mixxx Reference Adoption Blueprint for DGN-DJ

## Scope and assumptions

- Upstream reference repository: `https://github.com/mixxxdj/mixxx` (cloned locally to `/workspace/mixxx`).
- This blueprint captures **architecture patterns only**; no Mixxx source code is copied into DGN-DJ.
- Mixxx is GPLv2, so direct code reuse would impose reciprocal licensing requirements; this plan keeps DGN-DJ in a clean-room pattern-first posture.

## Why Mixxx is relevant

Mixxx has solved many of the same hard problems DGN-DJ is targeting:

- Low-latency real-time audio mixing (`src/engine`, `src/soundio`, `src/audio`)
- Broadcast and recording plumbing (`src/broadcast`, `src/recording`, `src/encoder`)
- Track analysis and library scan workflows (`src/analyzer`, `src/library/analysis`, `src/library/scanner`)
- Control surfaces + operator ergonomics (`src/controllers`, `src/waveform`, `src/qml`)

## Recommended adoption tracks

### Track A — Audio engine hardening (highest impact)

Target DGN-DJ subsystems:

- Deck transport synchronization and crossfade timing stability
- Limiter/compressor safety rails in automation mode
- Buffer lifecycle and underflow recovery behavior

Apply from Mixxx patterns:

1. Isolate DSP hot paths from UI/event-loop work.
2. Define explicit engine state machines (running/degraded/recovering).
3. Instrument frame and buffer telemetry for drift detection.

Success criteria:

- p95 deck-sync jitter within target budget under nominal station load
- Zero uncaught audio-thread exceptions during soak tests

### Track B — Broadcast reliability

Target DGN-DJ subsystems:

- Streaming gateway handoff and reconnect behavior
- Encoder failure handling and fallback routing

Apply from Mixxx patterns:

1. Supervised process lifecycle with bounded restart policy.
2. Typed health events from encoder/output stack.
3. Backpressure-aware queueing between engine and network output.

Success criteria:

- Deterministic reconnect sequence after output failures
- No silent-stream windows beyond configured SLO

### Track C — Library analysis and ingestion throughput

Target DGN-DJ subsystems:

- AI track analysis queue
- Metadata normalization and scanner correctness

Apply from Mixxx patterns:

1. Separate scanner/analysis workers from playback-critical path.
2. Use normalized metadata canonicalization before cache fingerprinting.
3. Emit per-track lifecycle events (queued/running/completed/failed/degraded).

Success criteria:

- Stable queue throughput without impacting playback latency
- Predictable cache hit behavior across metadata mutations

### Track D — Controller and operator UX model

Target DGN-DJ subsystems:

- DJ console transport controls
- Keyboard/controller mapping extensibility

Apply from Mixxx patterns:

1. Maintain strict boundary between hardware input adapters and domain actions.
2. Use a typed command bus for deck/mixer actions.
3. Keep waveform/render updates decoupled from control polling loops.

Success criteria:

- No control path deadlocks during rapid cue/play/seek sequences
- Deterministic input mapping behavior across supported devices

## 30/60/90 execution plan

### 0–30 days

- Build a pattern matrix mapping DGN-DJ modules to Mixxx subsystem analogs.
- Add performance baselines for transport jitter, buffer underflow rate, and reconnect MTTR.
- Add architecture decision record (ADR) documenting clean-room pattern adoption constraints.

### 31–60 days

- Implement prioritized Track A and Track B reliability improvements.
- Add targeted stress tests for audio thread + broadcast bridge.
- Wire telemetry dashboards for engine and output health.

### 61–90 days

- Execute Track C and Track D improvements.
- Validate no regressions in automation and playlist generation flows.
- Publish phase-complete verification report with before/after deltas.

## Guardrails

- Never copy Mixxx source into DGN-DJ without explicit legal/licensing review.
- Prefer concept transfer (state models, failure handling, telemetry contracts) over API mirroring.
- Keep DGN-DJ naming/domain language canonical (no product identity drift).
