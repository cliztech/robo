'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { Button } from '../primitives/button';

interface PlaylistTrack {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
}

interface AudioPlayerProps {
  playlist: PlaylistTrack[];
  autoPlay?: boolean;
  className?: string;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function AudioPlayer({ playlist, autoPlay = false, className = '' }: AudioPlayerProps) {
  const { isInitialized, currentTrack, isPlaying, metrics, initialize, play, crossfade, pause, resume, setVolume } =
    useAudioEngine();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(70);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && autoPlay && playlist.length > 0 && !currentTrack) {
      void handlePlay(0);
    }
  }, [isInitialized, autoPlay, playlist.length, currentTrack]);

  useEffect(() => {
    if (!isPlaying && currentTrack && metrics && metrics.remainingTime < 0.1) {
      void handleNext();
    }
  }, [isPlaying, currentTrack, metrics]);

  const handlePlay = async (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    await play({ ...track, fadeIn: 0.5 });
    setCurrentIndex(index);
  };

  const handleCrossfade = async (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    await crossfade({ ...track, fadeIn: 3 }, 3);
    setCurrentIndex(index);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
      return;
    }

    if (currentTrack) {
      await resume();
      return;
    }

    if (playlist.length > 0) {
      await handlePlay(currentIndex);
    }
  };

  const handleNext = async () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    if (currentTrack) {
      await handleCrossfade(nextIndex);
    } else {
      await handlePlay(nextIndex);
    }
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume / 100);
    if (isMuted && newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume / 100);
      setVolumeState(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setVolumeState(0);
      setIsMuted(true);
    }
  };

  const currentPlaylistTrack = playlist[currentIndex];
  const progress = useMemo(() => {
    if (!metrics || metrics.duration <= 0) return 0;
    return Math.min(100, (metrics.currentTime / metrics.duration) * 100);
  }, [metrics]);

  return (
    <div className={`bg-zinc-900 rounded-lg p-6 space-y-4 text-white ${className}`.trim()}>
      <div className="text-center">
        <h3 className="text-xl font-semibold">{currentTrack?.title || currentPlaylistTrack?.title || 'No track loaded'}</h3>
        <p className="text-sm text-zinc-400">{currentTrack?.artist || currentPlaylistTrack?.artist || '—'}</p>
      </div>

      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatDuration(metrics?.currentTime ?? 0)}</span>
          <span>{formatDuration(metrics?.duration ?? currentPlaylistTrack?.duration ?? 0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button onClick={() => void handlePlayPause()} disabled={!isInitialized || playlist.length === 0} className="px-4 py-2">
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button onClick={() => void handleNext()} disabled={!isInitialized || playlist.length === 0} className="px-4 py-2">
          Next
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={toggleMute} className="px-3 py-2" aria-label="Toggle mute">
          {isMuted || volume === 0 ? 'Unmute' : 'Mute'}
        </Button>
        <input
          type="range"
          value={volume}
          min={0}
          max={100}
          step={1}
          onChange={handleVolumeChange}
          className="flex-1"
          aria-label="Volume"
        />
        <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(volume)}%</span>
      </div>
    </div>
  );
}
