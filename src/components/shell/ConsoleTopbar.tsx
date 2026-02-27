'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Clock3, Disc3, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONSOLE_NAV_ITEMS } from '@/components/console/consoleNav';
import type { ConsoleViewMode } from '@/components/console/types';

interface ConsoleTopbarProps {
    currentView: ConsoleViewMode;
    isOnAir: boolean;
    onToggleOnAir: () => void;
}

export function ConsoleTopbar({ currentView, isOnAir, onToggleOnAir }: ConsoleTopbarProps) {
    const activeView = CONSOLE_NAV_ITEMS.find((item) => item.view === currentView)?.label ?? currentView;

    return (
        <header className="h-11 bg-[#111319] border-b border-white/[0.12] flex items-center justify-between px-5 shrink-0 z-10">
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2">
                    <Disc3 size={11} className="text-cyan-300/80" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100">
                        DGN-DJ Studio
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-zinc-800" />
                <motion.span
                    key={currentView}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-mono font-medium text-cyan-200/80 uppercase truncate"
                >
                    {activeView}
                </motion.span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-black/45 border border-white/[0.12]">
                <Clock3 size={11} className="text-zinc-500" />
                <span className="text-[11px] font-mono text-zinc-100 tabular-nums tracking-[0.08em]">00:00:10</span>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-1.5 text-zinc-500 hover:text-zinc-400 transition-colors">
                    <AlertTriangle size={13} />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-400 rounded-full" />
                </button>

                <button
                    onClick={onToggleOnAir}
                    aria-label="On-air broadcast toggle" aria-pressed={isOnAir} className={cn(
                        'relative flex items-center gap-2 px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                        isOnAir
                            ? 'bg-red-600/15 border-red-500/25 text-red-400 pulse-ring'
                            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                    )}
                >
                    <Radio size={11} className={isOnAir ? 'animate-pulse' : ''} />
                    {isOnAir ? 'On Air' : 'Off Air'}
                </button>

                <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.06]">
                    <Activity size={10} className="text-lime-400/80" />
                    <span className="text-[9px] font-mono text-zinc-500 tabular-nums">06%</span>
                </div>
            </div>
        </header>
    );
}
