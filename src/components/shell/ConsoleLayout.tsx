'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DegenTransport } from '@/components/audio/DegenTransport';
import { ConsoleSidebar } from './ConsoleSidebar';
import { ConsoleTopbar } from './ConsoleTopbar';
import type { ConsoleNavItem, ConsoleViewMode } from '@/components/console/types';

interface ConsoleLayoutProps {
    navItems: ConsoleNavItem[];
    utilityItems: { icon: LucideIcon; label: string }[];
    currentView: ConsoleViewMode;
    isOnAir: boolean;
    onViewChange: (view: ConsoleViewMode) => void;
    onToggleOnAir: () => void;
    children: ReactNode;
}

export function ConsoleLayout({
    navItems,
    utilityItems,
    currentView,
    isOnAir,
    onViewChange,
    onToggleOnAir,
    children,
}: ConsoleLayoutProps) {
    return (
        <div className="flex h-screen bg-[hsl(0,0%,3%)] text-white overflow-hidden ambient-bg">
            {/* Floating ambient orbs */}
            <div className="floating-orb w-[300px] h-[300px] bg-[#027de1] top-[-80px] left-[10%]" style={{ animationDelay: '0s' }} />
            <div className="floating-orb w-[250px] h-[250px] bg-[#9933ff] bottom-[10%] right-[5%]" style={{ animationDelay: '5s' }} />
            <div className="floating-orb w-[200px] h-[200px] bg-[#00bfff] top-[40%] left-[60%]" style={{ animationDelay: '10s' }} />
            <ConsoleSidebar
                navItems={navItems}
                utilityItems={utilityItems}
                currentView={currentView}
                onViewChange={onViewChange}
            />

            <div className="flex-1 flex flex-col min-w-0 relative z-[1]">
                <ConsoleTopbar
                    currentView={currentView}
                    isOnAir={isOnAir}
                    onToggleOnAir={onToggleOnAir}
                />

                <main className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">{children}</main>

                <DegenTransport isOnAir={isOnAir} />
            </div>
        </div>
    );
}
