import { useState, useCallback, useRef, useEffect } from 'react';
import type { GearSyncState } from '../gear.types';

/**
 * useGearAudio — Hook that bridges SGE gear components to the Web Audio API.
 * Provides per-deck audio state: play/pause, volume, EQ, and BPM sync.
 *
 * This hook manages a virtual audio channel for a single gear unit,
 * enabling the StudioStage to orchestrate multiple decks through the
 * Web Audio API routing graph.
 */

interface GearAudioState {
    isPlaying: boolean;
    volume: number;
    eq: { low: number; mid: number; high: number };
    syncState: GearSyncState;
    waveformData: number[];
    peakLevel: number;
}

interface GearAudioActions {
    play: () => void;
    pause: () => void;
    stop: () => void;
    setVolume: (v: number) => void;
    setEQ: (band: 'low' | 'mid' | 'high', gain: number) => void;
    setSyncMaster: (isMaster: boolean) => void;
    setBPM: (bpm: number) => void;
}

const DEFAULT_STATE: GearAudioState = {
    isPlaying: false,
    volume: 0.8,
    eq: { low: 0, mid: 0, high: 0 },
    syncState: { bpm: 120, pitch: 0, isMaster: false, phase: 0 },
    waveformData: [],
    peakLevel: 0,
};

export function useGearAudio(deckId: string): [GearAudioState, GearAudioActions] {
    const [state, setState] = useState<GearAudioState>(DEFAULT_STATE);
    const contextRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);

    // Initialize audio context lazily (required for browser autoplay policy)
    const ensureContext = useCallback(() => {
        if (!contextRef.current) {
            contextRef.current = new AudioContext({ sampleRate: 44100 });
            gainRef.current = contextRef.current.createGain();
            analyserRef.current = contextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            gainRef.current.connect(analyserRef.current);
            analyserRef.current.connect(contextRef.current.destination);
        }
        if (contextRef.current.state === 'suspended') {
            contextRef.current.resume();
        }
        return contextRef.current;
    }, []);

    // Meter loop — pumps waveform and peak data into state
    const startMetering = useCallback(() => {
        const tick = () => {
            if (!analyserRef.current) return;
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            const peak = Math.max(...Array.from(data)) / 255;

            setState(prev => ({
                ...prev,
                waveformData: Array.from(data.slice(0, 32)),
                peakLevel: peak,
            }));

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const stopMetering = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        setState(prev => ({ ...prev, waveformData: [], peakLevel: 0 }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafRef.current);
            contextRef.current?.close();
        };
    }, []);

    const actions: GearAudioActions = {
        play: () => {
            ensureContext();
            startMetering();
            setState(prev => ({ ...prev, isPlaying: true }));
        },
        pause: () => {
            stopMetering();
            setState(prev => ({ ...prev, isPlaying: false }));
        },
        stop: () => {
            stopMetering();
            setState(prev => ({ ...prev, isPlaying: false, peakLevel: 0 }));
        },
        setVolume: (v: number) => {
            if (gainRef.current) gainRef.current.gain.value = v;
            setState(prev => ({ ...prev, volume: v }));
        },
        setEQ: (band, gain) => {
            setState(prev => ({
                ...prev,
                eq: { ...prev.eq, [band]: gain },
            }));
        },
        setSyncMaster: (isMaster) => {
            setState(prev => ({
                ...prev,
                syncState: { ...prev.syncState, isMaster },
            }));
        },
        setBPM: (bpm) => {
            setState(prev => ({
                ...prev,
                syncState: { ...prev.syncState, bpm },
            }));
        },
    };

    return [state, actions];
}
