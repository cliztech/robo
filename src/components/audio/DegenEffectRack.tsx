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

    const deckColor = deck === 'A' || deck === 'MST'
        ? '#aaff00'
        : deck === 'B'
            ? '#9933ff'
            : '#00bfff';

    return (
        <div className="glass-panel overflow-hidden">
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <Zap size={10} style={{ color: isActive ? deckColor : '#555' }} />
                    <span className="panel-header-title">{title}</span>
                    <span
                        className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-wider"
                        style={{
                            color: deckColor,
                            backgroundColor: `${deckColor}10`,
                            border: `1px solid ${deckColor}15`,
                        }}
                    >
                        {deck}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsLocked(!isLocked)}
                        className={cn(
                            'p-1 rounded transition-all',
                            isLocked
                                ? 'text-yellow-500 bg-yellow-500/10'
                                : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]'
                        )}
                        title={isLocked ? 'Unlock' : 'Lock'}
                    >
                        {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-all"
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
                <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-white/[0.03]">
                    {['Subtle', 'Warm', 'Heavy', 'Custom'].map((preset) => (
                        <button
                            key={preset}
                            className="text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-sm border border-white/[0.04] text-zinc-600 bg-white/[0.01] hover:text-zinc-300 hover:bg-white/[0.03] transition-all"
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
