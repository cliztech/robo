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
    className?: string;
}

function PlayingIndicator({ deckAccent, deckAccentSoft }: { deckAccent: string; deckAccentSoft: string }) {
    return (
        <div className="relative" data-testid="deck-playing-indicator">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deckAccent, boxShadow: `0 0 6px ${deckAccentSoft}` }} />
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full motion-safe:animate-ping motion-reduce:animate-none opacity-50" style={{ backgroundColor: deckAccent }} />
        </div>
    );
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
    className,
}: DegenWaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const deckState = useStudioStore((state) => state.decks[deck]);
    const seekDeck = useStudioStore((state) => state.seekDeck);

    const resolvedProgress = progress ?? deckState.waveformPosition;
    const resolvedDuration = duration ?? deckState.durationSeconds ?? 210;
    const resolvedCuePoints = cuePoints ?? deckState.cuePoints;
    const resolvedIsPlaying = isPlaying ?? deckState.isPlaying;
    const resolvedTrackTitle = trackTitle ?? deckState.track?.title;

    const data = useMemo(
        () => waveformData ?? (deckState.waveformData.length ? deckState.waveformData : deterministicWaveformSample(200)),
        [deckState.waveformData, waveformData]
    );

    const getPositionFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!containerRef.current) {
            return 0;
        }
        const rect = containerRef.current.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    }, []);

    const seekToPosition = useCallback(
        (position: number) => {
            const clamped = Math.max(0, Math.min(1, position));
            seekDeck(deck, clamped);
            onSeek?.(clamped);
        },
        [deck, onSeek, seekDeck]
    );

    useEffect(() => {
        if (!isDragging) {
            return;
        }
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
    const isDeckB = deck === 'B';
    const deckAccent = isDeckB ? 'hsl(var(--color-deck-b))' : 'hsl(var(--color-deck-a))';
    const deckAccentSoft = isDeckB ? 'hsla(var(--color-deck-b),0.55)' : 'hsla(var(--color-deck-a),0.55)';

    return (
        <div className={cn('relative rounded-lg overflow-hidden select-none group bg-gradient-to-b from-zinc-950 to-black border border-white/[0.04]', className)}>
            {resolvedTrackTitle && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <div className="flex items-center gap-2">
                        {resolvedIsPlaying && <PlayingIndicator deckAccent={deckAccent} deckAccentSoft={deckAccentSoft} />}
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">{resolvedTrackTitle}</span>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-zinc-500">{Math.round(resolvedDuration * resolvedProgress)}s</span>
                </div>
            )}

            <div ref={containerRef} className="relative h-28 cursor-crosshair" onMouseDown={(e) => {
                setIsDragging(true);
                seekToPosition(getPositionFromEvent(e));
            }} role="slider" aria-valuemin={0} aria-valuemax={resolvedDuration} aria-valuenow={Math.round(resolvedProgress * resolvedDuration)}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {data.map((amp, i) => {
                        const x = i * barWidth;
                        const isPast = x / 100 <= resolvedProgress;
                        const height = amp * 50;
                        return <rect key={i} x={x} y={60 - height} width={Math.max(0.15, barWidth - 0.12)} height={height} rx={0.1} fill={isPast ? 'hsl(var(--color-waveform-played-strong))' : 'hsl(var(--color-waveform-unplayed-strong))'} opacity={isPast ? 0.9 : 0.25} />;
                    })}
                </svg>

                <div className="absolute top-0 bottom-0 z-10" data-testid="waveform-playhead" style={{ left: `${playheadX}%` }}>
                    <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2" style={{ backgroundColor: deckAccent }} />
                </div>

                {resolvedCuePoints.map((cue) => (
                    <div key={cue.label} className="absolute top-0 bottom-0 w-px opacity-70" style={{ left: `${cue.position * 100}%`, backgroundColor: cue.color ?? '#fff' }} />
                ))}
            </div>
        </div>
    );
}
