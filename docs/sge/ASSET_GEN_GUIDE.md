# SGE Asset Generation Guide (Studio Iron Style)

> 🎨 This guide instructs AI agents on how to generate "Iron-Grade" visual assets for Studio Gear.

## 1. Visual Aesthetics (The "Iron" Look)

- **Palette:** Deep charcoals, brushed aluminums, and vibrant neons.
- **Backgrounds:** HSL(0, 0%, 7%), HSL(0, 0%, 10%).
- **Text:** Inter, Roboto, or Outfit (High legibility, uppercase labels).
- **Accents:** Neon Blues (#00E5FF), Electric Reds (#FF1744), Radioactive Greens (#00E676).

## 2. Component Textures (CSS & SVG)

### 🔘 Buttons (Pioneer Style)

- **Normal:** Inset shadow, subtle top glint, #1E1E1E.
- **Active:** Glowing border, brighter inner color, #3D3D3D.
- **Labels:** Small, crisp, above/below the button (e.g., "PLAY", "CUE").

### 🎚️ Faders & Knobs (Mixxx Style)

- **Fader Tracks:** Grooved, dark, with position markers.
- **Knob Caps:** Brushed metal texture, 3D shadow, single indicator notch.
- **Response:** Faders use logarithmic scaling for volume; liner for pitch.

## 3. Image Generation Prompts (for `generate_image`)

Use these prompt templates for specific gear styles:

- **"Platinum CDJ UI":** `High-fidelity, professional DJ equipment interface, dark-mode, brushed platinum metal texture, vibrant blue waveform display, high-density BPM/pitch data, minimalist industrial design, Mixxx and Pioneer inspired, 4k resolution, UI/UX asset.`
- **"Virtual Mixer Surface":** `Professional 4-channel DJ mixer GUI, analog VU meters with warm glow, dark charcoal surface, illuminated faders, tactile knobs, Studio Iron style, high-density, vector-style icons, professional broadcasting equipment.`
- **"Studio Control Surface":** `Modular radio broadcasting console interface, large tactile buttons, fader wing, multi-monitor waveform displays, dark-mode, sleek industrial design, high-fidelity UI/UX, premium metallic textures.`

## 4. SVG Precision Rules

- All icons (Play, Pause, Cue, Sync) must be pure SVG for scaling.
- Stroke width: 1.5px or 2px.
- Use `<defs>` with `<linearGradient>` for metallic finishes.

---

> [!NOTE]
> All assets must be verified for **Dark Mode** contrast (minimum ratio 4.5:1).
