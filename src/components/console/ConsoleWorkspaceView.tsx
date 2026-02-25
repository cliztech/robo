'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { DegenAIHost } from '@/components/ai/DegenAIHost';
import { DegenMixer } from '@/components/audio/DegenMixer';
import { DegenTrackList } from '@/components/audio/DegenTrackList';
import { DegenScheduleTimeline } from '@/components/schedule/DegenScheduleTimeline';
import { DashboardView } from './DashboardView';
import { DJStudioSurface } from './DJStudioSurface';
import type { ConsoleViewMode } from './types';

interface ConsoleWorkspaceViewProps {
    currentView: ConsoleViewMode;
}

export function ConsoleWorkspaceView({ currentView }: ConsoleWorkspaceViewProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
                {currentView === 'dashboard' && <DashboardView />}
                {(currentView === 'decks' || currentView === 'studio') && <DJStudioSurface />}
                {currentView === 'mixer' && (
                    <div className="max-w-4xl mx-auto">
                        <DegenMixer />
                    </div>
                )}
                {currentView === 'library' && (
                    <DegenTrackList className="max-h-[calc(100vh-160px)]" />
                )}
                {currentView === 'schedule' && (
                    <div className="max-w-5xl mx-auto">
                        <DegenScheduleTimeline />
                    </div>
                )}
                {currentView === 'ai-host' && (
                    <div className="max-w-3xl mx-auto">
                        <DegenAIHost className="max-h-[calc(100vh-160px)]" />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
