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

// Minimal DeckView shim if needed, or import it
function DeckView({ telemetry }: { telemetry: any }) {
    return <DecksView telemetry={telemetry} />;
}

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
            </div>
        </div>
    );
}
