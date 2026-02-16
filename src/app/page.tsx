'use client';

import { useMemo, useState } from 'react';
import { Bot, Clock, Disc, LayoutDashboard, Music, Sliders } from 'lucide-react';
import { DegenAIHost } from '../components/ai/DegenAIHost';
import { LibraryBrowser } from '../components/shell/library-browser';
import { MixerPanel } from '../components/shell/mixer-panel';
import { DegenScheduleTimeline } from '../components/schedule/DegenScheduleTimeline';
import { AppShell, type ShellNavItem } from '../components/shell/app-shell';
import { DashboardView, DecksView } from '../components/shell/console-views';

type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';

export default function StudioPage() {
    const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
    const [isOnAir, setIsOnAir] = useState(true);

    const navItems: ShellNavItem<ViewMode>[] = [
        { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { view: 'decks', icon: Disc, label: 'Decks' },
        { view: 'mixer', icon: Sliders, label: 'Mixer' },
        { view: 'library', icon: Music, label: 'Library' },
        { view: 'schedule', icon: Clock, label: 'Schedule' },
        { view: 'ai-host', icon: Bot, label: 'AI Host', badge: '3' },
    ];

    const viewContent = useMemo(() => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'decks':
                return <DecksView />;
            case 'mixer':
                return <MixerPanel className="max-w-4xl mx-auto" />;
            case 'library':
                return <LibraryBrowser className="max-h-[calc(100vh-160px)]" />;
            case 'schedule':
                return (
                    <div className="max-w-5xl mx-auto">
                        <DegenScheduleTimeline />
                    </div>
                );
            case 'ai-host':
                return (
                    <div className="max-w-3xl mx-auto">
                        <DegenAIHost className="max-h-[calc(100vh-160px)]" />
                    </div>
                );
            default:
                return null;
        }
    }, [currentView]);

    return (
        <AppShell
            currentView={currentView}
            navItems={navItems}
            isOnAir={isOnAir}
            onViewChange={setCurrentView}
            onToggleOnAir={() => setIsOnAir((prev) => !prev)}
        >
            {viewContent}
        </AppShell>
    );
}
