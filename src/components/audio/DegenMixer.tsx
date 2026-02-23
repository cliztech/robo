'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';

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
    telemetry?: any; // Simplified for now
    className?: string;
}

const DEFAULT_CHANNELS: MixerChannel[] = [
    { id: 'deck-a', label: 'DECK A', color: '#027de1', type: 'deck' },
    { id: 'deck-b', label: 'DECK B', color: '#10b981', type: 'deck' },
    { id: 'mic', label: 'MIC', color: '#9ca3af', type: 'mic' },
    { id: 'aux', label: 'AUX', color: '#f59e0b', type: 'aux' },
    { id: 'master', label: 'MASTER', color: '#f8fafc', type: 'master' },
];

function FaderTrack({ value, color }: { value: number; color: string }) {
    const fillHeight = (value / 100) * 82;
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

function ChannelStrip({
    channel,
    state,
    onStateChange,
    telemetryLevel = 0,
    telemetryPeak = 0,
}: {
    channel: MixerChannel;
    state: ChannelState;
    onStateChange: (partial: Partial<ChannelState>) => void;
    telemetryLevel?: number;
    telemetryPeak?: number;
}) {
    const isMaster = channel.type === 'master';
    const vuLevel = state.mute ? 0 : (state.volume / 100) * telemetryLevel;
    const vuPeak = state.mute ? 0 : (state.volume / 100) * telemetryPeak;

    return (
        <div
            className={cn(
                'flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all border relative overflow-hidden',
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
            <div className="flex items-center gap-1.5 w-full justify-center relative z-10">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: channel.color, boxShadow: `0 0 6px ${channel.color}40` }} />
                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-zinc-400">{channel.label}</span>
            </div>

            {!isMaster && (
                <div className="flex flex-col gap-2.5 items-center py-1 relative z-10">
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

            <div className="flex items-stretch gap-1.5 flex-1 relative z-10">
                <DegenVUMeter level={vuLevel} peak={vuPeak} orientation="vertical" size="xs" />

                <div className="relative h-28 w-7 flex items-center justify-center">
                    <FaderTrack value={state.volume} color={channel.color} />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.volume}
                        onChange={(e) => onStateChange({ volume: Number(e.target.value) })}
                        className="fader-vertical appearance-none cursor-pointer relative z-10"
                        style={{ 
                             writingMode: 'vertical-lr' as React.CSSProperties['writingMode'], 
                             direction: 'rtl', 
                             width: '28px', 
                             height: '100px', 
                             background: 'transparent' 
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

            <div className="px-2 py-0.5 rounded bg-black/30 border border-white/[0.03] relative z-10">
                <span className="text-[9px] font-mono font-bold text-zinc-400 tabular-nums">{Math.round(state.volume)}</span>
            </div>

            {!isMaster && (
                <div className="relative z-10">
                    <DegenKnob
                        label="PAN"
                        value={state.pan + 50}
                        min={0}
                        max={100}
                        onChange={(v) => onStateChange({ pan: v - 50 })}
                        size={22}
                    />
                </div>
            )}

            <div className="flex gap-1 relative z-10">
                <button
                    onClick={() => onStateChange({ mute: !state.mute })}
                    aria-label={`${channel.label} mute`}
                    aria-pressed={state.mute}
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
                        aria-label={`${channel.label} solo`}
                        aria-pressed={state.solo}
                        className={cn(
                            'text-[7px] font-black w-6 h-5 flex items-center justify-center rounded-sm border transition-all',
                            state.solo
                                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.15)]'
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

export function DegenMixer({ 
    channels = DEFAULT_CHANNELS, 
    telemetry, 
    className 
}: DegenMixerProps) {
    const [states, setStates] = useState<Record<string, ChannelState>>({});
    const [crossfader, setCrossfader] = useState(50);
    const [localTelemetryTick, setLocalTelemetryTick] = useState(0);

    // Initialize states
    useEffect(() => {
        const initial = channels.reduce((acc, ch) => ({
            ...acc,
            [ch.id]: {
                volume: ch.type === 'master' ? 80 : 70,
                pan: 0,
                mute: false,
                solo: false,
                eq: { hi: 50, mid: 50, lo: 50 },
            }
        }), {} as Record<string, ChannelState>);
        setStates(initial);
    }, [channels]);

    // Local telemetry tick for animations if no real telemetry
    useEffect(() => {
        if (telemetry) return;
        const id = setInterval(() => setLocalTelemetryTick(prev => prev + 1), 100);
        return () => clearInterval(id);
    }, [telemetry]);

    const handleChannelChange = (channelId: string, partial: Partial<ChannelState>) => {
        setStates((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...partial },
        }));
    };

    return (
        <div className={cn(
            'relative overflow-hidden border border-white/[0.08] rounded-xl shadow-2xl',
            'bg-[var(--metal-bg)]', 
            className
        )}>
            {/* Global Noise Overlay */}
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

            <div className="flex gap-1.5 p-3 overflow-x-auto custom-scrollbar relative z-10">
                {channels.map((ch, i) => {
                    const state = states[ch.id];
                    if (!state) return null;
                    
                    // Simple animation for VU levels if no telemetry
                    const level = telemetry ? (telemetry.mixer?.channels?.find((c: any) => c.id === ch.id)?.level ?? 0) 
                                            : (Math.max(0.08, 0.4 + Math.sin((localTelemetryTick + i * 3) / 6) * 0.2));

                    return (
                        <React.Fragment key={ch.id}>
                            {ch.type === 'master' && (
                                <div className="w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 self-stretch" />
                            )}
                            <ChannelStrip 
                                channel={ch} 
                                state={state} 
                                telemetryLevel={level}
                                onStateChange={(partial) => handleChannelChange(ch.id, partial)} 
                            />
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Crossfader Section */}
            <div className="px-4 pb-3 pt-1 border-t border-white/[0.03] relative z-10">
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Crossfader</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-blue-400/80 w-3">A</span>
                    <div className="flex-1 relative group h-6 flex items-center">
                        <div className="absolute inset-x-0 h-[4px] rounded-full overflow-hidden">
                            <div className="absolute inset-0 bg-white/[0.04]" />
                            <div 
                                className="absolute inset-y-0 left-0" 
                                style={{ 
                                    width: `${crossfader}%`, 
                                    background: 'linear-gradient(90deg, rgba(59,130,246,0.18), transparent)' 
                                }} 
                            />
                            <div 
                                className="absolute inset-y-0 right-0" 
                                style={{ 
                                    width: `${100 - crossfader}%`, 
                                    background: 'linear-gradient(-90deg, rgba(16,185,129,0.18), transparent)' 
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
                            className="absolute w-5 h-3 rounded-[2px] bg-gradient-to-b from-zinc-400 to-zinc-600 border border-white/20 pointer-events-none"
                            style={{
                                left: `calc(${crossfader}% - 10px)`,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.05)',
                            }}
                        >
                            <div className="absolute inset-x-1.5 top-[4px] h-[1px] bg-white/20" />
                            <div className="absolute inset-x-1.5 top-[7px] h-[1px] bg-white/20" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400/80 w-3 text-right">B</span>
                </div>
            </div>
        </div>
    );
}
