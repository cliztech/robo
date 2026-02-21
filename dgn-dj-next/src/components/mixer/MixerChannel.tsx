import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Knob } from '../ui/Knob';
import { VUMeter } from './VUMeter';

interface MixerChannelProps {
    channel: number;              // 1-4
    deck?: 'A' | 'B' | 'C' | 'D';
    volume: number;
    onVolumeChange: (v: number) => void;
    accentColor?: string;
}

export const MixerChannel: React.FC<MixerChannelProps> = ({
    channel,
    deck,
    volume,
    onVolumeChange,
    accentColor,
}) => {
    const [trim, setTrim] = useState(50);
    const [hi, setHi] = useState(50);
    const [mid, setMid] = useState(50);
    const [lo, setLo] = useState(50);
    const [filter, setFilter] = useState(50);
    const [fxAssign, setFxAssign] = useState(false);

    // Simulate VU meter level based on volume + random bounce
    const [meterLevel, setMeterLevel] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            const base = volume / 100;
            const noise = (Math.random() - 0.5) * 0.15;
            setMeterLevel(Math.max(0, Math.min(1, base * 0.75 + noise)));
        }, 50);
        return () => clearInterval(interval);
    }, [volume]);

    const color = useMemo(() => {
        if (accentColor) return accentColor;
        return channel <= 2 ? '#0091FF' : '#FF5500';
    }, [channel, accentColor]);

    const knobColor = channel <= 2 ? 'deck-a' as const : 'deck-b' as const;

    return (
        <div className="flex flex-col items-center gap-1.5 bg-panel-1 rounded-lg p-2 panel-depth"
            style={{ width: '160px' }}>  {/* Spec: 160px channel width */}

            {/* Deck label + Channel number */}
            <div className="flex items-center gap-1.5 select-none">
                {deck && (
                    <span className="text-[10px] font-mono font-black tracking-widest px-1 rounded"
                        style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                        {deck}
                    </span>
                )}
                <span className="text-xxs font-mono font-bold tracking-micro"
                    style={{ color: `${color}60` }}>
                    CH {channel}
                </span>
            </div>

            {/* Trim */}
            <Knob value={trim} onChange={setTrim} size={32} color={knobColor} label="TRIM" hasDetent />

            {/* 3-Band EQ */}
            <div className="flex flex-col gap-0.5 items-center">
                <Knob value={hi} onChange={setHi} size={28} color={knobColor} label="HI" hasDetent />
                <Knob value={mid} onChange={setMid} size={28} color={knobColor} label="MID" hasDetent />
                <Knob value={lo} onChange={setLo} size={28} color={knobColor} label="LO" hasDetent />
            </div>

            {/* Filter */}
            <Knob value={filter} onChange={setFilter} size={28} color={knobColor} label="FILTER" hasDetent />

            {/* FX Assign */}
            <button
                onClick={() => setFxAssign(!fxAssign)}
                className={cn(
                    "transport-btn !h-5 !w-full text-[8px] font-mono font-bold tracking-micro",
                    fxAssign
                        ? "text-white border"
                        : "text-zinc-600 border border-white/5 bg-panel-2"
                )}
                style={fxAssign ? { borderColor: `${color}50`, backgroundColor: `${color}15` } : undefined}
            >
                FX
            </button>

            {/* Fader + VU Meter */}
            <div className="flex items-stretch gap-1.5 flex-1 w-full px-1">
                {/* VU Meter */}
                <VUMeter level={meterLevel} className="w-2" />

                {/* Channel Fader */}
                <div className="flex-1 flex flex-col items-center relative">
                    <input
                        type="range"
                        min={0} max={100}
                        value={volume}
                        onChange={e => onVolumeChange(Number(e.target.value))}
                        className="w-full accent-white"
                        style={{
                            writingMode: 'vertical-lr',
                            direction: 'rtl',
                            height: '100%',
                            minHeight: '80px',
                        }}
                    />
                </div>

                {/* VU Meter (right) */}
                <VUMeter level={meterLevel * 0.95} className="w-2" />
            </div>

            {/* Volume readout */}
            <span className="text-xxs font-mono text-zinc-600 tabular-nums">{volume}</span>
        </div>
    );
};
