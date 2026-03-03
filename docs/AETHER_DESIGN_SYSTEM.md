# Aether Design System (v1.0)
Unified Design Language for DGN-DJ Studio Suite.

## Core Philosophy
The Aether Design System is built to bridge the gap between high-end professional hardware (Pioneer DJM, Recordbox 7) and modern digital interfaces. It emphasizes **tactile weight, industrial precision, and visual clarity.**

## 🎨 Palette (Sapphire & Obsidian)
- **Obsidian Black (`--bg`)**: `hsl(240, 10%, 2%)` — Deep, matte metal finish.
- **Sapphire Blue (`--accent`)**: `hsl(207, 98%, 45%)` — Reference color for active states/highlights.
- **Crystal White (`--text`)**: `hsl(210, 20%, 98%)` — High-contrast typography.
- **Emerald Green**: `hsl(160, 80%, 45%)` — Success states and alternate deck accents.

## 🏗️ UI Principles
1. **Material Weight**: All panels (`.glass-panel` or `.metal-bg`) must have a hardware-style border (`border-white/[0.08]`) and a subtle noise texture to simulate anodized aluminum.
2. **Point of Light**: Knobs and faders use radial gradients and SVG filters to create a 3D effect. Shadows must imply a source of light from the top-left of the screen.
3. **Discrete Segmenting**: VU meters and Progress bars should use segmented logic (LED style) rather than smooth gradients where possible, to maintain a "Virtual Hardware" feel.
4. **Header Precision**: Panel headers must use high-density typography (Uppercase, Black weight, high tracking) to mimic screen-printed labels on hardware.

## 🧪 Implementation
Tokens are stored in `src/styles/tokens.css`.
Components using this system are prefixed or suffixed with **Aether** (e.g., `AetherMixer`, `AetherKnob`).
