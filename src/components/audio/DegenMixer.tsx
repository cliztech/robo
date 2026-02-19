'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';
import {
    DEFAULT_MIXER_CHANNELS,
    MixerChannel,
    MixerChannelState,
    buildDefaultMixerState,
} from '../../lib/degenDataAdapters';

interface DegenMixerProps {
    channels?: MixerChannel[];
    initialStates?: Record<string, MixerChannelState>;
    telemetryTick?: number;
    className?: string;
}

import React, { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';
import type { DJTelemetry } from '../../lib/audio/telemetry';

interface ChannelState {
    volume: number;
    pan: number;
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
    telemetry?: DJTelemetry;
    className?: string;
}

const DEFAULT_CHANNELS: MixerChannel[] = [
    { id: 'deck-a', label: 'DECK A', color: 'hsl(var(--color-deck-a))', type: 'deck' },
    { id: 'deck-b', label: 'DECK B', color: 'hsl(var(--color-deck-b))', type: 'deck' },
    { id: 'mic', label: 'MIC', color: 'hsl(var(--color-accent-3))', type: 'mic' },
    { id: 'aux', label: 'AUX', color: 'hsl(var(--color-warning))', type: 'aux' },
    { id: 'master', label: 'MASTER', color: 'hsl(var(--color-text))', type: 'master' },
];

/* ── Fader Track SVG ───────── */
    { id: 'mic', label: 'MIC', color: 'hsl(var(--color-deck-mic))', type: 'mic' },
    { id: 'aux', label: 'AUX', color: 'hsl(var(--color-deck-aux))', type: 'aux' },
    { id: 'master', label: 'MASTER', color: 'hsl(var(--color-deck-master))', type: 'master' },
];

function FaderTrack({ value, color }: { value: number; color: string }) {
    const fillHeight = (value / 100) * 80;
    return (
        <svg viewBox="0 0 12 90" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Track groove */}
            <rect x="4.5" y="4" width="3" height="82" rx="0.75" fill="rgba(255,255,255,0.03)" />
            <rect x="4.5" y="4" width="3" height="82" rx="1.5" fill="hsl(var(--surface-rgb) / 0.03)" />
            {/* Fill from bottom */}
            <rect x="4.5" y="4" width="3" height="82" rx="1.5" fill="rgba(255,255,255,0.03)" />
            <rect x="4.5" y={86 - fillHeight} width="3" height={fillHeight} rx="1.5" fill={color} opacity={0.25} />
            <rect
                x="4.5"
                y={86 - fillHeight}
                width="3"
                height={fillHeight}
                rx="0.75"
                fill={color}
                opacity={0.25}
            />
            {[0, 25, 50, 75, 100].map((tick) => {
                const y = 86 - (tick / 100) * 82;
                return (
                    <line
                        key={tick}
                        x1={tick === 100 ? 1 : 2}
                        y1={y}
                        x2={tick === 100 ? 11 : 10}
                        y2={y}
                        stroke="hsl(var(--surface-rgb) / 0.08)"
                        strokeWidth="0.5"
                    />
                );
            })}
            {/* dB labels */}
            <text x="0" y="8" fill="hsl(var(--surface-rgb) / 0.15)" fontSize="3" fontFamily="monospace">+6</text>
            <text x="0" y="30" fill="hsl(var(--surface-rgb) / 0.15)" fontSize="3" fontFamily="monospace">0</text>
            <text x="0" y="88" fill="hsl(var(--surface-rgb) / 0.15)" fontSize="3" fontFamily="monospace">-∞</text>
            <text x="0" y="8" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">+6</text>
            <text x="0" y="30" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">0</text>
            <text x="0" y="88" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">-∞</text>
        </svg>
    );
}

function ChannelStrip({
    channel,
    state,
    vuLevel,
    onStateChange,
    telemetryLevel,
    telemetryPeak,
}: {
    channel: MixerChannel;
    state: MixerChannelState;
    vuLevel: number;
    onStateChange: (partial: Partial<MixerChannelState>) => void;
}) {
    const isMaster = channel.type === 'master';
    state: ChannelState;
    onStateChange: (partial: Partial<ChannelState>) => void;
    telemetryLevel: number;
    telemetryPeak: number;
}) {
    const isMaster = channel.type === 'master';
    const vuLevel = state.mute ? 0 : (state.volume / 100) * telemetryLevel;
    const vuPeak = state.mute ? 0 : (state.volume / 100) * telemetryPeak;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all border',
                isMaster
                    ? 'bg-white/[0.03] border-white/[0.06] shadow-[inset_0_1px_0_hsl(var(--surface-rgb)/0.03)]'
                    : 'bg-white/[0.015] border-white/[0.03] hover:border-white/[0.06]'
            )}
            style={{ minWidth: isMaster ? '88px' : '70px' }}
        >
            <div className="flex items-center gap-1.5 w-full justify-center">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: channel.color, boxShadow: `0 0 6px ${channel.color}40` }} />
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-400">{channel.label}</span>
                <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                        backgroundColor: channel.color,
                        boxShadow: `0 0 4px ${channel.color}` ,
                    }}
                />
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {channel.label}
                </span>
            </div>

            {!isMaster && (
                <div className="flex flex-col gap-2.5 items-center py-1">
                    {(['hi', 'mid', 'lo'] as const).map((band) => (
                        <DegenKnob
                            key={band}
                            label={band.toUpperCase()}
                            value={state.eq[band]}
                            min={0}
                            max={100}
                            onChange={(v) => onStateChange({ eq: { ...state.eq, [band]: v } })}
                            size={26}
                        />
                    ))}
                </div>
            )}

            <div className="flex items-stretch gap-1.5 flex-1">
                <DegenVUMeter level={vuLevel} peak={Math.min(1, vuLevel * 1.12)} orientation="vertical" size="xs" />
                <DegenVUMeter
                    level={vuLevel}
                    peak={vuPeak}
                    orientation="vertical"
                    size="xs"
                />

                <div className="relative h-28 w-7 flex items-center justify-center">
                    <FaderTrack value={state.volume} color={channel.color} />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.volume}
                        onChange={(e) => onStateChange({ volume: Number(e.target.value) })}
                        className="fader-vertical appearance-none cursor-pointer relative z-10"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl', width: '28px', height: '100px', background: 'transparent' }}
                        style={{
                            writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                            direction: 'rtl',
                            width: '28px',
                            height: '100px',
                            background: 'transparent',
                        }}
                        aria-label={`${channel.label} volume`}
                    />
                </div>

                {isMaster && (
                    <DegenVUMeter
                        level={vuLevel * 0.95}
                        peak={vuPeak * 0.95}
                        orientation="vertical"
                        size="xs"
                    />
                )}
            </div>

            <div className="px-2 py-0.5 rounded bg-black/30 border border-white/[0.03]">
                <span className="text-[9px] font-mono font-bold text-zinc-400 tabular-nums">{Math.round(state.volume)}</span>
            </div>

            {!isMaster && (
                <DegenKnob
                    label="PAN"
                    value={state.pan + 50}
                    min={0}
                    max={100}
                    onChange={(v) => onStateChange({ pan: v - 50 })}
                    size={22}
                />
            )}

            <div className="flex gap-1">
                <button
                    onClick={() => onStateChange({ mute: !state.mute })}
                    className={cn(
                        'text-[7px] font-black w-6 h-5 flex items-center justify-center rounded-sm border transition-all',
                        state.mute
                            ? 'bg-[hsl(var(--color-danger)_/_0.18)] border-[hsl(var(--color-danger)_/_0.45)] text-[hsl(var(--color-danger))]'
                            : 'bg-transparent border-[hsl(var(--color-control-border))] text-zinc-600 hover:text-zinc-400 hover:border-[hsl(var(--color-control-border-strong))]'
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_6px_hsla(var(--color-danger),0.15)]'
                            : 'bg-transparent border-white/[0.06] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.1]'
                    )}
                >
                    M
                </button>
                {!isMaster && (
                    <button
                        onClick={() => onStateChange({ solo: !state.solo })}
                        className={cn(
                            'text-[7px] font-black w-6 h-5 flex items-center justify-center rounded-sm border transition-all',
                            state.solo
                                ? 'bg-[hsl(var(--color-warning)_/_0.18)] border-[hsl(var(--color-warning)_/_0.45)] text-[hsl(var(--color-warning))]'
                                : 'bg-transparent border-[hsl(var(--color-control-border))] text-zinc-600 hover:text-zinc-400 hover:border-[hsl(var(--color-control-border-strong))]'
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_6px_hsla(var(--color-warning),0.15)]'
                                : 'bg-transparent border-white/[0.06] text-zinc-600 hover:text-zinc-400 hover:border-white/[0.1]'
                        )}
                    >
                        S
                    </button>
                )}
            </div>
        </div>
    );
}

export function DegenMixer({ channels = DEFAULT_MIXER_CHANNELS, initialStates, telemetryTick, className }: DegenMixerProps) {
    const [states, setStates] = useState<Record<string, MixerChannelState>>(initialStates ?? buildDefaultMixerState(channels));
export function DegenMixer({ channels = DEFAULT_CHANNELS, telemetry, className }: DegenMixerProps) {
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
    const [crossfader, setCrossfader] = useState(50);
    const [localTelemetryTick, setLocalTelemetryTick] = useState(0);

    useEffect(() => {
        setStates(initialStates ?? buildDefaultMixerState(channels));
    }, [channels, initialStates]);

    useEffect(() => {
        if (typeof telemetryTick === 'number') return;
        const id = setInterval(() => setLocalTelemetryTick((prev) => prev + 1), 100);
        return () => clearInterval(id);
    }, [telemetryTick]);
    const telemetryMap = useMemo(() => {
        const entries = telemetry?.mixer.channels ?? [];
        return new Map(entries.map((channel) => [channel.id, channel]));
    }, [telemetry]);

    const activeTick = typeof telemetryTick === 'number' ? telemetryTick : localTelemetryTick;

    const handleChannelChange = (channelId: string, partial: Partial<MixerChannelState>) => {
        setStates((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...partial },
        }));
    };

    return (
        <div className={cn('glass-panel overflow-hidden', className)}>
        <div className={cn(
            'glass-panel overflow-hidden',
            className
        )}>
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

            <div className="flex gap-1.5 p-3 overflow-x-auto custom-scrollbar">
                {channels.map((ch, i) => {
                    const baseState = states[ch.id] ?? buildDefaultMixerState([ch])[ch.id];
                    const baseVu = baseState.mute ? 0 : (baseState.volume / 100) * baseState.vuLevel;
                    const animatedVu = Math.max(0.08, Math.min(1, baseVu + Math.sin((activeTick + i * 3) / 6) * 0.08));

                    return (
                        <React.Fragment key={ch.id}>
                            {ch.type === 'master' && <div className="w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 self-stretch" />}
                            <ChannelStrip channel={ch} state={baseState} vuLevel={animatedVu} onStateChange={(partial) => handleChannelChange(ch.id, partial)} />
                {channels.map((ch) => {
                    const isMaster = ch.type === 'master';
                    const channelTelemetry = telemetryMap.get(ch.id);
                    return (
                        <React.Fragment key={ch.id}>
                            {isMaster && (
                                <div className="w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 self-stretch" />
                            )}
                            <ChannelStrip
                                channel={ch}
                                state={states[ch.id]}
                                telemetryLevel={channelTelemetry?.level ?? 0}
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
                        {/* Track */}
                        <div className="absolute inset-x-0 h-[4px] rounded-sm overflow-hidden">
                    <span className="text-[9px] font-black text-deck-a w-3">A</span>
                    <div className="flex-1 relative group h-6 flex items-center">
                        <div className="absolute inset-x-0 h-[4px] rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-white/[0.04]" />
                            <div className="absolute inset-y-0 left-0" style={{ width: `${crossfader}%`, background: 'linear-gradient(90deg, #aaff0030, transparent)' }} />
                            <div className="absolute inset-y-0 right-0" style={{ width: `${100 - crossfader}%`, background: 'linear-gradient(-90deg, #9933ff30, transparent)' }} />
                            <div
                                className="absolute inset-y-0 left-0"
                                style={{
                                    width: `${crossfader}%`,
                                    background: 'linear-gradient(90deg, hsla(var(--color-deck-a), 0.22), transparent)',
                                    background: 'linear-gradient(90deg, hsla(var(--color-deck-a), 0.18), transparent)',
                                }}
                            />
                            <div
                                className="absolute inset-y-0 right-0"
                                style={{
                                    width: `${100 - crossfader}%`,
                                    background: 'linear-gradient(-90deg, hsla(var(--color-deck-b), 0.22), transparent)',
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
                            className="absolute w-5 h-3 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600 border border-white/20 pointer-events-none shadow-lg"
                            style={{ left: `calc(${crossfader}% - 10px)`, boxShadow: '0 2px 6px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.05)' }}
                            className="absolute w-5 h-3 rounded-[2px] bg-gradient-to-b from-zinc-400 to-zinc-600 border border-[hsl(var(--color-control-border-strong))] pointer-events-none"
                            style={{
                                left: `calc(${crossfader}% - 10px)`,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
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
