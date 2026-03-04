# Equipment Interaction Model

Status: Draft for design pod adoption  
Scope: DJ console hardware realism and live-broadcast operational safety

## 1. Deck, Cue, and Headphone Workflows

### 1.1 Deck transport model

- **Deck states:** `stopped`, `armed`, `playing`, `paused`, `cue_hold`, `error`.
- **Primary controls:** play/pause toggle, cue set, cue return, nudge ±, pitch bend ±, load/replace guard.
- **Behavioral contracts:**
  - Cue set stores an absolute frame/beat anchor and is idempotent until explicitly replaced.
  - Cue return jumps to cue anchor and pauses transport unless hold-to-audition is active.
  - Hold-to-cue (momentary) plays only while held and snaps to anchor on release.
  - Load/replace while live requires explicit arming gesture to prevent accidental deck replacement.

### 1.2 Cue and monitor routing

- **PFL/CUE model:** per-deck cue toggle feeds headphone bus independent of program bus.
- **Headphone mix control:** crossfades headphone monitor between CUE bus and program/master bus.
- **Split-cue mode (optional):** left channel = CUE bus, right channel = program bus.
- **Operator feedback:** cue status requires always-visible, high-contrast indicators on deck and mixer strip.

### 1.3 Live-ops keyboard parity

- Every pointer-critical action in deck/cue flow must have keyboard equivalence.
- One-hand action clusters (left hand or right hand only) must cover:
  - play/pause,
  - cue set/return,
  - headphone cue toggle,
  - temporary duck/talkover trigger,
  - emergency stop/abort.

## 2. Mixer Channel Strip Semantics

### 2.1 Channel strip state model

- **Channel states:** `off`, `on-air`, `pfl`, `muted`, `clipping`, `fault`.
- **Semantics:**
  - `ON` routes channel to program bus.
  - `PFL` routes pre-fader signal to cue bus without program routing side effects.
  - `MUTE` removes signal from both program and cue buses unless explicit PFL override is enabled.
  - Fader level follows logarithmic dB law visualization with unity marker and clip warning margin.

### 2.2 Metering and gain staging contracts

- Pre-fader and post-fader metering should be distinguishable.
- Clip warning threshold and sustained-over threshold must be visually distinct.
- Gain adjustments require immediate visual feedback plus optional coarse/fine keyboard increments.

### 2.3 Safety controls

- Destructive channel actions (hard mute all, source swap, hot-load) require confirmation mode or reversible timeout window.
- Channel lock mode prevents accidental fader/route mutation while preserving metering visibility.

## 3. Broadcast Chain Interaction Model

## 3.1 Signal path and operator observability

Canonical chain:

1. **Mic processor** (gate/comp/EQ/limiter state)
2. **Playout engine** (deck/mixer composite output)
3. **Encoder** (codec, bitrate, reconnect state)
4. **Stream health** (upstream ingest + listener-facing continuity)

UI must expose chain stage status as:

- `healthy`, `degraded`, `recovering`, or `failed`
- last transition timestamp
- recommended operator action for each non-healthy state

### 3.2 Degradation semantics

- **Mic processor degraded:** highlight dynamics safety risk and recommend fallback profile.
- **Playout degraded:** mark transport reliability risk and suggest deck failover or safe-loop mode.
- **Encoder degraded:** show retry backoff timer and expected impact on live listeners.
- **Stream health degraded:** surface packet-loss/dropout indicators and escalation path.

## 4. Error Recovery Playbooks

### 4.1 Encoder stall or crash

1. Detect encoder heartbeat timeout and transition state to `failed`.
2. Auto-trigger bounded restart loop with backoff and visible countdown.
3. Keep local playout active; show “off-air risk” banner until stream recovers.
4. On repeated failure threshold, prompt operator for fallback output profile.

### 4.2 Deck source load failure

1. Freeze deck controls for failed load target only.
2. Maintain current on-air deck unaffected.
3. Offer retry, alternate source selection, and rollback to last-good track metadata.
4. Log incident token for post-show review.

### 4.3 Mixer channel clipping incident

1. Raise immediate strip-level clip alert.
2. Provide one-key “safe attenuation” action with bounded dB reduction.
3. Keep operator-visible before/after meter comparison.
4. Require explicit release from safe mode to prevent unnoticed persistent attenuation.

### 4.4 Cue bus routing mismatch

1. Detect mismatch between selected cue source and active headphone path.
2. Offer “sync cue routing” corrective action.
3. Preserve user’s prior split-cue preference after recovery.

## 5. Design Acceptance Criteria for Realism

### 5.1 Cue/monitor latency expectations

- Cue preview audible feedback should begin within **<=20 ms target, <=35 ms hard ceiling** from control actuation under nominal load.
- Program-to-headphone monitor blend adjustments should feel continuous with no discontinuity artifacts exceeding a single control frame.
- Any latency beyond ceiling must raise degraded-state telemetry and operator notice.

### 5.2 Accidental-trigger prevention

- Deck replace/load-on-air requires explicit arm state or two-step confirmation.
- Emergency actions must be intentionally discoverable but protected from adjacent-key accidental activation.
- Safety-critical controls require distinct visual affordance and keyboard chord separation from routine transport keys.

### 5.3 One-hand keyboard workflows for live ops

- Minimum one-hand workflows must complete for:
  - cue set + hold audition + cue return,
  - on-air deck swap,
  - quick-talkover/duck,
  - encoder recovery acknowledge.
- No required live-op sequence may force simultaneous two-hand reach across distant key zones.
- Focus and shortcut conflicts must be deterministic and documented in keyboard map artifacts.

## 6. Integration Notes

- This model is normative for DJ console design pod review and pre-PR design acceptance.
- Specialist ownership is split between:
  - `dj-hardware-specialist` for deck/cue/headphone realism,
  - `radio-control-room-specialist` for mixer/broadcast-chain/recovery realism.
