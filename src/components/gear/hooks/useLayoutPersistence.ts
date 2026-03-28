import { useState, useCallback, useEffect } from 'react';
import type { GearType } from '../gear.types';

/**
 * useLayoutPersistence — Hook for saving and loading modular gear layouts.
 * Persists to localStorage (client-side) with a structure ready for
 * backend migration to settings.db.
 */

export interface PersistedGear {
    instanceId: string;
    type: GearType;
    label: string;
    gridColumn: number;
    gridRow: number;
}

export interface PersistedLayout {
    id: string;
    name: string;
    gear: PersistedGear[];
    savedAt: string;
}

const STORAGE_KEY = 'dgn-dj-studio-layouts';

function loadLayouts(): PersistedLayout[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persistLayouts(layouts: PersistedLayout[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

export function useLayoutPersistence() {
    const [layouts, setLayouts] = useState<PersistedLayout[]>([]);
    const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = loadLayouts();
        setLayouts(stored);
        if (stored.length > 0) {
            setActiveLayoutId(stored[0].id);
        }
    }, []);

    const saveLayout = useCallback(
        (name: string, gear: PersistedGear[]) => {
            const layout: PersistedLayout = {
                id: `layout-${Date.now()}`,
                name,
                gear,
                savedAt: new Date().toISOString(),
            };
            const updated = [...layouts, layout];
            setLayouts(updated);
            persistLayouts(updated);
            setActiveLayoutId(layout.id);
            return layout;
        },
        [layouts],
    );

    const loadLayout = useCallback(
        (layoutId: string): PersistedLayout | null => {
            const found = layouts.find(l => l.id === layoutId) ?? null;
            if (found) setActiveLayoutId(found.id);
            return found;
        },
        [layouts],
    );

    const deleteLayout = useCallback(
        (layoutId: string) => {
            const updated = layouts.filter(l => l.id !== layoutId);
            setLayouts(updated);
            persistLayouts(updated);
            if (activeLayoutId === layoutId) {
                setActiveLayoutId(updated.length > 0 ? updated[0].id : null);
            }
        },
        [layouts, activeLayoutId],
    );

    const listLayouts = useCallback(() => layouts, [layouts]);

    return {
        layouts,
        activeLayoutId,
        saveLayout,
        loadLayout,
        deleteLayout,
        listLayouts,
    };
}
