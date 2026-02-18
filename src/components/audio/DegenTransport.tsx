'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { DegenStereoMeter } from './DegenVUMeter';
import type { DJTelemetry } from '../../lib/audio/telemetry';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Radio,
    Volume2,
    VolumeX,
    Volume1,
} from 'lucide-react';

interface DegenTransportProps {
    currentTrack?: {
        title: string;
        artist: string;
        album?: string;
        bpm?: number;
        key?: string;
        duration?: number;
    };
    isPlaying?: boolean;
    isOnAir?: boolean;
    onPlayPause?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    telemetry?: DJTelemetry;
    className?: string;
}

export function DegenTransport({
    currentTrack = {
        title: 'Neural Drift v2.1',
        artist: 'SynthKong',
        album: 'Quantum Bass EP',
        bpm: 128,
        key: 'Am',
        duration: 234,
    },
    isPlaying = true,
    isOnAir = true,
    onPlayPause,
    onNext,
    onPrev,
    telemetry,
    className,
}: DegenTransportProps) {
    const [progressOverride, setProgressOverride] = useState<number | null>(null);
    const [volume, setVolume] = useState(85);
    const [isMuted, setIsMuted] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [shuffle, setShuffle] = useState(false);

    const progress = progressOverride ?? telemetry?.transport.progress ?? 0;
    const elapsed = telemetry?.transport.elapsedSeconds ?? progress * (currentTrack.duration || 0);
    const remaining = useMemo(() => {
        if (telemetry) {
            return telemetry.transport.remainingSeconds;
        }
        return (currentTrack.duration || 0) - elapsed;
    }, [currentTrack.duration, elapsed, telemetry]);

    const vuLeft = telemetry?.stereoLevels.leftLevel ?? 0;
    const vuRight = telemetry?.stereoLevels.rightLevel ?? 0;
    const peakLeft = telemetry?.stereoLevels.leftPeak ?? vuLeft;
    const peakRight = telemetry?.stereoLevels.rightPeak ?? vuRight;

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
                'shadow-[0_-4px_20px_rgba(0,0,0,0.3)]',
                className
            )}
        >
            {/* ── On-Air Indicator ─── */}
            <div className="w-14 h-full flex items-center justify-center shrink-0 border-r border-white/[0.04]">
                {isOnAir ? (
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-red-500" style={{ boxShadow: '0 0 10px rgba(239,68,68,0.5)' }} />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-30" />
                    </div>
                ) : (
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                )}
            </div>

            {/* ── Track Info ─── */}
            <div className="w-52 px-4 shrink-0 border-r border-white/[0.04]">
                <div className="text-[11px] font-bold text-white truncate tracking-wide">
                    {currentTrack.title}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                    {currentTrack.artist}
                    {currentTrack.album && <span className="text-zinc-700"> · {currentTrack.album}</span>}
                </div>
            </div>

            {/* ── Transport Controls ─── */}
            <div className="flex items-center gap-1 px-3 shrink-0">
                <button
                    onClick={() => setShuffle(!shuffle)}
                    aria-label="Toggle shuffle"
                    aria-pressed={shuffle}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        shuffle ? 'text-lime-400' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Shuffle size={12} />
                </button>
                <button
                    onClick={onPrev}
                    aria-label="Previous track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipBack size={14} fill="currentColor" />
                </button>

                <button
                    onClick={onPlayPause}
                    aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                    className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isPlaying
                            ? 'bg-lime-500/15 border border-lime-500/30 text-lime-400 hover:bg-lime-500/25'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    )}
                    style={isPlaying ? { boxShadow: '0 0 15px rgba(170,255,0,0.12)' } : {}}
                >
                    {isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                    ) : (
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                    )}
                </button>

                <button
                    onClick={onNext}
                    aria-label="Next track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipForward size={14} fill="currentColor" />
                </button>
                <button
                    onClick={() => setRepeat(!repeat)}
                    aria-label="Toggle repeat"
                    aria-pressed={repeat}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        repeat ? 'text-purple-400' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Repeat size={12} />
                </button>
            </div>

            {/* ── Progress Bar ─── */}
            <div className="flex-1 flex items-center gap-3 px-4 min-w-0">
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-9 text-right shrink-0">
                    {formatTime(elapsed)}
                </span>
                <div className="flex-1 group relative h-7 flex items-center">
                    <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-[width] duration-100"
                            style={{
                                width: `${progress * 100}%`,
                                background: 'linear-gradient(90deg, hsl(82,100%,50%), hsl(82,80%,45%))',
                                boxShadow: '0 0 8px rgba(170,255,0,0.3)',
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
                        className="absolute inset-x-0 h-7 w-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="absolute w-3 h-3 rounded-full bg-lime-400 border-2 border-lime-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            left: `calc(${progress * 100}% - 6px)`,
                            boxShadow: '0 0 8px rgba(170,255,0,0.4)',
                        }}
                    />
                </div>
                <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-9 shrink-0">
                    -{formatTime(remaining)}
                </span>
            </div>

            {/* ── BPM / Key + flags ─── */}
            <div className="flex items-center gap-2 px-3 shrink-0 border-l border-white/[0.04]">
                <div className="flex flex-col items-center px-2 py-1 rounded bg-white/[0.02]">
                    <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">BPM</span>
                    <span className="text-[12px] font-mono font-black text-zinc-300 tabular-nums">
                        {currentTrack.bpm || '—'}
                    </span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded bg-purple-500/[0.06] border border-purple-500/[0.08]">
                    <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Key</span>
                    <span className="text-[12px] font-mono font-black text-purple-400 tabular-nums">
                        {currentTrack.key || '—'}
                    </span>
                </div>
                <div className="flex flex-col gap-0.5 ml-1">
                    <div className="flex items-center gap-1">
                        <Radio size={10} className={cn(telemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-700')} />
                        <span className={cn('text-[8px] font-black uppercase tracking-wider', telemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-600')}>Clip</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className={cn('w-1.5 h-1.5 rounded-full', telemetry?.signalFlags.limiterEngaged ? 'bg-orange-400' : 'bg-zinc-700')} />
                        <span className={cn('text-[8px] font-black uppercase tracking-wider', telemetry?.signalFlags.limiterEngaged ? 'text-orange-400' : 'text-zinc-600')}>Lim</span>
                    </div>
                </div>
            </div>

            {/* ── VU Meters ─── */}
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

            {/* ── Volume ─── */}
            <div className="flex items-center gap-2 px-3 w-36 shrink-0 border-l border-white/[0.04]">
                <button
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
                        <div
                            className="h-full rounded-full bg-zinc-400 transition-[width] duration-75"
                            style={{ width: `${isMuted ? 0 : volume}%` }}
                        />
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
                <span className="text-[9px] font-mono text-zinc-600 tabular-nums w-6 text-right">
                    {isMuted ? '0' : volume}
                </span>
            </div>
        </div>
    );
}
