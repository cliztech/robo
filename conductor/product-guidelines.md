# Product Guidelines: AetherRadio

## 1. Visual Identity & Aesthetic
*   **Core Philosophy:** "Professional Hardware, Digitized." The interface should evoke the feeling of high-end DJ equipment (Pioneer CDJs, Allen & Heath mixers) while leveraging the flexibility of software.
*   **Theme:** **Dark Mode Only.** Designed for low-light environments (clubs, studios). High contrast is essential for readability.
*   **Color Palette:**
    *   **Backgrounds:** Deep grays and blacks (`#121212`, `#1E1E1E`).
    *   **Accents:** Vibrant, neon-inspired colors for active states (e.g., Electric Blue `#00F0FF` for play, Neon Green `#39FF14` for sync, Hot Pink `#FF0099` for FX).
    *   **Indicators:** Red (`#FF3333`) for critical warnings (clipping, off-air), Amber (`#FFCC00`) for cautions.
*   **Typography:**
    *   **Headings:** Clean, industrial sans-serif (e.g., Roboto, Inter, or a custom technical font).
    *   **Data/Monospace:** High-readability monospace font for time, BPM, and metadata (e.g., JetBrains Mono, Fira Code).
*   **Iconography:** Minimalist, outline-style icons that resemble hardware labels.

## 2. User Experience (UX) Principles
*   **Tactile Feedback:** Controls (knobs, faders) should have a sense of "weight" and resistance. Visual feedback (highlighting, scaling) should accompany interactions.
*   **Direct Manipulation:** Drag-and-drop is the primary interaction model for loading tracks, reordering playlists, and applying effects.
*   **Information Density:** High. Professional DJs need a lot of information at a glance (waveforms, times, levels). Avoid hiding critical controls behind menus.
*   **Responsiveness:** Instantaneous reaction to user input. Audio latency < 10ms is the target. Visual latency should be imperceptible.
*   **Progressive Disclosure:** Advanced features (stem separation, complex FX chains) should be accessible but not clutter the primary mixing view.

## 3. Component Design
*   **Decks:** Circular jog wheel representations with rotating playheads. Detailed, zoomable waveforms are the focal point.
*   **Mixer:** Vertical channel strips with 3-band EQ knobs, gain faders, and level meters.
*   **Browser:** High-performance list view with sortable columns. Smart crates and folders on the left sidebar.
*   **Waveforms:** Smooth, vector-based rendering. Color-coded by frequency (Low=Red, Mid=Green, High=Blue) or spectrum.

## 4. Tone of Voice
*   **Professional & Technical:** Use industry-standard terminology (Cue, Loop, Quantize, Stem). Avoid dumbing down concepts.
*   **Efficient & Direct:** Error messages and status updates should be concise and actionable.
*   **Reliable:** The language should instill confidence in the software's stability.

## 5. Accessibility
*   **Keyboard Navigation:** Full support for keyboard shortcuts for all critical functions (Play, Pause, Cue, Crossfade).
*   **Screen Reader Support:** ARIA labels for all controls.
*   **Color Blindness:** Ensure critical status indicators (e.g., Record, On Air) rely on more than just color (use icons or text labels).
