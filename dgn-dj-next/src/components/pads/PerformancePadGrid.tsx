import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface PerformancePadGridProps {
    deck: 'A' | 'B';
}

type PadMode = 'HOT CUE' | 'LOOP' | 'ROLL' | 'SLICER' | 'SAMPLER';

interface PadState {
    active: boolean;
    color: string;
    label: string;
}

/* Contextual labels per mode */
const PAD_LABELS: Record<PadMode, string[]> = {
    'HOT CUE': ['CUE 1', 'CUE 2', 'CUE 3', 'CUE 4', 'CUE 5', 'CUE 6', 'CUE 7', 'CUE 8'],
    'LOOP': ['1/4', '1/2', '1', '2', '4', '8', '16', '32'],
    'ROLL': ['1/16', '1/8', '1/4', '1/2', '1', '2', '4', '8'],
    'SLICER': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
    'SAMPLER': ['KCK', 'SNR', 'HH', 'CLP', 'FX1', 'FX2', 'VOX', 'PAD'],
};

export const PerformancePadGrid: React.FC<PerformancePadGridProps> = ({ deck }) => {
    const [mode, setMode] = useState<PadMode>('HOT CUE');
    const [pressedPad, setPressedPad] = useState<number | null>(null);

    const accentColor = deck === 'A' ? '#0091FF' : '#FF5500';
    const modes: PadMode[] = ['HOT CUE', 'LOOP', 'ROLL', 'SLICER', 'SAMPLER'];

    // Mock pad colors per mode
    const padColors: Record<PadMode, string[]> = {
        'HOT CUE': ['#2ECC71', '#E74C3C', '#3498DB', '#F1C40F', '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'],
        'LOOP': Array(8).fill(accentColor),
        'ROLL': ['#2ECC71', '#2ECC71', '#F1C40F', '#F1C40F', '#E67E22', '#E67E22', '#E74C3C', '#E74C3C'],
        'SLICER': Array(8).fill('#9B59B6'),
        'SAMPLER': ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#1ABC9C', '#9B59B6', '#FF6B6B'],
    };

    const labels = PAD_LABELS[mode];
    const pads: PadState[] = padColors[mode].map((color, i) => ({
        active: i < 4,
        color,
        label: labels[i],
    }));

    return (
        <div className="flex flex-col gap-2 p-2 bg-panel-1 rounded-lg panel-depth">
            {/* Mode Selector — 11px / 400 weight / caps */}
            <div className="flex gap-0.5">
                {modes.map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn(
                            "flex-1 py-1 rounded-sm font-mono font-normal transition-all uppercase",
                            "text-[11px] tracking-micro",  /* Spec: 11px 400 weight caps */
                            mode === m
                                ? "text-white bg-white/10 border border-white/15"
                                : "text-zinc-600 hover:text-zinc-400"
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* 2×4 Pad Grid — taller 68px pads with contextual labels */}
            <div className="grid grid-cols-4 gap-1.5">
                {pads.map((pad, i) => (
                    <button
                        key={i}
                        className={cn(
                            "bg-silicone-pad noise-grain relative overflow-hidden",
                            "flex flex-col items-center justify-center gap-0.5",
                            pressedPad === i && "transform! translate-y-0.5!"
                        )}
                        style={{
                            width: '56px',
                            height: '68px',
                            borderRadius: '6px',
                        }}
                        onMouseDown={() => setPressedPad(i)}
                        onMouseUp={() => setPressedPad(null)}
                        onMouseLeave={() => setPressedPad(null)}
                    >
                        {/* LED diffusion layer */}
                        <div
                            className="absolute inset-0 rounded-md transition-opacity"
                            style={{
                                background: pad.active
                                    ? `radial-gradient(circle at center, ${pad.color}${pressedPad === i ? 'DD' : '66'} 0%, transparent 70%)`
                                    : 'none',
                                /* LED bloom: 40% → 85% opacity on press in 100ms */
                                opacity: pressedPad === i ? 0.85 : pad.active ? 0.4 : 0,
                                transition: pressedPad === i ? 'opacity 100ms ease-out' : 'opacity 120ms ease-in',
                            }}
                        />

                        {/* Contextual label */}
                        <span className="relative text-[8px] font-mono font-bold tracking-micro text-white/50 select-none uppercase">
                            {pad.label}
                        </span>

                        {/* Pad number */}
                        <span className="relative text-[10px] font-mono text-white/30 select-none tabular-nums">
                            {i + 1}
                        </span>
                    </button>
                ))}
            </div>

            {/* Active mode description */}
            <div className="text-[8px] font-mono text-zinc-600 text-center tracking-micro uppercase">
                {mode === 'HOT CUE' && '8 HOT CUES • TAP TO SET'}
                {mode === 'LOOP' && 'BEAT LOOP • TAP SIZE'}
                {mode === 'ROLL' && 'BEAT ROLL • HOLD TO PLAY'}
                {mode === 'SLICER' && '8 SLICES • QUANTIZED'}
                {mode === 'SAMPLER' && 'SAMPLE DECK • VELOCITY'}
            </div>
        </div>
    );
};
