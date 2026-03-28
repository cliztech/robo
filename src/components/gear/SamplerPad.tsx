import React, { useState, useCallback } from "react";
import "./SamplerPad.css";
import type { GearUnitProps } from "./gear.types";

/**
 * SamplerPad — An 8-pad sample trigger with velocity-sensitive visual feedback.
 * SGE Gear Unit (mod-drop v1.0) — Skin: DARK
 */

interface Pad {
  id: number;
  label: string;
  color: string;
  isPlaying: boolean;
}

const DEFAULT_PADS: Pad[] = [
  { id: 1, label: "KICK", color: "#ff3d00", isPlaying: false },
  { id: 2, label: "SNARE", color: "#ff9100", isPlaying: false },
  { id: 3, label: "CLAP", color: "#ffea00", isPlaying: false },
  { id: 4, label: "HAT", color: "#00e676", isPlaying: false },
  { id: 5, label: "STAB", color: "#00e5ff", isPlaying: false },
  { id: 6, label: "FX1", color: "#7c4dff", isPlaying: false },
  { id: 7, label: "VOX", color: "#e040fb", isPlaying: false },
  { id: 8, label: "DROP", color: "#ff1744", isPlaying: false },
];

export const SamplerPad: React.FC<Partial<GearUnitProps>> = ({
  id = "sampler-1",
  label = "Sampler",
}) => {
  const [pads, setPads] = useState<Pad[]>(DEFAULT_PADS);
  const [bank, setBank] = useState<"A" | "B">("A");

  const triggerPad = useCallback((padId: number) => {
    setPads((prev) =>
      prev.map((p) => (p.id === padId ? { ...p, isPlaying: true } : p)),
    );
    // Auto-release after 300ms (one-shot sample behavior)
    setTimeout(() => {
      setPads((prev) =>
        prev.map((p) => (p.id === padId ? { ...p, isPlaying: false } : p)),
      );
    }, 300);
  }, []);

  // Keyboard shortcut mapping: keys 1-8 trigger pads
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const padNum = parseInt(e.key);
      if (padNum >= 1 && padNum <= 8) {
        triggerPad(padNum);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [triggerPad]);

  return (
    <div className="sampler-pad gear-unit" role="region" aria-label={label}>
      <div className="sampler-header">
        <span className="sampler-label">{label}</span>
        <div className="bank-selector">
          <button
            className={`bank-btn ${bank === "A" ? "active" : ""}`}
            onClick={() => setBank("A")}
            aria-label="Bank A"
          >
            A
          </button>
          <button
            className={`bank-btn ${bank === "B" ? "active" : ""}`}
            onClick={() => setBank("B")}
            aria-label="Bank B"
          >
            B
          </button>
        </div>
      </div>

      <div className="pad-grid">
        {pads.map((pad) => (
          <button
            key={pad.id}
            className={`pad ${pad.isPlaying ? "triggered" : ""}`}
            style={
              {
                "--pad-color": pad.color,
                "--pad-glow": `${pad.color}66`,
              } as React.CSSProperties
            }
            onClick={() => triggerPad(pad.id)}
            aria-label={`Trigger ${pad.label}`}
          >
            <span className="pad-label">{pad.label}</span>
            <span className="pad-key">{pad.id}</span>
          </button>
        ))}
      </div>

      <div className="sampler-footer">
        <span className="kb-hint">Keys 1-8 to trigger</span>
      </div>
    </div>
  );
};

export default SamplerPad;
