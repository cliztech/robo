import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface TransportControlsProps {
    deck: 'A' | 'B';
    playing: boolean;
    onPlayPause: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
    deck,
    playing,
    onPlayPause,
}) => {
    const [loopActive, setLoopActive] = useState(false);
    const [loopSize, setLoopSize] = useState(4);

    const accentColor = deck === 'A' ? '#0091FF' : '#FF5500';
    const accentBorder = deck === 'A' ? 'border-deck-a' : 'border-deck-b';
    const accentBg = deck === 'A' ? 'bg-deck-a' : 'bg-deck-b';
    const accentShadow = deck === 'A'
        ? 'shadow-[0_0_12px_rgba(0,145,255,0.3)]'
        : 'shadow-[0_0_12px_rgba(255,85,0,0.3)]';

    // 44px height, 8px radius, transport-btn physics from design system
    const btnBase = "transport-btn w-12 border text-xxs font-bold font-mono uppercase flex items-center justify-center";
    const btnIdle = "border-white/10 bg-panel-2 text-zinc-400 hover:text-white";

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Main Transport */}
            <div className="flex gap-1.5">
                {/* CUE */}
                <button className={cn(btnBase, btnIdle)}>CUE</button>

                {/* PLAY/PAUSE */}
                <button
                    onClick={onPlayPause}
                    className={cn(
                        btnBase,
                        playing
                            ? cn("text-white", accentBorder, accentBg, accentShadow)
                            : btnIdle
                    )}
                    style={playing ? {
                        boxShadow: `0 0 12px ${accentColor}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    } : undefined}
                >
                    {playing ? '▮▮' : '▶'}
                </button>

                {/* SYNC */}
                <button className={cn(btnBase, btnIdle)}>SYNC</button>

                {/* SLIP */}
                <button className={cn(btnBase, btnIdle)}>SLIP</button>
            </div>

            {/* Loop Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setLoopActive(!loopActive)}
                    className={cn(
                        "transport-btn h-7! px-2.5 text-xxs font-mono font-bold",
                        loopActive
                            ? cn("text-white border", accentBorder, accentBg + '/20')
                            : "text-zinc-500 border border-white/5 bg-panel-2 hover:text-zinc-300"
                    )}
                >
                    LOOP
                </button>
                {[1, 2, 4, 8, 16].map(s => (
                    <button
                        key={s}
                        onClick={() => setLoopSize(s)}
                        className={cn(
                            "transport-btn h-7! w-7! text-xxs font-mono",
                            loopSize === s && loopActive
                                ? cn("text-white font-bold", accentBg + '/30', "border", accentBorder)
                                : "text-zinc-600 bg-panel-2 border border-white/5 hover:text-zinc-400"
                        )}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
};
