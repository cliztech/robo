'use client';

import { useMemo, useState } from 'react';
import { Bot, Clock, Disc, LayoutDashboard, Music, Sliders, Headphones, Settings as SettingsIcon, Radio, Activity, AlertTriangle } from 'lucide-react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';
import { DegenAIHost } from '../components/ai/DegenAIHost';
import { LibraryBrowser } from '../components/shell/library-browser';
import { MixerPanel } from '../components/shell/mixer-panel';
import { DegenScheduleTimeline } from '../components/schedule/DegenScheduleTimeline';
import { AppShell, type ShellNavItem } from '../components/shell/app-shell';
import { DashboardView, DecksView } from '../components/shell/console-views';
import { Sidebar, SidebarIcon } from '../components/shell/sidebar';
import { GorillaLogo } from '../components/branding/GorillaLogo';
import { Topbar, TabStrip } from '../components/shell/topbar';
import { Workspace } from '../components/shell/workspace';
import { DegenTransport } from '../components/transport/DegenTransport';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DegenMixer } from '../components/mixer/DegenMixer';
import { DegenTrackList } from '../components/library/DegenTrackList';
import { DeckView } from '../components/decks/DeckView';
import { cn } from '@/lib/utils';

type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';

export default function StudioPage() {
    const { currentView, isOnAir, setCurrentView, toggleOnAir } = useConsoleViewState();

    // Telemetry mock
    const telemetry = {
        transport: {
            isPlaying: isOnAir,
            durationSeconds: 234,
            elapsedSeconds: 45,
        },
        levels: {
            masterL: 0.8,
            masterR: 0.8,
        }
    };

    const isPlaying = isOnAir;
    const currentTrack = {
        title: 'Neural Drift v2.1',
        artist: 'SynthKong',
        duration: 234,
    };
    const isInitialized = true;
    const shouldReduceMotion = useReducedMotion();

    const navItems = [
        { view: 'dashboard' as ViewMode, icon: LayoutDashboard, label: 'Dashboard' },
        { view: 'decks' as ViewMode, icon: Disc, label: 'Decks' },
        { view: 'mixer' as ViewMode, icon: Sliders, label: 'Mixer' },
        { view: 'library' as ViewMode, icon: Music, label: 'Library' },
        { view: 'schedule' as ViewMode, icon: Clock, label: 'Schedule' },
        { view: 'ai-host' as ViewMode, icon: Bot, label: 'AI Host', badge: 'BETA' },
    ];

    return (
        <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden selection:bg-lime-500/30">
            {/* ── SIDEBAR ────────────────────────────── */}
            <Sidebar className="z-[2]">
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
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={shouldReduceMotion ? { duration: 0 } : undefined}
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
                            className="relative p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
                            aria-label="View alerts"
                        >
                            <AlertTriangle size={13} />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-500 rounded-full" aria-hidden="true" />
                        </button>

                        {/* On-Air toggle */}
                        <button
                            onClick={() => toggleOnAir()}
                            aria-pressed={isOnAir}
                            aria-label={isOnAir ? 'Set broadcast state to off air' : 'Set broadcast state to on air'}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                                isOnAir
                                    ? 'bg-red-600/15 border-red-500/25 text-red-400 pulse-ring'
                                    : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                            )}
                        >
                            <Radio size={11} className={isOnAir ? 'motion-safe:animate-pulse motion-reduce:animate-none' : ''} />
                            {isOnAir ? 'On Air' : 'Off Air'}
                        </button>

                        {/* CPU indicator */}
                        <div
                            className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]"
                            role="status"
                            aria-live="polite"
                            aria-label="CPU usage 12 percent"
                        >
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
                            initial={
                                shouldReduceMotion
                                    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                                    : { opacity: 0, y: 12, filter: 'blur(4px)' }
                            }
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={
                                shouldReduceMotion
                                    ? { opacity: 0, y: 0, filter: 'blur(0px)' }
                                    : { opacity: 0, y: -8, filter: 'blur(2px)' }
                            }
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0 }
                                    : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
                            }
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
