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
    const remaining = duration - progress * duration;

    return (
        <div
            className={cn(
                'relative rounded-lg overflow-hidden select-none group',
                'bg-gradient-to-b from-zinc-950 to-black',
                'border border-white/[0.04]',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]',
                className
            )}
        >
            {/* Title bar */}
            {trackTitle && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <div className="flex items-center gap-2">
                        {isPlaying && (
                            <div className="relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(170,255,0,0.6)' }} />
                                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-lime-500 animate-ping opacity-50" />
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
                className="relative h-28 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => setHoverPosition(getPositionFromEvent(e))}
                onMouseLeave={() => setHoverPosition(null)}
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
                            <stop offset="0%" stopColor="#aaff00" stopOpacity="0.95" />
                            <stop offset="40%" stopColor="#88dd00" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#669900" stopOpacity="0.4" />
                        </linearGradient>
                        {/* Unplayed gradient fill */}
                        <linearGradient id="wf-unplayed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
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
                                fill={isPast ? '#aaff00' : '#ffffff'}
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
                                fill="#aaff00"
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
                    <div className="w-full h-full bg-gradient-to-r from-lime-500/[0.02] via-lime-500/[0.05] to-lime-500/[0.08]" />
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 z-10 transition-[left] duration-75"
                    style={{ left: `${playheadX}%` }}
                >
                    {/* Line */}
                    <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-lime-400" style={{ boxShadow: '0 0 10px rgba(170,255,0,0.6), 0 0 30px rgba(170,255,0,0.15)' }} />
                    {/* Arrow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-lime-400" style={{ filter: 'drop-shadow(0 0 4px rgba(170,255,0,0.5))' }} />
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
                {cuePoints.map((cue, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 z-10 group/cue"
                        style={{ left: `${cue.position * 100}%` }}
                    >
                        <div
                            className="w-[2px] h-full opacity-50"
                            style={{
                                backgroundColor: cue.color || '#ff6b00',
                                boxShadow: `0 0 6px ${cue.color || '#ff6b00'}40`,
                            }}
                        />
                        {/* Cue diamond marker */}
                        <div
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity"
                            style={{ backgroundColor: cue.color || '#ff6b00' }}
                        />
                        <div
                            className="absolute bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[7px] font-black uppercase rounded opacity-0 group-hover/cue:opacity-100 transition-all duration-150 whitespace-nowrap"
                            style={{
                                backgroundColor: cue.color || '#ff6b00',
                                color: '#000',
                                boxShadow: `0 0 10px ${cue.color || '#ff6b00'}40`,
                            }}
                        >
                            {cue.label}
                        </div>
                    </div>
                ))}

                {/* Beat grid markers */}
                {[0.25, 0.5, 0.75].map((pos) => (
                    <div
                        key={pos}
                        className="absolute top-0 bottom-0 w-[1px] bg-white/[0.04] pointer-events-none"
                        style={{ left: `${pos * 100}%` }}
                    />
                ))}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-t border-white/[0.04]">
                <div className="flex gap-2">
                    {cuePoints.map((cue, i) => (
                        <button
                            key={i}
                            className="text-[7px] font-black uppercase px-2 py-0.5 rounded-sm border transition-all hover:scale-105"
                            style={{
                                borderColor: `${cue.color || '#ff6b00'}50`,
                                color: cue.color || '#ff6b00',
                                background: `${cue.color || '#ff6b00'}08`,
                            }}
                            onClick={() => onSeek?.(cue.position)}
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
