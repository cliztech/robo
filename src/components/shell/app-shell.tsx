import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Headphones,
    Radio,
    Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { DegenTransport } from '../audio/DegenTransport';
import { GorillaLogo } from './GorillaLogo';

export type ShellNavItem<TView extends string> = {
    view: TView;
    icon: React.ElementType;
    label: string;
    badge?: string;
};

type SidebarIconProps = {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    onClick?: () => void;
    badge?: string;
};

function SidebarIcon({ icon: Icon, label, active, onClick, badge }: SidebarIconProps) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 group',
                active
                    ? 'bg-lime-500/10 text-lime-400 shadow-[0_0_15px_rgba(170,255,0,0.08)]'
                    : 'text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.03]'
            )}
        >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.5} />
            {active && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full bg-lime-500"
                    style={{ boxShadow: '0 0 8px rgba(170,255,0,0.5)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            )}
            {badge && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-[6px] font-black text-white">{badge}</span>
                </div>
            )}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900/95 border border-zinc-700/50 rounded-md text-[9px] font-bold text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-lg backdrop-blur-sm translate-x-1 group-hover:translate-x-0">
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[4px] border-r-zinc-700/50" />
            </div>
        </button>
    );
}

export type AppShellProps<TView extends string> = {
    currentView: TView;
    navItems: ShellNavItem<TView>[];
    isOnAir: boolean;
    onViewChange: (view: TView) => void;
    onToggleOnAir: () => void;
    children: React.ReactNode;
};

export function AppShell<TView extends string>({
    currentView,
    navItems,
    isOnAir,
    onViewChange,
    onToggleOnAir,
    children,
}: AppShellProps<TView>) {
    return (
        <div className="flex h-screen bg-[hsl(0,0%,3%)] text-white overflow-hidden ambient-bg">
            <aside className="w-[56px] bg-black/40 border-r border-white/[0.04] flex flex-col items-center py-3 gap-0.5 shrink-0 backdrop-blur-md z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="mb-5 cursor-pointer hover:scale-110 transition-transform"
                >
                    <GorillaLogo size={28} />
                </motion.div>

                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

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
                                onClick={() => onViewChange(item.view)}
                                badge={item.badge}
                            />
                        </motion.div>
                    ))}
                </div>

                <div className="w-6 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent mb-2" />

                <div className="flex flex-col gap-0.5">
                    <SidebarIcon icon={Headphones} label="Monitor" />
                    <SidebarIcon icon={SettingsIcon} label="Settings" />
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
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
                            {currentView.replace('-', ' ')}
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

                <main className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentView}
                            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

                <DegenTransport isOnAir={isOnAir} />
            </div>
        </div>
    );
}
