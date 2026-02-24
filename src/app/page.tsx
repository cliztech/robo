'use client';

import React, { useState } from 'react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';

export default function StudioPage() {
    const { currentView, isOnAir, setCurrentView, toggleOnAir } = useConsoleViewState();

    return (
        <ConsoleLayout
            navItems={CONSOLE_NAV_ITEMS}
            utilityItems={CONSOLE_UTILITY_ITEMS}
            currentView={currentView}
            isOnAir={isOnAir}
            onViewChange={setCurrentView}
            onToggleOnAir={toggleOnAir}
        >
            <ConsoleWorkspaceView currentView={currentView} />
        </ConsoleLayout>
    );
}
