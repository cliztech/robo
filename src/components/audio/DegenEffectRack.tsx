'use client';

import React, { useState } from 'react';
import { DegenKnob } from './DegenKnob';
import { cn } from '../../lib/utils';
import { buildDefaultEffectValues } from '../../lib/degenDataAdapters';
import { Lock, Unlock, RotateCcw, Zap } from 'lucide-react';

interface EffectControl {
    label: string;
    key: string;
    min?: number;
    max?: number;
    unit?: string;
}

interface DegenEffectRackProps {
    title: string;
    deck: string;
    controls: EffectControl[];
    initialValues?: Record<string, number>;
    isActive?: boolean;
}

export function DegenEffectRack({ title, deck, controls, initialValues, isActive = true }: DegenEffectRackProps) {
    const [values, setValues] = useState<Record<string, number>>(
        initialValues ?? buildDefaultEffectValues(controls.map((ctrl) => ctrl.key))
    );
    const [isLocked, setIsLocked] = useState(false);

    const handleValueChange = (key: string, val: number) => {
        if (isLocked) return;
        setValues(prev => ({ ...prev, [key]: val }));
    };

    const handleReset = () => {
        if (isLocked) return;
        setValues(buildDefaultEffectValues(controls.map((ctrl) => ctrl.key)));
    };

    const deckColorToken = deck === 'B'
        ? '--color-deck-b'
        : deck === 'A' || deck === 'MST'
            ? '--color-deck-a'
            : '--color-accent-3';
    const deckColor = `hsl(var(${deckColorToken}))`;

    return (
        <div className="glass-panel overflow-hidden">
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <Zap size={10} style={{ color: isActive ? deckColor : 'hsl(var(--color-text-dim))' }} />
                    <span className="panel-header-title">{title}</span>
                    <span
                        className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-wider"
                        style={{
                            color: deckColor,
                            backgroundColor: isActive ? `hsla(var(${deckColorToken}), 0.12)` : 'hsl(var(--color-surface-2))',
                            border: `1px solid ${isActive ? `hsla(var(${deckColorToken}), 0.24)` : 'hsl(var(--color-control-border))'}`,
                        }}
                    >
                        {deck}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsLocked(!isLocked)}
                        aria-label={isLocked ? 'Unlock effect controls' : 'Lock effect controls'}
                        aria-pressed={isLocked}
                        className={cn(
                            'p-1 rounded-sm border transition-all',
                            isLocked
                                ? 'text-[hsl(var(--color-warning))] bg-[hsl(var(--color-warning)_/_0.12)] border-[hsl(var(--color-warning)_/_0.35)]'
                                : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:border-[hsl(var(--color-control-border))] hover:bg-white/[0.02]'
                        )}
                        title={isLocked ? 'Unlock' : 'Lock'}
                    >
                        {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                    <button
                        onClick={handleReset}
                        aria-label="Reset effect controls"
                        className="p-1 rounded-sm border border-transparent text-zinc-600 hover:text-zinc-400 hover:border-[hsl(var(--color-control-border))] hover:bg-white/[0.02] transition-all"
                        title="Reset"
                    >
                        <RotateCcw size={10} />
                    </button>
                </div>
            </div>

            {/* Controls grid */}
            <div className={cn(
                'p-4 transition-opacity duration-200',
                !isActive && 'opacity-40 pointer-events-none'
            )}>
                <div className="flex flex-wrap justify-center gap-4">
                    {controls.map((ctrl) => (
                        <DegenKnob
                            key={ctrl.key}
                            label={ctrl.label}
                            value={values[ctrl.key] ?? 50}
                            min={ctrl.min ?? 0}
                            max={ctrl.max ?? 100}
                            unit={ctrl.unit}
                            onChange={(val) => handleValueChange(ctrl.key, val)}
                            size={48}
                            color={deckColor}
                        />
                    ))}
                </div>

                {/* Preset bar */}
                <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-[hsl(var(--color-control-border)_/_0.6)]">
                    {['Subtle', 'Warm', 'Heavy', 'Custom'].map((preset) => (
                        <button
                            key={preset}
                            className="text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-sm border border-[hsl(var(--color-control-border)_/_0.75)] text-zinc-500 bg-[hsl(var(--color-surface)_/_0.65)] hover:text-zinc-300 hover:border-[hsl(var(--color-control-border-strong))] transition-all"
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
