import React, { useRef, useEffect, useCallback, useState } from "react";
import "./WaveformHeader.css";

/**
 * WaveformHeader — Full-width dual-deck waveform display.
 *
 * VDJ-style panoramic waveform showing both decks side by side
 * with RGB frequency separation, beat grid, and track info.
 */

export interface DeckTrackInfo {
  title: string;
  artist: string;
  bpm: number;
  musicalKey: string;
  elapsed: string;
  remaining: string;
}

export interface WaveformHeaderProps {
  deckAPlaying?: boolean;
  deckBPlaying?: boolean;
  deckATrack?: DeckTrackInfo;
  deckBTrack?: DeckTrackInfo;
}

interface WaveformBand {
  low: number;
  mid: number;
  high: number;
}

// Generate per-deck waveform
function generateDeckWaveform(length: number, seed: number): WaveformBand[] {
  const data: WaveformBand[] = [];
  let x = seed;
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    const r = (x % 1000) / 1000;
    const beatPhase = (i % 16) / 16;
    const isBeat = beatPhase < 0.12;
    const isSnare = Math.abs(beatPhase - 0.5) < 0.08;
    const breakdown = Math.sin((i / length) * Math.PI * 4) > 0.6;

    const low = isBeat
      ? 0.55 + r * 0.45
      : breakdown
        ? 0.05 + r * 0.1
        : 0.15 + r * 0.25;
    const mid = isSnare ? 0.45 + r * 0.35 : 0.18 + r * 0.28;
    const high = 0.08 + r * 0.32 + (isSnare ? 0.18 : 0);

    data.push({ low, mid, high });
  }
  return data;
}

const BARS = 400;
const waveformA = generateDeckWaveform(BARS, 42);
const waveformB = generateDeckWaveform(BARS, 137);

const DEFAULT_TRACK_A: DeckTrackInfo = {
  title: "Sweet Dreams (Radio Edit)",
  artist: "DGN Radio",
  bpm: 126.0,
  musicalKey: "04A",
  elapsed: "1:42.6",
  remaining: "2:18.4",
};

const DEFAULT_TRACK_B: DeckTrackInfo = {
  title: "No Stress (Extended Mix)",
  artist: "DGN Collective",
  bpm: 126.0,
  musicalKey: "02A",
  elapsed: "0:55.2",
  remaining: "3:04.8",
};

// Color configs per deck
const DECK_COLORS = {
  A: { low: "#2255dd", mid: "#00cc88", high: "#00e5ff" },
  B: { low: "#cc2244", mid: "#ff6644", high: "#ff3d6e" },
};

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: WaveformBand[],
  w: number,
  h: number,
  offset: number,
  colors: { low: string; mid: string; high: string },
  playheadRatio: number,
) {
  const barCount = data.length;
  const barWidth = Math.max(1.5, w / barCount);
  const centerY = h * 0.5;
  const playheadX = w * playheadRatio;

  // Beat grid
  for (let i = 0; i < barCount; i++) {
    const idx = (i + Math.floor(offset)) % barCount;
    if (idx % 16 === 0) {
      const x = i * barWidth;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  // Waveform bars
  for (let i = 0; i < barCount; i++) {
    const idx = (i + Math.floor(offset)) % barCount;
    const band = data[idx];
    const x = i * barWidth;
    const isPast = x < playheadX;
    ctx.globalAlpha = isPast ? 0.28 : 0.95;

    const lowH = band.low * centerY * 0.8;
    const midH = band.mid * centerY * 0.8;
    const highH = band.high * centerY * 0.8;

    // Upper half
    ctx.fillStyle = colors.low;
    ctx.fillRect(x, centerY - lowH, barWidth - 0.5, lowH);
    ctx.fillRect(x, centerY, barWidth - 0.5, lowH * 0.6);

    ctx.fillStyle = colors.mid;
    ctx.fillRect(x, centerY - lowH - midH, barWidth - 0.5, midH);
    ctx.fillRect(x, centerY + lowH * 0.6, barWidth - 0.5, midH * 0.6);

    ctx.fillStyle = colors.high;
    ctx.fillRect(x, centerY - lowH - midH - highH, barWidth - 0.5, highH);
    ctx.fillRect(
      x,
      centerY + lowH * 0.6 + midH * 0.6,
      barWidth - 0.5,
      highH * 0.4,
    );
  }

  ctx.globalAlpha = 1;

  // Center line
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(w, centerY);
  ctx.stroke();

  // Playhead
  ctx.save();
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 6;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, h);
  ctx.stroke();
  ctx.restore();

  // Playhead triangles
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(playheadX - 5, 0);
  ctx.lineTo(playheadX + 5, 0);
  ctx.lineTo(playheadX, 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(playheadX - 5, h);
  ctx.lineTo(playheadX + 5, h);
  ctx.lineTo(playheadX, h - 6);
  ctx.closePath();
  ctx.fill();
}

export const WaveformHeader: React.FC<WaveformHeaderProps> = ({
  deckAPlaying = true,
  deckBPlaying = true,
  deckATrack = DEFAULT_TRACK_A,
  deckBTrack = DEFAULT_TRACK_B,
}) => {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const offsetARef = useRef(0);
  const offsetBRef = useRef(0);
  const rafRef = useRef(0);

  const animate = useCallback(() => {
    const cA = canvasARef.current;
    const cB = canvasBRef.current;

    if (cA) {
      const ctx = cA.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, cA.width, cA.height);
        drawWaveform(
          ctx,
          waveformA,
          cA.width,
          cA.height,
          offsetARef.current,
          DECK_COLORS.A,
          0.4,
        );
      }
      if (deckAPlaying) offsetARef.current += 0.06;
    }

    if (cB) {
      const ctx = cB.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, cB.width, cB.height);
        drawWaveform(
          ctx,
          waveformB,
          cB.width,
          cB.height,
          offsetBRef.current,
          DECK_COLORS.B,
          0.4,
        );
      }
      if (deckBPlaying) offsetBRef.current += 0.055;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [deckAPlaying, deckBPlaying]);

  // Initialize canvases
  useEffect(() => {
    const setup = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    setup(canvasARef.current);
    setup(canvasBRef.current);

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      [canvasARef, canvasBRef].forEach((ref) => {
        const canvas = ref.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="waveform-header" aria-label="Dual deck waveform display">
      {/* Deck A */}
      <div className="wh-deck wh-deck-a">
        <div className="wh-canvas-wrap">
          <canvas ref={canvasARef} className="wh-canvas" />
          <span className="wh-deck-label wh-label-a">A</span>
        </div>
        <div className="wh-track-info">
          <div className="wh-track-meta">
            <span className="wh-track-title">{deckATrack.title}</span>
            <span className="wh-track-artist">{deckATrack.artist}</span>
          </div>
          <div className="wh-track-data">
            <span className="wh-key-tag">{deckATrack.musicalKey}</span>
            <span className="wh-bpm">{deckATrack.bpm.toFixed(2)}</span>
            <span className="wh-time">{deckATrack.elapsed}</span>
            <span className="wh-time wh-time-remain">
              {deckATrack.remaining}
            </span>
          </div>
        </div>
      </div>

      {/* Master Section */}
      <div className="wh-master-divider">
        <div className="wh-master-vu" />
      </div>

      {/* Deck B */}
      <div className="wh-deck wh-deck-b">
        <div className="wh-canvas-wrap">
          <canvas ref={canvasBRef} className="wh-canvas" />
          <span className="wh-deck-label wh-label-b">B</span>
        </div>
        <div className="wh-track-info wh-info-right">
          <div className="wh-track-data">
            <span className="wh-time wh-time-remain">
              {deckBTrack.remaining}
            </span>
            <span className="wh-time">{deckBTrack.elapsed}</span>
            <span className="wh-bpm wh-bpm-b">{deckBTrack.bpm.toFixed(2)}</span>
            <span className="wh-key-tag wh-key-b">{deckBTrack.musicalKey}</span>
          </div>
          <div className="wh-track-meta">
            <span className="wh-track-title">{deckBTrack.title}</span>
            <span className="wh-track-artist">{deckBTrack.artist}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveformHeader;
