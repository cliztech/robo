# Skill: DJ-Component-Library

> Generate DJ interface components for CDJ, Mixer, Turntable, Broadcast

## Triggers

- "create DJ component"
- "build deck" 
- "make mixer"
- "add turntable"
- "build DJ interface"

## Actions

### 1. Generate CDJ Deck Component

**Input:**
- Component name
- Features needed (jog, tempo, loop, cues)
- Style (vinyl, digital, CD)

**Output:**
- React component with TypeScript
- Props interface
- Styled with Tailwind + CSS variables
- Keyboard shortcuts
- Basic tests

### 2. Generate Mixer Channel Strip

**Input:**
- Number of channels (2-8)
- EQ type (3-band, 4-band, parametric)
- Fader type (linear, rotary)

**Output:**
- ChannelStrip component
- EQKnob components
- LevelMeter component
- FilterKnob component

### 3. Generate Turntable

**Input:**
- Speed options (33/45/78)
- Visual style (Technics, Audio-Technica, custom)
- Motor simulation level

**Output:**
- Platter component
- Tonearm component
- VinylVisual component
- RPM control

### 4. Generate Broadcast Panel

**Input:**
- Features (stream, record, mic)
- Encoder type

**Output:**
- StreamMonitor component
- ListenerCount component
- EncoderStatus component
- MicControl component

## Code Generation Pattern

```typescript
// Template for new component
export interface ${ComponentName}Props {
  // Required
  onStateChange?: (state: ${StateType}) => void;
  // Optional
  className?: string;
  initialState?: ${StateType};
}

export function ${ComponentName}({
  onStateChange,
  className,
  initialState,
}: ${ComponentName}Props) {
  // Implementation
}
```

## File Output

Components go in:
- `dgn-dj-next/src/components/{category}/`

Tests go in:
- `dgn-dj-next/src/tests/unit/`

Stories go in:
- `dgn-dj-next/src/stories/`

## Best Practices

1. Use CSS variables for theming
2. Implement keyboard shortcuts
3. Add ARIA labels
4. Support touch + mouse
5. Document props with JSDoc
