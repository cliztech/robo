import React, { useState } from "react";
import "./GearSettings.css";

/**
 * GearSettings — Studio configuration panel.
 * Controls global studio preferences like grid snap, label visibility,
 * metering mode, and theme accents.
 */

export interface StudioSettings {
  gridSnap: boolean;
  showLabels: boolean;
  meteringMode: "peak" | "rms" | "off";
  accentColor: string;
  autoRoute: boolean;
}

const ACCENT_COLORS = [
  { id: "cyan", hex: "#00e5ff", label: "Cyan" },
  { id: "purple", hex: "#7c4dff", label: "Purple" },
  { id: "orange", hex: "#ff9100", label: "Orange" },
  { id: "green", hex: "#00e676", label: "Green" },
  { id: "pink", hex: "#ff4081", label: "Pink" },
];

interface GearSettingsProps {
  settings: StudioSettings;
  onChange: (settings: StudioSettings) => void;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  gridSnap: true,
  showLabels: true,
  meteringMode: "peak",
  accentColor: "#00e5ff",
  autoRoute: true,
};

export const GearSettings: React.FC<GearSettingsProps> = ({
  settings,
  onChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const update = (patch: Partial<StudioSettings>) => {
    const next = { ...localSettings, ...patch };
    setLocalSettings(next);
    onChange(next);
  };

  return (
    <div className="gear-settings" role="form" aria-label="Studio settings">
      <div className="settings-row">
        <span className="settings-label">Grid Snap</span>
        <button
          className={`settings-toggle${localSettings.gridSnap ? " on" : ""}`}
          onClick={() => update({ gridSnap: !localSettings.gridSnap })}
          role="switch"
          aria-checked={localSettings.gridSnap}
          aria-label="Grid Snap"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">Show Labels</span>
        <button
          className={`settings-toggle${localSettings.showLabels ? " on" : ""}`}
          onClick={() => update({ showLabels: !localSettings.showLabels })}
          role="switch"
          aria-checked={localSettings.showLabels}
          aria-label="Show Labels"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">Auto-Route Signal</span>
        <button
          className={`settings-toggle${localSettings.autoRoute ? " on" : ""}`}
          onClick={() => update({ autoRoute: !localSettings.autoRoute })}
          role="switch"
          aria-checked={localSettings.autoRoute}
          aria-label="Auto-Route Signal"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="settings-row">
        <span className="settings-label">Metering</span>
        <div
          className="settings-segmented"
          role="radiogroup"
          aria-label="Metering mode"
        >
          {(["peak", "rms", "off"] as const).map((mode) => (
            <button
              key={mode}
              className={`segmented-btn${localSettings.meteringMode === mode ? " active" : ""}`}
              role="radio"
              aria-checked={localSettings.meteringMode === mode}
              onClick={() => update({ meteringMode: mode })}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <span className="settings-label">Accent Color</span>
        <div
          className="color-swatches"
          role="radiogroup"
          aria-label="Accent color"
        >
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.id}
              className={`color-swatch${localSettings.accentColor === c.hex ? " selected" : ""} swatch-${c.id}`}
              onClick={() => update({ accentColor: c.hex })}
              aria-label={`${c.label} accent color`}
              role="radio"
              aria-checked={localSettings.accentColor === c.hex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GearSettings;
