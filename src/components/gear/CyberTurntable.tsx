import React, { useState, useEffect, useRef } from "react";
import "./CyberTurntable.css";
import type { GearUnitProps } from "./gear.types";

/**
 * CyberTurntable — A futuristic vinyl turntable with platter physics.
 * SGE Gear Unit (mod-drop v1.0) — Skin: CYBER
 */
export const CyberTurntable: React.FC<Partial<GearUnitProps>> = ({
  id = "turntable-1",
  label = "Deck A",
  syncState,
}) => {
  const bpm = syncState?.bpm ?? 128.0;
  const [isSpinning, setIsSpinning] = useState(false);
  const [platterAngle, setPlatterAngle] = useState(0);
  const [tonearmAngle, setTonearmAngle] = useState(-20);
  const animRef = useRef<number>(0);

  // Platter physics: continuous rotation at BPM-linked speed
  useEffect(() => {
    if (!isSpinning) return;
    const rpm = 33.33; // standard vinyl RPM
    const degreesPerFrame = (rpm * 360) / (60 * 60); // ~0.33°/frame at 60fps

    const spin = () => {
      setPlatterAngle((prev) => (prev + degreesPerFrame * 3) % 360);
      animRef.current = requestAnimationFrame(spin);
    };

    animRef.current = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animRef.current);
  }, [isSpinning]);

  // Tonearm slowly sweeps inward when playing
  useEffect(() => {
    if (!isSpinning) return;
    const sweep = setInterval(() => {
      setTonearmAngle((prev) => Math.min(prev + 0.05, 15));
    }, 200);
    return () => clearInterval(sweep);
  }, [isSpinning]);

  const handleStart = () => {
    setIsSpinning(true);
    setTonearmAngle(-5);
  };

  const handleStop = () => {
    setIsSpinning(false);
    setTonearmAngle(-20);
  };

  return (
    <div className="cyber-turntable gear-unit">
      {/* Header */}
      <div className="tt-header">
        <span className="tt-label">{label}</span>
        <span className="tt-bpm">{bpm.toFixed(1)} BPM</span>
      </div>

      {/* Platter */}
      <div className="platter-housing">
        <div
          className={`platter ${isSpinning ? "active" : ""}`}
          style={{ transform: `rotate(${platterAngle}deg)` }}
        >
          <div className="vinyl-grooves" />
          <div className="vinyl-label">
            <div className="label-text">DGN</div>
          </div>
          <div className="spindle" />
        </div>

        {/* Tonearm */}
        <div
          className="tonearm"
          style={{ transform: `rotate(${tonearmAngle}deg)` }}
        >
          <div className="tonearm-base" />
          <div className="tonearm-arm" />
          <div className="tonearm-head" />
        </div>
      </div>

      {/* Controls */}
      <div className="tt-controls">
        <button
          className={`tt-btn start-btn ${isSpinning ? "active" : ""}`}
          onClick={isSpinning ? handleStop : handleStart}
        >
          {isSpinning ? "STOP" : "START"}
        </button>
        <div className="speed-selector">
          <button className="speed-btn active">33</button>
          <button className="speed-btn">45</button>
        </div>
      </div>

      <div className="cyber-border-accent" />
    </div>
  );
};

export default CyberTurntable;
