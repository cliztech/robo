import { useEffect, useRef, useCallback, useState } from 'react';
import { AudioEngine } from '@/lib/audio/engine';
import type { AudioMetrics, EQBand } from '@/lib/audio/engine';

/**
 * useAudioEngineBridge — Connects SGE gear components to the real AudioEngine.
 * This is the bridge between the modular gear UI and the actual Web Audio graph.
 *
 * Each gear component can:
 *   - Subscribe to engine events (track changes, metrics)
 *   - Control playback (play, stop, crossfade)
 *   - Adjust volume and EQ
 *   - Read real-time metering data
 */

export interface EngineStatus {
    isInitialized: boolean;
    isPlaying: boolean;
    currentTrackTitle: string;
    currentTrackArtist: string;
    bpm: number;
    volume: number;
    metrics: AudioMetrics | null;
}

const DEFAULT_STATUS: EngineStatus = {
    isInitialized: false,
    isPlaying: false,
    currentTrackTitle: '',
    currentTrackArtist: '',
    bpm: 0,
    volume: 0.8,
    metrics: null,
};

export function useAudioEngineBridge() {
    const engineRef = useRef<AudioEngine | null>(null);
    const [status, setStatus] = useState<EngineStatus>(DEFAULT_STATUS);
    const rafRef = useRef<number>(0);

    // Initialize engine on first use
    const initialize = useCallback(async () => {
        if (engineRef.current) return;
        const engine = new AudioEngine({ latencyHint: 'interactive' });

        engine.on('initialized', () => {
            setStatus(prev => ({ ...prev, isInitialized: true }));
        });

        engine.on('track-started', ({ track }) => {
            setStatus(prev => ({
                ...prev,
                isPlaying: true,
                currentTrackTitle: track.title,
                currentTrackArtist: track.artist,
                bpm: track.bpm ?? 0,
            }));
        });

        engine.on('track-ended', () => {
            setStatus(prev => ({
                ...prev,
                isPlaying: false,
                currentTrackTitle: '',
                currentTrackArtist: '',
            }));
        });

        engine.on('stopped', () => {
            setStatus(prev => ({ ...prev, isPlaying: false }));
        });

        engine.on('volume-changed', ({ level }) => {
            setStatus(prev => ({ ...prev, volume: level }));
        });

        engineRef.current = engine;
        await engine.initialize();
    }, []);

    // Metrics polling loop
    const startMetrics = useCallback(() => {
        const tick = () => {
            if (engineRef.current) {
                const metrics = engineRef.current.getMetrics();
                setStatus(prev => ({ ...prev, metrics }));
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const stopMetrics = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafRef.current);
            engineRef.current?.destroy();
        };
    }, []);

    // Control actions
    const setVolume = useCallback((level: number) => {
        engineRef.current?.setVolume(level);
    }, []);

    const setEQ = useCallback((band: EQBand, gain: number) => {
        engineRef.current?.setEQ(band, gain);
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

    return {
        status,
        engine: engineRef,
        initialize,
        startMetrics,
        stopMetrics,
        setVolume,
        setEQ,
        stop,
        pause,
        resume,
    };
}
