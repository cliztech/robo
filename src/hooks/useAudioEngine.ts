'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine, type AudioMetrics, type EQBand, type Track } from '../lib/audio/engine';
import { createDJTelemetry, createStudioTelemetrySnapshot } from '../lib/audio/telemetry';
import { useStudioStore } from '../stores/studioState';

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

  const setEngineBridge = useStudioStore((state) => state.setEngineBridge);
  const setDeckTrack = useStudioStore((state) => state.setDeckTrack);
  const setDeckPlayback = useStudioStore((state) => state.setDeckPlayback);
  const setMasterVolume = useStudioStore((state) => state.setMasterVolume);
  const setChannelEq = useStudioStore((state) => state.setChannelEq);
  const setTelemetry = useStudioStore((state) => state.setTelemetry);
  const setDeckWaveformData = useStudioStore((state) => state.setDeckWaveformData);
  const seekDeck = useStudioStore((state) => state.seekDeck);

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
      setDeckTrack('A', track);
      setDeckPlayback('A', true);
    };

    const handleTrackEnded = () => {
      setIsPlaying(false);
      setDeckPlayback('A', false);
    };

    const handlePaused = () => {
      setIsPlaying(false);
      setDeckPlayback('A', false);
    };

    const handleResumed = () => {
      setIsPlaying(true);
      setDeckPlayback('A', true);
    };

    const handleStopped = () => {
      setCurrentTrack(null);
      setIsPlaying(false);
      setDeckTrack('A', null);
      setDeckPlayback('A', false);
      seekDeck('A', 0);
    };

    const handleMetricsUpdate = (nextMetrics: AudioMetrics) => {
      setMetrics(nextMetrics);
      const telemetry = createDJTelemetry(nextMetrics, engine.getCurrentTrack());
      const snapshot = createStudioTelemetrySnapshot(nextMetrics, engine.getCurrentTrack());
      setTelemetry(telemetry);
      seekDeck('A', snapshot.waveformPosition);
      setDeckWaveformData('A', snapshot.waveformData);
    };

    const handleVolumeChange = ({ level }: { level: number }) => {
      setMasterVolume(level * 100);
    };

    const handleEQChanged = ({ band, gain }: { band: EQBand; gain: number }) => {
      if (band === 'low') setChannelEq('master', 'low', ((gain / 12) * 50) + 50);
      if (band === 'mid') setChannelEq('master', 'mid', ((gain / 12) * 50) + 50);
      if (band === 'high') setChannelEq('master', 'hi', ((gain / 12) * 50) + 50);
    };

    const handleError = ({ error: nextError }: { error: unknown }) => {
      setError(nextError instanceof Error ? nextError : new Error('Unknown audio engine error'));
    };

    engine.on('track-started', handleTrackStarted);
    engine.on('track-ended', handleTrackEnded);
    engine.on('paused', handlePaused);
    engine.on('resumed', handleResumed);
    engine.on('stopped', handleStopped);
    engine.on('metrics-update', handleMetricsUpdate);
    engine.on('volume-changed', handleVolumeChange);
    engine.on('eq-changed', handleEQChanged);
    engine.on('error', handleError);

    return () => {
      engine.off('track-started', handleTrackStarted);
      engine.off('track-ended', handleTrackEnded);
      engine.off('paused', handlePaused);
      engine.off('resumed', handleResumed);
      engine.off('stopped', handleStopped);
      engine.off('metrics-update', handleMetricsUpdate);
      engine.off('volume-changed', handleVolumeChange);
      engine.off('eq-changed', handleEQChanged);
      engine.off('error', handleError);
    };
  }, [isInitialized, seekDeck, setChannelEq, setDeckPlayback, setDeckTrack, setDeckWaveformData, setMasterVolume, setTelemetry]);

  useEffect(() => {
    setEngineBridge({
      togglePlayPause: async () => {
        const engine = engineRef.current;
        if (!engine) return;

        if (engine.getMetrics().isPlaying) {
          engine.pause();
          return;
        }

        await engine.resume();
      },
      setMasterVolume: (volume) => {
        engineRef.current?.setVolume(volume);
      },
      setEQ: (band, gain) => {
        engineRef.current?.setEQ(band, gain);
      },
    });
  }, [setEngineBridge]);

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
    setDeckTrack('A', track);
    setDeckPlayback('A', true);
  }, [setDeckPlayback, setDeckTrack]);

  const crossfade = useCallback(async (track: Track, duration = 3) => {
    if (!engineRef.current) throw new Error('Engine not initialized');
    await engineRef.current.crossfade(track, duration);
    setDeckTrack('B', track);
  }, [setDeckTrack]);

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
