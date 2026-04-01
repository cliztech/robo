# Product Guidelines

## Governance Pointers (Mandatory)
Strict adherence to repository governance is required:
- [AGENTS.md](../AGENTS.md) — multi-agent workflow, boundaries, and commit/PR requirements.
- [SKILLS.md](../SKILLS.md) — reusable skills and invocation rules.
- [SECURITY.md](../SECURITY.md) — security, secrets, and audit protocols.

## Product Design Guidance (DGN-DJ by DGNradio)

### 1. Visual Identity & Aesthetic
- **Core philosophy:** Professional hardware, digitized. The UI should feel like premium DJ gear while keeping software flexibility.
- **Theme:** Dark mode-first, optimized for low-light studios with high contrast readability.
- **Color palette:**
  - **Backgrounds:** Deep grays/blacks (`#121212`, `#1E1E1E`).
  - **Accents:** High-energy colors for active states (for example electric blue `#00F0FF`, neon green `#39FF14`, hot pink `#FF0099`).
  - **Indicators:** Red (`#FF3333`) for critical states, amber (`#FFCC00`) for caution.
- **Typography:**
  - **Headings:** Clean sans-serif (for example Inter/Roboto).
  - **Data-heavy fields:** Readable monospace for timestamps/BPM/metadata.
- **Iconography:** Minimal, hardware-like labels and outline-style controls.

### 2. UX Principles
- **Tactile feedback:** Knobs/faders should communicate "weight" through motion and state transitions.
- **Direct manipulation:** Drag-and-drop remains the primary model for loading/reordering/applying effects.
- **Information density:** High by default; critical controls should remain visible.
- **Responsiveness:** Near-instant interaction feedback; preserve low-latency operation.
- **Progressive disclosure:** Advanced capabilities are accessible without cluttering primary mix workflows.

### 3. Component Guidance
- **Decks:** Jog-wheel analog metaphors, transport clarity, and waveform-first interaction.
- **Mixer:** Channel strips with clear EQ/gain/level semantics and unambiguous metering.
- **Browser:** High-performance list/grid behavior with sortable metadata and crate/folder organization.
- **Waveforms:** Smooth rendering with consistent visual language for frequency/energy cues.

### 4. Tone of Voice
- **Professional and technical:** Use domain terms precisely (cue, loop, quantize, stem).
- **Efficient and direct:** Error/status copy must be concise and actionable.
- **Reliable:** Copy should reinforce trust in station uptime and operational stability.

### 5. Accessibility
- **Keyboard-first controls:** Critical actions must be accessible via shortcuts.
- **Screen reader support:** Ensure robust ARIA labeling and focus management.
- **Color-independent semantics:** Never rely on color alone for state-critical indicators.
