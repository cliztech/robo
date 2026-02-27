'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Disc3, Radio } from 'lucide-react';
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
        <header className="h-11 skin-panel border-b flex items-center justify-between px-5 shrink-0 z-10">
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2">
                    <Disc3 size={11} className="text-[hsl(var(--color-deck-a))]/80" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[hsl(var(--color-text))]">
                        DGN-DJ Studio
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-[hsla(var(--color-text),0.16)]" />
                <motion.span
                    key={currentView}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-mono font-medium text-[hsl(var(--color-deck-a))]/80 uppercase truncate"
                >
                    {activeView}
                </motion.span>
            </div>

            <div className="flex items-center gap-3">
                <button className="relative p-1.5 text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text))] transition-colors">
                    <AlertTriangle size={13} />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--color-warning))]" />
                </button>

                <button
                    onClick={onToggleOnAir}
                    aria-label="On-air broadcast toggle" aria-pressed={isOnAir} className={cn(
                        'relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300',
                        isOnAir ? 'skin-control skin-control-active pulse-ring' : 'skin-control skin-control-inactive'
                    )}
                >
                    <Radio size={11} className={isOnAir ? 'animate-pulse' : ''} />
                    {isOnAir ? 'On Air' : 'Off Air'}
                </button>

                <div className="flex items-center gap-2 px-2 py-1 rounded skin-panel-muted">
                    <Activity size={10} className="text-[hsl(var(--color-warning))]/80" />
                    <span className="text-[9px] font-mono text-[hsl(var(--color-text-muted))] tabular-nums">06%</span>
                </div>
            </div>
        </header>
    );
}
