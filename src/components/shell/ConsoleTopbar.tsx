'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsoleViewMode } from '@/components/console/types';

interface ConsoleTopbarProps {
    currentView: ConsoleViewMode;
    isOnAir: boolean;
    onToggleOnAir: () => void;
}

export function ConsoleTopbar({ currentView, isOnAir, onToggleOnAir }: ConsoleTopbarProps) {
    return (
        <header className="h-11 bg-black/30 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-between px-5 shrink-0 z-10">
            <div className="flex items-center gap-4">
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
                >
                <motion.span
                    key={currentView}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-mono font-medium text-zinc-500 uppercase"
                >
                    {CONSOLE_NAV_ITEMS.find(item => item.view === currentView)?.label ?? currentView}
                </motion.span>
                </motion.span>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <AlertTriangle size={13} />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-lime-500 rounded-full" />
                </button>

                <button
                    onClick={onToggleOnAir}
                    className={cn(
                        'relative flex items-center gap-2 px-3 py-1.5 rounded-md border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                        isOnAir
                            ? 'bg-red-600/15 border-red-500/25 text-red-400 pulse-ring'
                            : 'bg-zinc-900/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
                    )}
                >
                    <Radio size={11} className={isOnAir ? 'animate-pulse' : ''} />
                    {isOnAir ? 'On Air' : 'Off Air'}
                </button>

                <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.04]">
                    <Activity size={10} className="text-lime-500/70" />
                    <span className="text-[9px] font-mono text-zinc-500 tabular-nums">12%</span>
                </div>
            </div>
        </header>
    );
}
