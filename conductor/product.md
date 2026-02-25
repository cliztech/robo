# AetherRadio — Product Definition (product.md)

## 0. Document Purpose
This file is the **product single-source definition** for AetherRadio: vision, target users, UX, feature set, system architecture, performance targets, and phased roadmap.
It is written to be directly actionable for engineering, design, and agent-driven planning.

---

## 1. Vision
AetherRadio is a next-generation AI-powered radio automation platform that democratizes professional broadcasting.
It aims to surpass industry leaders like VirtualDJ and Rekordbox by combining:
- professional-grade manual mixing controls, and
- an industry-leading AI agent capable of **0–100% autonomous operation**.

It enables users—from hobbyists to commercial networks—to run **24/7 internet radio stations** with:  
- intelligent playlist generation,
- seamless crossfading,
- real-time audio processing,
- stable streaming via Icecast integration,
- modern, hardware-inspired UI.

---

## 2. Target Users
1) **Professional Radio DJs / Station Managers**
- show planning, clock-based scheduling, automation reliability, compliance, metadata accuracy

2) **Hobbyist Streamers / Podcasters**
- quick start, guided automation, low setup friction, great UX

3) **Automated / Unmanned Operators (24/7 stations)**
- minimal intervention, health monitoring, failover, robust streaming

4) **Commercial Radio Networks**
- multi-station scaling, multi-stream orchestration, RBAC, analytics, reliability

5) **World-Class Music Industry Professionals**
- low-latency performance, high audio quality, deep DJ controls, hardware integration

---

## 3. Core Value Propositions
### 3.1 Intelligent Automation
- AI-driven track selection + playlist generation reduces manual workload
- Autonomy from “assistive” to “fully automated DJ”

### 3.2 Professional Audio Quality
- Web Audio API-powered engine (initial) with:
  - 5-band EQ
  - compression
  - limiting
- Roadmap: optional native/WASM DSP for deterministic low latency

### 3.3 Seamless Broadcasting
- Reliable Icecast integration for stable 24/7 streaming
- Roadmap: Shoutcast + multi-format encoding (AAC/AAC+), robust metadata injection, RDS

### 3.4 Modern UX
- Dark-themed, hardware-style UI
- Drag-and-drop workflows, real-time visualizations

### 3.5 Industry-Leading AI Agent
- Human-like precision transitions + creative programming
- Adaptive learning + real-time decision-making

---

## 4. Key Features (MVP ? Pro)
### 4.1 AI Playlist Generation
- Inputs:
  - genre, mood, tempo/BPM, energy, era, rules (no repeats), station identity
- Outputs:
  - playable queue + “why this track” rationale
  - dynamic rotation and category balancing

### 4.2 Advanced Audio Engine
- Dual-deck playback with:
  - crossfading (curves)
  - beatmatching (sync/manual)
  - cue points, hot cues, looping
  - real-time metering
- Roadmap:
  - advanced beatgrid editing
  - FX racks/chains
  - stem separation (real-time isolation + FX per stem)

### 4.3 Live Broadcasting
- Icecast integration:
  - mountpoints, reconnect strategy
  - metadata (artist/title), fallback “now playing”
- Roadmap:
  - multi-format encoding (MP3/AAC/AAC+)
  - Shoutcast
  - RDS integration (where applicable)
  - multi-stream orchestration (network tier)

### 4.4 Smart Analytics
- Listener stats:
  - current listeners, peak, avg session length, geo (if available), client types
- Track performance:
  - plays, skips, retention around transitions, time-of-day performance

### 4.5 Media Management
- Cloud-based storage (optional) + local library
- Uploads, organization, tagging, smart crates
- Roadmap:
  - large library optimization (10k–100k+ tracks)
  - fast search + filtering
  - import/export, metadata tagging

### 4.6 Autonomous AI Agent (0–100%)
- Modes:
  - 0%: manual DJ (classic deck control)
  - 25%: AI recommends next tracks + transition suggestions
  - 50%: AI builds sets/blocks, user approves
  - 75%: AI runs station, user can override
  - 100%: fully autonomous with monitoring + emergency rules
- Real-time decisions:
  - transition type, crossfade length, FX usage (if enabled), energy shaping, category rotations
- Adaptive learning:
  - learns station style and constraints from operator feedback and analytics

---

## 5. UX & Design Principles (GUI Spec Level)
### 5.1 Visual Style
- Professional DJ aesthetic inspired by Rekordbox / VirtualDJ
- Dark theme, high contrast, low-light usability
- Hardware metaphors: knobs, faders, jog wheels (visual + interactive)

### 5.2 Layout: Core “DJ + Automation” Screen
**Top Bar (Global)**
- Station selector (single/multi station)
- Stream status indicator (Connected / Reconnecting / Offline)
- CPU/DSP load indicator
- “Autonomy” slider (0–100) + mode label
- Panic controls: “Fade to Backup”, “Mute Stream”, “Stop Auto”

**Left Column: Library / Browser**
- Search (instant)
- Filters:
  - genre, mood, BPM range, energy, key, era, tags
- Smart crates:
  - “High Energy”, “Chill”, “New Adds”, “Gold Rotation”, “No-Repeat Window”
- Drag track to Deck A / Deck B / Queue

**Center: Dual Decks**
- Deck A (left) + Deck B (right)
- Per-deck:
  - waveform (zoom)
  - play/pause/cue
  - BPM + detected key
  - beatgrid indicator (locked/unlocked)
  - hot cues (1–8)
  - loop controls
  - gain + 3-band EQ (or 5-band in advanced mode)
- Crossfader in the middle:
  - curve selector (linear, exponential, cut)
  - auto-crossfade toggle (when autonomy > threshold)

**Bottom: Mixer + Monitoring**
- Master meter (LUFS/RMS peaks)
- Limiter activity indicator
- Compressor gain reduction meter
- Headphone cue routing
- Stream output meter (post-encoder)

**Right Column: Automation + AI**
- “Now playing” metadata + artwork (optional)
- Next-up queue (editable)
- AI “Reasoning panel” (compact):
  - why this track
  - target energy curve
  - rule checks (no repeats, genre balance)
- Station clock (hour structure) view:
  - top-of-hour ID (future)
  - category slots (e.g., gold, new, recurrent)
  - ad markers (future if applicable)

### 5.3 Secondary Screens
1) **Station Setup**
- Icecast server settings
- mountpoint, user/pass, reconnect, bitrate
- metadata templates

2) **Library Management**
- import folders
- tag editor (bulk)
- smart crate rules builder

3) **Analytics**
- listener graphs
- transition performance (skip/retention)
- track fatigue detection (overplayed)

4) **Hardware / MIDI**
- device list
- mapping editor
- templates for common controllers (roadmap)

---

## 6. Technical Stack (High Detail Options + Recommendation)

### 6.1 App Form Factor
**Recommended:** Desktop app (Windows/macOS/Linux) using Electron + React + TypeScript
- Reason: DJ-grade UX, hardware I/O, stable audio access, file system library scale

Optional: Web version (later) for “control-only” dashboards

### 6.2 UI Layer
- React + TypeScript
- State:
  - Zustand or Redux Toolkit (Zustand preferred for low boilerplate)
- Rendering:
  - Canvas/WebGL for waveforms + meters (performance-first)
- Styling:
  - Tailwind or CSS variables (theme customization)

### 6.3 Audio Engine
**Phase 1 (Fast):** Web Audio API (inside Electron)
- Crossfade nodes, EQ biquads, compressor/limiter nodes
- Analyzer nodes for visualization

**Phase 2 (Pro):** WASM DSP module for deterministic low latency
- time-stretch/pitch shift (beatmatching)
- improved limiter/compressor
- consistent behavior across OS/browser engines

### 6.4 Beat Analysis + Library Indexing
- Offline analysis pipeline:
  - BPM detection
  - key detection
  - waveform peaks + beatgrid
  - loudness (LUFS estimate)
- Storage:
  - SQLite (local) for library DB
  - optional Postgres (cloud multi-station/network tier)

### 6.5 Streaming / Encoding
**Phase 1:** Icecast + MP3 (libmp3lame) or Opus/OGG (optional)
**Phase 2:** AAC/AAC+ encoder support + robust metadata injection
- Persistent reconnect logic with backoff
- Encoder watchdog for “zero dropouts” goal

### 6.6 AI / Autonomy Services
- Core “Decision Engine”:
  - rule system (hard constraints)
  - scoring system (preferences)
  - model-assisted selection (LLM + embeddings)
- Data:
  - track embeddings (audio + metadata)
  - station history + no-repeat windows
  - listener feedback signals (skips, retention)

**Suggested model split**
- LLM: planning, explanation, format transforms, show logic
- Embeddings: similarity, mood clustering, playlist shaping
- Deterministic layer: legality, repetition, category constraints

---

## 7. Non-Negotiable Performance Targets
- Startup time: **< 3 seconds** (current: ~5s)
- Audio latency: **< 10ms** for professional cue/scratch performance
- Stability goal: **zero dropouts** during 24/7 operation
- CPU: stem separation spikes must be capped; degrade gracefully if overloaded
- Library: 10k+ tracks must remain responsive; roadmap to 100k+

---

## 8. Competitive Analysis (VirtualDJ / Rekordbox) — Gaps
### 8.1 Feature Parity Gaps
- FX chain depth + granular beatgrid editing — gap critical
- Broadcasting suite:
  - multi-format encoding (AAC+)
  - robust metadata injection / RDS — gap major
- Library performance and smart crates — gap moderate
- Hardware mappings ecosystem — gap major

### 8.2 Performance Benchmarks
- Startup: <3s
- Latency: <10ms
- Stress test: no buffer underruns
- Lower-end hardware efficiency improved vs current

---

## 9. Strategic Roadmap (Phases)
### Phase 1 — Foundation
- Close gap on core mixing + library performance
- Implement robust beatgrid analysis
- Improve startup time
- Stabilize streaming reliability

### Phase 2 — Broadcasting Pro
- Multi-format encoding options
- Metadata stability improvements
- Professional station features (RDS where applicable)

### Phase 3 — AI & Autonomy
- “Human-like” transitions
- Real-time adaptive playlist curation
- Operator feedback loop

### Phase 4 — Hardware Expansion
- Expand MIDI mapping support
- Templates for popular controllers (Pioneer/Numark)

---

## 10. Agent & Workflow Integration (BMAD Methodology)

### 10.1 Multi-Agent Architecture
AetherRadio leverages the DGN-DJ multi-agent organization defined in `AGENTS.md`.
Key integrations include:

*   **Intake & Planning:**
    *   **Intake Agent:** Routes user requests (e.g., "create a chill mix") to the appropriate sub-agents.
    *   **Planner Agent:** Orchestrates the playlist generation workflow.
*   **Execution & Content:**
    *   **AI Improvement Team:** Responsible for the 0-100% autonomous agent logic, model evaluation, and prompt optimization.
    *   **Radio Broadcasting Consulting Team:** Ensures programming strategy and compliance (Program Director, Broadcast Compliance).
    *   **Radio Trend & Analysis Team:** Provides data-driven insights (listener analytics, content performance) to refine AI decisions.
    *   **Content Moderation Team:** Safegaurds all AI-generated content before broadcast.
*   **Infrastructure & Ops:**
    *   **DevOps & QA Teams:** Manage the CI/CD pipeline, automated testing, and performance profiling to meet the strict latency and stability targets.
    *   **Incident Response Team:** Handles real-time alerts (e.g., stream outages, dead air) and coordinates recovery.

### 10.2 Workflow & Governance
*   **Stage-Gated Pipeline:** All AI-driven changes (playlist updates, new features) follow the 5-stage pipeline: Intake -> Planner -> Executor -> Verifier -> Handoff.
*   **Autonomy Modes:** Strict adherence to the 5-level autonomy modes defined in `docs/autonomy_modes.md`.
*   **Quality Gates:** "Brutal Review" and "QA" gates ensure high standards for code, documentation, and UX before release.
