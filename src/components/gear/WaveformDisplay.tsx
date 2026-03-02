import React, { useRef, useEffect, useCallback } from "react";
import "./WaveformDisplay.css";

/**
 * WaveformDisplay — Canvas-rendered scrolling waveform with RGB frequency bands.
 *
 * Renders a multi-color waveform (blue=lows, green=mids, cyan=highs) with
 * scrolling playhead, beat grid markers, and mirror reflection.
 */

export interface WaveformDisplayProps {
  isPlaying: boolean;
  color?: string;
  playheadColor?: string;
  height?: number;
  bpm?: number;
}

interface WaveformBand {
  low: number;
  mid: number;
  high: number;
}

// Generate multi-band waveform data (simulated frequency separation)
function generateWaveformData(
  length: number,
  seed: number = 42,
): WaveformBand[] {
  const data: WaveformBand[] = [];
  let x = seed;
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const r = (x % 1000) / 1000;

    // Simulate bass hits on beat positions
    const beatPhase = (i % 16) / 16;
    const isBeat = beatPhase < 0.15;
    const isSnare = Math.abs(beatPhase - 0.5) < 0.08;

    const low = isBeat ? 0.6 + r * 0.4 : 0.15 + r * 0.25;
    const mid = isSnare ? 0.5 + r * 0.4 : 0.2 + r * 0.3;
    const high = 0.1 + r * 0.35 + (isSnare ? 0.2 : 0);

    data.push({ low, mid, high });
  }
  return data;
}

const WAVEFORM_BARS = 300;

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
  const waveformRef = useRef<WaveformBand[]>(
    generateWaveformData(WAVEFORM_BARS),
  );

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const data = waveformRef.current;
      const barCount = data.length;
      const barWidth = Math.max(1.5, w / barCount);
      const offset = offsetRef.current;
      const playheadX = w * 0.35;
      const centerY = h * 0.5;

      ctx.clearRect(0, 0, w, h);

      // Draw beat grid lines
      for (let i = 0; i < barCount; i++) {
        const idx = (i + Math.floor(offset)) % barCount;
        if (idx % 16 === 0) {
          const x = i * barWidth;
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
      }

      // Draw waveform bars (mirrored around center)
      for (let i = 0; i < barCount; i++) {
        const idx = (i + Math.floor(offset)) % barCount;
        const band = data[idx];
        const x = i * barWidth;
        const isPast = x < playheadX;
        const opacity = isPast ? 0.3 : 1.0;

        // Stack: low (blue) + mid (green) + high (cyan)
        const totalH = (band.low + band.mid + band.high) * centerY * 0.85;
        const lowH = band.low * centerY * 0.85;
        const midH = band.mid * centerY * 0.85;
        const highH = band.high * centerY * 0.85;

        // Upper half (mirrored)
        let yPos = centerY;

        // Low frequencies (deep blue/purple)
        ctx.globalAlpha = opacity;
        ctx.fillStyle = "#4466ff";
        ctx.fillRect(x, yPos - lowH, barWidth - 0.5, lowH);
        ctx.fillRect(x, yPos, barWidth - 0.5, lowH * 0.7); // mirror

        // Mid frequencies (green/teal)
        ctx.fillStyle = "#00cc88";
        ctx.fillRect(x, yPos - lowH - midH, barWidth - 0.5, midH);
        ctx.fillRect(x, yPos + lowH * 0.7, barWidth - 0.5, midH * 0.7);

        // High frequencies (cyan/white)
        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(x, yPos - lowH - midH - highH, barWidth - 0.5, highH);
        ctx.fillRect(
          x,
          yPos + lowH * 0.7 + midH * 0.7,
          barWidth - 0.5,
          highH * 0.5,
        );
      }

      ctx.globalAlpha = 1.0;

      // Centre line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Playhead line with glow
      ctx.save();
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.restore();

      // Playhead glow band
      const glowGrad = ctx.createLinearGradient(
        playheadX - 6,
        0,
        playheadX + 6,
        0,
      );
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.5, "rgba(255,255,255,0.06)");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(playheadX - 6, 0, 12, h);

      // Playhead triangle markers (top)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(playheadX - 4, 0);
      ctx.lineTo(playheadX + 4, 0);
      ctx.lineTo(playheadX, 5);
      ctx.closePath();
      ctx.fill();
      // Bottom
      ctx.beginPath();
      ctx.moveTo(playheadX - 4, h);
      ctx.lineTo(playheadX + 4, h);
      ctx.lineTo(playheadX, h - 5);
      ctx.closePath();
      ctx.fill();
    },
    [playheadColor],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    // Reset for draw coordinates
    canvas.width = rect.width;
    canvas.height = rect.height;

    draw(canvas);
  }, [draw]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const speed = bpm / 2400;

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
