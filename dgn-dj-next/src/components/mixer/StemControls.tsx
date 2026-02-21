import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface StemControlsProps {
    deck: 'A' | 'B';
    className?: string;
}

export const StemControls: React.FC<StemControlsProps> = ({ deck, className }) => {
    const [mutes, setMutes] = useState([false, false, false, false]); // VOC, DRM, INST, BASS

    const toggleMute = (index: number) => {
        const newMutes = [...mutes];
        newMutes[index] = !newMutes[index];
        setMutes(newMutes);
    };

    const labels = ['VOC', 'DRM', 'INS', 'BAS'];
    const baseColor = deck === 'A' ? 'bg-blue-500' : 'bg-orange-500';
    const glowColor = deck === 'A' ? 'shadow-[0_0_8px_rgba(0,145,255,0.6)]' : 'shadow-[0_0_8px_rgba(255,85,0,0.6)]';

    return (
        <div className={cn("flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl", className)}>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] text-center mb-1 drop-shadow-sm">STEMS {deck}</div>
            <div className="flex gap-2 h-36"> {/* Tall buttons */}
                {labels.map((label, i) => (
                    <button
                        key={label}
                        onClick={() => toggleMute(i)}
                        className={cn(
                            "flex-1 rounded-lg border flex flex-col items-center justify-end pb-3 transition-all duration-300 relative overflow-hidden group",
                            mutes[i]
                                ? "bg-black/40 border-white/5"
                                : "bg-gradient-to-b from-zinc-800 to-zinc-900 border-white/20 hover:border-white/40 shadow-lg active:scale-95"
                        )}
                    >
                        {/* Lighting Backdrop (Glow when active) */}
                        {!mutes[i] && (
                            <div className={cn(
                                "absolute inset-0 opacity-20 blur-xl transition-opacity group-hover:opacity-40",
                                deck === 'A' ? "bg-blue-500" : "bg-orange-500"
                            )}></div>
                        )}

                        {/* Active Indicator Bar */}
                        <div className={cn(
                            "w-2 h-full rounded-full transition-all duration-500 relative z-10",
                            mutes[i] ? "bg-zinc-800 h-2" : cn(baseColor, glowColor)
                        )}>
                            {/* Inner Shine */}
                            {!mutes[i] && <div className="absolute inset-0 bg-white/30 rounded-full blur-[1px] scale-x-50"></div>}
                        </div>

                        {/* Backlit Text */}
                        <span className={cn(
                            "text-[10px] font-bold mt-3 z-10 transition-all duration-300 uppercase tracking-tighter",
                            mutes[i]
                                ? "text-zinc-600"
                                : deck === 'A' ? "text-blue-100 drop-shadow-[0_0_8px_rgba(0,145,255,0.8)]" : "text-orange-100 drop-shadow-[0_0_8px_rgba(255,85,0,0.8)]"
                        )}>
                            {label}
                        </span>

                        {/* Glass Reflection */}
                        <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                    </button>
                ))}
            </div>
        </div>
    );
};
