'use client';

import type { ElementType, ReactNode } from 'react';
import { DegenTransport } from '@/components/audio/DegenTransport';
import { ConsoleSidebar } from './ConsoleSidebar';
import { ConsoleTopbar } from './ConsoleTopbar';
import type { ConsoleNavItem, ConsoleViewMode } from '@/components/console/types';

interface ConsoleLayoutProps {
    navItems: ConsoleNavItem[];
    utilityItems: { icon: ElementType; label: string }[];
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
