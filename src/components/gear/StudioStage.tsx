import React, { useState, useCallback } from "react";
import "./StudioStage.css";
import { PlatinumCDJ } from "./PlatinumCDJ";
import { VintageMixer } from "./VintageMixer";
import { CyberTurntable } from "./CyberTurntable";
import { FXRack } from "./FXRack";
import { SamplerPad } from "./SamplerPad";
import type { GearType } from "./gear.types";

/**
 * StudioStage — The modular layout engine for DGN-DJ Studio.
 * Users can drag gear from the palette and drop it onto the stage grid.
 * Implements the modular-layout-engine skill.
 */

interface PlacedGear {
  instanceId: string;
  type: GearType;
  label: string;
  gridColumn: number;
  gridRow: number;
}

const GEAR_PALETTE: { type: GearType; label: string; icon: string }[] = [
  { type: "DECK", label: "Platinum CDJ", icon: "💿" },
  { type: "MIXER", label: "Vintage Mixer", icon: "🎚️" },
  { type: "TURNTABLE", label: "Cyber Turntable", icon: "🎵" },
  { type: "FX", label: "FX Rack", icon: "✨" },
  { type: "SAMPLER", label: "Sampler Pad", icon: "🥁" },
];

let nextId = 1;

export const StudioStage: React.FC = () => {
  const [placedGear, setPlacedGear] = useState<PlacedGear[]>([]);
  const [dragType, setDragType] = useState<GearType | null>(null);
  const [layoutName, setLayoutName] = useState("My Setup");

  const handleDragStart = (type: GearType) => {
    setDragType(type);
  };

  const handleDrop = useCallback(
    (col: number, row: number) => {
      if (!dragType) return;

      const defaultLabel =
        dragType === "DECK"
          ? `Deck ${String.fromCharCode(65 + placedGear.filter((g) => g.type === "DECK").length)}`
          : dragType === "MIXER"
            ? "Master Mixer"
            : dragType === "FX"
              ? "FX Unit"
              : dragType === "SAMPLER"
                ? "Sampler"
                : `Turntable ${placedGear.filter((g) => g.type === "TURNTABLE").length + 1}`;

      setPlacedGear((prev) => [
        ...prev,
        {
          instanceId: `gear-${nextId++}`,
          type: dragType,
          label: defaultLabel,
          gridColumn: col,
          gridRow: row,
        },
      ]);
      setDragType(null);
    },
    [dragType, placedGear],
  );

  const handleRemoveGear = (instanceId: string) => {
    setPlacedGear((prev) => prev.filter((g) => g.instanceId !== instanceId));
  };

  const renderGearComponent = (gear: PlacedGear) => {
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
        return <div className="unknown-gear">Unknown Gear</div>;
    }
  };

  const handleExportLayout = () => {
    const layout = {
      name: layoutName,
      gear: placedGear,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layoutName.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="studio-stage">
      {/* Toolbar */}
      <div className="stage-toolbar">
        <div className="stage-title">
          <span className="stage-icon">🎛️</span>
          <input
            className="layout-name-input"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            aria-label="Layout name"
          />
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={handleExportLayout}>
            💾 Export
          </button>
          <button
            className="toolbar-btn danger"
            onClick={() => setPlacedGear([])}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="stage-body">
        {/* Gear Palette */}
        <div className="gear-palette">
          <div className="palette-title">GEAR</div>
          {GEAR_PALETTE.map((item) => (
            <div
              key={item.type}
              className="palette-item"
              draggable
              onDragStart={() => handleDragStart(item.type)}
            >
              <span className="palette-icon">{item.icon}</span>
              <span className="palette-name">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Drop Grid */}
        <div className="stage-grid">
          {placedGear.length === 0 && (
            <div className="stage-empty-hint">
              <div className="hint-icon">🎛️</div>
              <div className="hint-text">
                Drag gear from the palette to build your setup
              </div>
            </div>
          )}

          <div className="gear-canvas">
            {placedGear.map((gear) => (
              <div key={gear.instanceId} className="placed-gear-wrapper">
                <button
                  className="remove-gear-btn"
                  onClick={() => handleRemoveGear(gear.instanceId)}
                  aria-label={`Remove ${gear.label}`}
                >
                  ✕
                </button>
                {renderGearComponent(gear)}
              </div>
            ))}
          </div>

          {/* Drop zone overlay */}
          <div
            className="drop-zone-overlay"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(0, placedGear.length)}
          />
        </div>
      </div>
    </div>
  );
};

export default StudioStage;
