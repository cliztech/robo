import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export const TopNavBar: React.FC = () => {
    // Simulated system metrics
    const [headroom, setHeadroom] = useState(0.72);
    const [clock, setClock] = useState(() =>
        new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    );
    const [cpu, setCpu] = useState(28);
    const [mem, setMem] = useState(42);
    const [latency, setLatency] = useState(4.2);
    const [masterLevels, setMasterLevels] = useState([60, 75, 85, 70, 55, 40, 30]);
    const [deckABpm] = useState(128.00);
    const [deckBBpm] = useState(126.50);

    useEffect(() => {
        const interval = setInterval(() => {
            setClock(new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
            // Simulate headroom fluctuation
            setHeadroom(prev => {
                const delta = (Math.random() - 0.5) * 0.08;
                return Math.max(0.3, Math.min(0.95, prev + delta));
            });
            // Simulate CPU/MEM
            setCpu(prev => Math.max(8, Math.min(95, prev + (Math.random() - 0.45) * 6)));
            setMem(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 2)));
            // Simulate latency
            setLatency(prev => Math.max(1.5, Math.min(12, prev + (Math.random() - 0.5) * 1.5)));
            // Animate master levels
            setMasterLevels(prev => prev.map(v => {
                const delta = (Math.random() - 0.4) * 18;
                return Math.max(10, Math.min(95, v + delta));
            }));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const headroomColor = headroom > 0.85 ? '#E54848' : headroom > 0.7 ? '#F1C40F' : '#2ECC71';
    const cpuColor = cpu > 80 ? '#E54848' : cpu > 50 ? '#F1C40F' : '#2ECC71';
    const memColor = mem > 70 ? '#F1C40F' : '#2ECC71';
    const latColor = latency > 8 ? '#E54848' : latency > 5 ? '#F1C40F' : '#2ECC71';
    const tempoDiff = Math.abs(deckABpm - deckBBpm).toFixed(2);

    return (
        <div className="bg-panel-1 border-b border-white/5 flex flex-col shrink-0"
            style={{ height: 'var(--layout-nav-h)', minHeight: '44px' }}>

            {/* Headroom Monitor — 2px strip above nav */}
            <div className="h-[2px] w-full relative">
                <div
                    className="absolute inset-y-0 left-0 transition-all duration-500"
                    style={{
                        width: `${headroom * 100}%`,
                        backgroundColor: headroomColor,
                        boxShadow: `0 0 4px ${headroomColor}40`,
                    }}
                />
            </div>

            {/* Main Nav */}
            <div className="flex-1 flex items-center justify-between px-4">
                {/* Left: Branding */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-tight text-white">
                        DGN-DJ <span className="text-primary-accent">Studio</span>
                        <span className="text-xxs text-zinc-500 ml-0.5">™</span>
                    </span>
                    <div className="w-px h-5 bg-white/10" />
                    <span className="text-xxs text-zinc-500 font-mono uppercase tracking-widest">Performance</span>
                </div>

                {/* Center: Engine Status + System Gauges */}
                <div className="flex items-center gap-4">
                    {/* Engine Status Orb */}
                    <div className="flex items-center gap-1.5">
                        <div
                            className="rounded-full animate-orb-pulse"
                            style={{
                                width: '8px', height: '8px',
                                backgroundColor: '#2ECC71',
                                boxShadow: '0 0 6px rgba(46,204,113,0.5)',
                            }}
                        />
                        <span className="text-xxs text-zinc-400 font-mono tracking-micro">ENGINE</span>
                    </div>

                    <div className="w-px h-4 bg-white/8" />

                    {/* CPU Gauge */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-zinc-500 font-mono tracking-micro">CPU</span>
                        <div className="gauge-bar" style={{ width: '36px' }}>
                            <div className="gauge-bar-fill" style={{ width: `${cpu}%`, backgroundColor: cpuColor }} />
                        </div>
                        <span className="text-[9px] font-mono tabular-nums" style={{ color: cpuColor }}>{Math.round(cpu)}%</span>
                    </div>

                    {/* MEM Gauge */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-zinc-500 font-mono tracking-micro">MEM</span>
                        <div className="gauge-bar" style={{ width: '36px' }}>
                            <div className="gauge-bar-fill" style={{ width: `${mem}%`, backgroundColor: memColor }} />
                        </div>
                        <span className="text-[9px] font-mono tabular-nums" style={{ color: memColor }}>{Math.round(mem)}%</span>
                    </div>

                    {/* Latency */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-zinc-500 font-mono tracking-micro">LAT</span>
                        <span className="text-[9px] font-mono tabular-nums" style={{ color: latColor }}>{latency.toFixed(1)}ms</span>
                    </div>

                    <div className="w-px h-4 bg-white/8" />

                    {/* Tempo Difference */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-deck-a tabular-nums">{deckABpm.toFixed(2)}</span>
                        <span className={cn(
                            "text-[9px] font-mono font-bold tabular-nums px-1 rounded",
                            Number(tempoDiff) < 0.5 ? "text-meter-green bg-meter-green/10" :
                                Number(tempoDiff) < 2 ? "text-meter-yellow bg-meter-yellow/10" :
                                    "text-meter-red bg-meter-red/10"
                        )}>
                            Δ{tempoDiff}
                        </span>
                        <span className="text-[9px] font-mono text-deck-b tabular-nums">{deckBBpm.toFixed(2)}</span>
                    </div>

                    <div className="w-px h-4 bg-white/8" />

                    <span className="text-xxs text-zinc-600 font-mono tracking-micro">APE THE BASS™</span>
                </div>

                {/* Right: Master Meter + Clock */}
                <div className="flex items-center gap-4">
                    {/* Animated Master Meter */}
                    <div className="flex items-center gap-1">
                        <span className="text-xxs text-zinc-500 font-mono tracking-micro">MST</span>
                        <div className="flex gap-px items-end h-4">
                            {masterLevels.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-1 rounded-[1px] transition-all duration-200",
                                        h > 80 ? "bg-meter-red" : h > 60 ? "bg-meter-yellow" : "bg-meter-green"
                                    )}
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="w-px h-5 bg-white/10" />
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">{clock}</span>
                </div>
            </div>
        </div>
    );
};
