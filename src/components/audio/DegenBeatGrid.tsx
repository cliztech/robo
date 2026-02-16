'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface DegenBeatGridProps {
    decks?: number;
    steps?: number;
    onStepToggle?: (deck: number, step: number) => void;
}

export function DegenBeatGrid({ decks = 4, steps = 16, onStepToggle }: DegenBeatGridProps) {
    const [grid, setGrid] = useState<boolean[][]>(
        Array(decks).fill(null).map(() => Array(steps).fill(false))
    );
    const [mode, setMode] = useState<'single' | 'continuous'>('continuous');

    const toggleStep = (deckIndex: number, stepIndex: number) => {
        const newGrid = [...grid];
        newGrid[deckIndex] = [...newGrid[deckIndex]];
        newGrid[deckIndex][stepIndex] = !newGrid[deckIndex][stepIndex];
        setGrid(newGrid);
        onStepToggle?.(deckIndex, stepIndex);
    };

    return (
        <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Beat Grid - DEGEN NODE</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 rounded">128 BPM</div>
                    <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 rounded">4/4</div>
                </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="flex flex-col gap-1 justify-around">
                    {[...Array(decks)].map((_, i) => (
                        <span key={i} className="text-[10px] font-mono text-zinc-500">D{i + 1}</span>
                    ))}
                </div>

                <div className="flex flex-col gap-1">
                    {grid.map((row, rI) => (
                        <div key={rI} className="flex gap-1">
                            {row.map((active, cI) => {
                                const isPulse = cI % 4 === 0;
                                return (
                                    <button
                                        key={cI}
                                        onClick={() => toggleStep(rI, cI)}
                                        aria-label={`Deck ${rI + 1} step ${cI + 1}`}
                                        aria-pressed={active}
                                        className={cn(
                                            'h-6 w-full rounded-sm transition-all duration-75 border border-white/5',
                                            active
                                                ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.6)]'
                                                : isPulse
                                                    ? 'bg-zinc-800'
                                                    : 'bg-zinc-900',
                                            'hover:scale-105 active:scale-95'
                                        )}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => setMode('single')}
                    aria-pressed={mode === 'single'}
                    className={cn(
                        'flex-1 text-[10px] font-bold py-1.5 border rounded uppercase transition-colors',
                        mode === 'single'
                            ? 'bg-zinc-200/10 text-zinc-200 border-zinc-600'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                    )}
                >
                    SNGL
                </button>
                <button
                    onClick={() => setMode('continuous')}
                    aria-pressed={mode === 'continuous'}
                    className={cn(
                        'flex-1 text-[10px] font-bold py-1.5 border rounded uppercase transition-colors',
                        mode === 'continuous'
                            ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                    )}
                >
                    CONT
                </button>
            </div>
        </div>
    );
}
