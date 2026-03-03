'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Gauge,
    TrendingDown,
    TrendingUp,
    Minus,
    Users,
    Wifi,
    Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DegenAIHost } from '../ai/DegenAIHost';
import { DegenBeatGrid } from '../audio/DegenBeatGrid';
import { DegenEffectRack } from '../audio/DegenEffectRack';
import { DegenWaveform } from '../audio/DegenWaveform';
import { DegenScheduleTimeline } from '../schedule/DegenScheduleTimeline';
import { DeckPanel } from './deck-panel';
import { WaveformRail } from './waveform-rail';

export function DecksView() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <DeckPanel label="Deck A" color="#aaff00" bpm="128.0" musicalKey="Am" isActive={true}>
                    <DegenWaveform
                        progress={0.42}
                        duration={234}
                        trackTitle="Neural Drift v2.1 — SynthKong"
                        isPlaying
                        cuePoints={[
                            { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                            { position: 0.68, label: 'DROP', color: '#bf00ff' },
                        ]}
                    />
                    <DegenEffectRack
                        title="FX Bank A"
                        deck="A"
                        isActive
                        controls={[
                            { key: 'reverb', label: 'Reverb', unit: '%' },
                            { key: 'delay', label: 'Delay', unit: 'ms', max: 500 },
                            { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                            { key: 'filter', label: 'Filter', unit: 'Hz', max: 20000 },
                            { key: 'drive', label: 'Drive', unit: '%' },
                        ]}
                    />
                </DeckPanel>

                <DeckPanel label="Deck B" color="#9933ff" bpm="140.0" musicalKey="Fm" isActive={false}>
                    <DegenWaveform
                        progress={0.15}
                        duration={198}
                        trackTitle="Bass Gorilla — DJ DegenApe"
                        isPlaying={false}
                        cuePoints={[
                            { position: 0.08, label: 'INTRO', color: '#3b82f6' },
                            { position: 0.52, label: 'BUILD', color: '#bf00ff' },
                        ]}
                    />
                    <DegenEffectRack
                        title="FX Bank B"
                        deck="B"
                        isActive={false}
                        controls={[
                            { key: 'chorus', label: 'Chorus', unit: '%' },
                            { key: 'phaser', label: 'Phaser', unit: '%' },
                            { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                            { key: 'flanger', label: 'Flanger', unit: '%' },
                            { key: 'bitcrush', label: 'Crush', unit: 'bit', max: 16 },
                        ]}
                    />
                </DeckPanel>
            </div>

            <div className="glass-panel">
                <div className="panel-header">
                    <span className="panel-header-title">Beat Sequencer</span>
                </div>
                <div className="p-3">
                    <DegenBeatGrid decks={4} steps={16} />
                </div>
            </div>
        </div>
    );
}

type StatCardProps = {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    color?: 'lime' | 'purple' | 'cyan' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'stable';
    sparkline?: number[];
    delay?: number;
};

function StatCard({ label, value, unit, icon: Icon, color = 'lime', trend, sparkline, delay = 0 }: StatCardProps) {
    const colorMap = {
        lime: {
            gradient: 'from-lime-500/8 via-lime-500/3 to-transparent',
            border: 'border-lime-500/15',
            icon: 'text-lime-500/70',
            glow: 'shadow-[0_0_20px_rgba(170,255,0,0.04)]',
            spark: '#aaff00',
        },
        purple: {
            gradient: 'from-purple-500/8 via-purple-500/3 to-transparent',
            border: 'border-purple-500/15',
            icon: 'text-purple-500/70',
            glow: 'shadow-[0_0_20px_rgba(153,51,255,0.04)]',
            spark: '#9933ff',
        },
        cyan: {
            gradient: 'from-cyan-500/8 via-cyan-500/3 to-transparent',
            border: 'border-cyan-500/15',
            icon: 'text-cyan-500/70',
            glow: 'shadow-[0_0_20px_rgba(0,191,255,0.04)]',
            spark: '#00bfff',
        },
        orange: {
            gradient: 'from-orange-500/8 via-orange-500/3 to-transparent',
            border: 'border-orange-500/15',
            icon: 'text-orange-500/70',
            glow: 'shadow-[0_0_20px_rgba(255,107,0,0.04)]',
            spark: '#ff6b00',
        },
        red: {
            gradient: 'from-red-500/8 via-red-500/3 to-transparent',
            border: 'border-red-500/15',
            icon: 'text-red-500/70',
            glow: 'shadow-[0_0_20px_rgba(239,68,68,0.04)]',
            spark: '#ef4444',
        },
    };

    const c = colorMap[color];
    const defaultSparkline = [30, 45, 38, 52, 48, 60, 55, 70, 65, 75, 72, 80];
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-lime-500' : trend === 'down' ? 'text-red-400' : 'text-zinc-600';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
                'relative overflow-hidden rounded-xl border p-4',
                'bg-gradient-to-br',
                c.gradient,
                c.border,
                c.glow,
                'hover:scale-[1.02] hover:shadow-lg transition-all duration-300'
            )}
        >
            <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Icon size={13} className={c.icon} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-white tabular-nums tracking-tight">{value}</span>
                        {unit && <span className="text-[10px] font-medium text-zinc-500">{unit}</span>}
                    </div>
                </div>
                {trend && (
                    <div className={cn('flex items-center gap-0.5 mt-1', trendColor)}>
                        <TrendIcon size={10} />
                    </div>
                )}
            </div>

            <div className="relative z-10 mt-3 h-6">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id={`spark-fill-${label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c.spark} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={c.spark} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M 0 30 ${(sparkline || defaultSparkline)
                            .map(
                                (v, i, arr) =>
                                    `L ${(i / (arr.length - 1)) * 100} ${30 - (v / 100) * 28}`
                            )
                            .join(' ')} L 100 30 Z`}
                        fill={`url(#spark-fill-${label})`}
                    />
                    <polyline
                        points={(sparkline || defaultSparkline)
                            .map((v, i, arr) => `${(i / (arr.length - 1)) * 100},${30 - (v / 100) * 28}`)
                            .join(' ')}
                        fill="none"
                        stroke={c.spark}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="sparkline-animate"
                        opacity="0.5"
                    />
                </svg>
            </div>
        </motion.div>
    );
}

type SectionHeaderProps = {
    children: React.ReactNode;
};

function SectionHeader({ children }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{children}</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
        </div>
    );
}

export function DashboardView() {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
            );
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="space-y-5">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Station <span className="glow-text text-lime-400">Overview</span>
                    </h1>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Live monitoring · All systems nominal</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">{currentTime}</div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">Local Time</div>
                </div>
            </motion.div>

            <div className="grid grid-cols-5 gap-3">
                <StatCard
                    label="Uptime"
                    value="99.8"
                    unit="%"
                    icon={Activity}
                    color="lime"
                    trend="stable"
                    sparkline={[95, 96, 98, 97, 99, 99, 100, 99, 100, 100, 99, 100]}
                />
                <StatCard
                    label="Listeners"
                    value="1,247"
                    icon={Users}
                    color="purple"
                    trend="up"
                    sparkline={[40, 45, 55, 60, 58, 70, 75, 80, 85, 82, 90, 95]}
                    delay={0.05}
                />
                <StatCard
                    label="Latency"
                    value="12"
                    unit="ms"
                    icon={Gauge}
                    color="cyan"
                    trend="down"
                    sparkline={[40, 35, 30, 28, 25, 22, 20, 18, 15, 14, 13, 12]}
                    delay={0.1}
                />
                <StatCard
                    label="Stream"
                    value="320"
                    unit="kbps"
                    icon={Wifi}
                    color="lime"
                    trend="stable"
                    sparkline={[80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80]}
                    delay={0.15}
                />
                <StatCard
                    label="AI Load"
                    value="34"
                    unit="%"
                    icon={Zap}
                    color="orange"
                    trend="up"
                    sparkline={[15, 20, 25, 22, 30, 28, 35, 32, 38, 36, 35, 34]}
                    delay={0.2}
                />
            </div>

            <SectionHeader>Now Playing</SectionHeader>

            <div className="grid grid-cols-[1fr_340px] gap-4">
                <div className="space-y-4">
                    <WaveformRail
                        title="Master Output"
                        statusLabel="AAC 320k"
                        progress={0.42}
                        duration={234}
                        trackTitle="Neural Drift v2.1 — SynthKong"
                        isPlaying={true}
                        cuePoints={[
                            { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                            { position: 0.68, label: 'DROP', color: '#bf00ff' },
                        ]}
                    />

                    <SectionHeader>On-Air Schedule</SectionHeader>
                    <DegenScheduleTimeline />
                </div>

                <div className="space-y-4">
                    <DegenAIHost className="glass-panel" />
                </div>
            </div>

            <SectionHeader>Audio Engine</SectionHeader>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel overflow-hidden">
                    <div className="panel-header">
                        <span className="panel-header-title">Beat Sequencer</span>
                    </div>
                    <div className="p-3">
                        <DegenBeatGrid decks={4} steps={16} />
                    </div>
                </div>
                <DegenEffectRack
                    title="Master FX"
                    deck="MST"
                    isActive
                    controls={[
                        { key: 'reverb', label: 'Reverb', unit: '%' },
                        { key: 'comp', label: 'Comp', unit: 'dB', max: 30 },
                        { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                        { key: 'limit', label: 'Limiter', unit: 'dB', max: 0 },
                        { key: 'width', label: 'Stereo', unit: '%' },
                    ]}
                />
            </div>
        </div>
    );
}
