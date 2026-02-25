'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { deterministicWaveformSample } from '../../lib/audio/telemetry';
import { useStudioStore, type DeckId } from '../../stores/studioState';

interface CuePoint {
  position: number;
  label: string;
  color?: string;
}

interface DegenWaveformProps {
  deck?: DeckId;
  progress?: number;
  duration?: number;
  waveformData?: number[];
  cuePoints?: CuePoint[];
  onSeek?: (position: number) => void;
  trackTitle?: string;
  isPlaying?: boolean;
  beatMarkers?: number[];
  className?: string;
}

export function DegenWaveform({
  deck = 'A',
  progress,
  duration,
  waveformData,
  cuePoints,
  onSeek,
  trackTitle,
  isPlaying,
  beatMarkers = [0.25, 0.5, 0.75],
  className,
}: DegenWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const deckState = useStudioStore((state) => state.decks[deck]);
  const seekDeck = useStudioStore((state) => state.seekDeck);

  const resolvedProgress = progress ?? deckState.waveformPosition;
  const resolvedDuration = duration ?? deckState.durationSeconds ?? 210;
  const resolvedCuePoints = cuePoints ?? deckState.cuePoints;
  const resolvedIsPlaying = isPlaying ?? deckState.isPlaying;
  const resolvedTrackTitle = trackTitle ?? deckState.track?.title;

  const data = useMemo(
    () => waveformData ?? (deckState.waveformData.length ? deckState.waveformData : deterministicWaveformSample(250)),
    [deckState.waveformData, waveformData],
  );

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const getPositionFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const seekToPosition = useCallback((position: number) => {
    const clamped = Math.max(0, Math.min(1, position));
    seekDeck(deck, clamped);
    onSeek?.(clamped);
  }, [deck, onSeek, seekDeck]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    seekToPosition(getPositionFromEvent(e));
  }, [getPositionFromEvent, seekToPosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekToPosition(resolvedProgress - step);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekToPosition(resolvedProgress + step);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      seekToPosition(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      seekToPosition(1);
    }
  }, [resolvedProgress, seekToPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => seekToPosition(getPositionFromEvent(e));
    const handleUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [getPositionFromEvent, isDragging, seekToPosition]);

  const barWidth = 100 / data.length;
  const playheadX = resolvedProgress * 100;
  const remaining = resolvedDuration - resolvedProgress * resolvedDuration;
  const isDeckB = deck === 'B';
  const waveColorSoft = isDeckB ? 'hsla(var(--color-wave-b), 0.4)' : 'hsla(var(--color-wave-a), 0.4)';
  const deckAccent = isDeckB ? 'hsl(var(--color-deck-b))' : 'hsl(var(--color-deck-a))';

  return (
    <div className={cn('relative rounded-lg overflow-hidden select-none group bg-gradient-to-b from-zinc-950 to-black border border-white/[0.04]', className)}>
      {resolvedTrackTitle && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-2">
            {resolvedIsPlaying && <div className="w-1.5 h-1.5 rounded-full bg-lime-500 motion-safe:animate-ping" />}
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">{resolvedTrackTitle}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono tabular-nums">
            <span className="text-zinc-400">{formatTime(resolvedProgress * resolvedDuration)}</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-600">{formatTime(resolvedDuration)}</span>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative h-28 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => setHoverPosition(getPositionFromEvent(e))}
        onMouseLeave={() => setHoverPosition(null)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label={`Waveform seek bar${resolvedTrackTitle ? ` for ${resolvedTrackTitle}` : ''}`}
        aria-valuemin={0}
        aria-valuemax={resolvedDuration}
        aria-valuenow={Math.round(resolvedProgress * resolvedDuration)}
        aria-valuetext={`${formatTime(resolvedProgress * resolvedDuration)} elapsed of ${formatTime(resolvedDuration)}`}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {data.map((amp, i) => {
            const x = i * barWidth;
            const isPast = x / 100 <= resolvedProgress;
            const height = amp * 50;
            return (
              <rect
                key={i}
                x={x}
                y={60 - height}
                width={Math.max(0.15, barWidth - 0.12)}
                height={height}
                rx={0.1}
                fill={isPast ? 'hsl(var(--color-waveform-played-strong))' : 'hsl(var(--color-waveform-unplayed-strong))'}
                opacity={isPast ? 0.9 : 0.25}
              />
            );
          })}
        </svg>

        <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: `${playheadX}%` }}>
          <div className="w-full h-full" style={{ background: `linear-gradient(90deg, transparent, ${waveColorSoft})` }} />
        </div>

        <div className="absolute top-0 bottom-0 z-10" style={{ left: `${playheadX}%` }}>
          <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2" style={{ backgroundColor: deckAccent }} />
        </div>

        {hoverPosition !== null && !isDragging && (
          <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: `${hoverPosition * 100}%` }}>
            <div className="absolute top-0 bottom-0 w-[1px] -translate-x-1/2 bg-white/20" />
          </div>
        )}

        {resolvedCuePoints.map((cue, i) => (
          <button
            key={`${cue.label}-${i}`}
            type="button"
            className="absolute top-0 bottom-0 z-10 -translate-x-1/2"
            style={{ left: `${cue.position * 100}%` }}
            onClick={() => seekToPosition(cue.position)}
            aria-label={`Cue ${cue.label} at ${formatTime(cue.position * resolvedDuration)}`}
          >
            <div className="w-[2px] h-full opacity-50" style={{ backgroundColor: cue.color || 'hsl(var(--color-waveform-cue-default))' }} />
          </button>
        ))}

        {beatMarkers.map((pos) => (
          <div key={pos} className="absolute top-0 bottom-0 w-[1px] pointer-events-none" style={{ left: `${pos * 100}%`, backgroundColor: 'hsla(var(--color-grid-minor), 0.6)' }} />
        ))}
      </div>

      <div className="flex items-center justify-end px-3 py-1.5 bg-white/[0.02] border-t border-white/[0.04]">
        <span className="text-[9px] font-mono text-red-400/70 tabular-nums">-{formatTime(remaining)}</span>
      </div>
    </div>
  );
}
