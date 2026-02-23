'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';
import {
    LayoutDashboard, Disc, Music, Sliders, Clock, Bot, Headphones, Gauge, Wifi, Users, TrendingUp, TrendingDown, Minus, Zap, Signal, AlertTriangle, Activity, Radio, Mic2, Settings as SettingsIcon, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Volume1
} from 'lucide-react';
import { DegenAIHost } from '../components/ai/DegenAIHost';
import { LibraryBrowser } from '../components/shell/library-browser';
import { MixerPanel } from '../components/shell/mixer-panel';
import { DegenScheduleTimeline } from '../components/schedule/DegenScheduleTimeline';
import { AppShell, type ShellNavItem } from '../components/shell/app-shell';
import { DashboardView, DecksView } from '../components/shell/console-views';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { createDJTelemetry, type DJTelemetry } from '../lib/audio/telemetry';
import { createMockTelemetry } from '../lib/audio/mockTelemetry';
import { cn } from '../lib/utils';
import { DegenEffectRack } from '../components/audio/DegenEffectRack';
import { DegenBeatGrid } from '../components/audio/DegenBeatGrid';
import { DegenWaveform } from '../components/audio/DegenWaveform';
import { DegenMixer } from '../components/audio/DegenMixer';
import { DegenTransport } from '../components/audio/DegenTransport';
import { DegenTrackList } from '../components/audio/DegenTrackList';
import { StageTimeline } from '../components/workflow/StageTimeline';
import { DegenButton } from '../components/primitives/DegenButton';
import { GorillaLogo, Sidebar, TabStrip, Topbar, Workspace } from '../components/shell';

export default function StudioPage() {
    const { currentView, isOnAir, setCurrentView, toggleOnAir } = useConsoleViewState();
    const shouldReduceMotion = useReducedMotion();

    // Mock telemetry for now as we don't have the full engine context in this view
    const [telemetry, setTelemetry] = useState<any>({
        transport: { isPlaying: false, progress: 0, elapsedSeconds: 0, durationSeconds: 234, remainingSeconds: 234 },
        stereoLevels: { leftLevel: 0, rightLevel: 0, leftPeak: 0, rightPeak: 0 },
        signalFlags: { clipDetected: false, limiterEngaged: false }
    });

    // Sidebar items
    const navItems = [
        { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { view: 'decks', label: 'Decks', icon: Disc, badge: 'LIVE' },
        { view: 'mixer', label: 'Mixer', icon: Sliders },
        { view: 'library', label: 'Library', icon: Music },
        { view: 'schedule', label: 'Schedule', icon: Clock },
        { view: 'ai-host', label: 'AI Host', icon: Bot },
    ];

    return (
        <div className="flex h-screen bg-black text-white font-sans selection:bg-lime-500/30 overflow-hidden">
            {/* SIDEBAR */}
            <Sidebar>
                <div className="mb-5 cursor-pointer hover:scale-110 transition-transform">
                    <GorillaLogo size={28} />
                </div>

                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

                <div className="flex-1 flex flex-col gap-0.5">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view as any)}
                            className={cn(
                                'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                                currentView === item.view
                                    ? 'bg-deck-a-soft text-deck-a shadow-glow-deck-a-ring'
                                    : 'text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]'
                            )}
                            aria-label={item.label}
                            aria-pressed={currentView === item.view}
                        >
                            <item.icon size={17} />
                        </button>
                    ))}
                </div>

                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

                <div className="flex flex-col gap-0.5">
                     <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]">
                        <Headphones size={17} />
                     </button>
                     <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]">
                        <SettingsIcon size={17} />
                     </button>
                </div>
            </Sidebar>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
                <Topbar height="comfortable" ariaLabel="Studio top bar">
                    <TabStrip ariaLabel="View context" region="secondary" align="start" className="pr-3">
                        <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase">
                            {currentView}
                        </span>
                    </TabStrip>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleOnAir}
                            aria-label="On-air broadcast toggle"
                            aria-pressed={isOnAir}
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
                    </div>
                </Topbar>

                <Workspace
                    ariaLabel="Studio workspace"
                    padding="comfortable"
                    focusOnContentChange
                    focusKey={currentView}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {currentView === 'dashboard' && <DashboardView telemetry={telemetry} />}
                            {currentView === 'decks' && <DeckView telemetry={telemetry} />}
                            {currentView === 'mixer' && <div className="max-w-4xl mx-auto"><DegenMixer telemetry={telemetry} /></div>}
                            {currentView === 'library' && <DegenTrackList />}
                            {currentView === 'schedule' && <div className="max-w-5xl mx-auto"><DegenScheduleTimeline /></div>}
                            {currentView === 'ai-host' && <div className="max-w-3xl mx-auto"><DegenAIHost /></div>}
                        </motion.div>
                    </AnimatePresence>
                </Workspace>

                <DegenTransport
                    isOnAir={isOnAir}
                    isPlaying={false}
                    telemetry={telemetry}
                />
import { Music2, Play, Square, ChevronLeft, ChevronRight, Search, ListMusic, Volume2 } from 'lucide-react';

const tracks = [
    ['Jin (Original Mix)', 'Arche', '128.0', 'Gm', '05:31'],
    ['Womanloop (Original Mix)', 'Sergio Saffe', '128.0', 'D', '06:03'],
    ['Pelusa (Original Mix)', 'Nacho Scoppa', '128.0', 'Db', '07:00'],
    ['Slow Down (Original Mix)', "GuyMac, Murphy's Law", '125.0', 'Abm', '06:54'],
    ['Closing Doors (Original Mix)', 'Imanol Molina', '122.0', 'Fm', '06:50'],
    ['All Nighter (Original Mix)', 'Mescal Kids', '123.0', 'F#m', '05:48'],
];

const memoryPoints = [
    { label: 'A', time: '00:00', color: 'bg-red-500/90' },
    { label: 'B', time: '00:30', color: 'bg-blue-500/90' },
    { label: 'C', time: '01:45', color: 'bg-green-500/90' },
    { label: 'D', time: '02:30', color: 'bg-purple-500/90' },
    { label: 'E', time: '03:00', color: 'bg-emerald-500/90' },
    { label: 'F', time: '03:30', color: 'bg-orange-500/90' },
    { label: 'G', time: '04:15', color: 'bg-indigo-500/90' },
    { label: 'H', time: '04:52', color: 'bg-yellow-500/90' },
];

function Waveform({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`relative w-full overflow-hidden rounded border border-zinc-700 bg-black ${compact ? 'h-16' : 'h-40'}`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,#0c2248_30%,#122f66_65%,#0b2d5a_100%)] opacity-60" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-500/40" />
            <div className="absolute inset-0 flex items-end gap-[2px] px-2 pb-2">
                {Array.from({ length: 180 }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-[3px] rounded-t ${idx % 8 < 4 ? 'bg-blue-500/90' : 'bg-orange-300/90'}`}
                        style={{ height: `${24 + ((idx * 13) % (compact ? 28 : 75))}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function StudioPage() {
    return (
        <main className="h-screen w-full overflow-hidden bg-[#0a0a0a] text-zinc-100">
            <div className="grid h-full grid-cols-[72px_1fr_260px] grid-rows-[34px_1fr_290px]">
                <header className="col-span-3 flex items-center justify-between border-b border-zinc-800 bg-black px-4 text-xs font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-3 text-zinc-300"><span>Export</span><span>▾</span></div>
                    <div className="flex items-center gap-6 text-zinc-400">
                        <span className="rounded bg-zinc-800 px-2 py-0.5">Professional</span>
                        <span>125.00</span>
                        <span>20:49</span>
                    </div>
                </header>

                <aside className="row-span-2 flex flex-col items-center gap-4 border-r border-zinc-800 bg-[#111] py-4">
                    <button className="rounded-full border border-yellow-500/60 p-3 text-yellow-400"><Play size={16} /></button>
                    <button className="rounded-full border border-zinc-600 p-3 text-zinc-300"><Square size={16} /></button>
                    <div className="h-px w-8 bg-zinc-700" />
                    <button className="rounded border border-zinc-700 p-2"><ChevronLeft size={14} /></button>
                    <button className="rounded border border-zinc-700 p-2"><ChevronRight size={14} /></button>
                    <div className="mt-2 text-[11px] uppercase text-zinc-500">4 Beats</div>
                    <button className="rounded-full border border-yellow-500/70 px-3 py-1 text-[10px] font-bold uppercase text-yellow-400">Cue</button>
                </aside>

                <section className="space-y-2 border-r border-zinc-800 bg-[#080808] p-2">
                    <div className="flex items-end justify-between text-xs">
                        <div>
                            <p className="text-base font-bold">Jin (Original Mix)</p>
                            <p className="text-zinc-400">Arche</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="rounded bg-zinc-900 px-2 py-0.5">KEY SYNC</span>
                            <span className="rounded bg-blue-700 px-2 py-0.5">BEAT SYNC</span>
                        </div>
                    </div>
                    <Waveform compact />
                    <div className="grid grid-cols-[1fr_130px] gap-2">
                        <Waveform />
                        <div className="space-y-2 rounded border border-zinc-700 bg-[#121212] p-2 text-xs">
                            <div className="flex items-center justify-between"><span>MASTER</span><span>125.00</span></div>
                            <div className="h-24 rounded bg-black p-2">
                                <div className="h-full w-full border border-zinc-700" />
                            </div>
                            <button className="w-full rounded bg-blue-700 py-1 font-semibold">Q</button>
                        </div>
                    </div>
                    <Waveform compact />
                </section>

                <section className="overflow-hidden border-b border-zinc-800 bg-[#0f0f0f]">
                    <div className="flex items-center justify-between border-b border-zinc-700 px-2 py-1 text-xs font-semibold uppercase text-zinc-300">
                        <span>Memory</span>
                        <div className="flex gap-2">
                            <button className="rounded bg-zinc-800 px-2 py-0.5">Hot Cue</button>
                            <button className="rounded bg-zinc-800 px-2 py-0.5">Info</button>
                        </div>
                    </div>
                    <div className="h-full space-y-1 overflow-auto p-2 text-xs">
                        {memoryPoints.map((point) => (
                            <div key={point.label} className="flex items-center justify-between border-b border-zinc-800 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-4 rounded text-center text-[10px] font-bold text-black ${point.color}`}>{point.label}</span>
                                    <span>{point.time}</span>
                                    <span className="text-zinc-500">Cue(Auto)</span>
                                </div>
                                <span className="text-zinc-500">×</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="col-span-2 grid grid-cols-[250px_1fr] border-r border-zinc-800 bg-[#0b0b0b]">
                    <div className="border-r border-zinc-800">
                        <div className="flex items-center gap-2 border-b border-zinc-800 p-2 text-sm font-semibold">
                            <ListMusic size={16} /> Collection
                        </div>
                        <ul className="space-y-1 p-2 text-sm text-zinc-300">
                            {['All', 'Date Added', 'Genre', 'Artist', 'Album'].map((item, idx) => (
                                <li key={item} className={`rounded px-2 py-1 ${idx === 0 ? 'bg-blue-800/60 text-white' : 'hover:bg-zinc-800/70'}`}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs">
                            <span>Collection (2040 Tracks)</span>
                            <div className="flex items-center gap-2 text-zinc-500"><Search size={14} /><Volume2 size={14} /><Music2 size={14} /></div>
                        </div>
                        <table className="w-full table-fixed text-left text-sm">
                            <thead className="bg-zinc-900/90 text-xs uppercase text-zinc-400">
                                <tr>
                                    <th className="px-2 py-2">Track Title</th><th className="px-2 py-2">Artist</th><th className="px-2 py-2">BPM</th><th className="px-2 py-2">Key</th><th className="px-2 py-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tracks.map((track, idx) => (
                                    <tr key={track[0]} className={idx % 2 ? 'bg-[#121212]' : 'bg-[#0d0d0d]'}>
                                        <td className="truncate px-2 py-2">{track[0]}</td>
                                        <td className="truncate px-2 py-2 text-zinc-300">{track[1]}</td>
                                        <td className="px-2 py-2">{track[2]}</td>
                                        <td className="px-2 py-2"><span className="rounded bg-green-500/90 px-2 py-0.5 text-black">{track[3]}</span></td>
                                        <td className="px-2 py-2">{track[4]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-[#0f0f0f]" />
            </div>
        </main>
    );
}

// Minimal DeckView shim if needed, or import it
function DeckView({ telemetry }: { telemetry: any }) {
    return <DecksView telemetry={telemetry} />;
}
