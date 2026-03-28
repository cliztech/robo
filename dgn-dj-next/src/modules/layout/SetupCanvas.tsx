// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Setup Canvas
//  Modular drag-and-drop interface builder
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Layout, LayoutComponent, ComponentType } from './types';
import { 
  COMPONENT_REGISTRY, 
  DEFAULT_LAYOUTS,
  useLayoutManager 
} from './types';
import { 
  Disc, Disc3, Boxes, Sliders, SlidersHorizontal, 
  Wand2, LayoutGrid, FolderOpen, Radio, Activity, Box,
  Plus, Download, Upload, Maximize2, ChevronDown, Settings, LayoutIcon, X
} from 'lucide-react';
import { CompactDeck, CompactMixerChannel, CompactFXRack, CompactPads, CompactWaveform, CompactBrowser, CompactBroadcast } from '../../components/compact/CompactComponents';

// ─── Component Icons ────────────────────────────────────────────

const getIcon = (type: ComponentType) => {
  const def = COMPONENT_REGISTRY[type];
  switch (def?.icon) {
    case 'Disc': return Disc;
    case 'Disc3': return Disc3;
    case 'Boxes': return Boxes;
    case 'Sliders': return Sliders;
    case 'SlidersHorizontal': return SlidersHorizontal;
    case 'Wand2': return Wand2;
    case 'LayoutGrid': return LayoutGrid;
    case 'FolderOpen': return FolderOpen;
    case 'Radio': return Radio;
    case 'Activity': return Activity;
    default: return Box;
  }
};

// ─── Individual Component Wrappers ─────────────────────────────

interface ComponentWrapperProps {
  component: LayoutComponent;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
}

function ComponentWrapper({
  component,
  isSelected,
  isEditing,
  onSelect,
  onMove,
  onResize,
  onRemove,
  children,
}: ComponentWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, compX: 0, compY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      compX: component.x,
      compY: component.y,
    };
  }, [isEditing, onSelect, component.x, component.y]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: component.width,
      h: component.height,
    };
  }, [isEditing, component.width, component.height]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        onMove(dragStart.current.compX + dx, dragStart.current.compY + dy);
      }
      if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        onResize(resizeStart.current.w + dx, resizeStart.current.h + dy);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, onMove, onResize]);

  const def = COMPONENT_REGISTRY[component.type];

  return (
    <div
      className={`absolute transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 z-50' : ''
      } ${isEditing ? 'cursor-move' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        zIndex: component.zIndex,
      }}
      onClick={onSelect}
    >
      {/* Header bar for dragging */}
      <div
        className={`h-6 bg-zinc-800 flex items-center justify-between px-2 border-b border-zinc-700 select-none ${
          isEditing ? 'cursor-move' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
      >
        <span className="text-xs text-zinc-400 flex items-center gap-1">
          {React.createElement(getIcon(component.type), { size: 12 })}
          {def?.name || 'Custom'}
        </span>
        {isEditing && (
          <button
            className="text-zinc-500 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="h-[calc(100%-24px)] bg-zinc-900 overflow-hidden">
        {children}
      </div>

      {/* Resize handle */}
      {isEditing && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
          onMouseDown={handleResizeStart}
        >
          <Maximize2 size={10} className="text-zinc-400" />
        </div>
      )}
    </div>
  );
}

// ─── Component Palette ──────────────────────────────────────────

interface ComponentPaletteProps {
  onAdd: (type: ComponentType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function ComponentPalette({ onAdd, isOpen, onToggle }: ComponentPaletteProps) {
  const categories = ['deck', 'mixer', 'fx', 'browser', 'broadcast', 'utility'] as const;
  
  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = Object.values(COMPONENT_REGISTRY).filter(c => c.category === cat);
    return acc;
  }, {} as Record<string, typeof COMPONENT_REGISTRY[keyof typeof COMPONENT_REGISTRY][]>);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
      >
        <Plus size={16} />
        Add Component
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat}>
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase bg-zinc-800/50 sticky top-0">
                {cat}
              </div>
              {grouped[cat].map(def => (
                <button
                  key={def.type}
                  onClick={() => { onAdd(def.type); onToggle(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 text-left text-sm text-zinc-200"
                >
                  {React.createElement(getIcon(def.type), { size: 16 })}
                  {def.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preset Selector ───────────────────────────────────────────

interface PresetSelectorProps {
  currentLayoutId: string;
  onLoad: (presetId: string) => void;
}

function PresetSelector({ currentLayoutId, onLoad }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
      >
        <LayoutIcon size={16} />
        {DEFAULT_LAYOUTS[currentLayoutId]?.name || 'Select Preset'}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
          {Object.entries(DEFAULT_LAYOUTS).map(([id, layout]) => (
            <button
              key={id}
              onClick={() => { onLoad(id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 text-left text-sm ${
                id === currentLayoutId ? 'text-blue-400 bg-zinc-700/50' : 'text-zinc-200'
              }`}
            >
              <LayoutIcon size={14} />
              {layout.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Setup Canvas ─────────────────────────────────────────

interface SetupCanvasProps {
  layoutId?: string;
  onLayoutChange?: (layout: Layout) => void;
}

export function SetupCanvas({ layoutId = '2-deck-classic', onLayoutChange }: SetupCanvasProps) {
  const {
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
  } = useLayoutManager(layoutId);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

  // Handle click outside to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  }, [setSelectedId]);

  // Render component content based on type
  const renderComponentContent = (type: ComponentType, componentId: string) => {
    const isCompact = componentId.includes('b') || componentId.includes('c');
    
    switch (type) {
      case 'deck-cdj':
        return <CompactDeck deck={componentId.includes('b') ? 'B' : 'A'} compact={isCompact} />;
      case 'deck-turntable':
        return <CompactDeck deck={componentId.includes('b') ? 'B' : 'A'} compact={isCompact} />;
      case 'deck-sampler':
        return <CompactPads />;
      case 'mixer-2ch':
        return (
          <div className="flex gap-1 h-full bg-zinc-900 p-1 rounded-lg">
            <CompactMixerChannel channel={1} accentColor="#0091FF" />
            <CompactMixerChannel channel={2} accentColor="#FF5500" />
          </div>
        );
      case 'mixer-4ch':
        return (
          <div className="flex gap-1 h-full bg-zinc-900 p-1 rounded-lg">
            <CompactMixerChannel channel={1} accentColor="#0091FF" />
            <CompactMixerChannel channel={2} accentColor="#FF5500" />
            <CompactMixerChannel channel={3} accentColor="#22C55E" />
            <CompactMixerChannel channel={4} accentColor="#A855F7" />
          </div>
        );
      case 'fx-rack':
        return <CompactFXRack />;
      case 'pads':
        return <CompactPads />;
      case 'browser':
        return <CompactBrowser />;
      case 'broadcast':
        return <CompactBroadcast />;
      case 'waveform':
        return <CompactWaveform />;
      default:
        return <div className="flex items-center justify-center h-full text-zinc-500">Custom</div>;
    }
  };

  // Export layout
  const handleExport = useCallback(() => {
    const json = saveLayout();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.name.replace(/\s+/g, '-').toLowerCase()}-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [saveLayout, layout.name]);

  // Import layout
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          loadLayout(ev.target?.result as string);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [loadLayout]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{layout.name}</h2>
          <PresetSelector currentLayoutId={layout.id} onLoad={loadPreset} />
        </div>

        <div className="flex items-center gap-2">
          <ComponentPalette
            onAdd={addComponent}
            isOpen={paletteOpen}
            onToggle={() => setPaletteOpen(!paletteOpen)}
          />

          <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-zinc-800 rounded">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                isEditing ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Settings size={14} />
              {isEditing ? 'Done Editing' : 'Edit Layout'}
            </button>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleExport}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              title="Export Layout"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleImport}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
              title="Import Layout"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={`relative flex-1 overflow-auto ${
          isEditing ? 'bg-zinc-900/50' : 'bg-zinc-950'
        }`}
        style={{
          backgroundImage: isEditing 
            ? `linear-gradient(to right, rgba(63,63,70,0.3) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(63,63,70,0.3) 1px, transparent 1px)`
            : 'none',
          backgroundSize: `${layout.gridSize}px ${layout.gridSize}px`,
        }}
        onClick={handleCanvasClick}
      >
        {/* Components */}
        {layout.components.map(component => (
          <ComponentWrapper
            key={component.id}
            component={component}
            isSelected={selectedId === component.id}
            isEditing={isEditing}
            onSelect={() => {
              setSelectedId(component.id);
              bringToFront(component.id);
            }}
            onMove={(x, y) => moveComponent(component.id, x, y)}
            onResize={(w, h) => resizeComponent(component.id, w, h)}
            onRemove={() => removeComponent(component.id)}
          >
            {renderComponentContent(component.type, component.id)}
          </ComponentWrapper>
        ))}

        {/* Empty state */}
        {layout.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <LayoutIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No components in this layout</p>
              <p className="text-sm">Click "Add Component" to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <span>{layout.components.length} components</span>
        <span>Grid: {layout.gridSize}px</span>
        <span>
          {Math.max(...layout.components.map(c => c.x + c.width), 0)}x
          {Math.max(...layout.components.map(c => c.y + c.height), 0)}
        </span>
      </div>
    </div>
  );
}

export default SetupCanvas;
