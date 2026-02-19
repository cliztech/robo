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
        <div className="bg-zinc-950 p-4 border border-[hsl(var(--color-control-border))] rounded-md overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'hsl(var(--color-control-active))', boxShadow: '0 0 4px hsla(var(--color-control-active), 0.4)' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-deck-mic))] animate-pulse shadow-[0_0_8px_hsla(var(--color-deck-mic),0.5)]"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Beat Grid - DEGEN NODE</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 bg-zinc-900 border border-[hsl(var(--color-control-border))] text-[10px] font-mono text-zinc-400 rounded-sm">128 BPM</div>
                    <div className="px-2 py-0.5 bg-zinc-900 border border-[hsl(var(--color-control-border))] text-[10px] font-mono text-zinc-400 rounded-sm">4/4</div>
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
                                        className={`
                      h-6 w-full rounded-[2px] transition-all duration-75
                      ${active
                                                ? 'bg-[hsl(var(--color-deck-b)_/_0.7)] border-[hsl(var(--color-deck-b)_/_0.45)] shadow-[0_0_4px_hsla(var(--color-deck-b),0.25)]'
                                                : isPulse ? 'bg-[hsl(var(--color-grid-major)_/_0.3)] border-[hsl(var(--color-grid-major)_/_0.35)]' : 'bg-[hsl(var(--color-grid-minor)_/_0.28)] border-[hsl(var(--color-grid-minor)_/_0.35)]'}
                      hover:brightness-110 active:translate-y-px
                                                ? 'bg-[hsl(var(--color-deck-b))] shadow-[0_0_10px_hsla(var(--color-deck-b),0.6)]'
                                                : isPulse ? 'bg-zinc-800' : 'bg-zinc-900'}
                      hover:scale-105 active:scale-95 border border-white/5
                    `}
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
                <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold py-1.5 border border-[hsl(var(--color-control-border))] rounded-sm uppercase">SNGL</button>
                <button className="flex-1 bg-[hsl(var(--color-deck-b)_/_0.2)] text-[hsl(var(--color-deck-b))] border border-[hsl(var(--color-deck-b)_/_0.35)] text-[10px] font-bold py-1.5 rounded-sm uppercase">CONT</button>
                <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold py-1.5 border border-zinc-800 rounded uppercase">SNGL</button>
                <button className="flex-1 bg-deck-b-soft text-deck-b border border-deck-b-soft text-[10px] font-bold py-1.5 rounded uppercase">CONT</button>
            </div>
        </div>
    );
}
