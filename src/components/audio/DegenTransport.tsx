'use client';

import React, { useMemo, useState, useEffect } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { DegenStereoMeter } from './DegenVUMeter';
import {
    TransportTelemetry,
    TransportTrack,
    resolveTransportTelemetry,
    resolveTransportTrack,
} from '../../lib/degenDataAdapters';
import type { DJTelemetry } from '../../lib/audio/telemetry';
import {
    Pause,
    Play,
    Radio,
    Repeat,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume1,
    Volume2,
    VolumeX,
    Volume1,
    Radio
} from 'lucide-react';

interface DegenTransportProps {
    currentTrack?: TransportTrack;
    telemetry?: DJTelemetry;
    telemetryTick?: number;
    isPlaying?: boolean;
    isOnAir?: boolean;
    onPlayPause?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    className?: string;
}

function adaptDJTelemetryToTransportTelemetry(telemetry?: DJTelemetry): Partial<TransportTelemetry> | undefined {
    if (!telemetry) return undefined;

    return {
        progress: telemetry.transport.progress,
        volume: 85,
        vuLeft: telemetry.stereoLevels.leftLevel,
        vuRight: telemetry.stereoLevels.rightLevel,
    };
}

export function DegenTransport({
    currentTrack,
    telemetryTick,
    isPlaying = true,
    isOnAir = true,
    onPlayPause,
    onNext,
    onPrev,
    className,
}: DegenTransportProps) {
    const track = resolveTransportTrack(currentTrack);
    const transportTelemetry = resolveTransportTelemetry(adaptDJTelemetryToTransportTelemetry(telemetry));

    const [telemetryStep, setTelemetryStep] = useState(0);

    useEffect(() => {
        setProgress(transportTelemetry.progress);
    }, [transportTelemetry.progress]);

    useEffect(() => {
        setVolume(transportTelemetry.volume);
    }, [transportTelemetry.volume]);

    useEffect(() => {
        if (!isPlaying || typeof telemetryTick === 'number') return;

        const id = setInterval(() => {
            setTelemetryStep((prev) => prev + 1);
        }, 80);

        return () => clearInterval(id);
    }, [isPlaying, telemetryTick]);

    const phase = typeof telemetryTick === 'number' ? telemetryTick : telemetryStep;
    const [progressOverride, setProgressOverride] = useState<number | null>(null);
    const [volume, setVolume] = useState(85);
    const [isMuted, setIsMuted] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [shuffle, setShuffle] = useState(false);

    const progress = progressOverride ?? telemetry?.transport.progress ?? 0;
    const elapsed = telemetry?.transport.elapsedSeconds ?? progress * (currentTrack?.duration || 0);
    const vuLeft =
        telemetry?.stereoLevels.leftLevel ??
        Math.max(0.1, Math.min(1, transportTelemetry.vuLeft + Math.sin(phase / 5) * 0.08));
    const vuRight =
        telemetry?.stereoLevels.rightLevel ??
        Math.max(0.1, Math.min(1, transportTelemetry.vuRight + Math.cos(phase / 6) * 0.08));
    const peakLeft = telemetry?.stereoLevels.leftPeak ?? vuLeft;
    const peakRight = telemetry?.stereoLevels.rightPeak ?? vuRight;

    const elapsed = telemetry?.transport.elapsedSeconds ?? progress * (track.duration || 0);
    const remaining = useMemo(() => {
        if (telemetry) {
            return telemetry.transport.remainingSeconds;
        }

        return (track.duration || 0) - elapsed;
    }, [elapsed, telemetry, track.duration]);

    const formatTime = (seconds: number) => {
        const safeSeconds = Math.max(0, seconds);
        const m = Math.floor(safeSeconds / 60);
        const s = Math.floor(safeSeconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };


    const VolumeIcon = isMuted ? VolumeX : volume < 40 ? Volume1 : Volume2;

    return (
        <div
            className={cn(
                'h-16 bg-black/60 backdrop-blur-xl border-t border-white/[0.04] flex items-center gap-0 px-0 shrink-0 z-20',
                'shadow-[0_-4px_20px_hsl(var(--black-rgb)/0.3)]',
                className
            )}
        >
            <div className="w-14 h-full flex items-center justify-center shrink-0 border-r border-white/[0.04]">
                {isOnAir ? (
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-[hsl(var(--color-danger))] shadow-glow-danger" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-[hsl(var(--color-danger))] animate-ping opacity-30" />
                    </div>
                ) : (
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                )}
            </div>

            <div className="w-52 px-4 shrink-0 border-r border-white/[0.04]">
                <div className="text-[11px] font-bold text-white truncate tracking-wide">{track.title}</div>
                <div className="text-[10px] text-zinc-500 truncate">
                    {track.artist}
                    {track.album && <span className="text-zinc-700"> · {track.album}</span>}
                </div>
            </div>

            <div className="flex items-center gap-1 px-3 shrink-0">
                <button
                    type="button"
                    onClick={() => setShuffle(!shuffle)}
                    aria-label="Toggle shuffle"
                    aria-pressed={shuffle}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        shuffle ? 'text-deck-a' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Shuffle size={12} />
                </button>

                <button
                    type="button"
                    onClick={onPrev}
                    aria-label="Previous track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipBack size={14} fill="currentColor" />
                </button>
                <button
                    type="button"
                    onClick={onPlayPause}
                    aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                    aria-pressed={isPlaying}
                    className={cn(
                        'p-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isPlaying ? 'bg-lime-400/90 text-black hover:bg-lime-300' : 'bg-zinc-700 text-white hover:bg-zinc-600'
                    )}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    aria-label="Next track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipForward size={14} fill="currentColor" />
                </button>

                <button
                    type="button"
                    onClick={() => setRepeat(!repeat)}
                    aria-label="Toggle repeat"
                    aria-pressed={repeat}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        repeat ? 'text-deck-b' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Repeat size={12} />
                </button>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-9 text-right shrink-0">{formatTime(elapsed)}</span>
                <div className="flex-1 group relative h-7 flex items-center">
                    <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-[width] duration-100"
                            style={{
                                width: `${progress * 100}%`,
                                background: 'linear-gradient(90deg, hsl(var(--color-waveform-played-strong)), hsl(var(--color-waveform-played-mid)))',
                                boxShadow: '0 0 8px hsla(var(--color-deck-a),0.3)',
                            }}
                        />
                    </div>
                    <input
                        aria-label="Playback position"
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={progress}
                        onChange={(e) => setProgressOverride(parseFloat(e.target.value))}
                        onChange={(e) => setProgress(parseFloat(e.target.value))}
                        className="absolute inset-x-0 h-7 w-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="absolute w-3 h-3 rounded-full bg-[hsl(var(--color-deck-a))] border-2 border-deck-a-soft opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            left: `calc(${progress * 100}% - 6px)`,
                            boxShadow: '0 0 8px hsla(var(--color-deck-a),0.4)',
                        }}
                    />
                </div>
                <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-9 shrink-0">-{formatTime(remaining)}</span>
            </div>

            <div className="flex items-center gap-2 px-3 shrink-0 border-l border-white/[0.04]">
                <div className="flex flex-col items-center px-2 py-1 rounded bg-white/[0.02]">
                    <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">BPM</span>
                    <span className="text-[12px] font-mono font-black text-zinc-300 tabular-nums">{track.bpm || '—'}</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded bg-deck-b-soft border border-deck-b-soft">
                    <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Key</span>
                    <span className="text-[12px] font-mono font-black text-[hsl(var(--color-deck-b))] tabular-nums">
                        {currentTrack?.key || '—'}
                    </span>
                    <span className="text-[12px] font-mono font-black text-[hsl(var(--color-deck-b))] tabular-nums">{track.key || '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-1">
                    <div className="flex items-center gap-1">
                        <Radio size={10} className={cn(telemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-700')} />
                        <span
                            className={cn(
                                'text-[8px] font-black uppercase tracking-wider',
                                telemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-600'
                            )}
                        >
                            Clip
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                telemetry?.signalFlags.limiterEngaged ? 'bg-orange-400' : 'bg-zinc-700'
                            )}
                        />
                        <span
                            className={cn(
                                'text-[8px] font-black uppercase tracking-wider',
                                telemetry?.signalFlags.limiterEngaged ? 'text-orange-400' : 'text-zinc-600'
                            )}
                        >
                            Lim
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-3 shrink-0 border-l border-white/[0.04]">
                <DegenStereoMeter
                    leftLevel={vuLeft}
                    rightLevel={vuRight}
                    leftPeak={peakLeft}
                    rightPeak={peakRight}
                    size="sm"
                    showDb
                />
            </div>

            <div className="flex items-center gap-2 px-3 w-36 shrink-0 border-l border-white/[0.04]">
                <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    aria-label={isMuted ? 'Unmute output' : 'Mute output'}
                    aria-pressed={isMuted}
                    className={cn(
                        'p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isMuted ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'
                    )}
                >
                    <VolumeIcon size={14} />
                </button>
                <div className="flex-1 relative group">
                    <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-zinc-400 transition-[width] duration-75" style={{ width: `${isMuted ? 0 : volume}%` }} />
                    </div>
                    <input
                        aria-label="Output volume"
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(parseInt(e.target.value, 10));
                            if (isMuted) setIsMuted(false);
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>
                <span className="text-[9px] font-mono text-zinc-600 tabular-nums w-6 text-right">{isMuted ? '0' : volume}</span>
            </div>
        </div>
    );
}
