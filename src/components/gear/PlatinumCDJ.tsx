import React, { useState, useEffect } from "react";
import "./PlatinumCDJ.css";
import { VUMeter } from "./VUMeter";
import { WaveformDisplay } from "./WaveformDisplay";

/**
 * PlatinumCDJ - A high-fidelity, modular virtual deck for DGN-DJ Studio.
 * Based on SGE Gear Modularity Spec (mod-drop v1.0).
 */
export const PlatinumCDJ: React.FC<{
  deckId: string;
  label: string;
  bpm?: number;
  pitch?: number;
}> = ({ deckId, label, bpm = 124.0, pitch = 0.0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Simulate jog wheel rotation when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setRotation((prev) => (prev + 5) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Keyboard shortcuts: Space=Play/Pause, C=Cue
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "c" || e.key === "C") {
        setIsPlaying(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`platinum-cdj gear-unit iron-surface`}
      role="region"
      aria-label={`${label} CDJ Player`}
    >
      {/* Top Section: Deck Info & BPM */}
      <div className="cdj-header">
        <div className="deck-indicator">{label}</div>
        <div className="cdj-header-right">
          <div className="cdj-meters">
            <VUMeter
              level={0}
              mode="peak"
              size={40}
              label="L"
              demo={isPlaying}
            />
            <VUMeter
              level={0}
              mode="peak"
              size={40}
              label="R"
              demo={isPlaying}
            />
          </div>
          <div className="bpm-display">
            <span className="bpm-value">{bpm.toFixed(1)}</span>
            <span className="bpm-unit">BPM</span>
          </div>
        </div>
      </div>

      {/* Main Display: Canvas Waveform & Time */}
      <div className="cdj-main-display">
        <div className="time-display">03:42.12</div>
        <WaveformDisplay isPlaying={isPlaying} bpm={bpm} height={52} />
      </div>

      {/* Jog Wheel Section */}
      <div className="jog-wheel-container">
        <div
          className="jog-wheel"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="jog-inner-texture" />
          <div className="jog-indicator" />
        </div>
      </div>

      {/* Controls: Play, Cue, Pitch Fader */}
      <div className="cdj-controls">
        <button
          className={`cdj-btn cue-btn ${isPlaying ? "active" : ""}`}
          onClick={() => setIsPlaying(false)}
        >
          CUE
        </button>
        <button
          className={`cdj-btn play-btn ${isPlaying ? "active" : ""}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "PAUSE" : "PLAY"}
        </button>

        <div className="pitch-section">
          <div className="pitch-slider-track">
            <div
              className="pitch-handle"
              style={{ top: `${50 + pitch * 5}%` }}
            />
          </div>
          <div className="pitch-value">
            {(pitch > 0 ? "+" : "") + pitch.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="iron-border-accent" />
    </div>
  );
};

export default PlatinumCDJ;
