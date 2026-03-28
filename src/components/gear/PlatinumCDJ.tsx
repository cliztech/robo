import React, { useState, useEffect, useCallback } from "react";
import "./PlatinumCDJ.css";
import { VUMeter } from "./VUMeter";
import { WaveformDisplay } from "./WaveformDisplay";

/**
 * PlatinumCDJ - VDJ-grade virtual deck with STEMS, hot cues, and loops.
 * Based on SGE Gear Modularity Spec (mod-drop v1.0).
 */

const STEM_BUTTONS = [
  { id: "vocal", label: "Vocal", color: "#3b82f6" },
  { id: "instru", label: "Instru", color: "#22cc88" },
  { id: "bass", label: "Bass", color: "#f59e0b" },
  { id: "acapella", label: "Acapella", color: "#a855f7" },
] as const;

const HOT_CUE_COLORS = [
  "#ff3d3d",
  "#ff8c00",
  "#22cc44",
  "#00bfff",
  "#9966ff",
  "#ff66b2",
  "#cccc00",
  "#00ccaa",
];

const LOOP_SIZES = [0.25, 0.5, 1, 2, 4, 8, 16, 32];

export const PlatinumCDJ: React.FC<{
  deckId: string;
  label: string;
  bpm?: number;
  pitch?: number;
}> = ({ deckId, label, bpm = 124.0, pitch = 0.0 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [stems, setStems] = useState<Record<string, boolean>>({
    vocal: true,
    instru: true,
    bass: true,
    acapella: true,
  });
  const [activeCues, setActiveCues] = useState<Set<number>>(new Set());
  const [loopSizeIdx, setLoopSizeIdx] = useState(4); // default 4 beats
  const [loopActive, setLoopActive] = useState(false);

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

  const toggleStem = useCallback((id: string) => {
    setStems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleCue = useCallback((idx: number) => {
    setActiveCues((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
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

      {/* STEMS 2.0 */}
      <div className="cdj-stems" role="group" aria-label="Stems control">
        <span className="stems-label">STEMS</span>
        {STEM_BUTTONS.map((s) => (
          <button
            key={s.id}
            className={`stem-btn ${stems[s.id] ? "stem-active" : ""}`}
            style={{ "--stem-color": s.color } as React.CSSProperties}
            onClick={() => toggleStem(s.id)}
            aria-pressed={stems[s.id]}
          >
            {s.label}
          </button>
        ))}
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

      {/* Hot Cue Pads */}
      <div className="cdj-hotcues" role="group" aria-label="Hot cue pads">
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            className={`hotcue-pad ${activeCues.has(i) ? "hotcue-set" : ""}`}
            style={{ "--cue-color": HOT_CUE_COLORS[i] } as React.CSSProperties}
            onClick={() => toggleCue(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Controls: Play, Cue, Loops, Pitch Fader */}
      <div className="cdj-controls">
        <div className="cdj-transport">
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
        </div>

        {/* Loop controls */}
        <div className="cdj-loops" role="group" aria-label="Loop controls">
          <button
            className="loop-btn"
            onClick={() => setLoopSizeIdx((i) => Math.max(0, i - 1))}
          >
            ÷2
          </button>
          <button
            className={`loop-size-btn ${loopActive ? "loop-on" : ""}`}
            onClick={() => setLoopActive((a) => !a)}
          >
            {LOOP_SIZES[loopSizeIdx]}
          </button>
          <button
            className="loop-btn"
            onClick={() =>
              setLoopSizeIdx((i) => Math.min(LOOP_SIZES.length - 1, i + 1))
            }
          >
            ×2
          </button>
        </div>

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
