'use client';

import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { DegenStereoMeter } from './DegenVUMeter';
import type { DJTelemetry } from '../../lib/audio/telemetry';
import { Pause, Play, Radio, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useStudioStore } from '../../stores/studioState';

interface DegenTransportProps {
  telemetry?: DJTelemetry;
  isPlaying?: boolean;
  isOnAir?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
}

export function DegenTransport({ telemetry, isPlaying, isOnAir = true, onPlayPause, onNext, onPrev, className }: DegenTransportProps) {
  const deckA = useStudioStore((state) => state.decks.A);
  const mixer = useStudioStore((state) => state.mixer);
  const storeTelemetry = useStudioStore((state) => state.telemetry);
  const toggleDeckPlayback = useStudioStore((state) => state.toggleDeckPlayback);
  const seekDeck = useStudioStore((state) => state.seekDeck);
  const setMasterVolume = useStudioStore((state) => state.setMasterVolume);
  const toggleMuted = useStudioStore((state) => state.toggleMuted);

  const activeTelemetry = telemetry ?? storeTelemetry;
  const effectiveIsPlaying = isPlaying ?? deckA.isPlaying;
  const progress = deckA.waveformPosition;
  const duration = deckA.durationSeconds || deckA.track?.duration || 0;
  const elapsed = progress * duration;
  const remaining = Math.max(0, duration - elapsed);
  const vuLeft = activeTelemetry?.stereoLevels.leftLevel ?? 0;
  const vuRight = activeTelemetry?.stereoLevels.rightLevel ?? 0;
  const peakLeft = activeTelemetry?.stereoLevels.leftPeak ?? vuLeft;
  const peakRight = activeTelemetry?.stereoLevels.rightPeak ?? vuRight;

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const m = Math.floor(safeSeconds / 60);
    const s = Math.floor(safeSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const volumeIcon = useMemo(() => {
    if (mixer.muted || mixer.masterVolume <= 0) return VolumeX;
    return mixer.masterVolume < 40 ? Volume1 : Volume2;
  }, [mixer.masterVolume, mixer.muted]);

  const VolumeIcon = volumeIcon;

  return (
    <div className={cn('h-16 bg-black/60 backdrop-blur-xl border-t border-white/[0.04] flex items-center px-2 gap-2 shrink-0 z-20', className)}>
      <div className="w-12 flex justify-center">
        {isOnAir ? <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> : <div className="w-3 h-3 rounded-full bg-zinc-700" />}
      </div>

      <div className="w-52 px-2 shrink-0">
        <div className="text-[11px] font-bold text-white truncate tracking-wide">{deckA.track?.title ?? 'No track loaded'}</div>
        <div className="text-[10px] text-zinc-500 truncate">{deckA.track?.artist ?? '—'}</div>
      </div>

      <div className="flex items-center gap-1 px-2 shrink-0">
        <button type="button" onClick={onPrev} aria-label="Previous track" className="p-1.5 text-zinc-400 hover:text-white"><SkipBack size={14} /></button>
        <button
          type="button"
          onClick={() => {
            void toggleDeckPlayback('A');
            onPlayPause?.();
          }}
          aria-label={effectiveIsPlaying ? 'Pause playback' : 'Start playback'}
          aria-pressed={effectiveIsPlaying}
          className={cn('p-2 rounded-full focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black', effectiveIsPlaying ? 'bg-lime-400/90 text-black' : 'bg-zinc-700 text-white')}
        >
          {effectiveIsPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button type="button" onClick={onNext} aria-label="Next track" className="p-1.5 text-zinc-400 hover:text-white"><SkipForward size={14} /></button>
      </div>

      <div className="flex-1 flex items-center gap-3 px-2 min-w-0">
        <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-9 text-right shrink-0">{formatTime(elapsed)}</span>
        <input
          aria-label="Playback position"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={(e) => seekDeck('A', parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-9 shrink-0">-{formatTime(remaining)}</span>
      </div>

      <div className="flex flex-col items-center px-2 py-1 rounded bg-white/[0.02]">
        <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">BPM</span>
        <span className="text-[12px] font-mono font-black text-zinc-300 tabular-nums">{deckA.bpm ?? '—'}</span>
      </div>

      <div className="flex flex-col items-center px-2 py-1 rounded bg-deck-b-soft border border-deck-b-soft">
        <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Key</span>
        <span className="text-[12px] font-mono font-black text-[hsl(var(--color-deck-b))] tabular-nums">{deckA.key ?? '—'}</span>
      </div>

      <div className="px-2 shrink-0 border-l border-white/[0.04]">
        <DegenStereoMeter leftLevel={vuLeft} rightLevel={vuRight} leftPeak={peakLeft} rightPeak={peakRight} size="sm" showDb />
      </div>

      <div className="flex items-center gap-2 px-2 w-36 shrink-0 border-l border-white/[0.04]">
        <button
          type="button"
          onClick={toggleMuted}
          aria-label={mixer.muted ? 'Unmute output' : 'Mute output'}
          aria-pressed={mixer.muted}
          className={cn('p-1 rounded', mixer.muted ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300')}
        >
          <VolumeIcon size={14} />
        </button>
        <input
          aria-label="Output volume"
          type="range"
          min={0}
          max={100}
          value={mixer.masterVolume}
          onChange={(e) => setMasterVolume(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <span className="text-[9px] font-mono text-zinc-600 tabular-nums w-6 text-right">{mixer.masterVolume}</span>
      </div>

      <div className="flex items-center gap-1 px-2">
        <Radio size={10} className={cn(activeTelemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-700')} />
        <span className={cn('text-[8px] font-black uppercase tracking-wider', activeTelemetry?.signalFlags.clipDetected ? 'text-red-400' : 'text-zinc-600')}>Clip</span>
      </div>
    </div>
  );
}
