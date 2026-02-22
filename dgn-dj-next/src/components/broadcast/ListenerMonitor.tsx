import { useState, useEffect, useCallback, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   ListenerMonitor — Live Audience Analytics
   Agent: Listener Analytics Agent (Team 11) + UI/UX Agent (Team 3)
   ───────────────────────────────────────────────────────────── */

interface ListenerMonitorProps {
    className?: string;
}

// Generate realistic-looking listener data
function generateHistory(len: number): number[] {
    const data: number[] = [];
    let val = 180 + Math.random() * 60;
    for (let i = 0; i < len; i++) {
        val += (Math.random() - 0.48) * 15;
        val = Math.max(40, Math.min(400, val));
        data.push(Math.round(val));
    }
    return data;
}

export default function ListenerMonitor({ className = '' }: ListenerMonitorProps) {
    const [history] = useState(() => generateHistory(30));
    const [current, setCurrent] = useState(history[history.length - 1]);
    const peakVal = Math.max(...history);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawSparkline = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const min = Math.min(...history) * 0.85;
        const max = Math.max(...history) * 1.05;
        const range = max - min || 1;
        const stepX = w / (history.length - 1);

        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(0, 145, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 145, 255, 0.01)');

        // Area fill
        ctx.beginPath();
        ctx.moveTo(0, h);
        history.forEach((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / range) * h;
            if (i === 0) ctx.lineTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        history.forEach((v, i) => {
            const x = i * stepX;
            const y = h - ((v - min) / range) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#0091FF';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Current value dot
        const lastX = (history.length - 1) * stepX;
        const lastY = h - ((history[history.length - 1] - min) / range) * h;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#0091FF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 145, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }, [history]);

    useEffect(() => {
        drawSparkline();
    }, [drawSparkline]);

    // Simulate slight fluctuation
    useEffect(() => {
        const iv = setInterval(() => {
            setCurrent(prev => {
                const next = prev + Math.round((Math.random() - 0.48) * 5);
                return Math.max(1, next);
            });
        }, 3000);
        return () => clearInterval(iv);
    }, []);

    const avgListeners = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

    return (
        <div className={`bg-panel-2/60 rounded-md border border-white/5 ${className}`}
            style={{ backdropFilter: 'blur(8px)' }}>
            <div className="flex items-start gap-3 px-3 py-2">
                {/* ── Left: Big number + stats ── */}
                <div className="shrink-0">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[26px] font-bold text-white tabular-nums leading-none"
                            style={{ textShadow: '0 0 12px rgba(0, 145, 255, 0.4)' }}>
                            {current}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono uppercase tracking-wider">listeners</span>
                    </div>

                    {/* Sub-stats row */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-white/40 font-mono">
                            <span className="text-meter-green">↑</span> {peakVal}
                            <span className="text-white/25 ml-0.5">peak</span>
                        </span>
                        <span className="text-white/10 text-[8px]">│</span>
                        <span className="text-[9px] text-white/40 font-mono">
                            ø {avgListeners}
                            <span className="text-white/25 ml-0.5">avg</span>
                        </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1 mt-1.5">
                        <span className="stream-badge" style={{ background: 'rgba(0, 145, 255, 0.12)', color: '#0091FF' }}>
                            🔵 {Math.round(current * 0.72)} unique
                        </span>
                        <span className="stream-badge" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' }}>
                            ↩ {Math.round(current * 0.28)} return
                        </span>
                    </div>
                </div>

                {/* ── Right: Sparkline ── */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] text-white/25 font-mono uppercase tracking-wider">30min trend</span>
                        <span className="text-[8px] text-white/25 font-mono">
                            {current > avgListeners
                                ? <span className="text-meter-green">▲ +{current - avgListeners}</span>
                                : <span className="text-meter-red">▼ {current - avgListeners}</span>}
                        </span>
                    </div>
                    <canvas ref={canvasRef} className="w-full animate-spark-fade" style={{ height: '48px' }} />
                </div>
            </div>
        </div>
    );
}
