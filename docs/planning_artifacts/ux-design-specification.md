---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-dgn-dj-2026-02-18.md
  - docs/planning_artifacts/bmad_deep_research/04_prd.md
  - https://www.virtualdj.com/products/virtualdj/features.html
  - https://rekordbox.com/en/feature/overview/
---

# UX Design Specification DGN-DJ

**Author:** CLIZTECH
**Date:** 2026-02-20

---

## Executive Summary

### Project Vision

DGN-DJ aims to be the **"Operating System for Music Professionals"**, unifying professional DJ performance, radio automation, and Web3 innovation into a single, modular platform.  It aspires to combine the **sub-millisecond responsiveness and stability** of industry standards like Virtual DJ and Rekordbox with a **futuristic, premium aesthetic** and **unprecedented AI autonomy**.  The user interface must feel instantly familiar to pros (using standard layouts and controls) while introducing a novel "AI Co-pilot" paradigm that feels like a collaborative teammate rather than a background process.

### Target Users

1. **Professional DJs:**  Standard club/event DJs who demand low latency, reliability, and familiar layouts (waveforms, decks, library). They value "Pro" features like stem separation and advanced effects.
2. **Radio Broadcasters:** Station managers and hosts who need automation, scheduling, and "lights-out" reliability. They need clear visibility of logs, schedules, and failover states.
3. **Radio Producers/Program Directors:**  Users focused on curating content, managing schedules, and overseeing multiple stations.
4. **Hybrid User (The "DGN-DJ" Pro):**  A new breed of creator who mixes live sets *and* broadcasts them, leveraging AI to handle repetitive tasks while they focus on creativity and audience interaction.

### Key Design Challenges

1. **Complexity vs. Usability:**  Integrating a full DAW-like mixer, radio automation station, and AI agent control center without overwhelming the user.  The UI needs a "Progressive Disclosure" strategy—showing only what's needed for the current context (DJing vs. Broadcasting vs. Planning).
2. **Latency & Responsiveness Perception:** The UI must *feel* native and instant (60fps+), even if the underlying audio engine is doing heavy AI processing.  All visual feedback (metering, waveforms) must be perfectly synced.
3. **Visualizing AI Autonomy:**  Designing a way to show *what the AI is doing* (and why) without distracting the user.  The "AI Co-pilot" needs a dedicated but non-intrusive presence.
4. **Hybrid Native/Web Bridge:**  Ensuring the web-based UI (Tauri) feels exactly like a native C++ app (Rekordbox).  No "webpage" jank; custom context menus, rigid layout capabilities, and smooth animations are critical.

### Design Opportunities

1. **The "AI Sidebar" Paradigm:**  Instead of burying AI settings in menus, give the AI a dedicated "Sidebar" or "Heads-Up Display" where it offers suggestions ("Key match found", "Vocal overlap detected") and accepts natural language commands ("Mix into a high-energy track next").
2. **Context-Aware Workspaces:**  Leverage the modular architecture to create distinct "Perspectives" (like VS Code or Eclipse):
    * **Performance Mode:**  Decks, Mixer, Waveforms (Minimal distractions).
    * **Broadcast Mode:**  Schedule, Logs, Signal Path, Station Status.
    * **Preparation Mode:**  Library, Metadata, Stem Analysis, Playlist Management.
3. **Visual Innovation (The "Glow"):**  Use modern CSS capabilities (glassmorphism/blur, distinct neon gradients) to create a "Next-Gen" feel that sets it apart from the flat/utilitarian look of legacy apps. Update the traditional "gray on gray" with deep, rich dark modes and vibrant accent colors that denote state.
4. **Dual Player & Column View (Inspired by Rekordbox 7):** Adopt the "Dual Player" concept for checking mix compatibility in the library, and "Column View" for Finder-like navigation, as these are proven workflow enhancers.

## Core User Experience

### Defining Experience

The core experience of DGN-DJ is **"Seamless Flow"**.  Whether a user is manually beatmatching on four decks, automating a 24-hour radio schedule, or minting a live set as an NFT, the transition between these modes must be fluid.  The user should never feel like they are "switching apps" or fighting the interface.  The system proactively offers assistance (via the AI Co-pilot) but respects the user's authority as the primary artist/director.

### Platform Strategy

* **Primary Platform:** Windows Desktop (High-performance workstation).
  * **Input:** Mouse/Keyboard + MIDI/HID Hardware (Pioneer DDJ, CDJ, etc.).
  * **Performance:** Uncompromised. Native C++/Rust audio engine is non-negotiable.
* **Secondary Contexts:**
  * **Touch:** UI elements (faders, pads) must be touch-friendly for Microsoft Surface or touchscreen monitor users in a radio booth.
  * **Multi-Monitor:** Native support for detaching the "Broadcast" or "Library" windows to a second screen.

### Effortless Interactions

1. **"One-Click Live":**  Transitioning from "Bedroom Practice" to "Live Broadcast" should be a single toggle, handling all stream encoding and server connections automatically.
2. **Smart Sync:**  Sync implies more than just BPM.  Key matching, phrase alignment, and gain staging should optionally Auto-Sync to let the DJ focus on creativity.
3. **Universal Search:**  A single search bar should query local files, streaming services (Tidal/SoundCloud), and the context-aware AI command prompt simultaneously.
4. **Auto-Mapping:**  Plugging in a supported controller (e.g., DDJ-FLX10) should instantly reconfigure the UI to match the hardware layout without manual mapping.

### Critical Success Moments

1. **The First Mix:**  Within 60 seconds of first launch, a new user should be able to load two tracks and perform a seamless transition.
2. **The "Save" Moment:**  When a radio automation schedule fails (e.g., internet drop), the system seamlessly switches to local fallback without dead air, notifying the user *after* the crisis is averted.
3. **The "Discovery" Moment:**  When the AI suggests a track the user *didn't know they had* but fits perfectly, validating the "Co-pilot" value proposition.

### Experience Principles

1. **Performance First:**  Audio stability and low latency trump all visual candy.  If the audio glitches, the product fails.
2. **Visible Intelligence:**  AI actions must be transparent.  Show *why* a track is suggested or *how* a transition will occur.
3. **Context is King:**  Hide radio automation tools during a live mix; hide performance pads during playlist scheduling.
4. **Dark by Default:**  Designed for dark clubs and late-night studios.  Minimize eye strain with low-glare interfaces and high-contrast active elements.

## 2. Core User Experience / Defining Experience

### 2.1 The Dynamic Autonomy Handoff (The Co-Pilot Handshake)

The defining experience of DGN-DJ is the **"Dynamic Autonomy Handoff."**

It is the singular, fluid moment where the user transfers responsibility for the broadcast to the AI (or takes it back) without a single millisecond of audio interruption. It transforms the relationship from "User vs. Tool" to "Captain and Co-Pilot."

### 2.2 User Mental Model

* **Legacy Model:** "I am either DJing (Manual) OR I am running a script (Automation). Switching stops the flow."
* **DGN-DJ Model:** "I am always the Captain. The AI is my Co-Pilot. I can hand the controls to the Co-Pilot for 10 seconds or 10 hours. I can take them back instantly by touching the wheel."

### 2.3 Novel UX Pattern: "The Autonomy Slider"

Instead of a binary "Auto-DJ On/Off" button, we introduce a continuous vertical slider:

* **0% (Manual):** AI calculates keys/bpm but touches nothing.
* **50% (Assist):** AI syncs beats and gain-stages; User triggers start/stop.
* **100% (Cruise):** AI manages playlist, transitions, and loading.

### 2.4 Magnetic UI Feedback

* **High Autonomy:** UI elements (waveforms, grids) "snap" and look rigid/green.
* **Manual Control:** UI elements look organic/blue and "loose," giving subconscious feedback on system state.

## 3. Visual Design Foundation

*Refined via Party Mode & Advanced Elicitation*

### 3.1 Color System: "DGN-Neon" (Pro)

* **Backgrounds:**
  * `bg-background`: #09090b (Zinc 950) - Deepest black for OLED contrast.
  * `bg-surface`: #18181b (Zinc 900) - Panels.
  * `bg-glass`: `rgba(24, 24, 27, 0.7)` - **Adaptive Glass**. Uses `backdrop-blur` on high-end GPUs, falls back to solid 95% opacity on battery/low-spec to save frames.
* **Primary Accent:**
  * `primary`: #8b5cf6 (Violet 500) - The "DGN/AI" Glow. Indicates intelligent features.
* **Functional Safety Colors:**
  * `status-live`: #ef4444 (Red 500) - **Strictly** for On-Air/Recording.
  * `status-safe`: #10b981 (Emerald 500) - Sync Locked, Broadcast Safe.
  * `status-warn`: #f59e0b (Amber 500) - Clipping, Network Jitter.

### 3.2 Typography System

* **UI/Labels:** `Inter` (Google Fonts). Standard, neutral, highly legible.
* **Data/Timecodes:** `JetBrains Mono` (or `Roboto Mono`).
  * *Why:* Tabular figures are non-negotiable for DJs. Timecodes (00:00:00) must not jitter as numbers change.

### 3.3 Spacing & Layout Density

* **Base Unit:** 4px.
* **Modes:**
  * **Performance (High Density):** `gap-1`. Maximum info density. "Cockpit" feel.
  * **Touch (Hybrid):** Increases critical touch targets (Play, Cue, Faders) to min 44px without sacrificing information density elsewhere.

### 3.5 Inspiration Benchmark: "The Flagship Standard"

*Analysis of Rekordbox 7 & VirtualDJ 2025*

* **Visual Signature:** "High-Definition Reality."
* **Key Characteristics:**
  * **OLED Blacks:** usage of pure #000000 for maximum contrast.
  * **Hardware Navigation:** Left-sidebar navigation mimics CDJ physical buttons (large tap targets, distinct active states).
  * **"Electric Blue" Accent:** A shift to a vibrant, digital blue (approx `#007AFF`) as the primary active state indicator.
  * **Flat but layered:** No drop shadows, but distinct "surface" separation through 1px borders and slight brightness variations.
  * **Data Density:** High. Waveforms are detailed (RGB/3Band), lists are compact.

### 3.6 Selected Direction: "The Hybrid Stitch" (Direction G)

* **Synthesis Strategy:**  Combines the "Reference Standard" precision with "Performance" functionality.
* **Core Philosophy:** "Professional Fidelity with Performance Soul."
* **Visual Pillars:**
  * **Deck Identity:**  Immediate visual separation via color-coded decks.
    * **Deck A:** `Azure Blue (#0091FF)` - Used for Jog Ring, Waveform Tint, and Shift states.
    * **Deck B:** `Magma Orange (#FF5500)` - Used for Jog Ring, Waveform Tint, and Shift states.
  * **Micro-Textures:**
    * **Mixer:** Subtle `brushed-metal-dark` CSS overlay to distinguish the "hardware" zone from the "software" decks.
    * **Glass:** Tinted glass panels (`pro-glass-blue/orange`) for deck containers.
* **Functional Additions:**
  * **Performance Pads:** 8x RGB pads per deck (Hot Cue, Loop, Stem split).
  * **Stem Mute:** Dedicated "Vocals/Drums/Inst/Bass" mute toggles in the mixer strip.
