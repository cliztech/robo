'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DegenVUMeter } from './DegenVUMeter';
import { DegenKnob } from './DegenKnob';
import { DEFAULT_MIXER_CHANNELS, type MixerChannel } from '@/lib/degenDataAdapters';
import { useStudioStore } from '@/stores/studioState';
import type { DJTelemetry } from '@/lib/audio/telemetry';

interface DegenMixerProps {
  channels?: MixerChannel[];
  telemetry?: DJTelemetry;
  className?: string;
}

interface ChannelStripProps {
  channel: MixerChannel;
  gain: number;
  eq: { hi: number; mid: number; low: number };
  telemetryLevel: number;
  telemetryPeak: number;
  onGainChange: (gain: number) => void;
  onEQChange: (band: 'hi' | 'mid' | 'low', value: number) => void;
}

function ChannelStrip({ channel, gain, eq, telemetryLevel, telemetryPeak, onGainChange, onEQChange }: ChannelStripProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-16 group relative">
      <div className="absolute inset-0 bg-white/[0.02] rounded-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex flex-col items-center gap-1.5 pt-2 pb-1 w-full border-b border-white/[0.04]">
        <div className="text-[9px] font-black uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded-sm" style={{ color: channel.color, backgroundColor: `${channel.color}15` }}>
          {channel.label}
        </div>
        <DegenKnob value={eq.hi} onChange={(v) => onEQChange('hi', v)} label="HI" size={28} color={channel.color} />
        <DegenKnob value={eq.mid} onChange={(v) => onEQChange('mid', v)} label="MID" size={28} color={channel.color} />
        <DegenKnob value={eq.low} onChange={(v) => onEQChange('low', v)} label="LOW" size={28} color={channel.color} />
      </div>

      <div className="flex gap-2 h-32 items-stretch">
        <div className="h-full pt-1 pb-1">
          <DegenVUMeter level={telemetryLevel} peak={telemetryPeak} size="md" />
        </div>
        <div className="relative w-8 h-full bg-black/40 rounded-sm border border-white/[0.06] shadow-inner">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={gain}
            onChange={(e) => onGainChange(parseInt(e.target.value, 10))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            aria-label={`${channel.label} volume`}
          />
          <div className="absolute left-0 right-0 h-8 -ml-[1px] -mr-[1px] z-10" style={{ bottom: `${gain}%`, transform: 'translateY(50%)' }}>
            <div className="w-full h-full rounded-[1px] bg-zinc-700 border border-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DegenMixer({ channels = DEFAULT_MIXER_CHANNELS, telemetry, className }: DegenMixerProps) {
  const mixer = useStudioStore((state) => state.mixer);
  const storeTelemetry = useStudioStore((state) => state.telemetry);
  const setChannelGain = useStudioStore((state) => state.setChannelGain);
  const setChannelEq = useStudioStore((state) => state.setChannelEq);
  const setCrossfader = useStudioStore((state) => state.setCrossfader);

  const activeTelemetry = telemetry ?? storeTelemetry;
  const telemetryMap = useMemo(() => {
    // Correctly map telemetry data
    if (!activeTelemetry?.mixer?.channels) return new Map();
    return new Map(activeTelemetry.mixer.channels.map((ch: any) => [ch.id, ch]));
  }, [activeTelemetry]);

  return (
    <div className={cn('glass-panel overflow-hidden', className)}>
      <div className="panel-header">
        <span className="panel-header-title">Mixer Console</span>
        <span className="text-[8px] font-mono text-zinc-600">{channels.length} CH</span>
      </div>

      <div className="flex gap-1.5 p-3 overflow-x-auto custom-scrollbar items-start">
        {channels.map((channel) => {
          const state = mixer.channels[channel.id] ?? { gain: 70, eq: { hi: 50, mid: 50, low: 50 } };
          const channelTelemetry = telemetryMap.get(channel.id);
          return (
            <ChannelStrip
              key={channel.id}
              channel={channel}
              gain={state.gain}
              eq={state.eq}
              telemetryLevel={channelTelemetry?.level ?? state.gain / 100}
              telemetryPeak={channelTelemetry?.peak ?? state.gain / 100}
              onGainChange={(gain) => setChannelGain(channel.id, gain)}
              onEQChange={(band, value) => setChannelEq(channel.id, band, value)}
            />
          );
        })}
      </div>

      <div className="px-4 pb-3 pt-1 border-t border-white/[0.03]">
        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600">Crossfader</span>
        <input
          type="range"
          min={0}
          max={100}
          value={mixer.crossfader}
          onChange={(e) => setCrossfader(parseInt(e.target.value, 10))}
          className="w-full"
          aria-label="Crossfader"
        />
      </div>
    </div>
  );
}
