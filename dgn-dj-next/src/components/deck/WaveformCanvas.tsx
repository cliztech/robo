import React, { useEffect, useRef, useMemo } from 'react';

interface WaveformCanvasProps {
    deck: 'A' | 'B';
    playing?: boolean;
    className?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ deck, playing = false, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const offsetRef = useRef<number>(0);

    // Generate deterministic mock waveform data with frequency bands
    const waveformData = useMemo(() => {
        const data = [];
        const seed = deck === 'A' ? 42 : 137;
        for (let i = 0; i < 4000; i++) {
            // Pseudo-random seeded noise
            const hash = ((i + seed) * 2654435761) >>> 0;
            const noise = (hash % 1000) / 1000;

            const kick = (i % 32 < 4) ? 0.7 + noise * 0.3 : 0;
            const snare = (i % 32 > 14 && i % 32 < 18) ? 0.4 + noise * 0.4 : 0;
            const hihat = (i % 8 < 2) ? 0.15 + noise * 0.25 : noise * 0.05;
            const pad = Math.sin(i / 50) * 0.2 + 0.2;

            // Phrase-level dynamics (32-bar phrases)
            const phrasePos = (i % 512) / 512;
            const isBreakdown = phrasePos > 0.75 && phrasePos < 0.88;
            const isDrop = phrasePos < 0.06;
            const energyMult = isBreakdown ? 0.3 + phrasePos * 0.3 : 1.0;

            // Transient spike clarity: sharpen kick transients
            const transientBoost = (i % 32 < 2) ? 1.15 : 1.0;

            data.push({
                low: Math.min(1, kick * energyMult * transientBoost),
                mid: Math.min(1, (snare + pad) * energyMult),
                high: Math.min(1, hihat * energyMult),
                isDownbeat: i % 32 === 0,
                isBeat: i % 8 === 0,
                isPhraseStart: i % 256 === 0,
                energy: energyMult,
                isBreakdown,
                isDrop,
            });
        }
        return data;
    }, [deck]);

    // Cue points
    const cuePoints = useMemo(() => deck === 'A' ? [
        { position: 120, color: '#2ECC71', label: '1' },
        { position: 340, color: '#F1C40F', label: '2' },
        { position: 680, color: '#9B59B6', label: '3' },
        { position: 1200, color: '#E67E22', label: '4' },
    ] : [
        { position: 200, color: '#3498DB', label: '1' },
        { position: 500, color: '#E74C3C', label: '2' },
        { position: 900, color: '#1ABC9C', label: '3' },
    ], [deck]);

    const deckColors = deck === 'A'
        ? { low: '#1a4a7a', mid: '#2277bb', high: '#55aaee', phrase: 'rgba(0,145,255,0.08)' }
        : { low: '#7a3a1a', mid: '#bb5522', high: '#ee8844', phrase: 'rgba(255,85,0,0.08)' };

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
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // L1: Background
            ctx.fillStyle = '#0F1216';
            ctx.fillRect(0, 0, w, h);

            // Waveform bars
            const barWidth = 2 * dpr;
            const gap = 1 * dpr;
            const totalBarWidth = barWidth + gap;
            const barsToDraw = Math.ceil(w / totalBarWidth);

            if (playing) {
                offsetRef.current += 0.5;
            }

            const startIdx = Math.floor(offsetRef.current);
            const subPixelOffset = (offsetRef.current % 1) * totalBarWidth;

            for (let i = 0; i < barsToDraw + 1; i++) {
                const dataIdx = (startIdx + i) % waveformData.length;
                const d = waveformData[dataIdx];
                const x = (i * totalBarWidth) - subPixelOffset;

                // L4: Phrase shading (overlay blend 12%)
                if (d.isBreakdown) {
                    ctx.fillStyle = 'rgba(255,255,255,0.025)';
                    ctx.fillRect(x, 0, totalBarWidth, h);
                }
                if (d.isDrop) {
                    ctx.fillStyle = deckColors.phrase;
                    ctx.fillRect(x, 0, totalBarWidth, h);
                }

                // L3: Beat grid (multiply blend at 70%)
                if (d.isBeat) {
                    if (d.isPhraseStart) {
                        ctx.fillStyle = 'rgba(255,255,255,0.15)';
                        ctx.fillRect(x, 0, 2 * dpr, h);
                    } else if (d.isDownbeat) {
                        ctx.fillStyle = 'rgba(255,255,255,0.08)';
                        ctx.fillRect(x, 0, 1.5 * dpr, h);
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.03)';
                        ctx.fillRect(x, 0, 0.5 * dpr, h);
                    }
                }

                // L1+L2: RGB frequency separation with dynamic normalization
                const maxAmp = h * 0.42;
                const normFactor = 0.85 + d.energy * 0.15; // Dynamic amplitude normalization

                const lowAmp = d.low * maxAmp * 0.55 * normFactor;
                const midAmp = d.mid * maxAmp * 0.35 * normFactor;
                const highAmp = d.high * maxAmp * 0.25 * normFactor;

                // Low (innermost)
                ctx.fillStyle = deckColors.low;
                ctx.fillRect(x, cy - lowAmp, barWidth, lowAmp * 2);

                // Mid (layered)
                ctx.fillStyle = deckColors.mid;
                ctx.fillRect(x, cy - lowAmp - midAmp, barWidth, midAmp);
                ctx.fillRect(x, cy + lowAmp, barWidth, midAmp);

                // High (outermost)
                ctx.fillStyle = deckColors.high;
                ctx.fillRect(x, cy - lowAmp - midAmp - highAmp, barWidth, highAmp);
                ctx.fillRect(x, cy + lowAmp + midAmp, barWidth, highAmp);
            }

            // L5: Energy prediction strip (top 4px)
            const stripH = 4 * dpr;
            for (let i = 0; i < barsToDraw + 1; i++) {
                const dataIdx = (startIdx + i + 200) % waveformData.length; // look-ahead 200 bars
                const d = waveformData[dataIdx];
                const x = (i * totalBarWidth) - subPixelOffset;
                const totalEnergy = (d.low + d.mid + d.high) / 3;
                ctx.fillStyle = totalEnergy > 0.5
                    ? `rgba(${deck === 'A' ? '0,145,255' : '255,85,0'},${totalEnergy * 0.3})`
                    : `rgba(255,255,255,${totalEnergy * 0.08})`;
                ctx.fillRect(x, 0, barWidth, stripH);
            }

            // Cue point markers
            for (const cue of cuePoints) {
                const cueScreenPos = ((cue.position - startIdx) * totalBarWidth) - subPixelOffset;
                if (cueScreenPos > 0 && cueScreenPos < w) {
                    ctx.fillStyle = cue.color;
                    ctx.globalAlpha = 0.85;
                    // Triangle marker
                    ctx.beginPath();
                    ctx.moveTo(cueScreenPos - 5 * dpr, 0);
                    ctx.lineTo(cueScreenPos + 5 * dpr, 0);
                    ctx.lineTo(cueScreenPos, 10 * dpr);
                    ctx.fill();
                    // Label
                    ctx.font = `bold ${9 * dpr}px 'Inter', sans-serif`;
                    ctx.fillText(cue.label, cueScreenPos - 3 * dpr, 20 * dpr);
                    // Vertical line
                    ctx.globalAlpha = 0.25;
                    ctx.fillRect(cueScreenPos - 0.5 * dpr, 0, 1 * dpr, h);
                    ctx.globalAlpha = 1;
                }
            }

            // Playhead
            const playheadX = w / 2;
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(255,255,255,0.6)';
            ctx.shadowBlur = 6 * dpr;
            ctx.fillRect(playheadX - 0.75 * dpr, 0, 1.5 * dpr, h);
            ctx.shadowBlur = 0;

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [deck, playing, deckColors, waveformData, cuePoints]);

    return (
        <div ref={containerRef} className={`w-full h-full relative overflow-hidden bg-bg-base ${className || ''}`}>
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};
