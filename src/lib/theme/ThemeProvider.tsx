'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    DEFAULT_THEME_STATE,
    loadThemeState,
    resolveTheme,
    saveThemeState,
    type ThemeMode,
    type ThemeState,
} from '@/lib/theme/themeStore';

interface ThemeContextValue extends ThemeState {
    resolvedTheme: 'dark' | 'light';
    setThemeMode: (mode: ThemeMode) => void;
    setActiveSkinId: (skinId: string) => void;
    resetThemePreferences: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeState, setThemeState] = useState<ThemeState>(DEFAULT_THEME_STATE);
    const [prefersDark, setPrefersDark] = useState(true);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const updatePreference = () => setPrefersDark(media.matches);

        updatePreference();
        setThemeState(loadThemeState(window.localStorage));

        media.addEventListener('change', updatePreference);
        return () => media.removeEventListener('change', updatePreference);
    }, []);

    const resolvedTheme = useMemo(
        () => resolveTheme(themeState.themeMode, prefersDark),
        [themeState.themeMode, prefersDark]
    );

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', resolvedTheme);
        root.setAttribute('data-skin', themeState.activeSkinId);
        saveThemeState(window.localStorage, themeState);
    }, [resolvedTheme, themeState]);

    const value = useMemo<ThemeContextValue>(() => ({
        ...themeState,
        resolvedTheme,
        setThemeMode: (mode) => setThemeState((prev) => ({ ...prev, themeMode: mode })),
        setActiveSkinId: (skinId) => setThemeState((prev) => ({ ...prev, activeSkinId: skinId })),
        resetThemePreferences: () => setThemeState(DEFAULT_THEME_STATE),
    }), [resolvedTheme, themeState]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useThemePreferences = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemePreferences must be used within ThemeProvider');
    }

    return context;
};
