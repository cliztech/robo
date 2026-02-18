'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { createDJTelemetry, type DJTelemetry } from '../lib/audio/telemetry';
import { createMockTelemetry } from '../lib/audio/mockTelemetry';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { DegenEffectRack } from '../components/audio/DegenEffectRack';
import { DegenBeatGrid } from '../components/audio/DegenBeatGrid';
import { DegenWaveform } from '../components/audio/DegenWaveform';
import { DegenMixer } from '../components/audio/DegenMixer';
import { DegenTransport } from '../components/audio/DegenTransport';
import { DegenTrackList } from '../components/audio/DegenTrackList';
import { DegenScheduleTimeline } from '../components/schedule/DegenScheduleTimeline';
import { DegenAIHost } from '../components/ai/DegenAIHost';
import { StageTimeline } from '../components/workflow/StageTimeline';
import { DegenButton } from '../components/primitives/DegenButton';
import { GorillaLogo, Sidebar, TabStrip, Topbar, Workspace } from '../components/shell';
import {
    Activity,
    Radio,
    Mic2,
    LayoutDashboard,
    Disc,
    Settings as SettingsIcon,
    Music,
    Sliders,
    Clock,
    Bot,
    Headphones,
    Gauge,
    Wifi,
    Users,
    TrendingUp,
    TrendingDown,
    Minus,
    Zap,
    Signal,
    AlertTriangle,
} from 'lucide-react';

type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';

/* ═══════════════════════════════════════════════
   SIDEBAR ICON — with glass hover and glow bar
   ═══════════════════════════════════════════════ */
function SidebarIcon({
    icon: Icon,
    label,
    active,
    onClick,
    badge,
}: {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick?: () => void;
    badge?: string;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className={cn(
                'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                active
                    ? 'bg-lime-500/10 text-lime-400 shadow-[0_0_15px_rgba(170,255,0,0.08)]'
                    : 'text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]'
            )}
        >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.5} />
            {/* Active indicator bar */}
            {active && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full bg-lime-500"
                    style={{ boxShadow: '0 0 8px rgba(170,255,0,0.5)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            )}
            {/* Badge */}
            {badge && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[6px] font-black text-white">{badge}</span>
                </div>
            )}
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900/95 border border-zinc-700/50 rounded-md text-[9px] font-bold text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-lg backdrop-blur-sm translate-x-1 group-hover:translate-x-0">
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px] border-r-zinc-700/50" />
            </div>
        </button>
    );
}

/* ═══════════════════════════════════════════════
   STAT CARD — with sparkline, trend, and shimmer
   ═══════════════════════════════════════════════ */
function StatCard({
    label,
    value,
    unit,
    icon: Icon,
    color = 'lime',
    trend,
    sparkline,
    delay = 0,
}: {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    color?: 'lime' | 'purple' | 'cyan' | 'orange' | 'red';
    trend?: 'up' | 'down' | 'stable';
    sparkline?: number[];
    delay?: number;
}) {
    const colorMap = {
        lime: {
            gradient: 'from-lime-500/8 via-lime-500/3 to-transparent',
            border: 'border-lime-500/15',
            text: 'text-lime-400',
            icon: 'text-lime-500/70',
            glow: 'shadow-[0_0_20px_rgba(170,255,0,0.04)]',
            spark: '#aaff00',
        },
        purple: {
            gradient: 'from-purple-500/8 via-purple-500/3 to-transparent',
            border: 'border-purple-500/15',
            text: 'text-purple-400',
            icon: 'text-purple-500/70',
            glow: 'shadow-[0_0_20px_rgba(153,51,255,0.04)]',
            spark: '#9933ff',
        },
        cyan: {
            gradient: 'from-cyan-500/8 via-cyan-500/3 to-transparent',
            border: 'border-cyan-500/15',
            text: 'text-cyan-400',
            icon: 'text-cyan-500/70',
            glow: 'shadow-[0_0_20px_rgba(0,191,255,0.04)]',
            spark: '#00bfff',
        },
        orange: {
            gradient: 'from-orange-500/8 via-orange-500/3 to-transparent',
            border: 'border-orange-500/15',
            text: 'text-orange-400',
            icon: 'text-orange-500/70',
            glow: 'shadow-[0_0_20px_rgba(255,107,0,0.04)]',
            spark: '#ff6b00',
        },
        red: {
            gradient: 'from-red-500/8 via-red-500/3 to-transparent',
            border: 'border-red-500/15',
            text: 'text-red-400',
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
            {/* Shimmer overlay */}
            <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <Icon size={13} className={c.icon} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                            {label}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                            {value}
                        </span>
                        {unit && (
                            <span className="text-[10px] font-medium text-zinc-500">{unit}</span>
                        )}
                    </div>
                </div>

                {/* Trend */}
                {trend && (
                    <div className={cn('flex items-center gap-0.5 mt-1', trendColor)}>
                        <TrendIcon size={10} />
                    </div>
                )}
            </div>

            {/* Sparkline */}
            <div className="relative z-10 mt-3 h-6">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                        <linearGradient id={`spark-fill-${label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c.spark} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={c.spark} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {/* Fill area */}
                    <path
                        d={`M 0 30 ${(sparkline || defaultSparkline)
                            .map(
                                (v, i, arr) =>
                                    `L ${(i / (arr.length - 1)) * 100} ${30 - (v / 100) * 28}`
                            )
                            .join(' ')} L 100 30 Z`}
                        fill={`url(#spark-fill-${label})`}
                    />
                    {/* Line */}
                    <polyline
                        points={(sparkline || defaultSparkline)
                            .map(
                                (v, i, arr) =>
                                    `${(i / (arr.length - 1)) * 100},${30 - (v / 100) * 28}`
                            )
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

/* ═══════════════════════════════════════════════
   DECK PANEL — glass wrapper
   ═══════════════════════════════════════════════ */
function DeckPanel({
    label,
    color,
    bpm,
    musicalKey,
    isActive,
    children,
}: {
    label: string;
    color: string;
    bpm: string;
    musicalKey: string;
    isActive: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="glass-panel overflow-hidden">
            {/* Deck header */}
            <div className="panel-header">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div
                            className={cn('w-2.5 h-2.5 rounded-full', isActive && 'animate-pulse')}
                            style={{
                                backgroundColor: color,
                                boxShadow: isActive ? `0 0 10px ${color}80` : 'none',
                            }}
                        />
                    </div>
                    <span
                        className="text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color }}
                    >
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 tabular-nums">
                            {bpm}
                        </span>
                        <span className="text-[8px] text-zinc-600">BPM</span>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/15">
                        <span className="text-[9px] font-mono font-bold text-purple-400">
                            {musicalKey}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-3 space-y-3">{children}</div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   DECK VIEW
   ═══════════════════════════════════════════════ */
function DeckView({ telemetry }: { telemetry: DJTelemetry }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <DeckPanel label="Deck A" color="#aaff00" bpm="128.0" musicalKey="Am" isActive={true}>
                    <DegenWaveform
                        progress={telemetry.transport.progress}
                        duration={telemetry.transport.durationSeconds || 234}
                        waveformData={telemetry.waveformPeaks}
                        trackTitle="Neural Drift v2.1 — SynthKong"
                        isPlaying={telemetry.transport.isPlaying}
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
                        progress={telemetry.transport.progress}
                        duration={telemetry.transport.durationSeconds || 198}
                        waveformData={telemetry.waveformPeaks}
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

/* ═══════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════ */
function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
                {children}
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
        </div>
    );
}

/* ═══════════════════════════════════════════════
   DASHBOARD VIEW — with ambient bg, glass panels
   ═══════════════════════════════════════════════ */
function DashboardView({ telemetry }: { telemetry: DJTelemetry }) {
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="space-y-5">
            {/* Welcome header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        Station <span className="glow-text text-lime-400">Overview</span>
                    </h1>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                        Live monitoring · All systems nominal
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">
                        {currentTime}
                    </div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
                        Local Time
                    </div>
                </div>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-5 gap-3">
                <StatCard
                    label="Uptime"
                    value="99.8"
                    unit="%"
                    icon={Activity}
                    color="lime"
                    trend="stable"
                    sparkline={[95, 96, 98, 97, 99, 99, 100, 99, 100, 100, 99, 100]}
                    delay={0}
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

            {/* Waveform + AI Host */}
            <div className="grid grid-cols-[1fr_340px] gap-4">
                <div className="space-y-4">
                    <div className="glass-panel overflow-hidden">
                        <div className="panel-header">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" style={{ boxShadow: '0 0 8px rgba(170,255,0,0.5)' }} />
                                <span className="panel-header-title">Master Output</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Signal size={10} className="text-lime-500" />
                                <span className="text-[9px] font-mono text-zinc-500">AAC 320k</span>
                            </div>
                        </div>
                        <div className="p-3">
                            <DegenWaveform
                                progress={telemetry.transport.progress}
                                duration={telemetry.transport.durationSeconds || 234}
                                waveformData={telemetry.waveformPeaks}
                                trackTitle="Neural Drift v2.1 — SynthKong"
                                isPlaying={telemetry.transport.isPlaying}
                                cuePoints={[
                                    { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                                    { position: 0.68, label: 'DROP', color: '#bf00ff' },
                                ]}
                            />
                        </div>
                    </div>

                    <SectionHeader>On-Air Schedule</SectionHeader>
                    <DegenScheduleTimeline />
                </div>

                <div className="space-y-4">
                    <DegenAIHost className="glass-panel" />
                    <StageTimeline />
                </div>
            </div>

            <SectionHeader>Audio Engine</SectionHeader>

            {/* Beat Grid + Effects */}
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

/* ═══════════════════════════════════════════════
   MAIN STUDIO PAGE
   ═══════════════════════════════════════════════ */
export default function StudioPage() {
    const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
    const [isOnAir, setIsOnAir] = useState(true);
    const [mockTelemetryTick, setMockTelemetryTick] = useState(0);

    const { isInitialized, initialize, metrics, currentTrack, isPlaying } = useAudioEngine();

    const isMockTelemetryEnabled = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DJ_MOCK_TELEMETRY === 'true';

    useEffect(() => {
        if (!isMockTelemetryEnabled) {
            void initialize();
            return;
        }

        const intervalId = window.setInterval(() => {
            setMockTelemetryTick((previous) => previous + 1);
        }, 150);

        return () => window.clearInterval(intervalId);
    }, [initialize, isMockTelemetryEnabled]);

    const telemetry = useMemo(
        () => (isMockTelemetryEnabled ? createMockTelemetry(mockTelemetryTick) : createDJTelemetry(metrics, currentTrack)),
        [currentTrack, isMockTelemetryEnabled, metrics, mockTelemetryTick],
    );

    const navItems: { view: ViewMode; icon: React.ElementType; label: string; badge?: string }[] = [
        { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { view: 'decks', icon: Disc, label: 'Decks' },
        { view: 'mixer', icon: Sliders, label: 'Mixer' },
        { view: 'library', icon: Music, label: 'Library' },
        { view: 'schedule', icon: Clock, label: 'Schedule' },
        { view: 'ai-host', icon: Bot, label: 'AI Host', badge: '3' },
    ];

    return (
        <div className="flex h-screen bg-[hsl(0,0%,3%)] text-white overflow-hidden ambient-bg">
            {/* ── SIDEBAR ──────────────────────────────── */}
            <Sidebar width="compact" ariaLabel="Primary navigation">
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-5 cursor-pointer hover:scale-110 transition-transform"
                >
                    <GorillaLogo size={28} />
                </motion.div>

                {/* Separator */}
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

                {/* Nav items with stagger animation */}
                <div className="flex-1 flex flex-col gap-0.5">
                    {navItems.map((item, i) => (
                        <motion.div
                            key={item.view}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                        >
                            <SidebarIcon
                                icon={item.icon}
                                label={item.label}
                                active={currentView === item.view}
                                onClick={() => setCurrentView(item.view)}
                                badge={item.badge}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

                {/* Bottom icons */}
                <div className="flex flex-col gap-0.5">
                    <SidebarIcon icon={Headphones} label="Monitor" />
                    <SidebarIcon icon={SettingsIcon} label="Settings" />
                </div>
            </Sidebar>

            {/* ── MAIN AREA ────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
                {/* TOPBAR */}
                <Topbar height="comfortable" ariaLabel="Studio top bar">
                    <TabStrip ariaLabel="View context" region="secondary" align="start" className="pr-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
                                DGN-DJ
                            </span>
                            <span className="text-[11px] font-light uppercase tracking-[0.15em] text-zinc-600">
                                Studio
                            </span>
                        </div>
                        <div className="w-[1px] h-4 bg-zinc-800" />
                        <motion.span
                            key={currentView}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] font-mono font-medium text-zinc-500 uppercase"
                            role="status"
                            aria-live="polite"
                        >
                            {currentView.replace('-', ' ')}
                        </motion.span>
                    </TabStrip>

                    <div className="flex items-center gap-4">
                        {/* Alerts placeholder */}
                        <button
                            aria-label="Alerts"
                            className="relative p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
                        >
                            <AlertTriangle size={13} />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-500 rounded-full" />
                        </button>

                        {/* On-Air toggle */}
                        <button
                            onClick={() => setIsOnAir(!isOnAir)}
                            aria-pressed={isOnAir}
                            aria-label="On-air broadcast toggle"
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                                isOnAir
                                    ? 'bg-red-600/15 border-red-500/25 text-red-400 pulse-ring'
                                    : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                            )}
                        >
                            <Radio size={11} className={isOnAir ? 'animate-pulse' : ''} />
                            {isOnAir ? 'On Air' : 'Off Air'}
                        </button>

                        {/* CPU indicator */}
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]">
                            <Activity size={10} className="text-lime-500/70" />
                            <span className="text-[9px] font-mono text-zinc-500 tabular-nums">12%</span>
                        </div>
                    </div>
                </Topbar>

                {/* CONTENT */}
                <Workspace
                    ariaLabel="Studio workspace"
                    padding="comfortable"
                    focusOnContentChange
                    focusKey={currentView}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {currentView === 'dashboard' && <DashboardView telemetry={telemetry} />}
                            {currentView === 'decks' && <DeckView telemetry={telemetry} />}
                            {currentView === 'mixer' && (
                                <div className="max-w-4xl mx-auto">
                                    <DegenMixer telemetry={telemetry} />
                                </div>
                            )}
                            {currentView === 'library' && (
                                <DegenTrackList className="max-h-[calc(100vh-160px)]" />
                            )}
                            {currentView === 'schedule' && (
                                <div className="max-w-5xl mx-auto">
                                    <DegenScheduleTimeline />
                                </div>
                            )}
                            {currentView === 'ai-host' && (
                                <div className="max-w-3xl mx-auto">
                                    <DegenAIHost className="max-h-[calc(100vh-160px)]" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </Workspace>

                {/* TRANSPORT BAR */}
                <DegenTransport
                    isOnAir={isOnAir}
                    isPlaying={telemetry.transport.isPlaying || isPlaying}
                    telemetry={telemetry}
                    currentTrack={{
                        title: currentTrack?.title || 'Neural Drift v2.1',
                        artist: currentTrack?.artist || 'SynthKong',
                        duration: telemetry.transport.durationSeconds || currentTrack?.duration || 234,
                        bpm: isInitialized ? 128 : undefined,
                        key: 'Am',
                    }}
                />
            </div>
        </div>
    );
}
