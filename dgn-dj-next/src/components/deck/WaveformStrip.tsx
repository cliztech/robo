import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { cn } from '../../lib/utils';

interface WaveformStripProps {
    playingA: boolean;
    playingB: boolean;
}

type PhaseState = 'aligned' | 'drift' | 'misaligned';

/* Section labels (simulated — real DAW would derive from audio analysis) */
const SECTIONS_A = [
    { label: 'INTRO', color: '#3498DB', left: '2%', width: '12%' },
    { label: 'VERSE', color: '#2ECC71', left: '14%', width: '20%' },
    { label: 'CHORUS', color: '#E67E22', left: '34%', width: '18%' },
    { label: 'DROP', color: '#E74C3C', left: '52%', width: '22%' },
    { label: 'OUTRO', color: '#9B59B6', left: '74%', width: '16%' },
];
const SECTIONS_B = [
    { label: 'INTRO', color: '#3498DB', left: '2%', width: '15%' },
    { label: 'BUILD', color: '#F1C40F', left: '17%', width: '18%' },
    { label: 'DROP', color: '#E74C3C', left: '35%', width: '25%' },
    { label: 'BREAK', color: '#1ABC9C', left: '60%', width: '15%' },
    { label: 'OUTRO', color: '#9B59B6', left: '75%', width: '15%' },
];

export const WaveformStrip: React.FC<WaveformStripProps> = ({ playingA, playingB }) => {
    const [zoomLevel, setZoomLevel] = useState(4);
    const [gridSnap, setGridSnap] = useState(true);
    const [phaseState, setPhaseState] = useState<PhaseState>('aligned');
    const phaseRef = useRef<number>(0);

    // Compute phase state inside setInterval callback (not synchronously in effect body)
    const computePhase = useCallback(() => {
        phaseRef.current = phaseRef.current + Math.random() * 0.3 - 0.1;
        const abs = Math.abs(phaseRef.current);
        if (abs < 0.5) return 'aligned' as const;
        if (abs < 1.5) return 'drift' as const;
        return 'misaligned' as const;
    }, []);

    useEffect(() => {
        if (!playingA || !playingB) {
            // Reset ref on stop; state will update on next tick
            phaseRef.current = 0;
            const t = setTimeout(() => setPhaseState('aligned'), 0);
            return () => clearTimeout(t);
        }
        const interval = setInterval(() => {
            setPhaseState(computePhase());
        }, 200);
        return () => clearInterval(interval);
    }, [playingA, playingB, computePhase]);

    const phaseColor = {
        aligned: 'bg-meter-green',
        drift: 'bg-meter-yellow',
        misaligned: 'bg-meter-red',
    };

    const phaseGlow = {
        aligned: 'shadow-[0_0_6px_rgba(46,204,113,0.4)]',
        drift: 'shadow-[0_0_6px_rgba(241,196,15,0.4)]',
        misaligned: 'shadow-[0_0_6px_rgba(229,72,72,0.4)]',
    };

    const zoomLevels = [1, 2, 4, 8, 16, 32];

    return (
        <div className="flex flex-col bg-panel-1 border-b border-white/5" style={{ height: 'var(--layout-waveform-h)' }}>
            {/* Info Bar (60px) */}
            <div className="h-[60px] shrink-0 flex items-center justify-between px-4 border-b border-white/5">
                {/* Deck A info */}
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-deck-a" />
                    <span className="text-xs font-mono text-zinc-400 tracking-micro">DECK A</span>
                    <span className="text-xs font-mono text-zinc-600 tabular-nums">BAR 83.1</span>
                </div>

                {/* Center: Phrase position */}
                <div className="flex items-center gap-2">
                    <span className="text-xxs font-mono text-zinc-600 tracking-widest uppercase">PHRASE</span>
                    <div className="flex gap-0.5">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={cn(
                                "w-1.5 h-3 rounded-[1px]",
                                i < 7 ? "bg-primary-accent/50" : "bg-white/5"
                            )} />
                        ))}
                    </div>
                </div>

                {/* Deck B info */}
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-600 tabular-nums">BAR 17.1</span>
                    <span className="text-xs font-mono text-zinc-400 tracking-micro">DECK B</span>
                    <div className="w-2 h-2 rounded-full bg-deck-b" />
                </div>
            </div>

            {/* Waveforms + Phase Indicator */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Deck A Waveform */}
                <div className="flex-1 relative min-h-0">
                    <WaveformCanvas deck="A" playing={playingA} />
                    {/* Deck label overlay */}
                    <div className="absolute top-2 left-3 text-xxs font-mono text-deck-a/40 tracking-widest">A</div>
                    {/* Section labels */}
                    <div className="absolute bottom-0 left-0 right-0 h-3 pointer-events-none">
                        {SECTIONS_A.map(s => (
                            <div key={s.label} className="section-label absolute bottom-0"
                                style={{ left: s.left, width: s.width, backgroundColor: `${s.color}20`, color: s.color, borderBottom: `2px solid ${s.color}` }}>
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* L6: Phase Alignment Indicator (24px) */}
                <div className="h-6 shrink-0 flex items-center justify-center relative z-10">
                    <div className="absolute inset-0 bg-bg-base" />
                    <div className={cn(
                        "relative w-6 h-3 rounded-full transition-all duration-150",
                        phaseColor[phaseState],
                        phaseGlow[phaseState]
                    )} />
                    <span className="relative ml-2 text-xxs font-mono text-zinc-600 tracking-micro uppercase">
                        {phaseState === 'aligned' ? 'SYNC' : phaseState === 'drift' ? 'DRIFT' : 'OFF'}
                    </span>
                </div>

                {/* Deck B Waveform */}
                <div className="flex-1 relative min-h-0">
                    <WaveformCanvas deck="B" playing={playingB} />
                    <div className="absolute top-2 left-3 text-xxs font-mono text-deck-b/40 tracking-widest">B</div>
                    {/* Section labels */}
                    <div className="absolute top-0 left-0 right-0 h-3 pointer-events-none">
                        {SECTIONS_B.map(s => (
                            <div key={s.label} className="section-label absolute top-0"
                                style={{ left: s.left, width: s.width, backgroundColor: `${s.color}20`, color: s.color, borderTop: `2px solid ${s.color}` }}>
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zoom Control Strip (72px) */}
            <div className="h-[72px] shrink-0 flex items-center justify-between px-4 border-t border-white/5">
                {/* Zoom selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xxs font-mono text-zinc-600 tracking-micro">ZOOM</span>
                    <div className="flex gap-0.5">
                        {zoomLevels.map(z => (
                            <button
                                key={z}
                                onClick={() => setZoomLevel(z)}
                                className={cn(
                                    "px-2 py-1 text-xxs font-mono rounded transition-all",
                                    zoomLevel === z
                                        ? "text-white bg-white/10 border border-white/15"
                                        : "text-zinc-600 hover:text-zinc-400"
                                )}
                            >
                                {z}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid snap toggle */}
                <button
                    onClick={() => setGridSnap(!gridSnap)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded text-xxs font-mono transition-all",
                        gridSnap
                            ? "text-primary-accent border border-primary-accent/30 bg-primary-accent/5"
                            : "text-zinc-600 border border-white/5 hover:text-zinc-400"
                    )}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-60">
                        <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
                        <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="0.5" />
                        <line x1="10" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    GRID SNAP
                </button>

                {/* Beat Jump */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xxs font-mono text-zinc-600 tracking-micro">JUMP</span>
                    {[2, 4, 8, 16, 32].map(b => (
                        <button key={b}
                            className="px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 hover:text-white hover:bg-white/8 rounded transition-colors">
                            ×{b}
                        </button>
                    ))}
                </div>

                {/* Waveform color mode */}
                <div className="flex items-center gap-2">
                    <span className="text-xxs font-mono text-zinc-600 tracking-micro">RGB FREQ</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#1a4a7a]" />
                        <div className="w-2 h-2 rounded-full bg-[#2277bb]" />
                        <div className="w-2 h-2 rounded-full bg-[#55aaee]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
