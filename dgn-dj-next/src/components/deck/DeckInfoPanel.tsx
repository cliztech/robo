import React from 'react';
import { cn } from '../../lib/utils';

interface DeckInfoPanelProps {
    deck: 'A' | 'B';
    trackTitle?: string;
    artist?: string;
    bpm?: number;
    musicalKey?: string;
    camelotKey?: string;
    timeRemaining?: string;
    pitch?: number;
    isMaster?: boolean;
    isSynced?: boolean;
}

export const DeckInfoPanel: React.FC<DeckInfoPanelProps> = ({
    deck,
    trackTitle = 'No Track Loaded',
    artist = '—',
    bpm = 0,
    musicalKey = '—',
    camelotKey = '—',
    timeRemaining = '00:00',
    pitch = 0,
    isMaster = false,
    isSynced = false,
}) => {
    const accentColor = deck === 'A' ? 'text-deck-a' : 'text-deck-b';
    const accentBg = deck === 'A' ? 'bg-deck-a' : 'bg-deck-b';
    const isLeft = deck === 'A';

    return (
        <div className={cn(
            "flex flex-col justify-between p-3 min-w-0",
            isLeft ? "items-start" : "items-end"
        )}>
            {/* Track Info — title tracking -0.2px */}
            <div className={cn("min-w-0", isLeft ? "text-left" : "text-right")}>
                <div className="text-white font-semibold text-sm truncate leading-tight tracking-title lh-strict">
                    {trackTitle}
                </div>
                <div className="text-zinc-500 text-xs truncate tracking-meta">{artist}</div>
            </div>

            {/* BPM / Key — BPM optical nudge: +2px lower via mt-[2px] */}
            <div className={cn("flex items-center gap-3 mt-2", !isLeft && "flex-row-reverse")}>
                <div className={cn("font-mono font-bold text-xl tabular-nums tracking-title", accentColor)}
                    style={{ marginTop: '2px' }}>
                    {bpm.toFixed(2)}
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xxs font-mono text-zinc-500 tracking-micro">{camelotKey}</span>
                    <span className="text-xxs font-mono text-zinc-400 tracking-micro">{musicalKey}</span>
                </div>
            </div>

            {/* Time & Badges — micro labels tracking +0.3px */}
            <div className={cn("flex items-center gap-2 mt-2", !isLeft && "flex-row-reverse")}>
                <span className="font-mono text-sm text-zinc-300 tabular-nums tracking-meta">-{timeRemaining}</span>
                {pitch !== 0 && (
                    <span className="text-xxs font-mono text-zinc-500 tabular-nums tracking-micro">
                        {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%
                    </span>
                )}
                {isSynced && (
                    <span className={cn("text-xxs font-bold px-1.5 py-0.5 rounded border tracking-micro", accentColor, 'border-current')}>
                        SYNC
                    </span>
                )}
                {isMaster && (
                    <span className={cn("text-xxs font-bold px-1.5 py-0.5 rounded text-black tracking-micro", accentBg)}>
                        MST
                    </span>
                )}
            </div>
        </div>
    );
};
