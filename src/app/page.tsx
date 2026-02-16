'use client';

import React, { useState } from 'react';
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
import { DegenButton } from '../components/primitives/DegenButton';
import { GorillaLogo } from '../components/shell/GorillaLogo';
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
} from 'lucide-react';

type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';

/* ── Sidebar Icon ────────────────────────────── */
function SidebarIcon({
    icon: Icon,
    label,
    active,
    onClick,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick?: () => void;
    accent?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all group',
                active
                    ? 'bg-lime-500/10 text-lime-500'
                    : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60',
                accent && 'text-purple-500'
            )}
        >
            <Icon size={18} />
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-lime-500 rounded-r" />
            )}
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] font-bold text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {label}
            </div>
        </button>
    );
}

/* ── Stat Card ───────────────────────────────── */
function StatCard({
    label,
    value,
    unit,
    icon: Icon,
    color = 'lime',
    trend,
}: {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    color?: 'lime' | 'purple' | 'cyan' | 'orange';
    trend?: 'up' | 'down' | 'stable';
}) {
    const colors = {
        lime: 'from-lime-500/10 to-transparent border-lime-500/20 text-lime-500',
        purple: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-500',
        cyan: 'from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-500',
        orange: 'from-orange-500/10 to-transparent border-orange-500/20 text-orange-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'bg-gradient-to-br border rounded-lg p-3 flex items-center gap-3',
                colors[color]
            )}
        >
            <Icon size={18} className="shrink-0" />
            <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white tabular-nums">{value}</span>
                    {unit && <span className="text-[10px] text-zinc-500">{unit}</span>}
                </div>
            </div>
        </motion.div>
    );
}

/* ── Deck View ───────────────────────────────── */
function DeckView() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Deck A */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(170,255,0,0.5)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-lime-500">Deck A</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-auto">128.0 BPM · Am</span>
                    </div>
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
                </div>

                {/* Deck B */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(191,0,255,0.5)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-purple-500">Deck B</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-auto">140.0 BPM · Fm</span>
                    </div>
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
                </div>
            </div>

            <DegenBeatGrid decks={4} steps={16} />
        </div>
    );
}

/* ── Dashboard View ──────────────────────────── */
function DashboardView() {
    return (
        <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
                <StatCard label="Uptime" value="99.8" unit="%" icon={Activity} color="lime" />
                <StatCard label="Listeners" value="1,247" icon={Users} color="purple" />
                <StatCard label="Latency" value="12" unit="ms" icon={Gauge} color="cyan" />
                <StatCard label="Stream" value="OK" icon={Wifi} color="lime" />
            </div>

            {/* Waveform + Schedule */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                    <DegenWaveform
                        progress={0.42}
                        duration={234}
                        trackTitle="Now Playing: Neural Drift v2.1 — SynthKong"
                        isPlaying
                        cuePoints={[
                            { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                            { position: 0.68, label: 'DROP', color: '#bf00ff' },
                        ]}
                    />
                    <DegenScheduleTimeline />
                </div>
                <div>
                    <DegenAIHost className="h-full" />
                </div>
            </div>

            {/* Beat Grid + Effects */}
            <div className="grid grid-cols-2 gap-4">
                <DegenBeatGrid decks={4} steps={16} />
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

/* ── Main Studio Page ────────────────────────── */
export default function StudioPage() {
    const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
    const [isOnAir, setIsOnAir] = useState(true);

    const navItems: { view: ViewMode; icon: React.ElementType; label: string }[] = [
        { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { view: 'decks', icon: Disc, label: 'Decks' },
        { view: 'mixer', icon: Sliders, label: 'Mixer' },
        { view: 'library', icon: Music, label: 'Library' },
        { view: 'schedule', icon: Clock, label: 'Schedule' },
        { view: 'ai-host', icon: Bot, label: 'AI Host' },
    ];

    return (
        <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
            {/* ── Sidebar ─────────────────────────────── */}
            <aside className="w-14 bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col items-center py-3 gap-1 shrink-0">
                <div className="mb-4">
                    <GorillaLogo />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <SidebarIcon
                            key={item.view}
                            icon={item.icon}
                            label={item.label}
                            active={currentView === item.view}
                            onClick={() => setCurrentView(item.view)}
                        />
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-1">
                    <SidebarIcon icon={Headphones} label="Monitor" />
                    <SidebarIcon icon={SettingsIcon} label="Settings" />
                </div>
            </aside>

            {/* ── Main Area ───────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-10 bg-zinc-900/30 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            DGN-DJ Studio
                        </span>
                        <span className="text-[10px] text-zinc-700">|</span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase">
                            {currentView}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* On-Air toggle */}
                        <button
                            onClick={() => setIsOnAir(!isOnAir)}
                            className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-black uppercase tracking-widest transition-all',
                                isOnAir
                                    ? 'bg-red-600/20 border-red-600/30 text-red-500'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                            )}
                        >
                            <Radio size={10} />
                            {isOnAir ? 'On Air' : 'Off Air'}
                        </button>

                        {/* CPU indicator */}
                        <div className="flex items-center gap-1.5">
                            <Activity size={10} className="text-lime-500" />
                            <span className="text-[9px] font-mono text-zinc-500">CPU 12%</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {currentView === 'dashboard' && <DashboardView />}
                            {currentView === 'decks' && <DeckView />}
                            {currentView === 'mixer' && <DegenMixer className="max-w-3xl mx-auto" />}
                            {currentView === 'library' && <DegenTrackList className="max-h-[calc(100vh-140px)]" />}
                            {currentView === 'schedule' && <DegenScheduleTimeline className="max-w-4xl mx-auto" />}
                            {currentView === 'ai-host' && <DegenAIHost className="max-w-2xl mx-auto max-h-[calc(100vh-140px)]" />}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Transport bar */}
                <DegenTransport isOnAir={isOnAir} />
            </div>
        </div>
    );
}
