"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { PlatinumCDJ } from "@/components/gear/PlatinumCDJ";
import { VintageMixer } from "@/components/gear/VintageMixer";
import { CyberTurntable } from "@/components/gear/CyberTurntable";
import { FXRack } from "@/components/gear/FXRack";
import { SamplerPad } from "@/components/gear/SamplerPad";
import { WaveformHeader } from "@/components/gear/WaveformHeader";
import { TrackLibrary } from "@/components/gear/TrackLibrary";
import { PresetLibrary } from "@/components/gear/PresetLibrary";
import { AudioRoutingViz, autoRoute } from "@/components/gear/AudioRoutingViz";
import { GearBottomPanel } from "@/components/gear/GearBottomPanel";
import { GearSettings, DEFAULT_SETTINGS } from "@/components/gear/GearSettings";
import { useDragReorder } from "@/components/gear/hooks/useDragReorder";
import { useUndoRedo } from "@/components/gear/hooks/useUndoRedo";
import { useKeyboardNav } from "@/components/gear/hooks/useKeyboardNav";
import { useTouchDrag } from "@/components/gear/hooks/useTouchDrag";
import type { GearType } from "@/components/gear/gear.types";
import type { PresetGear } from "@/components/gear/PresetLibrary";
import type { StudioSettings } from "@/components/gear/GearSettings";
import "./gear.css";

/**
 * /gear route — DGN-DJ Studio Gear Builder
 * Phase 7: Waveform, keyboard nav, import layout, touch support.
 */

interface PlacedGear {
  instanceId: string;
  type: GearType;
  label: string;
}

const GEAR_PALETTE: {
  type: GearType;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    type: "DECK",
    label: "Platinum CDJ",
    icon: "💿",
    desc: "Professional CD/media player",
  },
  {
    type: "MIXER",
    label: "Vintage Mixer",
    icon: "🎚️",
    desc: "4-channel analog mixer",
  },
  {
    type: "TURNTABLE",
    label: "Cyber Turntable",
    icon: "🎵",
    desc: "Vinyl turntable w/ platter",
  },
  { type: "FX", label: "FX Rack", icon: "✨", desc: "Multi-effect processor" },
  {
    type: "SAMPLER",
    label: "Sampler Pad",
    icon: "🥁",
    desc: "8-pad sample trigger",
  },
];

const STORAGE_KEY = "dgn-dj-gear-layout";
let nextId = 1;

export default function GearPage() {
  // Undo/redo wrapped gear state
  const {
    state: placedGear,
    setState: setPlacedGear,
    undo,
    redo,
    reset: resetGear,
    canUndo,
    canRedo,
  } = useUndoRedo<PlacedGear[]>([]);

  const [layoutName, setLayoutName] = useState("My Setup");
  const [savedLayouts, setSavedLayouts] = useState<string[]>([]);
  const [showToast, setShowToast] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | undefined>();
  const [bottomTab, setBottomTab] = useState("presets");
  const [studioSettings, setStudioSettings] =
    useState<StudioSettings>(DEFAULT_SETTINGS);
  const [layoutMode, setLayoutMode] = useState<"builder" | "performance">(
    "builder",
  );
  const importRef = useRef<HTMLInputElement>(null);

  // Drag reorder (mouse)
  const {
    positions,
    setPositions,
    onDragStart,
    onDragging,
    onDragEnd,
    getStyle,
    isDragging,
    resetPositions,
  } = useDragReorder(studioSettings.gridSnap, 20);

  // Touch drag (mobile/tablet)
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchDrag({
    gridSnap: studioSettings.gridSnap,
    snapSize: 20,
    positions,
    setPositions,
  });

  // Keyboard nav
  const itemIds = useMemo(
    () => placedGear.map((g) => g.instanceId),
    [placedGear],
  );

  const handleKeyMove = useCallback(
    (id: string, dx: number, dy: number) => {
      setPositions((prev) => {
        const pos = prev[id] ?? { x: 0, y: 0 };
        return { ...prev, [id]: { x: pos.x + dx, y: pos.y + dy } };
      });
    },
    [setPositions],
  );

  const handleKeyDelete = useCallback(
    (id: string) => {
      setPlacedGear(placedGear.filter((g) => g.instanceId !== id));
      setActivePresetId(undefined);
    },
    [placedGear, setPlacedGear],
  );

  const { focusedId, isFocused, selectItem, clearFocus } = useKeyboardNav({
    itemIds,
    moveStep: studioSettings.gridSnap ? 20 : 10,
    onDelete: handleKeyDelete,
    onMove: handleKeyMove,
  });

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Load saved layout names on mount
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(STORAGE_KEY),
      );
      setSavedLayouts(keys.map((k) => k.replace(`${STORAGE_KEY}-`, "")));
    } catch {
      /* SSR guard */
    }
  }, []);

  // Auto-route signal graph
  const routeGraph = useMemo(
    () =>
      studioSettings.autoRoute
        ? autoRoute(placedGear)
        : { nodes: [], connections: [] },
    [placedGear, studioSettings.autoRoute],
  );

  const addGear = useCallback(
    (type: GearType) => {
      const count = placedGear.filter((g) => g.type === type).length;
      const label =
        type === "DECK"
          ? `Deck ${String.fromCharCode(65 + count)}`
          : type === "MIXER"
            ? "Master Mixer"
            : type === "TURNTABLE"
              ? `Turntable ${count + 1}`
              : type === "FX"
                ? "FX Unit"
                : "Sampler";
      setPlacedGear([
        ...placedGear,
        { instanceId: `gear-${nextId++}`, type, label },
      ]);
      setActivePresetId(undefined);
    },
    [placedGear, setPlacedGear],
  );

  const removeGear = useCallback(
    (id: string) => {
      setPlacedGear(placedGear.filter((g) => g.instanceId !== id));
      setActivePresetId(undefined);
    },
    [placedGear, setPlacedGear],
  );

  const handleLoadPreset = useCallback(
    (gear: PresetGear[]) => {
      const loaded = gear.map((g) => ({
        instanceId: `gear-${nextId++}`,
        type: g.type,
        label: g.label,
      }));
      setPlacedGear(loaded);
      resetPositions();
      toast(`Loaded preset with ${gear.length} units`);
    },
    [setPlacedGear, resetPositions],
  );

  // Save layout
  const saveLayout = useCallback(() => {
    const data = {
      name: layoutName,
      gear: placedGear,
      settings: studioSettings,
      positions,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY}-${layoutName}`, JSON.stringify(data));
    setSavedLayouts((prev) => [...new Set([...prev, layoutName])]);
    toast(`Layout "${layoutName}" saved`);
  }, [layoutName, placedGear, studioSettings, positions]);

  // Load layout from localStorage
  const loadSavedLayout = useCallback(
    (name: string) => {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY}-${name}`);
        if (!raw) return;
        const data = JSON.parse(raw);
        setPlacedGear(data.gear || []);
        setLayoutName(data.name || name);
        if (data.settings) setStudioSettings(data.settings);
        if (data.positions) setPositions(data.positions);
        else resetPositions();
        toast(`Loaded "${name}"`);
      } catch {
        /* parse error */
      }
    },
    [setPlacedGear, resetPositions, setPositions],
  );

  // Export as JSON
  const exportLayout = useCallback(() => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            name: layoutName,
            gear: placedGear,
            settings: studioSettings,
            positions,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layoutName.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layoutName, placedGear, studioSettings, positions]);

  // Import from JSON file
  const importLayout = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.gear && Array.isArray(data.gear)) {
            setPlacedGear(data.gear);
            if (data.name) setLayoutName(data.name);
            if (data.settings) setStudioSettings(data.settings);
            if (data.positions) setPositions(data.positions);
            else resetPositions();
            toast(`Imported "${data.name || file.name}"`);
          } else {
            toast("Invalid layout file");
          }
        } catch {
          toast("Failed to parse layout file");
        }
      };
      reader.readAsText(file);
      // Reset the input so the same file can be imported again
      e.target.value = "";
    },
    [setPlacedGear, setPositions, resetPositions],
  );

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(""), 2000);
  };

  const renderGear = (gear: PlacedGear) => {
    switch (gear.type) {
      case "DECK":
        return <PlatinumCDJ deckId={gear.instanceId} label={gear.label} />;
      case "MIXER":
        return <VintageMixer id={gear.instanceId} label={gear.label} />;
      case "TURNTABLE":
        return <CyberTurntable id={gear.instanceId} label={gear.label} />;
      case "FX":
        return <FXRack id={gear.instanceId} label={gear.label} />;
      case "SAMPLER":
        return <SamplerPad id={gear.instanceId} label={gear.label} />;
      default:
        return null;
    }
  };

  return (
    <div className="gear-page">
      {/* Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="sr-only"
        onChange={importLayout}
        aria-label="Import layout file"
      />

      {/* Header */}
      <header className="gear-topbar">
        <div className="topbar-brand">
          <span className="brand-icon">🎛️</span>
          <h1 className="brand-title">
            DGN-DJ <span className="brand-accent">Studio Gear</span>
          </h1>
          <button
            className={`layout-mode-toggle ${layoutMode === "performance" ? "perf-active" : ""}`}
            onClick={() =>
              setLayoutMode((m) =>
                m === "builder" ? "performance" : "builder",
              )
            }
            aria-pressed={layoutMode === "performance"}
          >
            {layoutMode === "builder" ? "⚡ Performance" : "🔧 Builder"}
          </button>
        </div>
        <div className="topbar-controls">
          <input
            className="layout-name-field"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            aria-label="Layout name"
          />
          <button
            className={`topbar-btn undo${canUndo ? "" : " disabled"}`}
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            className={`topbar-btn redo${canRedo ? "" : " disabled"}`}
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
          <button className="topbar-btn save" onClick={saveLayout}>
            💾 Save
          </button>
          <button className="topbar-btn export" onClick={exportLayout}>
            📤 Export
          </button>
          <button
            className="topbar-btn import"
            onClick={() => importRef.current?.click()}
          >
            📥 Import
          </button>
          <button
            className="topbar-btn clear"
            onClick={() => {
              resetGear([]);
              resetPositions();
              setActivePresetId(undefined);
              clearFocus();
            }}
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      {/* ─── Performance Mode ─── */}
      {layoutMode === "performance" && (
        <div className="perf-layout">
          <WaveformHeader />
          <div className="perf-decks">
            <PlatinumCDJ deckId="perf-a" label="DECK A" />
            <VintageMixer id="perf-mixer" label="CLUB MIXER" />
            <FXRack id="perf-fx" label="SEND FX" />
            <PlatinumCDJ deckId="perf-b" label="DECK B" />
          </div>
          <TrackLibrary />
        </div>
      )}

      {/* ─── Builder Mode ─── */}
      <div
        className={`gear-workspace ${layoutMode === "performance" ? "hidden" : ""}`}
      >
        {/* Sidebar */}
        <aside className="gear-sidebar">
          <div className="sidebar-section">
            <h2 className="sidebar-title">GEAR</h2>
            {GEAR_PALETTE.map((item) => (
              <button
                key={item.type}
                className="gear-add-btn"
                onClick={() => addGear(item.type)}
                aria-label={`Add ${item.label}`}
              >
                <span className="gear-add-icon">{item.icon}</span>
                <div className="gear-add-info">
                  <span className="gear-add-name">{item.label}</span>
                  <span className="gear-add-desc">{item.desc}</span>
                </div>
                <span className="gear-add-plus">+</span>
              </button>
            ))}
          </div>

          {savedLayouts.length > 0 && (
            <div className="sidebar-section">
              <h2 className="sidebar-title">SAVED</h2>
              {savedLayouts.map((name) => (
                <button
                  key={name}
                  className="saved-layout-btn"
                  onClick={() => loadSavedLayout(name)}
                >
                  📂 {name}
                </button>
              ))}
            </div>
          )}

          <div className="sidebar-footer">
            <div className="gear-count">{placedGear.length} units</div>
            {focusedId && (
              <div className="focus-indicator">
                ⌨{" "}
                {placedGear.find((g) => g.instanceId === focusedId)?.label ??
                  ""}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="gear-main">
          {/* Canvas with drag + touch + keyboard support */}
          <main
            className={`gear-canvas-area${isDragging ? " dragging" : ""}`}
            onMouseMove={onDragging}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {placedGear.length === 0 ? (
              <div className="canvas-empty">
                <div className="empty-icon">🎛️</div>
                <h2 className="empty-title">Build Your Setup</h2>
                <p className="empty-desc">
                  Click gear from the sidebar, load a preset, or import a layout
                </p>
              </div>
            ) : (
              <div className="gear-canvas-grid">
                {placedGear.map((gear) => (
                  <div
                    key={gear.instanceId}
                    className={`canvas-gear-card${isFocused(gear.instanceId) ? " kb-focused" : ""}`}
                    style={getStyle(gear.instanceId)}
                    onMouseDown={(e) => {
                      selectItem(gear.instanceId);
                      onDragStart(gear.instanceId, e);
                    }}
                    onTouchStart={(e) => {
                      selectItem(gear.instanceId);
                      onTouchStart(gear.instanceId, e);
                    }}
                    onClick={() => selectItem(gear.instanceId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${gear.label} — drag to reposition, arrows to move, Delete to remove`}
                  >
                    <button
                      className="canvas-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGear(gear.instanceId);
                      }}
                      aria-label={`Remove ${gear.label}`}
                    >
                      ✕
                    </button>
                    <div className="drag-handle" aria-hidden="true">
                      ⠿
                    </div>
                    {renderGear(gear)}
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Bottom Panel */}
          <GearBottomPanel activeTab={bottomTab} onTabChange={setBottomTab}>
            {bottomTab === "presets" && (
              <PresetLibrary
                onLoadPreset={handleLoadPreset}
                activePresetId={activePresetId}
              />
            )}
            {bottomTab === "routing" && (
              <AudioRoutingViz
                nodes={routeGraph.nodes}
                connections={routeGraph.connections}
                isLive={placedGear.length > 0}
              />
            )}
            {bottomTab === "settings" && (
              <GearSettings
                settings={studioSettings}
                onChange={setStudioSettings}
              />
            )}
          </GearBottomPanel>
        </div>
      </div>

      {/* Toast */}
      {showToast && <div className="gear-toast">{showToast}</div>}
    </div>
  );
}
