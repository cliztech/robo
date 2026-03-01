// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — 4-Channel Mixer Component
//  Professional DJ mixer with EQ, filter, faders, crossfader
// ═══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react';
import { Knob } from '../ui/Knob';
import { Fader } from '../ui/Fader';
import { VUMeter } from '../mixer/VUMeter';

interface MixerChannelProps {
  channel: number;
  deck: 'A' | 'B' | 'C' | 'D';
  volume?: number;
  trim?: number;
  hi?: number;
  mid?: number;
  lo?: number;
  filter?: number;
  pan?: number;
  muted?: boolean;
  soloed?: boolean;
  onVolumeChange?: (value: number) => void;
  onTrimChange?: (value: number) => void;
  onHiChange?: (value: number) => void;
  onMidChange?: (value: number) => void;
  onLoChange?: (value: number) => void;
  onFilterChange?: (value: number) => void;
  onPanChange?: (value: number) => void;
  onMute?: () => void;
  onSolo?: () => void;
  accentColor?: string;
}

function MixerChannel({
  channel,
  deck,
  volume = 80,
  trim = 50,
  hi = 50,
  mid = 50,
  lo = 50,
  filter = 50,
  pan = 50,
  muted = false,
  soloed = false,
  onVolumeChange,
  onTrimChange,
  onHiChange,
  onMidChange,
  onLoChange,
  onFilterChange,
  onPanChange,
  onMute,
  onSolo,
  accentColor = '#0091FF',
}: MixerChannelProps) {
  const [level, setLevel] = useState(0);

  // Simulate level meter
  useEffect(() => {
    if (muted || volume === 0) {
      setLevel(0);
      return;
    }
    const interval = setInterval(() => {
      const baseLevel = volume / 100;
      const variation = Math.random() * 0.3 - 0.1;
      setLevel(Math.max(0, Math.min(1, baseLevel + variation)));
    }, 50);
    return () => clearInterval(interval);
  }, [volume, muted]);

  return (
    <div className={`flex flex-col gap-1 p-2 bg-zinc-900 rounded-lg ${muted ? 'opacity-50' : ''}`}>
      {/* Channel label */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-zinc-400">{channel}</span>
        <span className="text-zinc-600">{deck}</span>
      </div>

      {/* VU Meter */}
      <VUMeter level={level} className="h-24" segments={12} />

      {/* EQ Section */}
      <div className="flex flex-col gap-1">
        {/* High EQ */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 w-3">HI</span>
          <Knob
            value={hi}
            onChange={onHiChange}
            size={32}
            color={deck === 'A' || deck === 'C' ? 'deck-a' : 'deck-b'}
          />
        </div>
        
        {/* Mid EQ */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 w-3">MID</span>
          <Knob
            value={mid}
            onChange={onMidChange}
            size={32}
            color={deck === 'A' || deck === 'C' ? 'deck-a' : 'deck-b'}
          />
        </div>
        
        {/* Low EQ */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 w-3">LO</span>
          <Knob
            value={lo}
            onChange={onLoChange}
            size={32}
            color={deck === 'A' || deck === 'C' ? 'deck-a' : 'deck-b'}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-500 w-3">FIL</span>
        <Knob
          value={filter}
          onChange={onFilterChange}
          size={32}
          color="neutral"
        />
      </div>

      {/* Gain/Trim */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-zinc-500 w-3">TRM</span>
        <Knob
          value={trim}
          onChange={onTrimChange}
          size={28}
          color="neutral"
        />
      </div>

      {/* Volume Fader */}
      <div className="flex-1 flex flex-col items-center py-2">
        <Fader
          value={volume}
          onChange={onVolumeChange}
          orientation="vertical"
          height={100}
          color={accentColor}
        />
        <span className="text-xs text-zinc-500 mt-1">{volume}</span>
      </div>

      {/* Mute/Solo */}
      <div className="flex gap-1">
        <button
          className={`flex-1 py-1 text-xs font-bold rounded ${
            muted ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
          }`}
          onClick={onMute}
        >
          M
        </button>
        <button
          className={`flex-1 py-1 text-xs font-bold rounded ${
            soloed ? 'bg-yellow-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
          }`}
          onClick={onSolo}
        >
          S
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Main 4-Channel Mixer Component
// ═══════════════════════════════════════════════════════════════

interface Mixer4ChProps {
  channels?: {
    A: { volume: number; hi: number; mid: number; lo: number; filter: number; muted?: boolean };
    B: { volume: number; hi: number; mid: number; lo: number; filter: number; muted?: boolean };
    C: { volume: number; hi: number; mid: number; lo: number; filter: number; muted?: boolean };
    D: { volume: number; hi: number; mid: number; lo: number; filter: number; muted?: boolean };
  };
  crossfader?: number;
  masterVolume?: number;
  onChannelChange?: (channel: 'A' | 'B' | 'C' | 'D', param: string, value: number) => void;
  onCrossfaderChange?: (value: number) => void;
  onMasterChange?: (value: number) => void;
}

export const Mixer4Ch: React.FC<Mixer4ChProps> = ({
  channels = {
    A: { volume: 80, hi: 50, mid: 50, lo: 50, filter: 50 },
    B: { volume: 75, hi: 50, mid: 50, lo: 50, filter: 50 },
    C: { volume: 0, hi: 50, mid: 50, lo: 50, filter: 50 },
    D: { volume: 0, hi: 50, mid: 50, lo: 50, filter: 50 },
  },
  crossfader = 50,
  masterVolume = 85,
  onChannelChange,
  onCrossfaderChange,
  onMasterChange,
}) => {
  const handleChannelChange = useCallback((channel: 'A' | 'B' | 'C' | 'D') => 
    (param: string, value: number) => {
      onChannelChange?.(channel, param, value);
    }, [onChannelChange]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-2 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-900 rounded">
        <span className="text-sm font-bold text-zinc-300">MIXER</span>
        <span className="text-xs text-zinc-500">4-CHANNEL</span>
      </div>

      {/* Main mixer area */}
      <div className="flex-1 flex gap-2">
        {/* Channel strips */}
        <div className="flex gap-1">
          <MixerChannel
            channel={1}
            deck="A"
            volume={channels.A.volume}
            hi={channels.A.hi}
            mid={channels.A.mid}
            lo={channels.A.lo}
            filter={channels.A.filter}
            muted={channels.A.muted}
            accentColor="#0091FF"
            onVolumeChange={(v) => handleChannelChange('A')('volume', v)}
            onHiChange={(v) => handleChannelChange('A')('hi', v)}
            onMidChange={(v) => handleChannelChange('A')('mid', v)}
            onLoChange={(v) => handleChannelChange('A')('lo', v)}
            onFilterChange={(v) => handleChannelChange('A')('filter', v)}
          />
          <MixerChannel
            channel={2}
            deck="B"
            volume={channels.B.volume}
            hi={channels.B.hi}
            mid={channels.B.mid}
            lo={channels.B.lo}
            filter={channels.B.filter}
            muted={channels.B.muted}
            accentColor="#FF5500"
            onVolumeChange={(v) => handleChannelChange('B')('volume', v)}
            onHiChange={(v) => handleChannelChange('B')('hi', v)}
            onMidChange={(v) => handleChannelChange('B')('mid', v)}
            onLoChange={(v) => handleChannelChange('B')('lo', v)}
            onFilterChange={(v) => handleChannelChange('B')('filter', v)}
          />
          <MixerChannel
            channel={3}
            deck="C"
            volume={channels.C.volume}
            hi={channels.C.hi}
            mid={channels.C.mid}
            lo={channels.C.lo}
            filter={channels.C.filter}
            muted={channels.C.muted}
            accentColor="#22C55E"
            onVolumeChange={(v) => handleChannelChange('C')('volume', v)}
            onHiChange={(v) => handleChannelChange('C')('hi', v)}
            onMidChange={(v) => handleChannelChange('C')('mid', v)}
            onLoChange={(v) => handleChannelChange('C')('lo', v)}
            onFilterChange={(v) => handleChannelChange('C')('filter', v)}
          />
          <MixerChannel
            channel={4}
            deck="D"
            volume={channels.D.volume}
            hi={channels.D.hi}
            mid={channels.D.mid}
            lo={channels.D.lo}
            filter={channels.D.filter}
            muted={channels.D.muted}
            accentColor="#A855F7"
            onVolumeChange={(v) => handleChannelChange('D')('volume', v)}
            onHiChange={(v) => handleChannelChange('D')('hi', v)}
            onMidChange={(v) => handleChannelChange('D')('mid', v)}
            onLoChange={(v) => handleChannelChange('D')('lo', v)}
            onFilterChange={(v) => handleChannelChange('D')('filter', v)}
          />
        </div>

        {/* Master section */}
        <div className="w-24 flex flex-col gap-2 bg-zinc-900 rounded-lg p-2">
          <div className="text-xs text-zinc-500 text-center">MASTER</div>
          
          {/* Master VU */}
          <VUMeter level={masterVolume / 100} className="h-24" segments={16} />
          
          {/* Master fader */}
          <div className="flex-1 flex flex-col items-center">
            <Fader
              value={masterVolume}
              onChange={onMasterChange}
              orientation="vertical"
              height={80}
              color="#22C55E"
            />
            <span className="text-xs text-zinc-400 mt-1">{masterVolume}</span>
          </div>

          {/* Crossfader */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 text-center">XFADE</span>
            <Fader
              value={crossfader}
              onChange={onCrossfaderChange}
              orientation="horizontal"
              width={80}
              color="#FFFFFF"
            />
            <div className="flex justify-between text-[10px] text-zinc-600">
              <span>A</span>
              <span>B</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mixer4Ch;
