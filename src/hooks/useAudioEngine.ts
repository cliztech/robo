'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine, type AudioMetrics, type EQBand, type Track } from '../lib/audio/engine';

export interface UseAudioEngineReturn {
  engine: AudioEngine | null;
  isInitialized: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  metrics: AudioMetrics | null;
  initialize: () => Promise<void>;
  play: (track: Track) => Promise<void>;
  crossfade: (track: Track, duration?: number) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => Promise<void>;
  setVolume: (level: number) => void;
  setEQ: (band: EQBand, gain: number) => void;
  error: Error | null;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    if (engineRef.current) return;

    try {
      const engine = new AudioEngine({
        sampleRate: 48_000,
        latencyHint: 'interactive',
        autoResume: true,
      });

      await engine.initialize();
      engineRef.current = engine;
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      const typedError = err instanceof Error ? err : new Error('Unknown audio engine initialization error');
      setError(typedError);
      throw typedError;
    }
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const handleTrackStarted = ({ track }: { track: Track }) => {
      setCurrentTrack(track);
      setIsPlaying(true);
    };

    const handleTrackEnded = () => setIsPlaying(false);
    const handlePaused = () => setIsPlaying(false);
    const handleResumed = () => setIsPlaying(true);
    const handleStopped = () => {
      setCurrentTrack(null);
      setIsPlaying(false);
    };

    const handleMetricsUpdate = (nextMetrics: AudioMetrics) => setMetrics(nextMetrics);

    const handleError = ({ error: nextError }: { error: unknown }) => {
      setError(nextError instanceof Error ? nextError : new Error('Unknown audio engine error'));
    };

    engine.on('track-started', handleTrackStarted);
    engine.on('track-ended', handleTrackEnded);
    engine.on('paused', handlePaused);
    engine.on('resumed', handleResumed);
    engine.on('stopped', handleStopped);
    engine.on('metrics-update', handleMetricsUpdate);
    engine.on('error', handleError);

    return () => {
      engine.off('track-started', handleTrackStarted);
      engine.off('track-ended', handleTrackEnded);
      engine.off('paused', handlePaused);
      engine.off('resumed', handleResumed);
      engine.off('stopped', handleStopped);
      engine.off('metrics-update', handleMetricsUpdate);
      engine.off('error', handleError);
    };
  }, [isInitialized]);

  useEffect(
    () => () => {
      if (engineRef.current) {
        void engineRef.current.destroy();
        engineRef.current = null;
      }
    },
    [],
  );

  const play = useCallback(async (track: Track) => {
    if (!engineRef.current) throw new Error('Engine not initialized');
    await engineRef.current.play(track);
  }, []);

  const crossfade = useCallback(async (track: Track, duration = 3) => {
    if (!engineRef.current) throw new Error('Engine not initialized');
    await engineRef.current.crossfade(track, duration);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await engineRef.current?.resume();
  }, []);

  const setVolume = useCallback((level: number) => {
    engineRef.current?.setVolume(level);
  }, []);

  const setEQ = useCallback((band: EQBand, gain: number) => {
    engineRef.current?.setEQ(band, gain);
  }, []);

  return {
    engine: engineRef.current,
    isInitialized,
    currentTrack,
    isPlaying,
    metrics,
    initialize,
    play,
    crossfade,
    stop,
    pause,
    resume,
    setVolume,
    setEQ,
    error,
  };
}
