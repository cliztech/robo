import React from 'react';
import { Knob } from '../ui/Knob';
import { Fader } from '../ui/Fader';
import { cn } from '../../lib/utils';

interface MixerChannelProps {
    deck: 'A' | 'B';
    volume: number;
    onVolumeChange: (val: number) => void;
    className?: string;
}

export const MixerChannel: React.FC<MixerChannelProps> = ({ deck, volume, onVolumeChange, className }) => {
    const color = deck === 'A' ? 'deck-a' : 'deck-b';

    return (
        <div className={cn(
            "flex flex-col items-center gap-6 w-full p-4 rounded-3xl relative overflow-hidden",
            "bg-gradient-to-b from-zinc-900 to-[#0a0a0a] border border-white/5 shadow-2xl",
            className
        )}>
            {/* Top Light Catch */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="flex flex-col items-center gap-5 w-full">
                <Knob value={volume} onChange={onVolumeChange} label="GAIN" size={44} color="neutral" />
                <div className="w-full h-[1px] bg-white/5 shadow-sm my-1"></div>
                <Knob value={75} onChange={() => { }} label="HIGH" size={44} color="neutral" />
                <Knob value={50} onChange={() => { }} label="MID" size={44} color="neutral" />
                <Knob value={50} onChange={() => { }} label="LOW" size={44} color="neutral" />
            </div>

            <div className="flex-1 flex items-end w-full justify-center mt-4 relative">
                {/* Visual Depth Background for Fader */}
                <div className="absolute inset-0 bg-black/20 rounded-2xl blur-xl opacity-50"></div>
                <Fader value={volume} onChange={onVolumeChange} height={220} color={color} className="z-10" />
            </div>

            {/* Bottom Glow */}
            <div className={cn(
                "absolute bottom-0 w-full h-1 blur-sm opacity-30",
                deck === 'A' ? "bg-blue-500" : "bg-orange-500"
            )}></div>
        </div>
    );
};
