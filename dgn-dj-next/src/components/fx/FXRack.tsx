import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Knob } from '../ui/Knob';

interface FXRackProps {
    deck: 'A' | 'B';
}

const FX_PRESETS = ['ECHO', 'REVERB', 'FLANGER', 'ROLL', 'SWEEP', 'V.BRAKE', 'PITCH', 'PHASER'];
const BEAT_DIVS = ['1/4', '1/2', '1', '2', '4'];

interface FXSlot {
    name: string;
    wet: number;
    active: boolean;
    beatDiv: string;
}

export const FXRack: React.FC<FXRackProps> = ({ deck }) => {
    const [slots, setSlots] = useState<FXSlot[]>([
        { name: 'ROLL', wet: 50, active: false, beatDiv: '1/2' },
        { name: 'ECHO', wet: 35, active: false, beatDiv: '1' },
        { name: 'FLANGER', wet: 65, active: false, beatDiv: '1/4' },
        { name: 'REVERB', wet: 40, active: false, beatDiv: '2' },
    ]);
    const [beatSync, setBeatSync] = useState(true);

    const color = deck === 'A' ? '#0091FF' : '#FF5500';
    const knobColor = deck === 'A' ? 'deck-a' as const : 'deck-b' as const;

    const updateSlot = (idx: number, updates: Partial<FXSlot>) => {
        setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
    };

    return (
        <div className="flex flex-col gap-1.5 p-2 bg-panel-1 rounded-lg panel-depth">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xxs font-mono tracking-micro text-zinc-500">
                        FX <span style={{ color }}>{deck}</span>
                    </span>
                </div>
                {/* Beat Sync Toggle */}
                <button
                    onClick={() => setBeatSync(!beatSync)}
                    className={cn(
                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all",
                        beatSync
                            ? "text-white bg-white/10 border border-white/20"
                            : "text-zinc-600 border border-white/5 hover:text-zinc-400"
                    )}
                >
                    BPM SYNC
                </button>
            </div>

            {/* FX Slots — 4 slots */}
            <div className="flex gap-1.5">
                {slots.map((slot, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        {/* FX Name / Selector */}
                        <select
                            value={slot.name}
                            onChange={e => updateSlot(i, { name: e.target.value })}
                            className="w-full bg-panel-2 border border-white/5 rounded text-[9px] font-mono
                                       text-zinc-400 px-1 py-0.5 text-center cursor-pointer
                                       hover:border-white/15 transition-colors focus-ring"
                        >
                            {FX_PRESETS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>

                        {/* Wet Knob */}
                        <Knob
                            value={slot.wet}
                            onChange={v => updateSlot(i, { wet: v })}
                            size={30}
                            color={knobColor}
                            label=""
                        />

                        {/* Dry/Wet Readout */}
                        <span className="text-[8px] font-mono tabular-nums text-zinc-600">{slot.wet}%</span>

                        {/* Beat Division — Cycle on click */}
                        <button
                            onClick={() => {
                                const idx = BEAT_DIVS.indexOf(slot.beatDiv);
                                updateSlot(i, { beatDiv: BEAT_DIVS[(idx + 1) % BEAT_DIVS.length] });
                            }}
                            className="text-[9px] font-mono text-zinc-500 hover:text-white
                                       bg-panel-2 border border-white/5 rounded px-1.5 py-0.5
                                       transition-colors hover:border-white/15"
                        >
                            {slot.beatDiv}
                        </button>

                        {/* ON/OFF Toggle */}
                        <button
                            onClick={() => updateSlot(i, { active: !slot.active })}
                            className={cn(
                                "transport-btn h-5! w-full! text-[8px] font-mono font-bold tracking-micro",
                                slot.active
                                    ? "text-white border"
                                    : "text-zinc-600 border border-white/5 bg-panel-2"
                            )}
                            style={slot.active ? {
                                borderColor: `${color}60`,
                                backgroundColor: `${color}20`,
                                boxShadow: `0 0 8px ${color}30`,
                            } : undefined}
                        >
                            ON
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
