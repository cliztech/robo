'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { Button } from '@/components/primitives/button';

interface AudioPlayerProps {
  playlist: Array<{
    id: string;
    url: string;
    title: string;
    artist: string;
    duration: number;
  }>;
  autoPlay?: boolean;
  className?: string;
}

const formatDuration = (seconds: number): string => {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export function AudioPlayer({ playlist, autoPlay = false, className = '' }: AudioPlayerProps) {
  const { isInitialized, currentTrack, isPlaying, metrics, initialize, play, crossfade, pause, resume, setVolume } =
    useAudioEngine();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(70);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && autoPlay && playlist.length > 0 && !currentTrack) {
      void handlePlay(0);
    }
  }, [isInitialized, autoPlay, playlist, currentTrack]);

  useEffect(() => {
    if (!isPlaying && currentTrack && metrics?.remainingTime !== undefined && metrics.remainingTime < 0.1) {
      void handleNext();
    }
  }, [isPlaying, currentTrack, metrics]);

  const handlePlay = async (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    await play({
      id: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      fadeIn: 0.5,
    });

    setCurrentIndex(index);
  };

  const handleCrossfade = async (index: number) => {
    if (index < 0 || index >= playlist.length) return;

    const track = playlist[index];
    await crossfade(
      {
        id: track.id,
        url: track.url,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        fadeIn: 3,
      },
      3,
    );

    setCurrentIndex(index);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      return;
    }

    if (currentTrack) {
      void resume();
      return;
    }

    if (playlist.length > 0) {
      void handlePlay(0);
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

    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume / 100);
      setVolumeState(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setVolumeState(0);
      setIsMuted(true);
    }
  };

  const currentPlaylistTrack = playlist[currentIndex];
  const progress = metrics?.duration ? (metrics.currentTime / metrics.duration) * 100 : 0;

  return (
    <div className={`bg-zinc-900 rounded-lg p-6 space-y-4 ${className}`.trim()}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white">{currentTrack?.title || currentPlaylistTrack?.title || 'No track loaded'}</h3>
        <p className="text-sm text-zinc-400">{currentTrack?.artist || currentPlaylistTrack?.artist || '—'}</p>
      </div>

      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatDuration(metrics?.currentTime || 0)}</span>
          <span>{formatDuration(metrics?.duration || currentPlaylistTrack?.duration || 0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button onClick={() => void handleNext()} disabled={!isInitialized || playlist.length === 0}>
          Next
        </Button>

        <Button onClick={handlePlayPause} disabled={!isInitialized || playlist.length === 0} className="w-20">
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <Button onClick={() => void handleNext()} disabled={!isInitialized || playlist.length === 0}>
          Skip
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={toggleMute} className="min-w-16">
          {isMuted || volume === 0 ? 'Muted' : 'Volume'}
        </Button>

        <input
          type="range"
          value={volume}
          max={100}
          min={0}
          step={1}
          onChange={handleVolumeChange}
          className="flex-1"
        />

        <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(volume)}%</span>
      </div>
    </div>
  );
}
