'use client';

import React, { useState } from 'react';

interface DegenBeatGridProps {
    decks?: number;
    steps?: number;
    onStepToggle?: (deck: number, step: number) => void;
}

export function DegenBeatGrid({ decks = 4, steps = 16 }: DegenBeatGridProps) {
    const [grid, setGrid] = useState<boolean[][]>(
        Array(decks).fill(null).map(() => Array(steps).fill(false))
    );

    const toggleStep = (deckIndex: number, stepIndex: number) => {
        const newGrid = [...grid];
        newGrid[deckIndex] = [...newGrid[deckIndex]];
        newGrid[deckIndex][stepIndex] = !newGrid[deckIndex][stepIndex];
        setGrid(newGrid);
    };

    return (
        <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-deck-mic))] animate-pulse shadow-[0_0_8px_hsla(var(--color-deck-mic),0.5)]"></div>
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
                                const isPulse = (cI % 4 === 0);
                                return (
                                    <button
                                        key={cI}
                                        onClick={() => toggleStep(rI, cI)}
                                        className={`
                      h-6 w-full rounded-sm transition-all duration-75
                      ${active
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
                <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold py-1.5 border border-zinc-800 rounded uppercase">SNGL</button>
                <button className="flex-1 bg-[hsla(var(--color-deck-b),0.2)] text-[hsl(var(--color-deck-b))] border border-[hsla(var(--color-deck-b),0.3)] text-[10px] font-bold py-1.5 rounded uppercase">CONT</button>
            </div>
        </div>
    );
}
