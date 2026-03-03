import type { LucideIcon } from 'lucide-react';

export type ConsoleViewMode =
    | 'dashboard'
    | 'decks'
    | 'mixer'
    | 'library'
    | 'schedule'
    | 'ai-host';

export interface ConsoleNavItem {
    view: ConsoleViewMode;
    icon: LucideIcon;
    label: string;
    badge?: string;
}
