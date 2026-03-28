# Skill: Modular-Layout-Builder

> Build drag-and-drop DJ interface layouts

## Triggers

- "setup editor"
- "custom layout"
- "build interface"
- "create preset"
- "save layout"

## Actions

### 1. Setup Canvas Component

**Features:**
- Drag-and-drop component placement
- Grid snap (8px, 16px, 32px configurable)
- Resize handles with min/max constraints
- Layer ordering (z-index)
- Undo/redo support

### 2. Layout Serialization

**Save Format (JSON):**
```json
{
  "version": "1.0",
  "name": "My Setup",
  "gridSize": 16,
  "components": [
    {
      "id": "deck-a",
      "type": "deck",
      "variant": "cdj",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 400,
      "config": { "color": "blue" }
    }
  ],
  "shortcuts": {
    "play": "space",
    "cue": "c"
  }
}
```

### 3. Preset Templates

**Built-in Presets:**
- `2-deck-classic` - Standard 2-deck setup
- `4-deck-advanced` - 4-deck with dual mixer
- `broadcast-radio` - Radio streaming focus
- `minimal` - Single deck + browser
- `turntable-vinyl` - Vinyl simulation focus

### 4. Component Registry

```typescript
interface Registry {
  register(type: string, component: ComponentDef): void;
  get(type: string): ComponentDef;
  list(): ComponentDef[];
  findCompatible(position: Position): ComponentDef[];
}
```

## Drag-and-Drop Implementation

Use `@dnd-kit/core` for:
- Draggable components
- Droppable zones
- Collision detection
- Keyboard accessibility

## Persistence

- Auto-save to localStorage
- Export to JSON file
- Import from JSON
- Share via URL params

## User Customization

Users can:
- Add/remove components
- Resize any component
- Configure component settings
- Set keyboard shortcuts
- Choose color themes
- Save multiple layouts

## Best Practices

1. Provide sensible defaults
2. Validate layout on load
3. Handle missing components gracefully
4. Support both mouse and touch
5. Include layout reset option
