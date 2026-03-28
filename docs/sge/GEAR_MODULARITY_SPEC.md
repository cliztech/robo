# Gear Modularity Specification (mod-drop v1.0)

> 🎚️ This specification defines how virtual gear units (Decks, Mixers, FX) interact, synchronize, and connect in a modular Studio layout.

## 1. Component Interface

All SGE components MUST implement the `GearUnit` standard for interoperability.

### 🔌 Standard Input/Output (Audio Virtual Patching)

- **Audio Inputs:** Multiple channel support (Left/Right/Stereo).
- **Audio Outputs:** Master, Booth, Record, Headphone/Cue.
- **Control Inputs:** MIDI/HID mapping, Sync-Link (BPM, Pitch, Time).

### 🛠️ Common Property Structure

```typescript
interface GearUnitProps {
  id: string; // Unique component ID
  type: "DECK" | "MIXER" | "FX" | "SAMPLER";
  label: string; // Display name (e.g., "Deck A")
  skin: "PLATINUM" | "DARK" | "CIBER" | "VINTAGE";
  isDraggable?: boolean; // For modular layout grid
  onPatchChannel: (targetId: string, channel: number) => void;
  syncState: GearSyncState; // BPM, Pitch, Sync-Master status
}
```

## 2. The "Stage" & Grid System

- **Grid Resolution:** Studio layouts use a 12-column responsive grid.
- **Droppable Zones:** Decks and Mixers can be "dropped" onto any grid slot.
- **Auto-Patching:** Dropping a Deck next to a Mixer automatically attempts to patch to the nearest available channel.

## 3. State Synchronization (Sync-Link)

- **Global BPM Master:** Only one `GearUnit` can be the "Master" at any time.
- **Sync Protocol:** Subordinate units (Slaves) match BPM and phase to the Master through the `SyncLink` broadcast channel.
- **Pitch-Lock:** Phase-alignment logic for smooth beatmatching between modular units.

## 4. Visual "Iron" Quality Standards

- **Dark Mode First:** Backgrounds must be ≥ #121212.
- **Display Intensity:** Waveforms and faders use vibrant, non-distracting colors (e.g., #00E5FF, #FF3D00).
- **Control Textures:** Buttons must have "Press" states with subtle shadow/glint shifts to simulate physical hardware.
- **Modular Margins:** Each gear unit has a 2px "Iron Border" to distinguish components in high-density layouts.

---

> [!TIP]
> Use the `modular-layout-engine` skill to automate the assembly of complex multi-deck setups based on this spec.
