// ═══════════════════════════════════════════════════════════════
//  DGN-DJ STUDIO — Deck Context Provider
//  Centralized state for 4 decks, mixer, and audio engine.
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import type { DeckId, DeckState, TrackInfo, MixerChannelState } from '../types';
import { audioEngine } from '../engine/AudioEngine';

// ─── Default States ──────────────────────────────────────────

const defaultDeckState = (id: DeckId): DeckState => ({
    id,
    track: null,
    playing: false,
    position: 0,
    pitch: 0,
    volume: id === 'A' ? 80 : id === 'B' ? 75 : 0,
    isMaster: id === 'A',
    isSynced: false,
    cuePoint: 0,
    loopIn: null,
    loopOut: null,
    loopActive: false,
    slipMode: false,
    hotCues: Array(8).fill(null) as (number | null)[],
});

const defaultMixerState = (): MixerChannelState => ({
    trim: 50,
    hi: 50,
    mid: 50,
    lo: 50,
    filter: 50,
    fxAssign: false,
});

// ─── Context Types ───────────────────────────────────────────

interface DeckContextType {
    // Deck states
    decks: Record<DeckId, DeckState>;
    mixer: Record<DeckId, MixerChannelState>;
    crossfader: number;
    engineReady: boolean;

    // Deck actions
    loadTrack: (deck: DeckId, track: TrackInfo, buffer?: AudioBuffer) => void;
    play: (deck: DeckId) => void;
    pause: (deck: DeckId) => void;
    togglePlay: (deck: DeckId) => void;
    seek: (deck: DeckId, position: number) => void;
    setPitch: (deck: DeckId, pitch: number) => void;
    setVolume: (deck: DeckId, volume: number) => void;
    setMaster: (deck: DeckId) => void;
    toggleSync: (deck: DeckId) => void;
    setCue: (deck: DeckId) => void;
    goToCue: (deck: DeckId) => void;
    setHotCue: (deck: DeckId, index: number) => void;
    clearHotCue: (deck: DeckId, index: number) => void;
    goToHotCue: (deck: DeckId, index: number) => void;
    setLoop: (deck: DeckId, beats: number) => void;
    toggleLoop: (deck: DeckId) => void;
    toggleSlip: (deck: DeckId) => void;

    // Mixer actions
    setMixerValue: (deck: DeckId, param: keyof MixerChannelState, value: number | boolean) => void;
    setCrossfader: (value: number) => void;

    // Engine access
    initEngine: () => Promise<void>;
    getLevel: (deck: DeckId) => number;
    nudge: (deck: DeckId, delta: number) => void;
    stopNudge: (deck: DeckId) => void;
}

const DeckContext = createContext<DeckContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [decks, setDecks] = useState<Record<DeckId, DeckState>>({
        A: defaultDeckState('A'),
        B: defaultDeckState('B'),
        C: defaultDeckState('C'),
        D: defaultDeckState('D'),
    });

    const [mixer, setMixer] = useState<Record<DeckId, MixerChannelState>>({
        A: defaultMixerState(),
        B: defaultMixerState(),
        C: defaultMixerState(),
        D: defaultMixerState(),
    });

    const [crossfader, setCrossfaderState] = useState(50);
    const [engineReady, setEngineReady] = useState(false);

    // Ref for position tracking (avoids stale closures)
    const decksRef = useRef(decks);
    useEffect(() => { decksRef.current = decks; }, [decks]);

    // ── Engine Init ──────────────────────────────────────────

    const initEngine = useCallback(async () => {
        if (audioEngine.isReady) {
            setEngineReady(true);
            return;
        }
        await audioEngine.init();
        setEngineReady(true);

        // Set initial volumes
        const ids: DeckId[] = ['A', 'B', 'C', 'D'];
        for (const id of ids) {
            audioEngine.setVolume(id, defaultDeckState(id).volume);
        }
    }, []);

    // ── Position Tracking ────────────────────────────────────

    useEffect(() => {
        if (!engineReady) return;

        const ids: DeckId[] = ['A', 'B', 'C', 'D'];
        for (const id of ids) {
            audioEngine.onPositionUpdate(id, (position) => {
                setDecks(prev => {
                    if (Math.abs(prev[id].position - position) < 0.05) return prev;
                    return { ...prev, [id]: { ...prev[id], position } };
                });
            });
        }

        return () => {
            for (const id of ids) {
                audioEngine.removePositionUpdate(id);
            }
        };
    }, [engineReady]);

    // ── Deck Actions ─────────────────────────────────────────

    const updateDeck = useCallback((deck: DeckId, updates: Partial<DeckState>) => {
        setDecks(prev => ({ ...prev, [deck]: { ...prev[deck], ...updates } }));
    }, []);

    const loadTrack = useCallback((deck: DeckId, track: TrackInfo, buffer?: AudioBuffer) => {
        if (buffer) {
            audioEngine.loadBuffer(deck, buffer);
            const peaks = audioEngine.extractPeaks(buffer);
            track = { ...track, waveformData: peaks.peaks, duration: peaks.duration };
        }
        updateDeck(deck, {
            track,
            position: 0,
            cuePoint: 0,
            hotCues: Array(8).fill(null),
            loopIn: null,
            loopOut: null,
            loopActive: false,
            playing: false,
        });
    }, [updateDeck]);

    const play = useCallback((deck: DeckId) => {
        audioEngine.play(deck);
        updateDeck(deck, { playing: true });
    }, [updateDeck]);

    const pause = useCallback((deck: DeckId) => {
        audioEngine.pause(deck);
        updateDeck(deck, { playing: false });
    }, [updateDeck]);

    const togglePlay = useCallback((deck: DeckId) => {
        const d = decksRef.current[deck];
        if (d.playing) pause(deck); else play(deck);
    }, [play, pause]);

    const seek = useCallback((deck: DeckId, position: number) => {
        audioEngine.seek(deck, position);
        updateDeck(deck, { position });
    }, [updateDeck]);

    const setPitch = useCallback((deck: DeckId, pitch: number) => {
        audioEngine.setPitch(deck, pitch);
        updateDeck(deck, { pitch });
    }, [updateDeck]);

    const setVolume = useCallback((deck: DeckId, volume: number) => {
        audioEngine.setVolume(deck, volume);
        updateDeck(deck, { volume });
    }, [updateDeck]);

    const setMaster = useCallback((deck: DeckId) => {
        setDecks(prev => {
            const next = { ...prev };
            for (const id of ['A', 'B', 'C', 'D'] as DeckId[]) {
                next[id] = { ...next[id], isMaster: id === deck };
            }
            return next;
        });
    }, []);

    const toggleSync = useCallback((deck: DeckId) => {
        setDecks(prev => {
            const d = prev[deck];
            const newSynced = !d.isSynced;

            if (newSynced) {
                // Find master deck and match BPM
                const masterId = (Object.keys(prev) as DeckId[]).find(id => prev[id].isMaster);
                if (masterId && prev[masterId].track) {
                    const masterBPM = prev[masterId].track!.bpm;
                    const trackBPM = d.track?.bpm ?? masterBPM;
                    const pitchAdj = ((masterBPM / trackBPM) - 1) * 100;
                    audioEngine.setPitch(deck, pitchAdj);
                    return {
                        ...prev,
                        [deck]: { ...d, isSynced: true, pitch: pitchAdj },
                    };
                }
            }

            return { ...prev, [deck]: { ...d, isSynced: newSynced } };
        });
    }, []);

    const setCue = useCallback((deck: DeckId) => {
        const pos = decksRef.current[deck].position;
        updateDeck(deck, { cuePoint: pos });
    }, [updateDeck]);

    const goToCue = useCallback((deck: DeckId) => {
        const cue = decksRef.current[deck].cuePoint;
        audioEngine.seek(deck, cue);
        updateDeck(deck, { position: cue });
    }, [updateDeck]);

    const setHotCue = useCallback((deck: DeckId, index: number) => {
        const pos = decksRef.current[deck].position;
        setDecks(prev => {
            const hotCues = [...prev[deck].hotCues];
            hotCues[index] = pos;
            return { ...prev, [deck]: { ...prev[deck], hotCues } };
        });
    }, []);

    const clearHotCue = useCallback((deck: DeckId, index: number) => {
        setDecks(prev => {
            const hotCues = [...prev[deck].hotCues];
            hotCues[index] = null;
            return { ...prev, [deck]: { ...prev[deck], hotCues } };
        });
    }, []);

    const goToHotCue = useCallback((deck: DeckId, index: number) => {
        const cue = decksRef.current[deck].hotCues[index];
        if (cue !== null) {
            audioEngine.seek(deck, cue);
            updateDeck(deck, { position: cue });
        }
    }, [updateDeck]);

    const setLoop = useCallback((deck: DeckId, beats: number) => {
        const d = decksRef.current[deck];
        const bpm = d.track?.bpm ?? 120;
        const beatSec = 60 / bpm;
        const loopLen = beatSec * beats;
        const pos = d.position;
        const loopIn = pos;
        const loopOut = pos + loopLen;

        audioEngine.setLoop(deck, loopIn, loopOut);
        updateDeck(deck, { loopIn, loopOut, loopActive: true });
    }, [updateDeck]);

    const toggleLoop = useCallback((deck: DeckId) => {
        const d = decksRef.current[deck];
        if (d.loopActive) {
            audioEngine.setLoop(deck, null, null);
            updateDeck(deck, { loopActive: false, loopIn: null, loopOut: null });
        }
    }, [updateDeck]);

    const toggleSlip = useCallback((deck: DeckId) => {
        updateDeck(deck, { slipMode: !decksRef.current[deck].slipMode });
    }, [updateDeck]);

    // ── Mixer Actions ────────────────────────────────────────

    const setMixerValue = useCallback((deck: DeckId, param: keyof MixerChannelState, value: number | boolean) => {
        setMixer(prev => ({
            ...prev,
            [deck]: { ...prev[deck], [param]: value },
        }));

        // Drive audio engine
        if (typeof value === 'number') {
            switch (param) {
                case 'trim': audioEngine.setTrim(deck, value); break;
                case 'hi': audioEngine.setEQ(deck, 'hi', value); break;
                case 'mid': audioEngine.setEQ(deck, 'mid', value); break;
                case 'lo': audioEngine.setEQ(deck, 'lo', value); break;
                case 'filter': audioEngine.setFilter(deck, value); break;
            }
        }
    }, []);

    const setCrossfader = useCallback((value: number) => {
        setCrossfaderState(value);
        audioEngine.setCrossfader(value);
    }, []);

    // ── Engine Helpers ───────────────────────────────────────

    const getLevel = useCallback((deck: DeckId): number => {
        return audioEngine.getLevel(deck);
    }, []);

    const nudge = useCallback((deck: DeckId, delta: number) => {
        audioEngine.nudge(deck, delta);
    }, []);

    const stopNudge = useCallback((deck: DeckId) => {
        audioEngine.stopNudge(deck);
    }, []);

    // ── Context Value ────────────────────────────────────────

    const value: DeckContextType = {
        decks,
        mixer,
        crossfader,
        engineReady,
        loadTrack,
        play,
        pause,
        togglePlay,
        seek,
        setPitch,
        setVolume,
        setMaster,
        toggleSync,
        setCue,
        goToCue,
        setHotCue,
        clearHotCue,
        goToHotCue,
        setLoop,
        toggleLoop,
        toggleSlip,
        setMixerValue,
        setCrossfader,
        initEngine,
        getLevel,
        nudge,
        stopNudge,
    };

    return (
        <DeckContext.Provider value={value}>
            {children}
        </DeckContext.Provider>
    );
};

// ─── Hook ────────────────────────────────────────────────────

export const useDeck = (): DeckContextType => {
    const ctx = useContext(DeckContext);
    if (!ctx) throw new Error('useDeck must be used within a DeckProvider');
    return ctx;
};
