'use client';

import type { ReactNode } from 'react';
import { DegenBeatGrid } from '@/components/audio/DegenBeatGrid';
import { DegenEffectRack } from '@/components/audio/DegenEffectRack';
import { DegenWaveform } from '@/components/audio/DegenWaveform';
import { cn } from '@/lib/utils';

function DeckPanel({
    label,
    color,
    bpm,
    musicalKey,
    isActive,
    children,
}: {
    label: string;
    color: string;
    bpm: string;
    musicalKey: string;
    isActive: boolean;
    children: ReactNode;
}) {
    return (
        <div className="glass-panel overflow-hidden">
            <div className="panel-header">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div
                            className={cn('w-2.5 h-2.5 rounded-full', isActive && 'animate-pulse')}
                            style={{
                                backgroundColor: color,
                                boxShadow: isActive ? `0 0 10px ${color}80` : 'none',
                            }}
                        />
                    </div>
                    <span
                        className="text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color }}
                    >
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 tabular-nums">
                            {bpm}
                        </span>
                        <span className="text-[8px] text-zinc-600">BPM</span>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/15">
                        <span className="text-[9px] font-mono font-bold text-purple-400">
                            {musicalKey}
                        </span>
                    </div>
                </div>
            </div>
            <div className="p-3 space-y-3">{children}</div>
        </div>
    );
}

export function DecksView() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <DeckPanel label="Deck A" color="#aaff00" bpm="128.0" musicalKey="Am" isActive>
                    <DegenWaveform
                        progress={0.42}
                        duration={234}
                        trackTitle="Neural Drift v2.1 — SynthKong"
                        isPlaying
                        cuePoints={[
                            { position: 0.12, label: 'CUE 1', color: '#ff6b00' },
                            { position: 0.68, label: 'DROP', color: '#bf00ff' },
                        ]}
                    />
                    <DegenEffectRack
                        title="FX Bank A"
                        deck="A"
                        isActive
                        controls={[
                            { key: 'reverb', label: 'Reverb', unit: '%' },
                            { key: 'delay', label: 'Delay', unit: 'ms', max: 500 },
                            { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                            { key: 'filter', label: 'Filter', unit: 'Hz', max: 20000 },
                            { key: 'drive', label: 'Drive', unit: '%' },
                        ]}
                    />
                </DeckPanel>

                <DeckPanel
                    label="Deck B"
                    color="#9933ff"
                    bpm="140.0"
                    musicalKey="Fm"
                    isActive={false}
                >
                    <DegenWaveform
                        progress={0.15}
                        duration={198}
                        trackTitle="Bass Gorilla — DJ DegenApe"
                        isPlaying={false}
                        cuePoints={[
                            { position: 0.08, label: 'INTRO', color: '#3b82f6' },
                            { position: 0.52, label: 'BUILD', color: '#bf00ff' },
                        ]}
                    />
                    <DegenEffectRack
                        title="FX Bank B"
                        deck="B"
                        isActive={false}
                        controls={[
                            { key: 'chorus', label: 'Chorus', unit: '%' },
                            { key: 'phaser', label: 'Phaser', unit: '%' },
                            { key: 'rate', label: 'Rate', unit: 'Hz', max: 20 },
                            { key: 'flanger', label: 'Flanger', unit: '%' },
                            { key: 'bitcrush', label: 'Crush', unit: 'bit', max: 16 },
                        ]}
                    />
                </DeckPanel>
            </div>

            <div className="glass-panel">
                <div className="panel-header">
                    <span className="panel-header-title">Beat Sequencer</span>
                </div>
                <div className="p-3">
                    <DegenBeatGrid decks={4} steps={16} />
                </div>
            </div>
        </div>
    );
}
