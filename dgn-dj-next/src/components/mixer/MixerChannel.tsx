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
        <div className={cn("flex flex-col items-center gap-4 w-full px-2", className)}>
            <Knob value={volume} onChange={onVolumeChange} label="GAIN" size={40} color="neutral" />
            <Knob value={75} onChange={() => { }} label="HIGH" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="MID" size={40} color="neutral" />
            <Knob value={50} onChange={() => { }} label="LOW" size={40} color="neutral" />
            <div className="flex-1 flex items-end w-full justify-center">
                <Fader value={volume} onChange={onVolumeChange} height={200} color={color} />
            </div>
        </div>
    );
};
