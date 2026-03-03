import React, { useRef, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface WaveformRailProps {
    playingA?: boolean;
    playingB?: boolean;
    posA?: number; // 0 to 1
    posB?: number; // 0 to 1
    reducedMotion?: boolean;
    className?: string;
}

interface CuePoint {
    pos: number; // 0 to 1
    color: string;
    label: string;
}

const MOCK_CUES_A: CuePoint[] = [
    { pos: 0.1, color: '#2ECC71', label: '1' },
    { pos: 0.35, color: '#F1C40F', label: '2' },
    { pos: 0.7, color: '#9B59B6', label: '3' },
];

const MOCK_CUES_B: CuePoint[] = [
    { pos: 0.2, color: '#3498DB', label: '1' },
    { pos: 0.55, color: '#E74C3C', label: '2' },
];

export const WaveformRail: React.FC<WaveformRailProps> = ({
    playingA = false,
    playingB = false,
    posA = 0.42,
    posB = 0.15,
    reducedMotion = false,
    className
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    // Generate static overview data for both decks
    const overviewData = useMemo(() => {
        const generateData = (seed: number) => {
            const data = [];
            for (let i = 0; i < 1000; i++) {
                const hash = ((i + seed) * 2654435761) >>> 0;
                const noise = (hash % 1000) / 1000;
                data.push(0.2 + noise * 0.6);
            }
            return data;
        };
        return {
            deckA: generateData(42),
            deckB: generateData(137)
        };
    }, []);

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
            }

            const w = canvas.width;
            const h = canvas.height;
            const laneH = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Draw lanes
            const drawLane = (deck: 'A' | 'B', yOffset: number, pos: number, cues: CuePoint[]) => {
                const data = deck === 'A' ? overviewData.deckA : overviewData.deckB;
                const color = deck === 'A' ? '#0091FF' : '#FF5500';
                const cy = yOffset + laneH / 2;

                // Lane BG
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(0, yOffset, w, laneH - 1);

                // Waveform
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.6;
                ctx.lineWidth = 1 * dpr;

                const step = w / data.length;
                for (let i = 0; i < data.length; i++) {
                    const x = i * step;
                    const amp = data[i] * (laneH * 0.4);
                    ctx.moveTo(x, cy - amp);
                    ctx.lineTo(x, cy + amp);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Played area shading
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.15;
                ctx.fillRect(0, yOffset, pos * w, laneH - 1);
                ctx.globalAlpha = 1;

                // Cues
                for (const cue of cues) {
                    const cx = cue.pos * w;
                    ctx.fillStyle = cue.color;
                    ctx.fillRect(cx - 1 * dpr, yOffset, 2 * dpr, laneH - 1);
                    
                    ctx.font = `${9 * dpr}px 'JetBrains Mono'`;
                    ctx.fillText(cue.label, cx + 4 * dpr, yOffset + 10 * dpr);
                }

                // Playhead
                const px = pos * w;
                ctx.shadowBlur = reducedMotion ? 0 : 8 * dpr;
                ctx.shadowColor = '#FFFFFF';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(px - 1 * dpr, yOffset, 2 * dpr, laneH - 1);
                ctx.shadowBlur = 0;
            };

            drawLane('A', 0, posA, MOCK_CUES_A);
            drawLane('B', laneH, posB, MOCK_CUES_B);

            // Redraw border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1 * dpr;
            ctx.strokeRect(0, 0, w, h);
            ctx.beginPath();
            ctx.moveTo(0, laneH);
            ctx.lineTo(w, laneH);
            ctx.stroke();

            if (!reducedMotion && (playingA || playingB)) {
                animationRef.current = requestAnimationFrame(render);
            }
        };

        render();

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, [overviewData, playingA, playingB, posA, posB, reducedMotion]);

    return (
        <div ref={containerRef} className={cn(
            "w-full h-12 bg-bg-base border border-white/5 overflow-hidden rounded-sm",
            className
        )}>
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute top-1 left-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest pointer-events-none">Overview</div>
        </div>
    );
};
