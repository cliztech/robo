'use client';

import React, { useState } from 'react';
import { DegenKnob } from './DegenKnob';
import { DegenButton } from '../primitives/DegenButton';
import { cn } from '../../lib/utils';

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
    isActive?: boolean;
}

export function DegenEffectRack({ title, deck, controls, isActive = true }: DegenEffectRackProps) {
    const [values, setValues] = useState<Record<string, number>>(
        controls.reduce((acc, ctrl) => ({ ...acc, [ctrl.key]: 60 }), {})
    );

    const [isLocked, setIsLocked] = useState(false);

    const handleValueChange = (key: string, val: number) => {
        if (isLocked) return;
        setValues(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
            {/* Title Bar */}
            <div className="bg-zinc-800/50 px-3 py-1.5 flex justify-between items-center border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isActive ? "bg-lime-500 shadow-[0_0_8px_rgba(170,255,0,0.6)]" : "bg-zinc-700"
                    )} />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">
                        {title} <span className="text-zinc-500">({deck})</span>
                    </h4>
                </div>
                <div className="flex gap-1">
                    <button className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1">#</button>
                    <button className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1">×</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 grid grid-cols-3 gap-6 relative">
                {/* Knobs Grid */}
                <div className="col-span-1 grid grid-cols-1 gap-6">
                    {controls.slice(0, 2).map((ctrl) => (
                        <DegenKnob
                            key={ctrl.key}
                            label={ctrl.label}
                            value={values[ctrl.key]}
                            min={ctrl.min}
                            max={ctrl.max}
                            unit={ctrl.unit}
                            onChange={(val) => handleValueChange(ctrl.key, val)}
                            size={50}
                        />
                    ))}
                </div>

                {/* Center Section with Buttons */}
                <div className="col-span-1 flex flex-col justify-center items-center gap-3">
                    <DegenButton
                        variant={isLocked ? "secondary" : "primary"}
                        className="w-full"
                        onClick={() => setIsLocked(!isLocked)}
                    >
                        {isLocked ? "Unlock" : "Lock"}
                    </DegenButton>

                    <DegenKnob
                        label={controls[2]?.label || "Rate"}
                        value={values[controls[2]?.key] || 50}
                        onChange={(val) => controls[2] && handleValueChange(controls[2].key, val)}
                        size={40}
                    />

                    <DegenButton variant="primary" className="w-full">Shape</DegenButton>
                </div>

                <div className="col-span-1 grid grid-cols-1 gap-6">
                    {controls.slice(3, 5).map((ctrl) => (
                        <DegenKnob
                            key={ctrl.key}
                            label={ctrl.label}
                            value={values[ctrl.key]}
                            min={ctrl.min}
                            max={ctrl.max}
                            unit={ctrl.unit}
                            onChange={(val) => handleValueChange(ctrl.key, val)}
                            size={50}
                        />
                    ))}
                </div>

                {/* Reset Button floating bottom right */}
                <div className="absolute bottom-4 right-4">
                    <DegenButton variant="ghost" size="xs">Reset...</DegenButton>
                </div>
            </div>
        </div>
    );
}
