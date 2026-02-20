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
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center mb-1">STEMS {deck}</div>
            <div className="flex gap-1 h-32"> {/* Tall buttons */}
                {labels.map((label, i) => (
                    <button
                        key={label}
                        onClick={() => toggleMute(i)}
                        className={cn(
                            "flex-1 rounded border border-[#333] flex flex-col items-center justify-end pb-2 transition-all duration-100 relative overflow-hidden group",
                            mutes[i] ? "bg-[#111] opacity-50" : "bg-[#1a1a1a] hover:bg-[#222]"
                        )}
                    >
                        {/* Active Indicator Bar */}
                        <div className={cn(
                            "w-1.5 h-full rounded-full transition-all duration-300 relative",
                            mutes[i] ? "bg-[#333] h-2" : cn(baseColor, glowColor)
                        )}>
                            {/* Fill animation */}
                            {!mutes[i] && <div className="absolute bottom-0 w-full bg-white/50 h-0 group-hover:h-full transition-all duration-300"></div>}
                        </div>

                        <span className={cn("text-[8px] font-mono mt-2", mutes[i] ? "text-zinc-600" : "text-zinc-400")}>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
