'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';
import {
    DEFAULT_MIXER_CHANNELS,
    MixerChannel,
    MixerChannelState,
    buildDefaultMixerState,
} from '../../lib/degenDataAdapters';
import type { DJTelemetry } from '../../lib/audio/telemetry';

interface DegenMixerProps {
    channels?: MixerChannel[];
    telemetry?: DJTelemetry;
    className?: string;
}

interface ChannelStripProps {
    channel: MixerChannel;
    state: MixerChannelState;
    telemetryLevel: number;
    telemetryPeak: number;
    onStateChange: (partial: Partial<MixerChannelState>) => void;
}

function ChannelStrip({ channel, state, telemetryLevel, telemetryPeak, onStateChange }: ChannelStripProps) {
    return (
        <div className="flex flex-col items-center gap-2 w-16 group relative">
            <div className="absolute inset-0 bg-white/[0.02] rounded-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header / EQ */}
            <div className="flex flex-col items-center gap-1.5 pt-2 pb-1 w-full border-b border-white/[0.04]">
                <div
                    className="text-[9px] font-black uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded-sm"
                    style={{ color: channel.color, backgroundColor: `${channel.color}15` }}
                >
                    {channel.label}
                </div>

                <div className="flex flex-col gap-1 items-center">
                    <DegenKnob
                        value={state.eq.hi}
                        onChange={(v) => onStateChange({ eq: { ...state.eq, hi: v } })}
                        label="HI"
                        size={28}
                        color={channel.color}
                    />
                    <DegenKnob
                        value={state.eq.mid}
                        onChange={(v) => onStateChange({ eq: { ...state.eq, mid: v } })}
                        label="MID"
                        size={28}
                        color={channel.color}
                    />
                    <DegenKnob
                        value={state.eq.lo}
                        onChange={(v) => onStateChange({ eq: { ...state.eq, lo: v } })}
                        label="LOW"
                        size={28}
                        color={channel.color}
                    />
                </div>
            </div>

            {/* Fader Section */}
            <div className="flex-1 w-full px-2 py-2 flex flex-col items-center gap-2 relative">
                <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none" />

                <div className="flex gap-2 h-32 items-stretch">
                    <div className="h-full pt-1 pb-1">
                        <DegenVUMeter
                            level={telemetryLevel || (state.mute ? 0 : state.vuLevel * (state.volume / 100))}
                            peak={telemetryPeak}
                            height={120}
                            width={4}
                            segmentGap={1}
                        />
                    </div>

                    <div className="relative w-8 h-full bg-black/40 rounded-sm border border-white/[0.06] shadow-inner">
                        <div className="absolute inset-x-0 top-[10%] h-[1px] bg-white/10" />
                        <div className="absolute inset-x-0 top-[30%] h-[1px] bg-white/10" />
                        <div className="absolute inset-x-0 top-[50%] h-[1px] bg-white/20" />
                        <div className="absolute inset-x-0 top-[70%] h-[1px] bg-white/10" />
                        <div className="absolute inset-x-0 top-[90%] h-[1px] bg-white/10" />

                        <div
                            className="absolute left-0 right-0 h-8 -ml-[1px] -mr-[1px] z-10 cursor-ns-resize group/fader"
                            style={{ bottom: `${state.volume}%`, transform: 'translateY(50%)' }}
                        >
                            <div
                                className="w-full h-full rounded-[1px] shadow-lg flex items-center justify-center relative transition-colors"
                                style={{
                                    background: 'linear-gradient(180deg, #3f3f46 0%, #27272a 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                                }}
                            >
                                <div className="w-full h-[1px] bg-white/50" />
                            </div>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={state.volume}
                            onChange={(e) => onStateChange({ volume: parseInt(e.target.value, 10) })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            aria-label="${channel.label} volume"
                        />
                    </div>
                </div>

                <div className="flex gap-1 w-full justify-center">
                    <button
                        onClick={() => onStateChange({ mute: !state.mute })}
                        aria-label="${channel.label} mute"
                        aria-pressed={state.mute}
                        className={cn(
                            'text-[9px] font-black w-6 h-5 flex items-center justify-center rounded-[2px] border transition-all',
                            state.mute
                                ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_6px_hsla(var(--color-danger),0.15)]'
                                : 'bg-transparent border-white/[0.06] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.1]'
                        )}
                    >
                        M
                    </button>
                    {channel.type !== 'master' && (
                        <button
                            onClick={() => onStateChange({ solo: !state.solo })}
                            aria-label="${channel.label} solo"
                            aria-pressed={state.solo}
                            className={cn(
                                'text-[9px] font-black w-6 h-5 flex items-center justify-center rounded-[2px] border transition-all',
                                state.solo
                                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_6px_hsla(var(--color-warning),0.15)]'
                                    : 'bg-transparent border-white/[0.06] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.1]'
                            )}
                        >
                            S
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function DegenMixer({ channels = DEFAULT_MIXER_CHANNELS, telemetry, className }: DegenMixerProps) {
    const [states, setStates] = useState<Record<string, MixerChannelState>>(() => buildDefaultMixerState(channels));
    const [crossfader, setCrossfader] = useState(50);
    const [localTelemetryTick, setLocalTelemetryTick] = useState(0);

    // If initial props change, re-init (optional, might not be needed but safe)
    useEffect(() => {
        // We only re-init if the keys of states don't match channels
        const currentKeys = Object.keys(states);
        const newKeys = channels.map(c => c.id);
        const diff = newKeys.filter(k => !currentKeys.includes(k));
        if (diff.length > 0) {
             setStates(prev => ({ ...buildDefaultMixerState(channels), ...prev }));
        }
    }, [channels]);

    // Local tick if no telemetry provided (for demo animation if needed)
    useEffect(() => {
        if (telemetry) return; // Use telemetry tick if available
        const id = setInterval(() => setLocalTelemetryTick((prev) => prev + 1), 100);
        return () => clearInterval(id);
    }, [telemetry]);

    const activeTick = telemetry ? 0 : localTelemetryTick; // Just a placeholder if telemetry is used

    // Map telemetry to channels
    const telemetryMap = useMemo(() => {
        const entries = telemetry?.mixer?.channels ?? [];
        return new Map(entries.map((channel) => [channel.id, channel]));
    }, [telemetry]);

    const handleChannelChange = (channelId: string, partial: Partial<MixerChannelState>) => {
        setStates((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...partial },
        }));
    };

    return (
        <div className={cn('glass-panel overflow-hidden', className)}>
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-control-active))]" style={{ boxShadow: '0 0 4px hsla(var(--color-control-active), 0.4)' }} />
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--color-deck-a))] shadow-glow-deck-a" />
                    <span className="panel-header-title">Mixer Console</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-zinc-600">{channels.length} CH</span>
                </div>
            </div>

            <div className="flex gap-1.5 p-3 overflow-x-auto custom-scrollbar items-start">
                {channels.map((ch) => {
                    const isMaster = ch.type === 'master';
                    const channelTelemetry = telemetryMap.get(ch.id);
                    // Fallback specific VU for demo/animation if no telemetry
                    const baseState = states[ch.id];
                    // If no telemetry, simulate VU
                    const simulatedVu = baseState?.mute ? 0 : (baseState?.volume / 100) * (baseState?.vuLevel ?? 0.5);
                    const animatedVu = Math.max(0.08, Math.min(1, simulatedVu + Math.sin((activeTick + (baseState?.volume||0)) / 6) * 0.08));

                    return (
                        <React.Fragment key={ch.id}>
                            {isMaster && (
                                <div className="w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 self-stretch" />
                            )}
                            <ChannelStrip
                                channel={ch}
                                state={states[ch.id]}
                                telemetryLevel={channelTelemetry?.level ?? animatedVu}
                                telemetryPeak={channelTelemetry?.peak ?? 0}
                                onStateChange={(partial) => handleChannelChange(ch.id, partial)}
                            />
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="px-4 pb-3 pt-1 border-t border-white/[0.03]">
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Crossfader</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-[hsl(var(--color-deck-a)_/_0.78)] w-3">A</span>
                    <div className="flex-1 relative group h-6 flex items-center">
                        <div className="absolute inset-x-0 h-[4px] rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-white/[0.04]" />
                            <div className="absolute inset-y-0 left-0" style={{ width: `${crossfader}%`, background: 'linear-gradient(90deg, #aaff0030, transparent)' }} />
                            <div className="absolute inset-y-0 right-0" style={{ width: `${100 - crossfader}%`, background: 'linear-gradient(-90deg, #9933ff30, transparent)' }} />
                            <div
                                className="absolute inset-y-0 left-0"
                                style={{
                                    width: `${crossfader}%`,
                                    background: 'linear-gradient(90deg, hsla(var(--color-deck-a), 0.18), transparent)',
                                }}
                            />
                            <div
                                className="absolute inset-y-0 right-0"
                                style={{
                                    width: `${100 - crossfader}%`,
                                    background: 'linear-gradient(-90deg, hsla(var(--color-deck-b), 0.18), transparent)',
                                }}
                            />
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 w-[1px] h-3 bg-white/[0.08] pointer-events-none" />
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={crossfader}
                            onChange={(e) => setCrossfader(parseInt(e.target.value, 10))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            aria-label="Crossfader"
                        />
                        <div
                            className="absolute w-5 h-3 rounded-[2px] bg-gradient-to-b from-zinc-400 to-zinc-600 border border-[hsl(var(--color-control-border-strong))] pointer-events-none"
                            style={{
                                left: `calc(${crossfader}% - 10px)`,
                                boxShadow: '0 2px 6px hsl(var(--black-rgb) / 0.5), 0 0 8px hsl(var(--surface-rgb) / 0.05)',
                            }}
                        >
                            <div className="absolute inset-x-1.5 top-[4px] h-[1px] bg-white/20" />
                            <div className="absolute inset-x-1.5 top-[7px] h-[1px] bg-white/20" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-deck-b w-3 text-right">B</span>
                </div>
            </div>
        </div>
    );
}
