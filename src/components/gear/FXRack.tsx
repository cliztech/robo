import React, { useState } from "react";
import "./FXRack.css";
import type { GearUnitProps } from "./gear.types";

/**
 * FXRack — A multi-effect processor with wet/dry knobs and beat-sync toggle.
 * SGE Gear Unit (mod-drop v1.0) — Skin: DARK
 */

interface FXSlot {
  name: string;
  wet: number;
  active: boolean;
  color: string;
}

const DEFAULT_FX: FXSlot[] = [
  { name: "ECHO", wet: 40, active: false, color: "#00e5ff" },
  { name: "REVERB", wet: 30, active: false, color: "#7c4dff" },
  { name: "FLANGER", wet: 50, active: false, color: "#ff3d00" },
  { name: "FILTER", wet: 60, active: true, color: "#00e676" },
];

export const FXRack: React.FC<Partial<GearUnitProps>> = ({
  id = "fx-1",
  label = "FX Rack",
}) => {
  const [slots, setSlots] = useState<FXSlot[]>(DEFAULT_FX);
  const [beatSync, setBeatSync] = useState(true);

  const toggleFX = (idx: number) => {
    setSlots((prev) =>
      prev.map((fx, i) => (i === idx ? { ...fx, active: !fx.active } : fx)),
    );
  };

  const updateWet = (idx: number, wet: number) => {
    setSlots((prev) => prev.map((fx, i) => (i === idx ? { ...fx, wet } : fx)));
  };

  return (
    <div className="fx-rack gear-unit" role="region" aria-label={label}>
      <div className="fx-header">
        <span className="fx-label">{label}</span>
        <button
          className={`beat-sync-btn ${beatSync ? "active" : ""}`}
          onClick={() => setBeatSync(!beatSync)}
          aria-label="Beat sync toggle"
          aria-pressed={beatSync ? "true" : "false"}
        >
          SYNC
        </button>
      </div>

      <div className="fx-slots">
        {slots.map((fx, i) => (
          <div
            key={fx.name}
            className={`fx-slot ${fx.active ? "active" : ""}`}
            style={{ "--fx-color": fx.color } as React.CSSProperties}
          >
            <button
              className="fx-toggle"
              onClick={() => toggleFX(i)}
              aria-label={`Toggle ${fx.name}`}
              aria-pressed={fx.active ? "true" : "false"}
            >
              {fx.name}
            </button>
            <div className="fx-wet-section">
              <input
                type="range"
                className="fx-wet-slider"
                min={0}
                max={100}
                value={fx.wet}
                onChange={(e) => updateWet(i, Number(e.target.value))}
                aria-label={`${fx.name} wet/dry`}
              />
              <span className="fx-wet-value">{fx.wet}%</span>
            </div>
            <div
              className="fx-indicator"
              style={{
                opacity: fx.active ? 1 : 0.15,
                backgroundColor: fx.color,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FXRack;
