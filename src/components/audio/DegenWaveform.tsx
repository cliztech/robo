'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { deterministicWaveformSample } from '../../lib/audio/telemetry';

interface CuePoint {
    position: number; // 0-1
    label: string;
    color?: string;
}

interface DegenWaveformProps {
    deck?: 'A' | 'B';
    progress?: number;
    duration?: number;
    waveformData?: number[];
    cuePoints?: CuePoint[];
    onSeek?: (position: number) => void;
    trackTitle?: string;
    isPlaying?: boolean;
    className?: string;
}

export function DegenWaveform({
    deck = 'A',
    progress = 0,
    duration = 210,
    waveformData,
    cuePoints = [],
    onSeek,
    trackTitle,
    isPlaying = false,
    className,
}: DegenWaveformProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverPosition, setHoverPosition] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const data = useMemo(
        () => waveformData || deterministicWaveformSample(250),
        [waveformData]
    );

    const formatTime = useCallback((seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }, []);

    const getPositionFromEvent = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!containerRef.current) return 0;
            const rect = containerRef.current.getBoundingClientRect();
            return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        },
        []
    );

    const clampPosition = useCallback((position: number) => {
        return Math.max(0, Math.min(1, position));
    }, []);

    const seekToPosition = useCallback(
        (position: number) => {
            onSeek?.(clampPosition(position));
        },
        [clampPosition, onSeek]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            const pos = getPositionFromEvent(e);
            seekToPosition(pos);
        },
        [getPositionFromEvent, seekToPosition]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const step = e.shiftKey ? 0.1 : 0.02;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                seekToPosition(progress - step);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                seekToPosition(progress + step);
            } else if (e.key === 'Home') {
                e.preventDefault();
                seekToPosition(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                seekToPosition(1);
            }
        },
        [progress, seekToPosition]
    );

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e: MouseEvent) => {
            const pos = getPositionFromEvent(e);
            seekToPosition(pos);
        };
        const handleUp = () => setIsDragging(false);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, getPositionFromEvent, seekToPosition]);

    const barWidth = 100 / data.length;
    const playheadX = progress * 100;
    const remaining = duration - progress * duration;

    const isDeckB = deck === 'B';
    const waveColor = isDeckB ? 'hsl(var(--color-wave-b))' : 'hsl(var(--color-wave-a))';
    const waveColorSoft = isDeckB ? 'hsla(var(--color-wave-b), 0.4)' : 'hsla(var(--color-wave-a), 0.4)';
    const deckAccent = isDeckB ? 'hsl(var(--color-deck-b))' : 'hsl(var(--color-deck-a))';

    return (
        <div
            className={cn(
                'relative rounded-lg overflow-hidden select-none group',
                'bg-gradient-to-b from-zinc-950 to-black',
                'border border-white/[0.04]',
                'shadow-[inset_0_1px_0_hsl(var(--surface-rgb)/0.02)]',
                className
            )}
        >
            {/* Title bar */}
            {trackTitle && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <div className="flex items-center gap-2">
                        {isPlaying && (
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deckAccent, boxShadow: `0 0 4px ${waveColorSoft}` }} />
                                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-50" style={{ backgroundColor: deckAccent }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(170,255,0,0.6)' }} />
                                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-lime-500 motion-safe:animate-ping motion-reduce:animate-none opacity-50" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-deck-a))] shadow-[0_0_6px_hsla(var(--color-deck-a),0.6)]" />
                                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-deck-a))] animate-ping opacity-50" />
                            </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">
                            {trackTitle}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-zinc-400 tabular-nums tracking-wider">
                            {formatTime(progress * duration)}
                        </span>
                        <span className="text-[10px] text-zinc-700">/</span>
                        <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>
            )}

            {/* Waveform canvas */}
            <div
                ref={containerRef}
                className="relative h-28 cursor-crosshair focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => setHoverPosition(getPositionFromEvent(e))}
                onMouseLeave={() => setHoverPosition(null)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="slider"
                aria-label={`Waveform seek bar${trackTitle ? ` for ${trackTitle}` : ''}`}
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={Math.round(progress * duration)}
                aria-valuetext={`${formatTime(progress * duration)} elapsed of ${formatTime(duration)}`}
            >
                {/* SVG waveform */}
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <defs>
                        {/* Played gradient fill */}
                        <linearGradient id="wf-played" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--color-waveform-played-strong))" stopOpacity="0.95" />
                            <stop offset="40%" stopColor="hsl(var(--color-waveform-played-mid))" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="hsl(var(--color-waveform-played-low))" stopOpacity="0.4" />
                        </linearGradient>
                        {/* Unplayed gradient fill */}
                        <linearGradient id="wf-unplayed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--color-waveform-unplayed-strong))" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="hsl(var(--color-waveform-unplayed-strong))" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="hsl(var(--color-waveform-unplayed-strong))" stopOpacity="0.05" />
                        </linearGradient>
                        {/* Glow filter */}
                        <filter id="wf-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                        </filter>
                    </defs>

                    {/* Mirror reflection (bottom half, subtle) */}
                    {data.map((amp, i) => {
                        const x = i * barWidth;
                        const barProgress = x / 100;
                        const isPast = barProgress <= progress;
                        const height = amp * 20;
                        return (
                            <rect
                                key={`mirror-${i}`}
                                x={x}
                                y={65}
                                width={Math.max(0.15, barWidth - 0.12)}
                                height={height}
                                rx={0.1}
                                fill={isPast ? waveColor : '#ffffff'}
                                fill={isPast ? 'hsl(var(--color-waveform-played-strong))' : 'hsl(var(--color-waveform-unplayed-strong))'}
                                opacity={isPast ? 0.06 : 0.02}
                            />
                        );
                    })}

                    {/* Main waveform bars */}
                    {data.map((amp, i) => {
                        const x = i * barWidth;
                        const barProgress = x / 100;
                        const isPast = barProgress <= progress;
                        const height = amp * 50;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={60 - height}
                                width={Math.max(0.15, barWidth - 0.12)}
                                height={height}
                                rx={0.1}
                                fill={isPast ? 'url(#wf-played)' : 'url(#wf-unplayed)'}
                            />
                        );
                    })}

                    {/* Glow layer on played portion */}
                    {data.map((amp, i) => {
                        const x = i * barWidth;
                        const barProgress = x / 100;
                        if (barProgress > progress) return null;
                        const height = amp * 50;
                        return (
                            <rect
                                key={`glow-${i}`}
                                x={x}
                                y={60 - height}
                                width={Math.max(0.15, barWidth - 0.12)}
                                height={height}
                                rx={0.1}
                                fill={waveColor}
                                fill="hsl(var(--color-waveform-played-strong))"
                                opacity={0.15}
                                filter="url(#wf-glow)"
                            />
                        );
                    })}

                    {/* Center zero line */}
                    <line x1="0" y1="60" x2="100" y2="60" stroke="white" strokeWidth="0.1" opacity="0.08" />
                </svg>

                {/* Played overlay glow */}
                <div
                    className="absolute inset-y-0 left-0 pointer-events-none"
                    style={{ width: `${playheadX}%` }}
                >
                    <div className="w-full h-full" style={{ background: `linear-gradient(90deg, transparent, ${waveColorSoft})` }} />
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 z-10 transition-[left] duration-75 motion-reduce:transition-none"
                    style={{ left: `${playheadX}%` }}
                >
                    {/* Line */}
                    <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2" style={{ backgroundColor: deckAccent, boxShadow: `0 0 8px ${waveColorSoft}` }} />
                    {/* Arrow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]" style={{ borderTopColor: deckAccent, filter: `drop-shadow(0 0 3px ${waveColorSoft})` }} />
                    <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-[hsl(var(--color-deck-a))] shadow-glow-waveform-playhead" />
                    {/* Arrow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-[hsl(var(--color-deck-a))]" style={{ filter: 'drop-shadow(0 0 4px hsla(var(--color-deck-a),0.5))' }} />
                </div>

                {/* Hover crosshair */}
                {hoverPosition !== null && !isDragging && (
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none z-10"
                        style={{ left: `${hoverPosition * 100}%` }}
                    >
                        <div className="absolute top-0 bottom-0 w-[1px] -translate-x-1/2 bg-white/20" />
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900/95 border border-zinc-700/50 rounded-md shadow-lg backdrop-blur-sm">
                            <span className="text-[9px] font-mono font-bold text-zinc-200 tabular-nums">
                                {formatTime(hoverPosition * duration)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Cue markers */}
                {cuePoints.map((cue, i) => {
                    const cueTime = formatTime(cue.position * duration);
                    const isCurrentCue = Math.abs(progress - cue.position) < 0.02;
                    return (
                    <button
                        key={i}
                        type="button"
                        className="absolute top-0 bottom-0 z-10 group/cue -translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/80 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
                        style={{ left: `${cue.position * 100}%` }}
                        onClick={() => seekToPosition(cue.position)}
                        aria-label={`Cue ${cue.label} at ${cueTime}`}
                        aria-current={isCurrentCue ? 'step' : undefined}
                    >
                        <div
                            className="w-[2px] h-full opacity-50"
                            style={{
                                backgroundColor: cue.color || 'hsl(var(--color-warning))',
                                boxShadow: `0 0 4px ${cue.color || 'hsl(var(--color-warning))'}`,
                                backgroundColor: cue.color || 'hsl(var(--color-waveform-cue-default))',
                                boxShadow: `0 0 6px ${cue.color || 'hsl(var(--color-waveform-cue-default))'}40`,
                            }}
                        />
                        {/* Cue diamond marker */}
                        <div
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity"
                            style={{ backgroundColor: cue.color || 'hsl(var(--color-warning))' }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity motion-reduce:transition-none"
                            style={{ backgroundColor: cue.color || '#ff6b00' }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity"
                            style={{ backgroundColor: cue.color || 'hsl(var(--color-waveform-cue-default))' }}
                        />
                        <div
                            className="absolute bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[7px] font-black uppercase rounded opacity-0 group-hover/cue:opacity-100 transition-all duration-150 motion-reduce:transition-none whitespace-nowrap"
                            style={{
                                backgroundColor: cue.color || 'hsl(var(--color-warning))',
                                color: 'hsl(var(--color-bg))',
                                boxShadow: `0 0 6px ${cue.color || 'hsl(var(--color-warning))'}`,
                                backgroundColor: cue.color || 'hsl(var(--color-waveform-cue-default))',
                                color: 'hsl(var(--black-rgb))',
                                boxShadow: `0 0 10px ${cue.color || 'hsl(var(--color-waveform-cue-default))'}40`,
                            }}
                        >
                            {cue.label}
                        </div>
                        <span className="sr-only">
                            {isCurrentCue ? 'Current cue marker.' : 'Cue marker.'}
                        </span>
                    </button>
                );})}

                {/* Beat grid markers */}
                {[0.25, 0.5, 0.75].map((pos) => (
                    <div
                        key={pos}
                        className="absolute top-0 bottom-0 w-[1px] pointer-events-none"
                        style={{ left: `${pos * 100}%`, backgroundColor: pos === 0.5 ? 'hsla(var(--color-grid-major), 0.75)' : 'hsla(var(--color-grid-minor), 0.7)' }}
                    />
                ))}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-t border-white/[0.04]">
                <div className="flex gap-2">
                    {cuePoints.map((cue, i) => (
                        <button
                            key={i}
                            className="text-[7px] font-black uppercase px-2 py-0.5 rounded-sm border transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/80 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
                            style={{
                                borderColor: cue.color || 'hsla(var(--color-warning), 0.45)',
                                color: cue.color || 'hsl(var(--color-warning))',
                                background: cue.color ? `${cue.color}14` : 'hsla(var(--color-warning), 0.1)',
                                borderColor: `${cue.color || 'hsl(var(--color-waveform-cue-default))'}50`,
                                color: cue.color || 'hsl(var(--color-waveform-cue-default))',
                                background: `${cue.color || 'hsl(var(--color-waveform-cue-default))'}08`,
                            }}
                            onClick={() => seekToPosition(cue.position)}
                            aria-label={`Jump to cue ${cue.label} at ${formatTime(cue.position * duration)}`}
                            aria-pressed={Math.abs(progress - cue.position) < 0.02}
                        >
                            {cue.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-red-400/70 tabular-nums">
                        -{formatTime(remaining)}
                    </span>
                </div>
            </div>
        </div>
    );
}
