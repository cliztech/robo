'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { DegenButton } from '../primitives/DegenButton';
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Repeat,
    Shuffle,
    Volume2,
    VolumeX,
    Radio,
    Mic2,
} from 'lucide-react';
import { DegenVUMeter } from './DegenVUMeter';

interface TransportTrack {
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
}

interface DegenTransportProps {
    currentTrack?: TransportTrack;
    isPlaying?: boolean;
    progress?: number; // 0-1
    volume?: number; // 0-100
    isOnAir?: boolean;
    onPlayPause?: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    onVolumeChange?: (v: number) => void;
    onSeek?: (pos: number) => void;
    className?: string;
}

export function DegenTransport({
    currentTrack = {
        title: 'Neural Drift v2.1',
        artist: 'SynthKong',
        duration: 234,
        bpm: 128,
        key: 'Am',
    },
    isPlaying = true,
    progress = 0.35,
    volume = 75,
    isOnAir = true,
    onPlayPause,
    onNext,
    onPrev,
    onVolumeChange,
    onSeek,
    className,
}: DegenTransportProps) {
    const [localProgress, setLocalProgress] = useState(progress);
    const [isMuted, setIsMuted] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [vuLeft, setVuLeft] = useState(65);
    const [vuRight, setVuRight] = useState(58);

    useEffect(() => setLocalProgress(progress), [progress]);

    // Simulate VU meter movement
    useEffect(() => {
        if (!isPlaying) return;
        const id = setInterval(() => {
            setVuLeft(55 + Math.random() * 30);
            setVuRight(50 + Math.random() * 35);
        }, 100);
        return () => clearInterval(id);
    }, [isPlaying]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const elapsed = localProgress * currentTrack.duration;
    const remaining = currentTrack.duration - elapsed;

    return (
        <div
            className={cn(
                'bg-zinc-950 border-t border-zinc-800 flex items-center gap-4 px-4 py-2',
                className
            )}
        >
            {/* On Air indicator */}
            <div className="flex items-center gap-2 min-w-[80px]">
                {isOnAir ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/20 border border-red-600/30 rounded">
                        <Radio size={10} className="text-red-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-500 animate-pulse">
                            On Air
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded">
                        <Mic2 size={10} className="text-zinc-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                            Off Air
                        </span>
                    </div>
                )}
            </div>

            {/* Track info */}
            <div className="flex flex-col min-w-[140px]">
                <span className="text-xs font-bold text-white truncate">
                    {currentTrack.title}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                    {currentTrack.artist}
                </span>
            </div>

            {/* Transport controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        isShuffle
                            ? 'text-lime-500'
                            : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Shuffle size={12} />
                </button>
                <button
                    onClick={onPrev}
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
                >
                    <SkipBack size={14} />
                </button>
                <button
                    onClick={onPlayPause}
                    className={cn(
                        'p-2 rounded-md transition-all',
                        isPlaying
                            ? 'bg-lime-500 text-black shadow-[0_0_12px_rgba(170,255,0,0.4)]'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    )}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                    onClick={onNext}
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
                >
                    <SkipForward size={14} />
                </button>
                <button
                    onClick={() => setIsRepeat(!isRepeat)}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        isRepeat
                            ? 'text-purple-500'
                            : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Repeat size={12} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 w-8 text-right tabular-nums">
                    {formatTime(elapsed)}
                </span>
                <div className="relative flex-1 group">
                    <input
                        type="range"
                        min={0}
                        max={1000}
                        value={localProgress * 1000}
                        onChange={(e) => {
                            const pos = Number(e.target.value) / 1000;
                            setLocalProgress(pos);
                            onSeek?.(pos);
                        }}
                        className="w-full h-1 appearance-none bg-zinc-800 rounded-full cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-2.5
                            [&::-webkit-slider-thumb]:h-2.5
                            [&::-webkit-slider-thumb]:bg-lime-500
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(170,255,0,0.5)]
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:opacity-0
                            group-hover:[&::-webkit-slider-thumb]:opacity-100
                            [&::-webkit-slider-thumb]:transition-opacity"
                        aria-label="Track progress"
                    />
                    <div
                        className="absolute top-0 left-0 h-1 bg-lime-500/80 rounded-full pointer-events-none"
                        style={{ width: `${localProgress * 100}%` }}
                    />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 w-8 tabular-nums">
                    -{formatTime(remaining)}
                </span>
            </div>

            {/* BPM / KEY */}
            <div className="flex gap-2 items-center">
                {currentTrack.bpm && (
                    <div className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-mono text-zinc-400">
                        {currentTrack.bpm} BPM
                    </div>
                )}
                {currentTrack.key && (
                    <div className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] font-mono text-purple-400">
                        {currentTrack.key}
                    </div>
                )}
            </div>

            {/* VU Meters */}
            <div className="flex gap-0.5 items-end">
                <DegenVUMeter level={vuLeft} peak={vuLeft + 5} orientation="vertical" size="sm" showDb={false} label="L" />
                <DegenVUMeter level={vuRight} peak={vuRight + 5} orientation="vertical" size="sm" showDb={false} label="R" />
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1 min-w-[100px]">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange?.(Number(e.target.value))}
                    className="flex-1 h-1 appearance-none bg-zinc-800 rounded-full cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-2
                        [&::-webkit-slider-thumb]:h-2
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:cursor-pointer"
                    aria-label="Master volume"
                />
                <span className="text-[9px] font-mono text-zinc-500 w-6 text-right tabular-nums">
                    {isMuted ? 0 : volume}
                </span>
            </div>
        </div>
    );
}
