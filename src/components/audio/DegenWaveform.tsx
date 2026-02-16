'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CuePoint {
    position: number; // 0-1
    label: string;
    color?: string;
}

interface DegenWaveformProps {
    /** 0-1 progress of current playback */
    progress?: number;
    /** Duration in seconds */
    duration?: number;
    /** Waveform data (0-1 array of amplitudes) */
    waveformData?: number[];
    /** Cue points on the waveform */
    cuePoints?: CuePoint[];
    /** Called when user scrubs to a position (0-1) */
    onSeek?: (position: number) => void;
    /** Track title overlay */
    trackTitle?: string;
    /** Is the track currently playing? */
    isPlaying?: boolean;
    className?: string;
}

function generateDefaultWaveform(length = 200): number[] {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
        const base = 0.3 + Math.random() * 0.4;
        const envelope =
            Math.sin((i / length) * Math.PI) * 0.3 +
            Math.sin((i / length) * Math.PI * 3) * 0.15 +
            Math.sin((i / length) * Math.PI * 7) * 0.08;
        data.push(Math.min(1, Math.max(0.05, base + envelope)));
    }
    return data;
}

export function DegenWaveform({
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
        () => waveformData || generateDefaultWaveform(200),
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

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            setIsDragging(true);
            const pos = getPositionFromEvent(e);
            onSeek?.(pos);
        },
        [getPositionFromEvent, onSeek]
    );

    useEffect(() => {
        if (!isDragging) return;
        const handleMove = (e: MouseEvent) => {
            const pos = getPositionFromEvent(e);
            onSeek?.(pos);
        };
        const handleUp = () => setIsDragging(false);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, getPositionFromEvent, onSeek]);

    const barWidth = 100 / data.length;
    const playheadX = progress * 100;

    return (
        <div
            className={cn(
                'relative bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden select-none group',
                className
            )}
        >
            {/* Title bar */}
            {trackTitle && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1 bg-gradient-to-b from-black/70 to-transparent">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {trackTitle}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">
                            {formatTime(progress * duration)} / {formatTime(duration)}
                        </span>
                        {isPlaying && (
                            <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse shadow-[0_0_6px_rgba(170,255,0,0.6)]" />
                        )}
                    </div>
                </div>
            )}

            {/* Waveform canvas area */}
            <div
                ref={containerRef}
                className="relative h-24 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => setHoverPosition(getPositionFromEvent(e))}
                onMouseLeave={() => setHoverPosition(null)}
            >
                {/* Waveform bars */}
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    {data.map((amp, i) => {
                        const x = i * barWidth;
                        const barProgress = x / 100;
                        const isPast = barProgress <= progress;
                        const height = amp * 80;
                        return (
                            <rect
                                key={i}
                                x={x}
                                y={50 - height / 2}
                                width={Math.max(0.2, barWidth - 0.15)}
                                height={height}
                                rx={0.15}
                                fill={
                                    isPast
                                        ? 'hsl(82, 100%, 50%)'
                                        : 'hsl(0, 0%, 25%)'
                                }
                                opacity={isPast ? 0.9 : 0.5}
                            />
                        );
                    })}
                </svg>

                {/* Played overlay glow */}
                <div
                    className="absolute inset-y-0 left-0 pointer-events-none"
                    style={{ width: `${playheadX}%` }}
                >
                    <div className="w-full h-full bg-gradient-to-r from-lime-500/5 to-lime-500/10" />
                </div>

                {/* Playhead line */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-lime-500 z-10 transition-[left] duration-75"
                    style={{ left: `${playheadX}%` }}
                >
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-lime-500" />
                    <div className="absolute top-0 left-0 w-[2px] h-full shadow-[0_0_8px_rgba(170,255,0,0.7)]" />
                </div>

                {/* Hover line */}
                {hoverPosition !== null && !isDragging && (
                    <div
                        className="absolute top-0 bottom-0 w-[1px] bg-white/30 pointer-events-none z-10"
                        style={{ left: `${hoverPosition * 100}%` }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 px-1 py-0.5 text-[8px] font-mono text-zinc-300 rounded whitespace-nowrap">
                            {formatTime(hoverPosition * duration)}
                        </div>
                    </div>
                )}

                {/* Cue markers */}
                {cuePoints.map((cue, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 z-10 group/cue"
                        style={{ left: `${cue.position * 100}%` }}
                    >
                        <div
                            className="w-[2px] h-full opacity-60"
                            style={{ backgroundColor: cue.color || '#ff6b00' }}
                        />
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 px-1 py-0.5 text-[7px] font-bold uppercase rounded-t opacity-0 group-hover/cue:opacity-100 transition-opacity whitespace-nowrap"
                            style={{
                                backgroundColor: cue.color || '#ff6b00',
                                color: '#000',
                            }}
                        >
                            {cue.label}
                        </div>
                    </div>
                ))}

                {/* Beat grid markers (every quarter) */}
                {[0.25, 0.5, 0.75].map((pos) => (
                    <div
                        key={pos}
                        className="absolute top-0 bottom-0 w-[1px] bg-zinc-700/30 pointer-events-none"
                        style={{ left: `${pos * 100}%` }}
                    />
                ))}
            </div>

            {/* Bottom mini-bar with remaining time */}
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-900/80 border-t border-zinc-800/50">
                <div className="flex gap-3">
                    {cuePoints.map((cue, i) => (
                        <button
                            key={i}
                            className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border transition-colors"
                            style={{
                                borderColor: cue.color || '#ff6b00',
                                color: cue.color || '#ff6b00',
                            }}
                            onClick={() => onSeek?.(cue.position)}
                        >
                            {cue.label}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-600">
                    -{formatTime(duration - progress * duration)}
                </span>
            </div>
        </div>
    );
}
