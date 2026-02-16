'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';
import { DegenButton } from '../primitives/DegenButton';

interface ChannelState {
    volume: number;     // 0-100
    pan: number;        // -50 to 50
    mute: boolean;
    solo: boolean;
    eq: { hi: number; mid: number; lo: number };
}

interface MixerChannel {
    id: string;
    label: string;
    color: string;
    type: 'deck' | 'mic' | 'aux' | 'master';
}

interface DegenMixerProps {
    channels?: MixerChannel[];
    className?: string;
}

const DEFAULT_CHANNELS: MixerChannel[] = [
    { id: 'deck-a', label: 'DECK A', color: 'hsl(82, 100%, 50%)', type: 'deck' },
    { id: 'deck-b', label: 'DECK B', color: 'hsl(285, 100%, 50%)', type: 'deck' },
    { id: 'mic', label: 'MIC', color: 'hsl(200, 100%, 50%)', type: 'mic' },
    { id: 'aux', label: 'AUX', color: 'hsl(50, 100%, 50%)', type: 'aux' },
    { id: 'master', label: 'MASTER', color: 'hsl(0, 0%, 100%)', type: 'master' },
];

function ChannelStrip({
    channel,
    state,
    onStateChange,
}: {
    channel: MixerChannel;
    state: ChannelState;
    onStateChange: (partial: Partial<ChannelState>) => void;
}) {
    // Simulated VU level based on volume + random variance
    const simulatedLevel = state.mute ? 0 : state.volume * (0.5 + Math.random() * 0.5);
    const isMaster = channel.type === 'master';

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-2 px-2 py-3',
                'bg-zinc-900/60 border border-zinc-800/80 rounded-lg',
                isMaster && 'bg-zinc-900 border-zinc-700'
            )}
            style={{
                minWidth: isMaster ? '90px' : '72px',
            }}
        >
            {/* Channel label */}
            <div className="flex items-center gap-1">
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: channel.color }}
                />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400">
                    {channel.label}
                </span>
            </div>

            {/* EQ Knobs */}
            {!isMaster && (
                <div className="flex flex-col gap-2 items-center">
                    {(['hi', 'mid', 'lo'] as const).map((band) => (
                        <DegenKnob
                            key={band}
                            label={band.toUpperCase()}
                            value={state.eq[band]}
                            min={0}
                            max={100}
                            onChange={(v) =>
                                onStateChange({ eq: { ...state.eq, [band]: v } })
                            }
                            size={28}
                        />
                    ))}
                </div>
            )}

            {/* Fader area */}
            <div className="flex items-end gap-1 flex-1">
                {/* VU Meter */}
                <DegenVUMeter
                    level={simulatedLevel}
                    peak={Math.min(100, simulatedLevel * 1.1)}
                    orientation="vertical"
                    size="sm"
                    showDb={false}
                />

                {/* Fader */}
                <div className="relative h-28 flex flex-col items-center justify-center">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.volume}
                        onChange={(e) =>
                            onStateChange({ volume: Number(e.target.value) })
                        }
                        className="fader-vertical appearance-none cursor-pointer"
                        style={{
                            writingMode: 'vertical-lr' as any,
                            direction: 'rtl',
                            width: '28px',
                            height: '100px',
                            background: 'transparent',
                        }}
                        aria-label={`${channel.label} volume`}
                    />
                </div>
            </div>

            {/* Fader value */}
            <span className="text-[9px] font-mono text-zinc-500 tabular-nums">
                {Math.round(state.volume)}
            </span>

            {/* Pan knob (non-master) */}
            {!isMaster && (
                <DegenKnob
                    label="PAN"
                    value={state.pan + 50}
                    min={0}
                    max={100}
                    onChange={(v) => onStateChange({ pan: v - 50 })}
                    size={24}
                />
            )}

            {/* Mute / Solo buttons */}
            <div className="flex gap-1">
                <button
                    onClick={() => onStateChange({ mute: !state.mute })}
                    className={cn(
                        'text-[8px] font-black px-1.5 py-0.5 rounded-sm border transition-all',
                        state.mute
                            ? 'bg-red-600/30 border-red-600/50 text-red-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                    )}
                >
                    M
                </button>
                {!isMaster && (
                    <button
                        onClick={() => onStateChange({ solo: !state.solo })}
                        className={cn(
                            'text-[8px] font-black px-1.5 py-0.5 rounded-sm border transition-all',
                            state.solo
                                ? 'bg-yellow-600/30 border-yellow-600/50 text-yellow-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                        )}
                    >
                        S
                    </button>
                )}
            </div>
        </div>
    );
}

export function DegenMixer({ channels = DEFAULT_CHANNELS, className }: DegenMixerProps) {
    const [states, setStates] = useState<Record<string, ChannelState>>(
        channels.reduce(
            (acc, ch) => ({
                ...acc,
                [ch.id]: {
                    volume: ch.type === 'master' ? 80 : 70,
                    pan: 0,
                    mute: false,
                    solo: false,
                    eq: { hi: 50, mid: 50, lo: 50 },
                },
            }),
            {} as Record<string, ChannelState>
        )
    );

    const handleChannelChange = (channelId: string, partial: Partial<ChannelState>) => {
        setStates((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...partial },
        }));
    };

    return (
        <div className={cn('bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden', className)}>
            {/* Mixer Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(170,255,0,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        Mixer Console
                    </span>
                </div>
                <div className="flex gap-1">
                    <DegenButton variant="ghost" size="xs">
                        Reset
                    </DegenButton>
                </div>
            </div>

            {/* Channel strips */}
            <div className="flex gap-1 p-2 overflow-x-auto">
                {channels.map((ch) => (
                    <ChannelStrip
                        key={ch.id}
                        channel={ch}
                        state={states[ch.id]}
                        onStateChange={(partial) => handleChannelChange(ch.id, partial)}
                    />
                ))}
            </div>

            {/* Crossfader */}
            <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-lime-500">A</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={50}
                        className="flex-1 h-1.5 appearance-none bg-zinc-800 rounded-full cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:rounded-sm
                            [&::-webkit-slider-thumb]:border
                            [&::-webkit-slider-thumb]:border-zinc-600
                            [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,255,255,0.3)]
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        aria-label="Crossfader"
                    />
                    <span className="text-[8px] font-bold text-purple-500">B</span>
                </div>
            </div>
        </div>
    );
}
