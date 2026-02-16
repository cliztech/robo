'use client';

import { useCallback, useState } from 'react';
import type { ConsoleViewMode } from '@/components/console/types';

interface UseConsoleViewStateResult {
    currentView: ConsoleViewMode;
    isOnAir: boolean;
    setCurrentView: (view: ConsoleViewMode) => void;
    toggleOnAir: () => void;
}

export function useConsoleViewState(): UseConsoleViewStateResult {
    const [currentView, setCurrentView] = useState<ConsoleViewMode>('dashboard');
    const [isOnAir, setIsOnAir] = useState(true);

    const toggleOnAir = useCallback(() => {
        setIsOnAir((previous) => !previous);
    }, []);

    return {
        currentView,
        isOnAir,
        setCurrentView,
        toggleOnAir,
    };
}
