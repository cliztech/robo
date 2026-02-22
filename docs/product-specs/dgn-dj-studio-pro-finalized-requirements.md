# DGN-DJ Studio Pro — Finalized Product Requirements

## 1. Product Overview

DGN-DJ Studio Pro is a hardware-emulation, performance-grade DJ platform with:

- Club-standard workflow (CDJ + DJM inspired)
- Integrated streaming services
- Real-time AI stem separation
- Touch-optimized interaction
- 2-deck base, scalable to 4 decks
- GPU-accelerated audio + inference pipeline

**Primary positioning:** Professional DJ performance system with AI-enhanced live production capability.

---

## 2. Core System Requirements

### 2.1 Audio Engine

- 24-bit / 48kHz minimum
- 64-bit internal mixing engine
- End-to-end latency target: < 5 ms (audio path)
- No blocking operations on audio thread
- Dedicated real-time audio thread (highest priority)
- Configurable buffer sizes
- ASIO (Windows), Core Audio (macOS/iOS)

### 2.2 Thread Architecture

Separate execution domains:

1. Audio Thread (real-time priority)
2. Stem Inference Thread Pool
3. Streaming Thread
4. Background Analysis Thread (BPM/Key)
5. UI Thread

No shared blocking resources between threads.
Audio thread must never wait on inference or network.

---

## 3. Streaming Integration

### 3.1 Supported Services (Launch Scope)

- Beatport Streaming
- Beatsource
- SoundCloud Go+
- TIDAL (if licensing permitted)

Architecture must support modular addition of new services.

### 3.2 Streaming Functional Requirements

- Unified local + streaming library
- Visual distinction for streamed tracks
- Cloud playlist sync
- Buffered playback (30–60 seconds minimum pre-buffer)
- Automatic network reconnection handling
- Offline locker mode (if licensing allows)

### 3.3 Streaming Performance Requirements

- Streaming must not block audio thread
- Preload next track while current is playing
- Adaptive quality based on bandwidth
- Seamless playback if connection drops (buffered continuation)
- Local caching of:
  - BPM analysis
  - Key detection
  - Beatgrid
  - Cue points

---

## 4. Real-Time Stem Separation

### 4.1 Stem Capabilities (Per Deck)

Four stems:

- Vocals
- Drums
- Bass
- Melody/Other

Per-stem controls:

- Volume fader
- Mute (latching)
- Solo (momentary + latch)
- Double-tap reset

### 4.2 Performance Targets

- Stem latency target: < 30 ms total
- Inference latency target: < 20 ms
- CPU overhead target: < 20% per active deck
- Stable under 4-deck load
- No audible glitching under heavy FX + stems

### 4.3 Model Strategy

- Canonical model format: ONNX
- Inference runtime: ONNX Runtime

Execution provider hierarchy:

- **Windows NVIDIA:** TensorRT → CUDA → DirectML → CPU
- **Windows AMD/Intel:** DirectML → CPU
- **Apple:** Metal / MPSGraph → CPU
- **Linux (if supported):** CUDA → CPU

Model strategy:

- Lightweight MDX-style frequency-domain model
- Quantized (FP16 / INT8 where viable)
- Hybrid pipeline:
  - Higher quality analysis on load
  - Streaming lightweight inference during playback

### 4.4 Scaling Strategy (4 Decks)

Priority-based quality scaling:

- Active audible decks = highest quality
- Queued decks = reduced quality
- Muted decks = inference suspended

Additional constraints:

- GPU batching when possible
- Pre-allocated memory buffers at launch
- No dynamic allocation during performance

Fallback hierarchy:

1. Hold last valid stem frame
2. Crossfade to full mix
3. Disable stems on affected deck
4. UI notification

---

## 5. Stem Artifact Control

### 5.1 Overlap-Add Processing

- Chunk size: 512–8192 samples (configurable)
- Overlap: 25–50%
- Windowed crossfade (equal-power or sqrt-Hann)
- Edge de-weighting to suppress boundary artifacts

### 5.2 Gain Smoothing

- Stem fader smoothing: 10–30 ms
- Mute/unmute fade: 30–60 ms
- Solo isolate fade: 50–120 ms
- No instantaneous gain steps allowed

### 5.3 Scratch Protection Mode

If rapid jog motion is detected:

- Temporarily reduce stem intensity internally
- Crossfade toward full mix during scratch
- Smooth return to stems after motion stabilizes

### 5.4 Transient Guard (Drums)

- Preserve kick/snare transients
- Short gain smoothing
- Optional lightweight post-processing filter

---

## 6. Hardware-Emulation UI Requirements

### 6.1 Deck Layout (CDJ Inspired)

Per deck:

- Large jog wheel with LED ring
- OLED center display (BPM, Key, Time, Pitch)
- Play/Pause (LED)
- Cue (LED)
- Loop In/Out
- Auto loop
- Slip mode
- Pitch fader (100mm visual equivalent)
- Pitch range selector

### 6.2 Mixer Layout (DJM Inspired)

Per channel:

- Trim (Gain)
- 3-band EQ (full kill)
- Dedicated Filter
- 60mm channel fader
- Channel VU
- Cue select

Master section:

- Crossfader (adjustable curve)
- Master VU
- Booth level
- Headphone cue mix
- Headphone level

---

## 7. Touch Optimization

### 7.1 Touch Targets

- Primary buttons: ≥ 80 px
- Knobs: ≥ 60 px
- Faders: ≥ 20 px width
- Performance pads: ≥ 60 px with 8 px spacing

### 7.2 Gesture Mapping

- Tap = trigger
- Double tap = reset
- Vertical swipe = knob rotation
- Drag = fader
- Circular gesture = jog scratch
- Long press = momentary mute/solo

### 7.3 Visual & Haptic Feedback

- LED glow on activation
- Press-depth animation
- Micro-interaction (120–300 ms)
- Optional haptic feedback (supported devices)

---

## 8. Performance Pads (8 Per Deck)

Modes:

- Hot Cue
- Loop Roll
- Beat Jump
- Sampler
- Slicer

Pad states:

- Idle
- Active
- Latched
- Disabled

All transitions use equal-power fades to prevent artifacts.

---

## 9. FX Engine

- 3 simultaneous FX units
- Wet/Dry control
- Beat sync
- Channel routing
- No phase drift allowed

Initial FX types:

- Reverb
- Delay
- Echo
- Flanger
- Phaser
- Filter
- Roll

---

## 10. System Performance Requirements

- GPU-accelerated waveform rendering
- Touch response < 16 ms
- Stable 4-deck playback for 4+ hours
- Memory cap target: < 1.5 GB
- No audio dropouts under load

---

## 11. Hardware Integration

- MIDI mapping system
- Plug-and-play compatibility:
  - Pioneer
  - Rane
  - Denon
- Custom mapping editor
- HID mode support (future phase)

---

## 12. Modes of Operation

### Classic Mode

- Safe defaults
- Automatic artifact masking
- Performance lock enabled

### Performance Mode

- Stem pads + macros
- Scratch protection active

### Studio Mode

- Maximum manual control
- Reduced automatic masking

---

## 13. Scalability Roadmap

### Phase 1

- 2 decks
- Real-time stems
- 2 FX units
- Streaming integration

### Phase 2

- 4 decks
- Advanced FX routing
- Stem recording
- AI harmonic assist

### Phase 3

- Cloud sync
- AI transition suggestions
- Hardware ecosystem expansion

---

## 14. Reliability & Safeguards

- No blocking calls in audio thread
- Automatic load scaling
- GPU fallback logic
- Graceful degradation under overload
- Autosave cue/loop metadata
- Recovery mode after crash

---

## 15. Minimum Hardware Target

Recommended:

- 16GB RAM
- 6-core CPU minimum
- Dedicated GPU recommended
- SSD storage

Performance modes:

- Standard
- Performance (reduced visuals)
- Studio (max quality inference)

---

This document represents the finalized product requirements baseline for engineering handoff.

If required, this can be converted into:

- Sprint breakdown plan
- Technical architecture whitepaper
- Controller hardware design spec
- Investor-grade positioning document
