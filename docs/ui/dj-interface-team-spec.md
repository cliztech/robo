# DJ UI/UX Agent Team - Specification

> **DGN-DJ Interface Engineering Team**
> Modular DJ Interface System for CDJ, Consoles, Turntables, Broadcasting Setups

---

## Team Overview

| Agent | Role | Focus |
|-------|------|-------|
| **DJ-UI-Architect** | Lead Architect | System design, modular framework, component API |
| **CDJ-Engineer** | CDJ Specialist | CDJ-style decks, jog wheels, performance pads |
| **Mixer-Engineer** | Mixer Specialist | Channel strips, crossfaders, EQs, filters |
| **Turntable-Engineer** | Vinyl/Turntable | Turntable simulation, platters, tonearms |
| **Broadcast-Engineer** | Radio/DVR | Stream monitoring, scheduling, encoding |
| **Setup-Builder** | Modular Systems | Layout composer, user customization |
| **UX-Researcher** | User Experience | Workflows, accessibility, usability |
| **Visual-Designer** | Aesthetics | Theming, animations, branding |

---

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    SetupCanvas                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Grid System (Drag & Drop + Snap)                   │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Deck A  │  │  Mixer   │  │  Deck B  │  ...          │
│  │ (CDJ)    │  │          │  │ (CDJ)    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                             │
│  ┌──────────┐  ┌──────────┐                               │
│  │  FX Rack │  │  Pads    │  ┌──────────┐               │
│  │          │  │          │  │ Browser   │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Module Registry

```typescript
interface ModuleRegistry {
  // Core modules
  deck: DeckModule[];
  mixer: MixerModule[];
  effects: FXModule[];
  pads: PadModule[];
  browser: BrowserModule[];
  broadcast: BroadcastModule[];
  waveform: WaveformModule[];
  custom: CustomModule[];
}

interface DeckModule {
  id: string;
  type: 'cdj' | 'turntable' | 'sampler' | 'custom';
  controls: ControlDefinition[];
  defaultLayout: LayoutConfig;
}

interface MixerModule {
  id: string;
  channels: number; // 2, 4, 6, 8
  hasCrossfader: boolean;
  hasFilter: boolean;
  eqType: '3-band' | '4-band' | 'parametric';
}
```

---

## Agent Specifications

### 1. DJ-UI-Architect

**Purpose:** Design the modular component system and API

**Responsibilities:**
- Define component interfaces (props, events, state)
- Create module registry architecture
- Design layout engine (drag-drop, snap, resize)
- Establish theming system
- Define persistence schema

**Key Deliverables:**
- `src/modules/registry.ts` - Module registration
- `src/modules/canvas/SetupCanvas.tsx` - Main canvas
- `src/modules/layout/LayoutEngine.ts` - Layout logic

**Skills Required:**
- React Component Architecture
- State Management (Zustand)
- Drag-and-drop libraries
- JSON Schema validation

---

### 2. CDJ-Engineer

**Purpose:** Build CDJ-style deck components

**Components to Build:**
- `JogWheel` - Vinyl-style jog with touch, brake, spin
- `TempoSlider` - Pitch fader with +/- range
- `LoopControls` - Loop in, out, roll, trim
- `CuePoints` - Hot cue management
- `BeatGrid` - BPM/beat visualization
- `TrackDisplay` - Title, artist, key, time

**Specifications:**
```
JogWheel:
  - touchSensitivity: 0-100
  - vinylWeight: 0-100
  - brakeDeceleration: 0-1
  - spinDeceleration: 0-1
  - displayModes: ['vinyl', 'digital', 'CD']
```

---

### 3. Mixer-Engineer

**Purpose:** Build mixer and channel strip components

**Components:**
- `ChannelStrip` - Volume, pan, EQ, filter, send
- `Crossfader` - Curve control, assignment
- `EQKnob` - 3-band/4-band parametric
- `FilterKnob` - Low/high pass with resonance
- `LevelMeter` - VU/Peak meters with peak hold
- `MasterOutput` - Master volume, limiter

**Specifications:**
```
ChannelStrip:
  - faderRange: [-inf, +6dB]
  - eqFreq: [20Hz - 20kHz]
  - eqGain: [-12dB, +12dB]
  - filterCutoff: [20Hz - 20kHz]
  - filterResonance: [0, 100%]
```

---

### 4. Turntable-Engineer

**Purpose:** Build vinyl turntable simulation

**Components:**
- `Platter` - Rotating disc with momentum
- `Tonearm` - Tracking arm with cueing
- `SlipMat` - Slip mode for cueing
- `VinylVisual` - Record spinning visualization
- `Needle` - Cartridge/needle simulation

**Specifications:**
```
Turntable:
  - speeds: [33, 45, 78] RPM
  - platterWeight: [light, medium, heavy]
  - motor: [on, off, slow, fast]
  - pitchRange: [+/- 8%, 16%, 50%]
```

---

### 5. Broadcast-Engineer

**Purpose:** Radio broadcast interface components

**Components:**
- `StreamMonitor` - Live stream status
- `ListenerCount` - Current audience
- `EncoderStatus` - Bitrate, codec info
- `ScheduleTimeline` - Upcoming content
- `DVRControls` - Recording, replay
- `MicControl` - Microphone mixing

---

### 6. Setup-Builder

**Purpose:** User-facing modular layout system

**Features:**
- Drag-and-drop component placement
- Grid snap with configurable grid size
- Component resize with min/max constraints
- Layout save/load/export/import
- Preset templates (2-deck, 4-deck, broadcast)
- Per-setup keyboard shortcuts

**Deliverables:**
- `SetupEditor.tsx` - Visual layout builder
- `LayoutSerializer.ts` - JSON persistence
- `PresetManager.ts` - Built-in templates

---

### 7. UX-Researcher

**Purpose:** Ensure usability and accessibility

**Focus Areas:**
- Keyboard-first navigation
- High contrast themes
- Screen reader compatibility
- Touch vs mouse interactions
- Pro DJ vs beginner modes

---

### 8. Visual-Designer

**Purpose:** Aesthetics and theming

**Scope:**
- Color themes (dark, light, custom)
- LED strip animations
- Jog wheel visual feedback
- Meter animations
- Custom skin system

---

## Skills to Create

### 1. DJ-Component-Library
```
Triggers: "create DJ component", "build deck", "make mixer"
Actions: Generate CDJ, Mixer, Turntable components
```

### 2. Modular-Layout-Builder
```
Triggers: "setup editor", "custom layout", "build interface"
Actions: Generate drag-drop layout system
```

### 3. Broadcast-Interface
```
Triggers: "radio UI", "stream monitor", "broadcast panel"
Actions: Generate broadcasting components
```

---

## MCP Tools

### dj-component-generator
- Input: Component type, specs
- Output: React component with tests

### layout-serializer
- Input: Current layout state
- Output: JSON config for save/load

### preset-manager
- Input: Template name
- Output: Full layout configuration

---

## Self-Review Rating

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture** | 8/10 | Modular design is sound, needs canvas optimization |
| **Component Coverage** | 7/10 | Core exists, advanced features needed |
| **Extensibility** | 9/10 | Plugin system well-designed |
| **Accessibility** | 5/10 | Needs keyboard navigation, ARIA |
| **Theming** | 6/10 | Basic themes work, custom skins incomplete |
| **Documentation** | 4/10 | Component docs needed |
| **Testing** | 3/10 | E2E tests minimal |

**Overall: 6/10** - Foundation solid, needs polish in docs, testing, accessibility

---

## Next Steps

1. **Expand component library** - Advanced FX, more deck types
2. **Accessibility audit** - WCAG 2.1 AA compliance
3. **Theming engine** - Full skin customization
4. **Setup sharing** - Community layout exchange
5. **Mobile adapter** - Touch-first layouts

---

## File Structure

```
dgn-dj-next/src/
├── components/
│   ├── deck/           # CDJ, Turntable, Sampler
│   ├── mixer/          # Channel strips, crossfader
│   ├── fx/             # Effects rack
│   ├── pads/           # Performance pads
│   ├── browser/        # Track browser
│   ├── broadcast/      # Radio streaming
│   ├── waveform/       # Waveform displays
│   └── ui/             # Shared UI primitives
├── modules/
│   ├── registry.ts     # Component registry
│   ├── canvas/         # Setup canvas
│   ├── layout/         # Layout engine
│   ├── presets/        # Built-in templates
│   └── serialization/  # Save/load system
├── hooks/              # DJ-specific hooks
├── stores/             # Zustand stores
├── themes/             # Theme definitions
└── types/              # TypeScript definitions
```
