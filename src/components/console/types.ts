import type { LucideIcon } from 'lucide-react';

export type ConsoleViewMode =
    | 'dashboard'
    | 'decks'
    | 'studio'
    | 'mixer'
    | 'library'
    | 'schedule'
    | 'ai-host'
    | 'skin-manager';

export interface ConsoleNavItem {
    view: ConsoleViewMode;
    icon: LucideIcon;
    label: string;
    badge?: string;
}
