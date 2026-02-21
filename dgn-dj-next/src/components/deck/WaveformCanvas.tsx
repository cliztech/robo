import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface WaveformCanvasProps {
    deck: 'A' | 'B';
    playing?: boolean;
    className?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ deck, playing = false, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const offsetRef = useRef<number>(0);

    // Generate deterministic mock waveform data
    const waveformData = useMemo(() => {
        const data = [];
        for (let i = 0; i < 2000; i++) {
            // Create a beat pattern
            let amp = Math.random() * 0.5;
            if (i % 30 < 5) amp *= 3; // Kick drum simulation
            if (i % 60 > 40) amp *= 0.5; // Quiet part
            data.push(Math.min(1.0, amp));
        }
        return data;
    }, []);

    const primaryColor = deck === 'A' ? '#007AFF' : '#FF5500';
    const secondaryColor = deck === 'A' ? '#001F4D' : '#331100';

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Handle Resize
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();

            // Update canvas size if changed
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                // ctx.scale(dpr, dpr); // Not needed if we calculate manually, but good for primitives
            }

            const w = canvas.width;
            const h = canvas.height;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Draw Grid/Background
            ctx.fillStyle = secondaryColor;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1.0;

            // Draw Waveform
            const barWidth = 3 * dpr;
            const gap = 1 * dpr;
            const totalBarWidth = barWidth + gap;
            const barsToDraw = Math.ceil(w / totalBarWidth);

            // Increment offset if playing
            if (playing) {
                offsetRef.current += 0.5; // Speed
            }

            const startIdx = Math.floor(offsetRef.current);
            const subPixelOffset = (offsetRef.current % 1) * totalBarWidth;

            for (let i = 0; i < barsToDraw + 1; i++) {
                const dataIdx = (startIdx + i) % waveformData.length;
                const amp = waveformData[dataIdx] * (h * 0.45);

                const x = (i * totalBarWidth) - subPixelOffset;

                // Gradient
                const g = ctx.createLinearGradient(0, cy - amp, 0, cy + amp);
                g.addColorStop(0, primaryColor);
                g.addColorStop(0.5, '#ffffff');
                g.addColorStop(1, primaryColor);

                ctx.fillStyle = g;

                // Draw Bar
                ctx.fillRect(x, cy - amp, barWidth, amp * 2);

                // Reflection line
                // ctx.fillStyle = 'rgba(255,255,255,0.1)';
                // ctx.fillRect(x, cy, barWidth, h/2);
            }

            // Draw Playhead Line
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.fillRect((w / 2) - 1, 0, 2 * dpr, h);
            ctx.shadowBlur = 0;

            animationRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, [deck, playing, primaryColor, secondaryColor, waveformData]);

    return (
        <div ref={containerRef} className={cn("w-full h-full relative overflow-hidden bg-black", className)}>
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />
        </div>
    );
};
