"use client";

import React, { useState, useCallback, useEffect } from "react";
import { PlatinumCDJ } from "@/components/gear/PlatinumCDJ";
import { VintageMixer } from "@/components/gear/VintageMixer";
import { CyberTurntable } from "@/components/gear/CyberTurntable";
import { FXRack } from "@/components/gear/FXRack";
import { SamplerPad } from "@/components/gear/SamplerPad";
import type { GearType } from "@/components/gear/gear.types";
import "./gear.css";

/**
 * /gear route — DGN-DJ Studio Gear Builder
 * Full-page modular layout with sidebar palette, layout persistence,
 * and real-time gear rendering.
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
  const [placedGear, setPlacedGear] = useState<PlacedGear[]>([]);
  const [layoutName, setLayoutName] = useState("My Setup");
  const [savedLayouts, setSavedLayouts] = useState<string[]>([]);
  const [showToast, setShowToast] = useState("");

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

  // Add gear via click (no drag needed)
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

      setPlacedGear((prev) => [
        ...prev,
        { instanceId: `gear-${nextId++}`, type, label },
      ]);
    },
    [placedGear],
  );

  const removeGear = useCallback((id: string) => {
    setPlacedGear((prev) => prev.filter((g) => g.instanceId !== id));
  }, []);

  // Save layout
  const saveLayout = useCallback(() => {
    const data = {
      name: layoutName,
      gear: placedGear,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY}-${layoutName}`, JSON.stringify(data));
    setSavedLayouts((prev) => [...new Set([...prev, layoutName])]);
    setShowToast(`Layout "${layoutName}" saved`);
    setTimeout(() => setShowToast(""), 2000);
  }, [layoutName, placedGear]);

  // Load layout
  const loadSavedLayout = useCallback((name: string) => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}-${name}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      setPlacedGear(data.gear || []);
      setLayoutName(data.name || name);
      setShowToast(`Loaded "${name}"`);
      setTimeout(() => setShowToast(""), 2000);
    } catch {
      /* parse error */
    }
  }, []);

  // Export as JSON file
  const exportLayout = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ name: layoutName, gear: placedGear }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layoutName.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layoutName, placedGear]);

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
      {/* Header */}
      <header className="gear-topbar">
        <div className="topbar-brand">
          <span className="brand-icon">🎛️</span>
          <h1 className="brand-title">
            DGN-DJ <span className="brand-accent">Studio Gear</span>
          </h1>
        </div>
        <div className="topbar-controls">
          <input
            className="layout-name-field"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            aria-label="Layout name"
          />
          <button className="topbar-btn save" onClick={saveLayout}>
            💾 Save
          </button>
          <button className="topbar-btn export" onClick={exportLayout}>
            📤 Export
          </button>
          <button
            className="topbar-btn clear"
            onClick={() => setPlacedGear([])}
          >
            🗑️ Clear
          </button>
        </div>
      </header>

      <div className="gear-workspace">
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
          </div>
        </aside>

        {/* Canvas */}
        <main className="gear-canvas-area">
          {placedGear.length === 0 ? (
            <div className="canvas-empty">
              <div className="empty-icon">🎛️</div>
              <h2 className="empty-title">Build Your Setup</h2>
              <p className="empty-desc">
                Click gear from the sidebar to add it to your layout
              </p>
            </div>
          ) : (
            <div className="gear-canvas-grid">
              {placedGear.map((gear) => (
                <div key={gear.instanceId} className="canvas-gear-card">
                  <button
                    className="canvas-remove-btn"
                    onClick={() => removeGear(gear.instanceId)}
                    aria-label={`Remove ${gear.label}`}
                  >
                    ✕
                  </button>
                  {renderGear(gear)}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {showToast && <div className="gear-toast">{showToast}</div>}
    </div>
  );
}
