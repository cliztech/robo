// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Modular Layout System
//  Drag-and-drop canvas for custom DJ setups
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────

export type ComponentType = 
  | 'deck-cdj' 
  | 'deck-turntable' 
  | 'deck-sampler'
  | 'mixer-2ch' 
  | 'mixer-4ch'
  | 'fx-rack'
  | 'pads'
  | 'browser'
  | 'broadcast'
  | 'waveform'
  | 'custom';

export interface LayoutComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  config?: Record<string, unknown>;
}

export interface Layout {
  id: string;
  name: string;
  version: string;
  gridSize: number;
  width?: number;
  height?: number;
  components: LayoutComponent[];
  shortcuts: Record<string, string>;
  theme?: string;
}

export interface CanvasState {
  layout: Layout;
  selectedId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
}

// ─── Default Presets ────────────────────────────────────────────

export const DEFAULT_LAYOUTS: Record<string, Layout> = {
  '2-deck-classic': {
    id: '2-deck-classic',
    name: 'Classic 2-Deck',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'deck-a', type: 'deck-cdj', x: 0, y: 0, width: 320, height: 480, zIndex: 1 },
      { id: 'mixer', type: 'mixer-4ch', x: 320, y: 0, width: 280, height: 480, zIndex: 2 },
      { id: 'deck-b', type: 'deck-cdj', x: 600, y: 0, width: 320, height: 480, zIndex: 1 },
      { id: 'browser', type: 'browser', x: 0, y: 480, width: 600, height: 280, zIndex: 3 },
      { id: 'broadcast', type: 'broadcast', x: 600, y: 480, width: 320, height: 280, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', cue: 'C', sync: 'S' }
  },
  '4-deck-advanced': {
    id: '4-deck-advanced',
    name: '4-Deck Advanced',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'deck-a', type: 'deck-cdj', x: 0, y: 0, width: 280, height: 400, zIndex: 1 },
      { id: 'deck-b', type: 'deck-cdj', x: 280, y: 0, width: 280, height: 400, zIndex: 1 },
      { id: 'mixer', type: 'mixer-4ch', x: 560, y: 0, width: 320, height: 400, zIndex: 2 },
      { id: 'deck-c', type: 'deck-cdj', x: 880, y: 0, width: 280, height: 400, zIndex: 1 },
      { id: 'deck-d', type: 'deck-cdj', x: 1160, y: 0, width: 280, height: 400, zIndex: 1 },
      { id: 'fx-rack', type: 'fx-rack', x: 0, y: 400, width: 400, height: 200, zIndex: 3 },
      { id: 'pads', type: 'pads', x: 400, y: 400, width: 300, height: 200, zIndex: 3 },
      { id: 'browser', type: 'browser', x: 700, y: 400, width: 400, height: 200, zIndex: 3 },
      { id: 'broadcast', type: 'broadcast', x: 1100, y: 400, width: 340, height: 200, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', cue: 'C', sync: 'S' }
  },
  'turntable-vinyl': {
    id: 'turntable-vinyl',
    name: 'Vinyl Setup',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'turntable-a', type: 'deck-turntable', x: 0, y: 0, width: 400, height: 500, zIndex: 1 },
      { id: 'mixer', type: 'mixer-2ch', x: 400, y: 0, width: 240, height: 500, zIndex: 2 },
      { id: 'turntable-b', type: 'deck-turntable', x: 640, y: 0, width: 400, height: 500, zIndex: 1 },
      { id: 'waveform', type: 'waveform', x: 0, y: 500, width: 1040, height: 160, zIndex: 3 },
      { id: 'browser', type: 'browser', x: 1040, y: 0, width: 300, height: 400, zIndex: 3 },
      { id: 'broadcast', type: 'broadcast', x: 1040, y: 400, width: 300, height: 260, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', cue: 'C', scratch: 'J' }
  },
  'broadcast-radio': {
    id: 'broadcast-radio',
    name: 'Radio Broadcast',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'deck-a', type: 'deck-cdj', x: 0, y: 0, width: 300, height: 380, zIndex: 1 },
      { id: 'deck-b', type: 'deck-cdj', x: 300, y: 0, width: 300, height: 380, zIndex: 1 },
      { id: 'mixer', type: 'mixer-4ch', x: 600, y: 0, width: 260, height: 380, zIndex: 2 },
      { id: 'broadcast', type: 'broadcast', x: 860, y: 0, width: 380, height: 380, zIndex: 3 },
      { id: 'waveform', type: 'waveform', x: 0, y: 380, width: 1240, height: 140, zIndex: 2 },
      { id: 'pads', type: 'pads', x: 0, y: 520, width: 860, height: 160, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', cue: 'C', record: 'R' }
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'deck-a', type: 'deck-cdj', x: 0, y: 0, width: 400, height: 500, zIndex: 1 },
      { id: 'mixer', type: 'mixer-2ch', x: 400, y: 0, width: 200, height: 500, zIndex: 2 },
      { id: 'browser', type: 'browser', x: 600, y: 0, width: 300, height: 500, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', cue: 'C' }
  },
  'sampler-grid': {
    id: 'sampler-grid',
    name: 'Sampler Grid',
    version: '1.0',
    gridSize: 16,
    components: [
      { id: 'sampler-1', type: 'deck-sampler', x: 0, y: 0, width: 280, height: 300, zIndex: 1 },
      { id: 'sampler-2', type: 'deck-sampler', x: 280, y: 0, width: 280, height: 300, zIndex: 1 },
      { id: 'sampler-3', type: 'deck-sampler', x: 560, y: 0, width: 280, height: 300, zIndex: 1 },
      { id: 'sampler-4', type: 'deck-sampler', x: 840, y: 0, width: 280, height: 300, zIndex: 1 },
      { id: 'mixer', type: 'mixer-4ch', x: 400, y: 300, width: 400, height: 280, zIndex: 2 },
      { id: 'broadcast', type: 'broadcast', x: 800, y: 300, width: 320, height: 280, zIndex: 3 },
    ],
    shortcuts: { play: 'Space', sample: '1-8' }
  },
};

// ─── Component Registry ─────────────────────────────────────────

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  category: 'deck' | 'mixer' | 'fx' | 'browser' | 'broadcast' | 'utility';
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  icon?: string;
}

export const COMPONENT_REGISTRY: Record<ComponentType, ComponentDefinition> = {
  'deck-cdj': {
    type: 'deck-cdj',
    name: 'CDJ Deck',
    category: 'deck',
    defaultWidth: 320,
    defaultHeight: 480,
    minWidth: 280,
    minHeight: 380,
    icon: 'Disc',
  },
  'deck-turntable': {
    type: 'deck-turntable',
    name: 'Turntable',
    category: 'deck',
    defaultWidth: 400,
    defaultHeight: 500,
    minWidth: 350,
    minHeight: 450,
    icon: 'Disc3',
  },
  'deck-sampler': {
    type: 'deck-sampler',
    name: 'Sampler',
    category: 'deck',
    defaultWidth: 280,
    defaultHeight: 300,
    minWidth: 200,
    minHeight: 200,
    icon: 'Boxes',
  },
  'mixer-2ch': {
    type: 'mixer-2ch',
    name: '2-Channel Mixer',
    category: 'mixer',
    defaultWidth: 200,
    defaultHeight: 480,
    minWidth: 180,
    minHeight: 380,
    icon: 'Sliders',
  },
  'mixer-4ch': {
    type: 'mixer-4ch',
    name: '4-Channel Mixer',
    category: 'mixer',
    defaultWidth: 280,
    defaultHeight: 480,
    minWidth: 240,
    minHeight: 380,
    icon: 'SlidersHorizontal',
  },
  'fx-rack': {
    type: 'fx-rack',
    name: 'FX Rack',
    category: 'fx',
    defaultWidth: 320,
    defaultHeight: 200,
    minWidth: 240,
    minHeight: 160,
    icon: 'Wand2',
  },
  'pads': {
    type: 'pads',
    name: 'Performance Pads',
    category: 'fx',
    defaultWidth: 280,
    defaultHeight: 200,
    minWidth: 200,
    minHeight: 160,
    icon: 'LayoutGrid',
  },
  'browser': {
    type: 'browser',
    name: 'Track Browser',
    category: 'browser',
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 280,
    minHeight: 200,
    icon: 'FolderOpen',
  },
  'broadcast': {
    type: 'broadcast',
    name: 'Broadcast Panel',
    category: 'broadcast',
    defaultWidth: 360,
    defaultHeight: 300,
    minWidth: 280,
    minHeight: 220,
    icon: 'Radio',
  },
  'waveform': {
    type: 'waveform',
    name: 'Waveform Display',
    category: 'utility',
    defaultWidth: 800,
    defaultHeight: 120,
    minWidth: 400,
    minHeight: 80,
    icon: 'Activity',
  },
  'custom': {
    type: 'custom',
    name: 'Custom Module',
    category: 'utility',
    defaultWidth: 200,
    defaultHeight: 200,
    minWidth: 100,
    minHeight: 100,
    icon: 'Box',
  },
};

// ─── Hooks ─────────────────────────────────────────────────────

export function useLayoutManager(initialLayoutId: string = '2-deck-classic') {
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUTS[initialLayoutId] || DEFAULT_LAYOUTS['2-deck-classic']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Snap to grid
  const snapToGrid = useCallback((value: number, gridSize: number) => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  // Add component
  const addComponent = useCallback((type: ComponentType) => {
    const def = COMPONENT_REGISTRY[type];
    const id = `${type}-${Date.now()}`;
    
    // Find empty position
    let x = 0, y = 0;
    const gridSize = layout.gridSize;
    
    // Simple grid placement - find first available spot
    const occupied = new Set(layout.components.map(c => `${c.x},${c.y}`));
    while (occupied.has(`${x},${y}`)) {
      x += def.defaultWidth + gridSize;
      if (x > 1200) {
        x = 0;
        y += def.defaultHeight + gridSize;
      }
    }

    const newComponent: LayoutComponent = {
      id,
      type,
      x: snapToGrid(x, gridSize),
      y: snapToGrid(y, gridSize),
      width: def.defaultWidth,
      height: def.defaultHeight,
      zIndex: layout.components.length + 1,
    };

    setLayout(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
    
    return id;
  }, [layout.components, layout.gridSize, snapToGrid]);

  // Move component
  const moveComponent = useCallback((id: string, x: number, y: number) => {
    const gridSize = layout.gridSize;
    setLayout(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id
          ? { ...c, x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) }
          : c
      ),
    }));
  }, [layout.gridSize, snapToGrid]);

  // Resize component
  const resizeComponent = useCallback((id: string, width: number, height: number) => {
    const def = COMPONENT_REGISTRY[layout.components.find(c => c.id === id)?.type || 'custom'];
    const gridSize = layout.gridSize;
    
    setLayout(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id
          ? {
              ...c,
              width: snapToGrid(Math.max(def.minWidth, width), gridSize),
              height: snapToGrid(Math.max(def.minHeight, height), gridSize),
            }
          : c
      ),
    }));
  }, [layout.components, layout.gridSize, snapToGrid]);

  // Remove component
  const removeComponent = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // Load preset
  const loadPreset = useCallback((presetId: string) => {
    const preset = DEFAULT_LAYOUTS[presetId];
    if (preset) {
      setLayout({ ...preset });
      setSelectedId(null);
    }
  }, []);

  // Save layout
  const saveLayout = useCallback(() => {
    return JSON.stringify(layout, null, 2);
  }, [layout]);

  // Load layout from JSON
  const loadLayout = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Layout;
      setLayout(parsed);
      setSelectedId(null);
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
  }, []);

  // Bring to front
  const bringToFront = useCallback((id: string) => {
    const maxZ = Math.max(...layout.components.map(c => c.zIndex));
    setLayout(prev => ({
      ...prev,
      components: prev.components.map(c =>
        c.id === id ? { ...c, zIndex: maxZ + 1 } : c
      ),
    }));
  }, [layout.components]);

  return {
    layout,
    selectedId,
    isEditing,
    setSelectedId,
    setIsEditing,
    addComponent,
    moveComponent,
    resizeComponent,
    removeComponent,
    loadPreset,
    saveLayout,
    loadLayout,
    bringToFront,
  };
}
