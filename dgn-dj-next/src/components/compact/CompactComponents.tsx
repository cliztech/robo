// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Compact Components for Modular Layout
//  Lightweight versions of DJ components for use in modular canvas
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════
//  Compact CDJ Deck
// ═══════════════════════════════════════════════════════════════

interface CompactDeckProps {
  deck: 'A' | 'B';
  compact?: boolean;
}

export function CompactDeck({ deck, compact = false }: CompactDeckProps) {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [bpm, setBpm] = useState(deck === 'A' ? 128.0 : 126.5);
  const [pitch, setPitch] = useState(0);
  
  const accentColor = deck === 'A' ? '#0091FF' : '#FF5500';

  // Simulate playback
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setPosition(p => (p + 0.1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  const size = compact ? 120 : 180;

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-800">
        <span className="text-xs font-bold" style={{ color: accentColor }}>DECK {deck}</span>
        <span className="text-xs text-zinc-500">{bpm.toFixed(1)} BPM</span>
      </div>

      {/* Jog Wheel Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div 
          className="rounded-full border-2 relative"
          style={{ 
            width: size, 
            height: size, 
            borderColor: accentColor,
            background: 'radial-gradient(circle, #1a1a1a 0%, #0a0a0a 100%)'
          }}
        >
          {/* Position indicator */}
          <div 
            className="absolute w-1 h-3 rounded-full"
            style={{ 
              background: accentColor,
              top: 4,
              left: '50%',
              transform: `translateX(-50%) rotate(${position * 3.6}deg)`,
              transformOrigin: '50% ' + (size / 2 - 6) + 'px'
            }}
          />
          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: accentColor, fontSize: compact ? '16px' : '24px' }}>
                {bpm.toFixed(1)}
              </div>
              {!compact && (
                <div className="text-xs text-zinc-500">
                  {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 p-2 bg-zinc-800">
        <button
          onClick={() => setPlaying(!playing)}
          className={`px-3 py-1 rounded text-xs font-bold ${
            playing ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {playing ? '■' : '▶'}
        </button>
        <button
          onClick={() => setPosition(0)}
          className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded text-xs font-bold"
        >
          CUE
        </button>
      </div>

      {/* Pitch slider (non-compact) */}
      {!compact && (
        <div className="px-2 pb-2">
          <input
            type="range"
            min="-8"
            max="8"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>-8%</span>
            <span>+8%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact Mixer Channel
// ═══════════════════════════════════════════════════════════════

interface CompactMixerChannelProps {
  channel: number;
  accentColor: string;
}

export function CompactMixerChannel({ channel, accentColor }: CompactMixerChannelProps) {
  const [volume, setVolume] = useState(80);
  const [level, setLevel] = useState(0);

  // Simulate level
  useEffect(() => {
    const interval = setInterval(() => {
      const base = volume / 100;
      setLevel(Math.max(0, Math.min(1, base + (Math.random() * 0.2 - 0.1))));
    }, 50);
    return () => clearInterval(interval);
  }, [volume]);

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-zinc-900 rounded-lg">
      <span className="text-xs font-bold text-zinc-400">{channel}</span>
      
      {/* Level meter */}
      <div className="flex gap-[2px] h-16">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-sm"
            style={{
              background: level > (i + 1) / 8 
                ? (i > 5 ? '#ef4444' : i > 3 ? '#eab308' : accentColor)
                : '#3f3f46',
              height: '100%'
            }}
          />
        ))}
      </div>

      {/* Fader */}
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => setVolume(parseInt(e.target.value))}
        className="h-16"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
      />
      <span className="text-[10px] text-zinc-500">{volume}</span>

      {/* Mute */}
      <button className="px-2 py-1 bg-zinc-700 text-zinc-400 rounded text-[10px]">
        M
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact FX Rack
// ═══════════════════════════════════════════════════════════════

export function CompactFXRack() {
  const effects = ['REVERB', 'DELAY', 'ECHO', 'FILTER'];
  const [activeFX, setActiveFX] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      <div className="px-2 py-1 bg-zinc-800 text-xs font-bold text-zinc-400">
        FX RACK
      </div>
      <div className="flex-1 grid grid-cols-2 gap-1 p-2">
        {effects.map(fx => (
          <button
            key={fx}
            onClick={() => setActiveFX(activeFX === fx ? null : fx)}
            className={`px-1 py-2 rounded text-[10px] font-bold transition-colors ${
              activeFX === fx 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
            }`}
          >
            {fx}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact Performance Pads
// ═══════════════════════════════════════════════════════════════

export function CompactPads() {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'];
  const [activePads, setActivePads] = useState<number[]>([]);

  const handlePad = (index: number) => {
    setActivePads(prev => 
      prev.includes(index) ? prev.filter(p => p !== index) : [...prev, index]
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      <div className="px-2 py-1 bg-zinc-800 text-xs font-bold text-zinc-400">
        PADS
      </div>
      <div className="flex-1 grid grid-cols-4 gap-1 p-2">
        {colors.map((color, i) => (
          <button
            key={i}
            onMouseDown={() => handlePad(i)}
            className={`rounded transition-all ${
              activePads.includes(i) 
                ? 'scale-95 brightness-125' 
                : 'brightness-75 hover:brightness-100'
            }`}
            style={{ backgroundColor: color, aspectRatio: '1' }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact Waveform
// ═══════════════════════════════════════════════════════════════

export function CompactWaveform() {
  const [progress, setProgress] = useState(35);

  // Generate random waveform bars
  const bars = Array.from({ length: 50 }, () => Math.random() * 0.6 + 0.2);

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800">
        <span className="text-xs font-bold text-zinc-400">WAVEFORM</span>
      </div>
      <div className="flex-1 relative px-2 pb-2">
        <div className="flex items-end justify-between h-full gap-[2px]">
          {bars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${height * 100}%`,
                background: i / bars.length < progress / 100 ? '#0091FF' : '#3f3f46'
              }}
            />
          ))}
        </div>
        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact Browser
// ═══════════════════════════════════════════════════════════════

export function CompactBrowser() {
  const tracks = [
    { title: 'Midnight Drive', artist: 'DJ Shadow', bpm: 124 },
    { title: 'Electric Feel', artist: 'Daft Punk', bpm: 128 },
    { title: 'Strobe', artist: 'deadmau5', bpm: 128 },
    { title: 'Levels', artist: 'Avicii', bpm: 126 },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      <div className="px-2 py-1 bg-zinc-800 text-xs font-bold text-zinc-400">
        TRACKS
      </div>
      <div className="flex-1 overflow-auto">
        {tracks.map((track, i) => (
          <div 
            key={i}
            className="px-2 py-1 border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer"
          >
            <div className="text-xs text-zinc-200 truncate">{track.title}</div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{track.artist}</span>
              <span>{track.bpm}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Compact Broadcast Panel
// ═══════════════════════════════════════════════════════════════

export function CompactBroadcast() {
  const [live, setLive] = useState(true);
  const [listeners, setListeners] = useState(247);

  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg overflow-hidden">
      <div className="px-2 py-1 bg-zinc-800 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-400">BROADCAST</span>
        <span className={`text-[10px] px-1 rounded ${live ? 'bg-red-600 text-white' : 'bg-zinc-600 text-zinc-400'}`}>
          {live ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      <div className="flex-1 p-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-500">Listeners</span>
          <span className="text-lg font-bold text-green-400">{listeners}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-500">Bitrate</span>
          <span className="text-sm text-zinc-300">128 kbps</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500">Codec</span>
          <span className="text-sm text-zinc-300">MP3</span>
        </div>
      </div>
    </div>
  );
}
