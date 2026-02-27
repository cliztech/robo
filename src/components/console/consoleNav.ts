import {
    Bot,
    Clock,
    Disc,
    Disc3,
    Headphones,
    LayoutDashboard,
    Music,
    Settings,
    Sliders,
} from 'lucide-react';
import type { ConsoleNavItem } from './types';

export const CONSOLE_NAV_ITEMS: ConsoleNavItem[] = [
    { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { view: 'decks', icon: Disc, label: 'Decks' },
    { view: 'studio', icon: Disc3, label: 'Studio' },
    { view: 'mixer', icon: Sliders, label: 'Mixer' },
    { view: 'library', icon: Music, label: 'Library' },
    { view: 'schedule', icon: Clock, label: 'Schedule' },
    { view: 'ai-host', icon: Bot, label: 'AI Host', badge: '3' },
];

export const CONSOLE_UTILITY_ITEMS = [
    { icon: Headphones, label: 'Monitor' },
    { icon: Settings, label: 'Settings' },
];
