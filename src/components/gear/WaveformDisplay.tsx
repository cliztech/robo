import React, { useRef, useEffect, useCallback } from "react";
import "./WaveformDisplay.css";

/**
 * WaveformDisplay — Canvas-rendered scrolling waveform visualization.
 *
 * Renders a procedurally generated waveform that scrolls when playing.
 * Uses HTML5 Canvas for smooth 60fps rendering.
 */

export interface WaveformDisplayProps {
  /** Is the waveform currently scrolling */
  isPlaying: boolean;
  /** Base color for waveform bars */
  color?: string;
  /** Playhead color */
  playheadColor?: string;
  /** Height of the waveform canvas */
  height?: number;
  /** BPM (influences waveform density) */
  bpm?: number;
}

// Generate a static waveform shape (simulated audio data)
function generateWaveformData(length: number, seed: number = 42): number[] {
  const data: number[] = [];
  let x = seed;
  for (let i = 0; i < length; i++) {
    // Pseudo-random deterministic waveform
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const base = 0.3 + ((x % 100) / 100) * 0.5;
    const beat = Math.sin((i / length) * Math.PI * 16) * 0.15;
    const phrase = Math.sin((i / length) * Math.PI * 2) * 0.1;
    data.push(Math.max(0.05, Math.min(1, base + beat + phrase)));
  }
  return data;
}

const WAVEFORM_BARS = 200;

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  isPlaying,
  color = "#00e5ff",
  playheadColor = "#ffffff",
  height = 56,
  bpm = 124,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const waveformRef = useRef<number[]>(generateWaveformData(WAVEFORM_BARS));

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const data = waveformRef.current;
      const barCount = data.length;
      const barWidth = w / barCount;
      const offset = offsetRef.current;
      const playheadX = w * 0.35; // Playhead at 35% from left

      ctx.clearRect(0, 0, w, h);

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        const idx = (i + Math.floor(offset)) % barCount;
        const amplitude = data[idx];
        const barH = amplitude * h * 0.85;
        const x = i * barWidth;
        const y = (h - barH) / 2;

        // Color: past bars dimmer, future bars brighter
        const isPast = x < playheadX;
        const alpha = isPast ? 0.35 : 0.85;

        ctx.fillStyle = isPast
          ? `${color}${Math.round(alpha * 255)
              .toString(16)
              .padStart(2, "0")}`
          : color;
        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barH);
      }

      // Playhead line
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Time indicator glow at playhead base
      ctx.fillStyle = `${playheadColor}22`;
      ctx.fillRect(playheadX - 1, 0, 3, h);
    },
    [color, playheadColor],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution to match display
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // 2x for retina
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(2, 2);
    canvas.width = rect.width;
    canvas.height = rect.height;

    draw(canvas);
  }, [draw]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const speed = bpm / 3600; // Scroll speed based on BPM

    const tick = () => {
      offsetRef.current += speed;
      const canvas = canvasRef.current;
      if (canvas) draw(canvas);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, bpm, draw]);

  return (
    <div className="waveform-display" aria-label="Audio waveform visualization">
      <canvas ref={canvasRef} className="waveform-canvas" style={{ height }} />
      {isPlaying && <div className="waveform-playing-badge">▶</div>}
    </div>
  );
};

export default WaveformDisplay;
