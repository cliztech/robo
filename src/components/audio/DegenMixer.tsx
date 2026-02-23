'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';

interface ChannelState {
    volume: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    eq: { hi: number; mid: number; lo: number };
    vuLevel: number;
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
    { id: 'deck-a', label: 'DECK A', color: '#027de1', type: 'deck' },
    { id: 'deck-b', label: 'DECK B', color: '#10b981', type: 'deck' },
    { id: 'mic', label: 'MIC', color: '#9ca3af', type: 'mic' },
    { id: 'aux', label: 'AUX', color: '#f59e0b', type: 'aux' },
    { id: 'master', label: 'MASTER', color: '#f8fafc', type: 'master' },
];

/* ── Fader Track SVG ───────── */
function FaderTrack({ value, color, isMaster }: { value: number; color: string; isMaster: boolean }) {
    const fillHeight = (value / 100) * 80;
    return (
        <svg viewBox="0 0 12 90" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Track groove */}
            <rect x="4.5" y="4" width="3" height="82" rx="1.5" fill="rgba(255,255,255,0.03)" />
            {/* Fill from bottom */}
            <rect
                x="4.5"
                y={86 - fillHeight}
                width="3"
                height={fillHeight}
                rx="1.5"
                fill={color}
                opacity={0.25}
            />
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
                const y = 86 - (tick / 100) * 82;
                return (
                    <line
                        key={tick}
                        x1={tick === 100 ? 1 : 2}
                        y1={y}
                        x2={tick === 100 ? 11 : 10}
                        y2={y}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="0.5"
                    />
                );
            })}
            {/* dB labels */}
            <text x="0" y="8" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">+6</text>
            <text x="0" y="30" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">0</text>
            <text x="0" y="88" fill="rgba(255,255,255,0.15)" fontSize="3" fontFamily="monospace">-∞</text>
        </svg>
    );
}

/* ── Channel Strip ─────────── */
function ChannelStrip({
    channel,
    state,
    onStateChange,
}: {
    channel: MixerChannel;
    state: ChannelState;
    onStateChange: (partial: Partial<ChannelState>) => void;
}) {
    const isMaster = channel.type === 'master';
    const vuLevel = state.mute ? 0 : (state.volume / 100) * state.vuLevel;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all relative overflow-hidden',
                'border',
                isMaster
                    ? 'bg-white/[0.04] border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)]'
                    : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.035] hover:border-white/[0.08]'
            )}
            style={{ 
                minWidth: isMaster ? '96px' : '74px',
            }}
        >
            {/* Fine hardware grain overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[var(--noise-texture)]" />
            {/* Channel label with color dot */}
            <div className="flex items-center gap-1.5 w-full justify-center">
                <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                        backgroundColor: channel.color,
                        boxShadow: `0 0 6px ${channel.color}40`,
                    }}
                />
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {channel.label}
                </span>
            </div>

            {/* EQ knobs */}
            {!isMaster && (
                <div className="flex flex-col gap-2.5 items-center py-1">
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
                            size={26}
                        />
                    ))}
                </div>
            )}

            {/* Fader + VU */}
            <div className="flex items-stretch gap-1.5 flex-1">
                {/* VU */}
                <DegenVUMeter
                    level={vuLevel}
                    peak={Math.min(1, vuLevel * 1.12)}
                    orientation="vertical"
                    size="xs"
                />

                {/* Fader */}
                <div className="relative h-28 w-7 flex items-center justify-center">
                    <FaderTrack value={state.volume} color={channel.color} isMaster={isMaster} />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.volume}
                        onChange={(e) =>
                            onStateChange({ volume: Number(e.target.value) })
                        }
                        className="fader-vertical appearance-none cursor-pointer relative z-10"
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

                {isMaster && (
                    <DegenVUMeter
                        level={vuLevel * 0.95}
                        peak={Math.min(1, vuLevel * 1.08)}
                        orientation="vertical"
                        size="xs"
                    />
                )}
            </div>

            {/* Volume readout */}
            <div className="px-2 py-0.5 rounded bg-black/30 border border-white/[0.03]">
                <span className="text-[9px] font-mono font-bold text-zinc-400 tabular-nums">
                    {Math.round(state.volume)}
                </span>
            </div>

            {/* Pan (non-master) */}
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

            {/* Mute / Solo */}
            <div className="flex gap-1">
                <button
                    onClick={() => onStateChange({ mute: !state.mute })}
                    className={cn(
                        'text-[7px] font-black w-6 h-5 flex items-center justify-center rounded-sm border transition-all',
                        state.mute
                            ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_6px_rgba(239,68,68,0.15)]'
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
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.15)]'
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

/* ── Mixer Console ─────────── */
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
                    vuLevel: 0.6 + Math.random() * 0.3,
                },
            }),
            {} as Record<string, ChannelState>
        )
    );
    const [crossfader, setCrossfader] = useState(50);

    // Simulate VU movement
    useEffect(() => {
        const id = setInterval(() => {
            setStates((prev) => {
                const next = { ...prev };
                for (const key of Object.keys(next)) {
                    next[key] = {
                        ...next[key],
                        vuLevel: Math.max(0.1, Math.min(1, next[key].vuLevel + (Math.random() - 0.5) * 0.1)),
                    };
                }
                return next;
            });
        }, 100);
        return () => clearInterval(id);
    }, []);

    const handleChannelChange = (channelId: string, partial: Partial<ChannelState>) => {
        setStates((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...partial },
        }));
    };

    return (
        <div className={cn(
            'relative overflow-hidden border border-white/[0.08] rounded-xl shadow-2xl',
            'bg-[var(--metal-bg)]', // Use the new hardware metal background
            className
        )}>
            {/* Global Noise Overlay for hardware feel */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[var(--noise-texture)] z-0" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100">
                        Aether Studio <span className="text-zinc-500 font-medium">Mixer</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/[0.05]">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-mono font-bold text-emerald-500/80">32-BIT FLOAT</span>
                    </div>
                </div>
            </div>

            {/* Channel strips */}
            <div className="flex gap-1.5 p-3 overflow-x-auto custom-scrollbar">
                {channels.map((ch, i) => {
                    const isMaster = ch.type === 'master';
                    return (
                        <React.Fragment key={ch.id}>
                            {isMaster && (
                                <div className="w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 self-stretch" />
                            )}
                            <ChannelStrip
                                channel={ch}
                                state={states[ch.id]}
                                onStateChange={(partial) => handleChannelChange(ch.id, partial)}
                            />
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Crossfader */}
            <div className="px-4 pb-3 pt-1 border-t border-white/[0.03]">
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Crossfader</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-lime-500/70 w-3">A</span>
                    <div className="flex-1 relative group h-6 flex items-center">
                        {/* Track */}
                        <div className="absolute inset-x-0 h-[4px] rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-white/[0.04]" />
                            {/* Gradient fill from A to B */}
                            <div
                                className="absolute inset-y-0 left-0"
                                style={{
                                    width: `${crossfader}%`,
                                    background: 'linear-gradient(90deg, #aaff0030, transparent)',
                                }}
                            />
                            <div
                                className="absolute inset-y-0 right-0"
                                style={{
                                    width: `${100 - crossfader}%`,
                                    background: 'linear-gradient(-90deg, #9933ff30, transparent)',
                                }}
                            />
                        </div>
                        {/* Center marker */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-[1px] h-3 bg-white/[0.08] pointer-events-none" />
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={crossfader}
                            onChange={(e) => setCrossfader(parseInt(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                            aria-label="Crossfader"
                        />
                        {/* Thumb */}
                        <div
                            className="absolute w-5 h-3 rounded-sm bg-gradient-to-b from-zinc-400 to-zinc-600 border border-white/20 pointer-events-none shadow-lg"
                            style={{
                                left: `calc(${crossfader}% - 10px)`,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Grip lines */}
                            <div className="absolute inset-x-1.5 top-[4px] h-[1px] bg-white/20" />
                            <div className="absolute inset-x-1.5 top-[7px] h-[1px] bg-white/20" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-purple-500/70 w-3 text-right">B</span>
                </div>
            </div>
        </div>
    );
}
