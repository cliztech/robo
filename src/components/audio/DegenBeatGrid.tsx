'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Play, Square, Shuffle, Trash2 } from 'lucide-react';

interface DegenBeatGridProps {
    decks?: number;
    steps?: number;
    onStepToggle?: (deck: number, step: number) => void;
}

const ROW_CONFIG = [
    { label: 'KICK', shortLabel: 'KK', color: '#027de1', activeColor: 'rgba(2,125,225,0.7)' },
    { label: 'SNARE', shortLabel: 'SN', color: '#a1cff5', activeColor: 'rgba(161,207,245,0.7)' },
    { label: 'HIHAT', shortLabel: 'HH', color: '#00bfff', activeColor: 'rgba(0,191,255,0.7)' },
    { label: 'PERC', shortLabel: 'PC', color: '#ff6b00', activeColor: 'rgba(255,107,0,0.7)' },
];

export function DegenBeatGrid({ decks = 4, steps = 16, onStepToggle }: DegenBeatGridProps) {
    const [grid, setGrid] = useState<boolean[][]>(
        Array(decks).fill(null).map((_, i) => {
            // Pre-fill a demo pattern
            const row = Array(steps).fill(false);
            if (i === 0) { row[0] = true; row[4] = true; row[8] = true; row[12] = true; }
            if (i === 1) { row[4] = true; row[12] = true; }
            if (i === 2) { row[0] = true; row[2] = true; row[4] = true; row[6] = true; row[8] = true; row[10] = true; row[12] = true; row[14] = true; }
            if (i === 3) { row[3] = true; row[7] = true; row[11] = true; }
            return row;
        })
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);

    const toggleStep = useCallback((deckIndex: number, stepIndex: number) => {
        setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            newGrid[deckIndex][stepIndex] = !newGrid[deckIndex][stepIndex];
            return newGrid;
        });
        onStepToggle?.(deckIndex, stepIndex);
    }, [onStepToggle]);

    const clearGrid = useCallback(() => {
        setGrid(Array(decks).fill(null).map(() => Array(steps).fill(false)));
    }, [decks, steps]);

    const randomize = useCallback(() => {
        setGrid(Array(decks).fill(null).map(() =>
            Array(steps).fill(false).map(() => Math.random() > 0.7)
        ));
    }, [decks, steps]);

    // Playback simulation
    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps);
        }, 125); // 120 BPM = 125ms per 16th note
        return () => clearInterval(interval);
    }, [isPlaying, steps]);

    useEffect(() => {
        if (!isPlaying) setCurrentStep(-1);
    }, [isPlaying]);

    return (
        <div className="glass-panel overflow-hidden">
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2.5">
                    <div
                        className={cn(
                            'w-2 h-2 rounded-full transition-all',
                            isPlaying ? 'bg-[#027de1] animate-pulse' : 'bg-zinc-700'
                        )}
                        style={isPlaying ? { boxShadow: '0 0 8px rgba(2,125,225,0.6)' } : {}}
                    />
                    <span className="panel-header-title">Beat Sequencer</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 tabular-nums">120</span>
                        <span className="text-[8px] text-zinc-600 ml-1">BPM</span>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-400">4/4</span>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="p-3">
                {/* Step numbers */}
                <div className="grid grid-cols-[40px_1fr] gap-2 mb-1">
                    <div /> {/* spacer for row labels */}
                    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }}>
                        {Array(steps).fill(0).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'text-center text-[7px] font-mono tabular-nums',
                                    i % 4 === 0 ? 'text-zinc-500 font-bold' : 'text-zinc-700'
                                )}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Beat rows */}
                <div className="space-y-[3px]">
                    {grid.map((row, rI) => {
                        const config = ROW_CONFIG[rI] || ROW_CONFIG[0];
                        return (
                            <div key={rI} className="grid grid-cols-[40px_1fr] gap-2 items-center">
                                {/* Row label */}
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{
                                            backgroundColor: config.color,
                                            boxShadow: `0 0 4px ${config.color}50`,
                                        }}
                                    />
                                    <span
                                        className="text-[8px] font-black uppercase tracking-wider"
                                        style={{ color: config.color }}
                                    >
                                        {config.shortLabel}
                                    </span>
                                </div>

                                {/* Steps */}
                                <div
                                    className="grid gap-[3px]"
                                    style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }}
                                >
                                    {row.map((active, cI) => {
                                        const isBeat = cI % 4 === 0;
                                        const isCurrent = cI === currentStep;
                                        return (
                                            <button
                                                key={cI}
                                                onClick={() => toggleStep(rI, cI)}
                                                className={cn(
                                                    'h-7 w-full rounded-[3px] transition-all duration-75 border',
                                                    'hover:brightness-125 active:scale-95',
                                                    isCurrent && 'ring-1 ring-white/20',
                                                )}
                                                style={{
                                                    backgroundColor: active
                                                        ? config.activeColor
                                                        : isBeat
                                                            ? 'rgba(255,255,255,0.04)'
                                                            : 'rgba(255,255,255,0.015)',
                                                    borderColor: active
                                                        ? `${config.color}30`
                                                        : isBeat
                                                            ? 'rgba(255,255,255,0.06)'
                                                            : 'rgba(255,255,255,0.03)',
                                                    boxShadow: active
                                                        ? `0 0 8px ${config.color}25, inset 0 1px 0 rgba(255,255,255,0.1)`
                                                        : isCurrent
                                                            ? '0 0 6px rgba(255,255,255,0.05)'
                                                            : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Playhead progress bar */}
                {isPlaying && (
                    <div className="mt-2 h-[2px] bg-white/[0.03] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-100"
                            style={{
                                width: `${((currentStep + 1) / steps) * 100}%`,
                                background: 'linear-gradient(90deg, #027de1, #a1cff5)',
                                boxShadow: '0 0 6px rgba(2,125,225,0.4)',
                            }}
                        />
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.03]">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[8px] font-black uppercase tracking-wider transition-all',
                            isPlaying
                                ? 'bg-[#027de1]/15 border-[#027de1]/25 text-[#4da6f0]'
                                : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                        )}
                    >
                        {isPlaying ? <Square size={9} fill="currentColor" /> : <Play size={9} fill="currentColor" />}
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>

                    <div className="w-px h-4 bg-white/[0.05]" />

                    <button
                        onClick={randomize}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-sm border border-white/[0.05] text-[8px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all"
                    >
                        <Shuffle size={9} /> Random
                    </button>
                    <button
                        onClick={clearGrid}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-sm border border-white/[0.05] text-[8px] font-black uppercase tracking-wider text-zinc-500 hover:text-red-400 hover:bg-red-500/[0.05] hover:border-red-500/[0.1] transition-all"
                    >
                        <Trash2 size={9} /> Clear
                    </button>

                    <div className="flex-1" />

                    {/* Step counter */}
                    {isPlaying && (
                        <div className="text-[9px] font-mono tabular-nums text-zinc-500">
                            Step <span className="text-[#4da6f0] font-bold">{currentStep + 1}</span>/{steps}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
