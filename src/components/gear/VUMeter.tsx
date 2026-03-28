import React, { useEffect, useRef, useState } from "react";
import "./VUMeter.css";

/**
 * VUMeter — Real-time audio level meter component.
 * Supports peak and RMS display modes with peak-hold indicator.
 *
 * Can be fed real values from useGearAudio or demo values for display.
 */

export interface VUMeterProps {
  /** Current level 0-1 */
  level: number;
  /** Peak hold level 0-1 */
  peakLevel?: number;
  /** Display mode */
  mode?: "peak" | "rms" | "off";
  /** Orientation */
  orientation?: "vertical" | "horizontal";
  /** Channel label */
  label?: string;
  /** Width in px (horizontal) or height (vertical) */
  size?: number;
  /** Enable animated demo mode (for display when no real audio) */
  demo?: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  level: propLevel,
  peakLevel: propPeak,
  mode = "peak",
  orientation = "vertical",
  label,
  size = 80,
  demo = false,
}) => {
  const [demoLevel, setDemoLevel] = useState(0);
  const [demoPeak, setDemoPeak] = useState(0);
  const rafRef = useRef(0);

  // Demo animation
  useEffect(() => {
    if (!demo) return;
    let phase = 0;
    const tick = () => {
      phase += 0.03;
      const base = 0.4 + Math.sin(phase) * 0.3 + Math.sin(phase * 2.7) * 0.15;
      const lvl = Math.max(0, Math.min(1, base + Math.random() * 0.08));
      setDemoLevel(lvl);
      setDemoPeak((prev) => Math.max(lvl, prev * 0.995));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [demo]);

  const level = demo ? demoLevel : propLevel;
  const peakLevel = demo ? demoPeak : (propPeak ?? level);

  if (mode === "off") {
    return (
      <div
        className={`vu-meter-unit ${orientation}`}
        aria-label={label ? `${label} meter off` : "Meter off"}
      >
        <div
          className="vu-track"
          style={
            orientation === "vertical" ? { height: size } : { width: size }
          }
        >
          <div className="vu-bar off" />
        </div>
        {label && <span className="vu-label">{label}</span>}
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, level * 100));
  const peakPct = Math.max(0, Math.min(100, peakLevel * 100));

  // Color zones: green (0-65), yellow (65-85), red (85-100)
  const getBarColor = () => {
    if (pct > 85) return "red";
    if (pct > 65) return "yellow";
    return "green";
  };

  const sizeStyle =
    orientation === "vertical" ? { height: size } : { width: size };

  const barStyle: React.CSSProperties =
    orientation === "vertical" ? { height: `${pct}%` } : { width: `${pct}%` };

  const peakStyle: React.CSSProperties =
    orientation === "vertical"
      ? { bottom: `${peakPct}%` }
      : { left: `${peakPct}%` };

  return (
    <div
      className={`vu-meter-unit ${orientation}`}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ? `${label} audio level` : "Audio level"}
    >
      <div className="vu-track" style={sizeStyle}>
        <div className={`vu-bar ${getBarColor()}`} style={barStyle} />
        {mode === "peak" && peakPct > 0 && (
          <div className="vu-peak-hold" style={peakStyle} />
        )}
        {/* Scale markers */}
        <div className="vu-scale">
          <span
            className="vu-mark"
            style={
              orientation === "vertical" ? { bottom: "85%" } : { left: "85%" }
            }
          />
          <span
            className="vu-mark"
            style={
              orientation === "vertical" ? { bottom: "65%" } : { left: "65%" }
            }
          />
        </div>
      </div>
      {label && <span className="vu-label">{label}</span>}
    </div>
  );
};

export default VUMeter;
