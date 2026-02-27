"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, RefreshCcw, Save, Unlock } from "lucide-react";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
import { DegenMixer } from "@/components/audio/DegenMixer";
import { DegenTrackList } from "@/components/audio/DegenTrackList";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import {
  BUILT_IN_LAYOUT_PRESET_NAMES,
  type BuiltInLayoutPresetName,
  createBuiltInLayoutPreset,
  type ConsoleLayoutModel,
  type LayoutPanelId,
} from "@/lib/layout/types";
import { DashboardView } from "./DashboardView";
import { DEFAULT_DASHBOARD_TELEMETRY } from "./dashboard.types";
import type { ConsoleViewMode } from "./types";

interface ConsoleWorkspaceViewProps {
  currentView: ConsoleViewMode;
}

interface StoredLayoutPresets {
  selected_preset: string;
  custom_presets: Record<string, ConsoleLayoutModel>;
}

const LAYOUT_STORAGE_KEY = "dgn_dj_console_layout_presets_v1";
const PANEL_ORDER: LayoutPanelId[] = [
  "waveform_a",
  "waveform_b",
  "deck_a",
  "mixer",
  "deck_b",
  "library",
  "performance",
];

function DeckTransportPanel({ deck, isPlaying }: { deck: "A" | "B"; isPlaying: boolean }) {
  return (
    <section className="glass-panel overflow-hidden h-full">
      <div className="panel-header">
        <span className="panel-header-title">Deck {deck} Transport</span>
      </div>
      <div className="p-3 text-xs text-zinc-300">{isPlaying ? "Playing" : "Standby"} • Transport armed</div>
    </section>
  );
}

function PerformancePanel() {
  return (
    <div className="h-full flex flex-col gap-3">
      <section className="glass-panel overflow-hidden">
        <div className="panel-header">
          <span className="panel-header-title">Performance Pads</span>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {Array.from({ length: 8 }, (_, index) => (
            <button key={index} type="button" className="dj-performance-pad" aria-label={`Pad ${index + 1}`}>
              {index + 1}
            </button>
          ))}
        </div>
      </section>
      <DegenEffectRack
        title="FX Bank"
        deck="A"
        controls={[
          { key: "chorus", label: "Chorus", unit: "%" },
          { key: "phaser", label: "Phaser", unit: "%" },
          { key: "rate", label: "Rate", unit: "Hz", max: 20 },
        ]}
      />
    </div>
  );
}

function getPanelBody(panelId: LayoutPanelId) {
  switch (panelId) {
    case "waveform_a":
      return (
        <DegenWaveform
          deck="A"
          progress={0.42}
          duration={234}
          trackTitle="Neural Drift v2.1 — SynthKong"
          isPlaying
          cuePoints={[
            { position: 0.12, label: "CUE 1", color: "#ff6b00" },
            { position: 0.68, label: "DROP", color: "#bf00ff" },
          ]}
        />
      );
    case "waveform_b":
      return (
        <DegenWaveform
          deck="B"
          progress={0.15}
          duration={198}
          trackTitle="Bass Gorilla — DJ DegenApe"
          isPlaying={false}
          cuePoints={[
            { position: 0.08, label: "INTRO", color: "#3b82f6" },
            { position: 0.52, label: "BUILD", color: "#bf00ff" },
          ]}
        />
      );
    case "deck_a":
      return <DeckTransportPanel deck="A" isPlaying />;
    case "deck_b":
      return <DeckTransportPanel deck="B" isPlaying={false} />;
    case "mixer":
      return <DegenMixer className="h-full" />;
    case "library":
      return <DegenTrackList className="max-h-[300px] lg:max-h-full" />;
    case "performance":
      return <PerformancePanel />;
    default:
      return null;
  }
}

function loadStoredLayoutState(): StoredLayoutPresets {
  const fallback: StoredLayoutPresets = {
    selected_preset: "Broadcast",
    custom_presets: {},
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as StoredLayoutPresets;
    return {
      selected_preset: parsed.selected_preset ?? fallback.selected_preset,
      custom_presets: parsed.custom_presets ?? {},
    };
  } catch {
    return fallback;
  }
}

function saveStoredLayoutState(state: StoredLayoutPresets) {
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(state));
}

function isBuiltInPresetName(value: string): value is BuiltInLayoutPresetName {
  return BUILT_IN_LAYOUT_PRESET_NAMES.includes(value as BuiltInLayoutPresetName);
}

function DockWorkspace() {
  const [customPresetName, setCustomPresetName] = useState("");
  const [customPresets, setCustomPresets] = useState<Record<string, ConsoleLayoutModel>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>("Broadcast");
  const [layout, setLayout] = useState<ConsoleLayoutModel>(() => createBuiltInLayoutPreset("Broadcast"));
  const [draggingPanelId, setDraggingPanelId] = useState<LayoutPanelId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = loadStoredLayoutState();
    setCustomPresets(state.custom_presets);
    setSelectedPreset(state.selected_preset);
    if (isBuiltInPresetName(state.selected_preset)) {
      setLayout(createBuiltInLayoutPreset(state.selected_preset));
      return;
    }
    const custom = state.custom_presets[state.selected_preset];
    if (custom) {
      setLayout(structuredClone(custom));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    saveStoredLayoutState({ selected_preset: selectedPreset, custom_presets: customPresets });
  }, [customPresets, selectedPreset]);

  const visiblePanels = useMemo(() => {
    const stackMembersToHide = new Set<LayoutPanelId>();
    Object.values(layout.tab_stacks).forEach((stack) => {
      const [primary, ...rest] = stack.panel_ids.filter((panelId) => layout.panel_visibility[panelId]);
      if (!primary) {
        return;
      }
      rest.forEach((panelId) => stackMembersToHide.add(panelId));
    });

    return PANEL_ORDER.filter(
      (panelId) => layout.panel_visibility[panelId] && !stackMembersToHide.has(panelId),
    );
  }, [layout.panel_visibility, layout.tab_stacks]);

  function applyPreset(presetName: string) {
    setSelectedPreset(presetName);
    if (isBuiltInPresetName(presetName)) {
      setLayout(createBuiltInLayoutPreset(presetName));
      return;
    }
    const custom = customPresets[presetName];
    if (custom) {
      setLayout(structuredClone(custom));
    }
  }

  function saveAsCustomPreset() {
    const name = customPresetName.trim();
    if (!name) {
      return;
    }
    setCustomPresets((prev) => ({ ...prev, [name]: { ...structuredClone(layout), name } }));
    setCustomPresetName("");
    setSelectedPreset(name);
  }

  function restoreSelectedPresetDefaults() {
    if (isBuiltInPresetName(selectedPreset)) {
      setLayout(createBuiltInLayoutPreset(selectedPreset));
      return;
    }
    const custom = customPresets[selectedPreset];
    if (custom) {
      setLayout(structuredClone(custom));
      return;
    }
    setLayout(createBuiltInLayoutPreset("Broadcast"));
  }

  function swapPanelPosition(source: LayoutPanelId, target: LayoutPanelId) {
    setLayout((prev) => {
      const next = structuredClone(prev);
      const sourcePosition = next.panels[source].position;
      next.panels[source].position = next.panels[target].position;
      next.panels[target].position = sourcePosition;
      return next;
    });
  }

  function handleWorkspaceKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key.toLowerCase() === "r" && event.ctrlKey && event.shiftKey) {
      event.preventDefault();
      restoreSelectedPresetDefaults();
      return;
    }
    if ((event.key.toLowerCase() === "l" && event.ctrlKey) || event.key === "F4") {
      event.preventDefault();
      setLayout((prev) => ({ ...prev, is_locked: !prev.is_locked }));
      return;
    }

    const focusedPanelId = (event.target as HTMLElement).dataset.panelId as LayoutPanelId | undefined;
    if (!focusedPanelId || layout.is_locked) {
      return;
    }

    const sourcePosition = layout.panels[focusedPanelId].position;
    const neighbor = PANEL_ORDER.find((candidate) => {
      if (candidate === focusedPanelId || !layout.panel_visibility[candidate]) {
        return false;
      }
      const pos = layout.panels[candidate].position;
      if (event.key === "ArrowLeft") {
        return pos.column + pos.column_span === sourcePosition.column;
      }
      if (event.key === "ArrowRight") {
        return sourcePosition.column + sourcePosition.column_span === pos.column;
      }
      if (event.key === "ArrowUp") {
        return pos.row + pos.row_span === sourcePosition.row;
      }
      if (event.key === "ArrowDown") {
        return sourcePosition.row + sourcePosition.row_span === pos.row;
      }
      return false;
    });

    if (!neighbor) {
      return;
    }

    event.preventDefault();
    swapPanelPosition(focusedPanelId, neighbor);
  }

  return (
    <section className="space-y-3" onKeyDown={handleWorkspaceKeyDown}>
      <div className="glass-panel p-3 flex flex-wrap items-center gap-2">
        <label className="text-xs uppercase tracking-[0.16em] text-zinc-400">Layout Preset</label>
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          value={selectedPreset}
          onChange={(event) => applyPreset(event.target.value)}
          aria-label="Layout preset selector"
        >
          {BUILT_IN_LAYOUT_PRESET_NAMES.map((presetName) => (
            <option key={presetName} value={presetName}>
              {presetName}
            </option>
          ))}
          {Object.keys(customPresets).map((presetName) => (
            <option key={presetName} value={presetName}>
              {presetName}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="px-2 py-1 border border-zinc-700 rounded text-xs flex items-center gap-1"
          onClick={() => setLayout((prev) => ({ ...prev, is_locked: !prev.is_locked }))}
          aria-label="Toggle layout lock"
        >
          {layout.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
          {layout.is_locked ? "Locked" : "Unlocked"}
        </button>
        <button
          type="button"
          className="px-2 py-1 border border-zinc-700 rounded text-xs flex items-center gap-1"
          onClick={restoreSelectedPresetDefaults}
        >
          <RefreshCcw size={14} /> Restore Default
        </button>
        <input
          value={customPresetName}
          onChange={(event) => setCustomPresetName(event.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          placeholder="Save custom preset"
          aria-label="Custom preset name"
        />
        <button
          type="button"
          className="px-2 py-1 border border-zinc-700 rounded text-xs flex items-center gap-1"
          onClick={saveAsCustomPreset}
          disabled={!customPresetName.trim()}
        >
          <Save size={14} /> Save
        </button>
      </div>

      <div
        ref={containerRef}
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(2, minmax(0, ${layout.split_ratios.left}fr)) repeat(2, minmax(0, ${layout.split_ratios.center}fr)) repeat(2, minmax(0, ${layout.split_ratios.right}fr))`,
          gridAutoRows: "minmax(180px, auto)",
        }}
      >
        {visiblePanels.map((panelId) => {
          const panel = layout.panels[panelId];
          const tabStack = Object.values(layout.tab_stacks).find((stack) => stack.panel_ids.includes(panelId));
          const isPanelDraggable = !layout.is_locked;

          return (
            <article
              key={panelId}
              data-panel-id={panelId}
              className="glass-panel overflow-hidden outline-none"
              style={{
                gridColumn: `${panel.position.column} / span ${panel.position.column_span}`,
                gridRow: `${panel.position.row} / span ${panel.position.row_span}`,
              }}
              tabIndex={0}
              draggable={isPanelDraggable}
              onDragStart={() => setDraggingPanelId(panelId)}
              onDragOver={(event) => {
                if (isPanelDraggable) {
                  event.preventDefault();
                }
              }}
              onDrop={() => {
                if (draggingPanelId && draggingPanelId !== panelId && isPanelDraggable) {
                  swapPanelPosition(draggingPanelId, panelId);
                }
                setDraggingPanelId(null);
              }}
              aria-label={`${panel.title} panel`}
            >
              <header className="panel-header flex items-center justify-between">
                <span className="panel-header-title">{panel.title}</span>
                {!layout.is_locked && <span className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">Drag enabled</span>}
              </header>
              {tabStack && tabStack.panel_ids.length > 1 ? (
                <div className="p-2">
                  <div className="flex gap-2 pb-2">
                    {tabStack.panel_ids.map((id) => (
                      <button
                        type="button"
                        key={id}
                        className="text-xs px-2 py-1 border border-zinc-700 rounded"
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            tab_stacks: {
                              ...prev.tab_stacks,
                              [tabStack.id]: {
                                ...prev.tab_stacks[tabStack.id],
                                active_panel_id: id,
                              },
                            },
                          }))
                        }
                      >
                        {prevTitle(layout, id)}
                      </button>
                    ))}
                  </div>
                  {getPanelBody(tabStack.active_panel_id)}
                </div>
              ) : (
                <div className="p-2 h-[calc(100%-34px)]">{getPanelBody(panelId)}</div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function prevTitle(layout: ConsoleLayoutModel, panelId: LayoutPanelId) {
  return layout.panels[panelId].title.replace(" / ", " ");
}

export function ConsoleWorkspaceView({
  currentView,
}: ConsoleWorkspaceViewProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      >
        {currentView === "dashboard" && (
          <DashboardView telemetry={DEFAULT_DASHBOARD_TELEMETRY} />
        )}
        {(currentView === "decks" || currentView === "studio") && <DockWorkspace />}
        {currentView === "mixer" && (
          <div className="max-w-4xl mx-auto">
            <DegenMixer />
          </div>
        )}
        {currentView === "library" && (
          <DegenTrackList className="max-h-[calc(100vh-160px)]" />
        )}
        {currentView === "schedule" && (
          <div className="max-w-5xl mx-auto">
            <DegenScheduleTimeline />
          </div>
        )}
        {currentView === "ai-host" && (
          <div className="max-w-3xl mx-auto">
            <DegenAIHost className="max-h-[calc(100vh-160px)]" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
