'use client';

import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GorillaLogo } from './GorillaLogo';
import type { ConsoleNavItem, ConsoleViewMode } from '@/components/console/types';

interface ConsoleSidebarProps {
    navItems: ConsoleNavItem[];
    utilityItems: { icon: LucideIcon; label: string }[];
    currentView: ConsoleViewMode;
    onViewChange: (view: ConsoleViewMode) => void;
}

function SidebarIcon({
    icon: Icon,
    label,
    active,
    onClick,
    badge,
}: {
    icon: ElementType;
    label: string;
    active?: boolean;
    onClick?: () => void;
    badge?: string;
}) {
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

export function ConsoleSidebar({
    navItems,
    utilityItems,
    currentView,
    onViewChange,
}: ConsoleSidebarProps) {
    return (
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
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.view}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.04, duration: 0.3 }}
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
                {utilityItems.map((item) => (
                    <SidebarIcon key={item.label} icon={item.icon} label={item.label} />
                ))}
            </div>
        </aside>
    );
}
