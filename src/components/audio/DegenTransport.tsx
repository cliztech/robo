'use client';

<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Radio, Repeat, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
=======
import React, { useEffect, useMemo, useState } from 'react';
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581
import { cn } from '../../lib/utils';
import { DegenStereoMeter } from './DegenVUMeter';
import type { DJTelemetry } from '../../lib/audio/telemetry';
<<<<<<< HEAD

interface TransportTrack {
    title?: string;
    artist?: string;
    album?: string;
    bpm?: string | number;
    key?: string;
    duration?: number;
}
=======
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
} from 'lucide-react';
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581

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

function formatTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function DegenTransport({
    currentTrack,
    telemetry,
    telemetryTick,
<<<<<<< HEAD
    isPlaying = false,
    isOnAir = false,
=======
    telemetry,
    isPlaying = true,
    isOnAir = true,
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581
    onPlayPause,
    onNext,
    onPrev,
    className,
}: DegenTransportProps) {
<<<<<<< HEAD
=======
    const track = resolveTransportTrack(currentTrack);
    const transportTelemetry = resolveTransportTelemetry(telemetry ? adaptDJTelemetryToTransportTelemetry(telemetry) : undefined);

    const [telemetryStep, setTelemetryStep] = useState(0);
    const [playbackProgress, setPlaybackProgress] = useState(0);

    useEffect(() => {
        setPlaybackProgress(transportTelemetry.progress);
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
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(85);

<<<<<<< HEAD
    const progress = telemetry?.transport.progress ?? 0;
    const elapsed = telemetry?.transport.elapsedSeconds ?? ((currentTrack?.duration ?? 0) * progress);
    const remaining = telemetry?.transport.remainingSeconds ?? Math.max(0, (currentTrack?.duration ?? 0) - elapsed);

    const phase = telemetryTick ?? 0;
    const left = telemetry?.stereoLevels.leftLevel ?? Math.max(0.05, 0.35 + Math.sin(phase / 7) * 0.2);
    const right = telemetry?.stereoLevels.rightLevel ?? Math.max(0.05, 0.35 + Math.cos(phase / 8) * 0.2);
    const leftPeak = telemetry?.stereoLevels.leftPeak ?? left;
    const rightPeak = telemetry?.stereoLevels.rightPeak ?? right;

    useEffect(() => {
        if (telemetry) return;
        const timer = setInterval(() => {
            // keep meter animated even without telemetry
            setVolume((prev) => prev);
        }, 160);
        return () => clearInterval(timer);
    }, [telemetry]);
=======
    const progress = progressOverride ?? transportTelemetry.progress ?? 0;
    const elapsed = telemetry?.transport.elapsedSeconds ?? progress * (track.duration || 0);
    const vuLeft =
        telemetry?.stereoLevels.leftLevel ??
        Math.max(0.1, Math.min(1, transportTelemetry.vuLeft + Math.sin(phase / 5) * 0.08));
    const vuRight =
        telemetry?.stereoLevels.rightLevel ??
        Math.max(0.1, Math.min(1, transportTelemetry.vuRight + Math.cos(phase / 6) * 0.08));
    const peakLeft = telemetry?.stereoLevels.leftPeak ?? vuLeft;
    const peakRight = telemetry?.stereoLevels.rightPeak ?? vuRight;

    const elapsedTime = telemetry?.transport.elapsedSeconds ?? progress * (track.duration || 0);
    const remaining = useMemo(() => {
        if (telemetry) {
            return telemetry.transport.remainingSeconds;
        }

        return (track.duration || 0) - elapsedTime;
    }, [elapsedTime, telemetry, track.duration]);
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581

    const VolumeIcon = useMemo(() => {
        if (isMuted) return VolumeX;
        if (volume < 40) return Volume1;
        return Volume2;
    }, [isMuted, volume]);

    return (
        <div
            className={cn(
                'h-16 bg-black/60 backdrop-blur-xl border-t border-white/[0.05] flex items-center px-0 shrink-0 z-20',
                className
            )}
        >
            <div className="w-14 h-full flex items-center justify-center border-r border-white/[0.05]">
                {isOnAir ? (
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-30" />
                    </div>
                ) : (
                    <div className="w-3 h-3 rounded-full bg-zinc-700" />
                )}
            </div>

            <div className="w-56 px-4 border-r border-white/[0.05]">
                <div className="text-[11px] font-bold text-white truncate tracking-wide">{currentTrack?.title ?? 'No track loaded'}</div>
                <div className="text-[10px] text-zinc-500 truncate">
                    {currentTrack?.artist ?? 'Unknown Artist'}
                    {currentTrack?.album ? <span className="text-zinc-700"> · {currentTrack.album}</span> : null}
                </div>
            </div>

            <div className="flex items-center gap-1 px-3 border-r border-white/[0.05]">
                <button type="button" onClick={() => setShuffle((p) => !p)} className={cn('p-1.5 rounded', shuffle ? 'text-lime-400' : 'text-zinc-500')}>
                    <Shuffle size={12} />
                </button>
                <button type="button" onClick={onPrev} className="p-1.5 rounded text-zinc-400 hover:text-white"><SkipBack size={14} /></button>
                <button
                    type="button"
                    onClick={onPlayPause}
                    className={cn('p-2 rounded-full', isPlaying ? 'bg-lime-400 text-black' : 'bg-zinc-700 text-white')}
                    aria-pressed={isPlaying}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button type="button" onClick={onNext} className="p-1.5 rounded text-zinc-400 hover:text-white"><SkipForward size={14} /></button>
                <button type="button" onClick={() => setRepeat((p) => !p)} className={cn('p-1.5 rounded', repeat ? 'text-indigo-400' : 'text-zinc-500')}>
                    <Repeat size={12} />
                </button>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 min-w-0">
<<<<<<< HEAD
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-9 text-right shrink-0">{formatTime(elapsed)}</span>
                <div className="relative h-2 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-lime-400 to-cyan-400" style={{ width: `${Math.round(progress * 100)}%` }} />
=======
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-9 text-right shrink-0">{formatTime(elapsedTime)}</span>
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

                        onChange={(e) => setPlaybackProgress(parseFloat(e.target.value))}
                        className="absolute inset-x-0 h-7 w-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="absolute w-3 h-3 rounded-full bg-[hsl(var(--color-deck-a))] border-2 border-deck-a-soft opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            left: `calc(${progress * 100}% - 6px)`,
                            boxShadow: '0 0 8px hsla(var(--color-deck-a),0.4)',
                        }}
                    />
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581
                </div>
                <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-9 shrink-0">-{formatTime(remaining)}</span>
            </div>

            <div className="px-3 border-l border-white/[0.05]">
                <DegenStereoMeter leftLevel={left} rightLevel={right} leftPeak={leftPeak} rightPeak={rightPeak} size="sm" />
            </div>

            <div className="flex items-center gap-2 px-3 w-36 border-l border-white/[0.05]">
                <button type="button" onClick={() => setIsMuted((p) => !p)} className={cn('p-1 rounded', isMuted ? 'text-red-400' : 'text-zinc-500')}>
                    <VolumeIcon size={14} />
                </button>
                <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-zinc-400" style={{ width: `${isMuted ? 0 : volume}%` }} />
                </div>
                <span className="text-[9px] font-mono text-zinc-600 tabular-nums w-6 text-right">{isMuted ? '0' : volume}</span>
            </div>

            <div className="px-3 border-l border-white/[0.05] text-[9px] text-zinc-500 min-w-[74px]">
                <div className="flex items-center gap-1"><Radio size={10} className={telemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-700'} /> Clip</div>
                <div className="mt-0.5">BPM {currentTrack?.bpm ?? '--'}</div>
            </div>
        </div>
    );
}
