import { Signal } from 'lucide-react';
import { DegenWaveform } from '../audio/DegenWaveform';

export type WaveformCuePoint = {
    position: number;
    label: string;
    color?: string;
};

export type WaveformRailProps = {
    title: string;
    statusLabel: string;
    progress: number;
    duration: number;
    trackTitle: string;
    isPlaying: boolean;
    cuePoints?: WaveformCuePoint[];
};

export function WaveformRail({
    title,
    statusLabel,
    progress,
    duration,
    trackTitle,
    isPlaying,
    cuePoints,
}: WaveformRailProps) {
    return (
        <div className="glass-panel overflow-hidden">
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"
                        style={{ boxShadow: '0 0 8px rgba(170,255,0,0.5)' }}
                    />
                    <span className="panel-header-title">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Signal size={10} className="text-lime-500" />
                    <span className="text-[9px] font-mono text-zinc-500">{statusLabel}</span>
                </div>
            </div>
            <div className="p-3">
                <DegenWaveform
                    progress={progress}
                    duration={duration}
                    trackTitle={trackTitle}
                    isPlaying={isPlaying}
                    cuePoints={cuePoints}
                />
            </div>
        </div>
    );
}
