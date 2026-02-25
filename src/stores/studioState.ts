import { create } from 'zustand';
import type { DJTelemetry } from '../lib/audio/telemetry';
import type { EQBand, Track } from '../lib/audio/engine';

export type DeckId = 'A' | 'B';

export interface CuePoint {
  position: number;
  label: string;
  color?: string;
}

export interface DeckFXState {
  filter: number;
  reverb: number;
  delay: number;
}

export interface DeckState {
  track: Track | null;
  bpm: number | null;
  key: string | null;
  isPlaying: boolean;
  pitch: number;
  cuePoints: CuePoint[];
  waveformPosition: number;
  durationSeconds: number;
  waveformData: number[];
  fx: DeckFXState;
}

export interface MixerChannelState {
  gain: number;
  eq: {
    hi: number;
    mid: number;
    low: number;
  };
}

export interface MixerState {
  channels: Record<string, MixerChannelState>;
  crossfader: number;
  masterVolume: number;
  muted: boolean;
}

type EngineBridge = {
  togglePlayPause: () => Promise<void>;
  setMasterVolume: (volume: number) => void;
  setEQ: (band: EQBand, gain: number) => void;
};

interface StudioState {
  decks: Record<DeckId, DeckState>;
  mixer: MixerState;
  telemetry: DJTelemetry | null;
  telemetryTick: number;
  setEngineBridge: (bridge: Partial<EngineBridge>) => void;
  setDeckTrack: (deck: DeckId, track: Track | null) => void;
  setDeckPlayback: (deck: DeckId, isPlaying: boolean) => void;
  toggleDeckPlayback: (deck: DeckId) => Promise<void>;
  setDeckPitch: (deck: DeckId, pitch: number) => void;
  setDeckCuePoints: (deck: DeckId, cuePoints: CuePoint[]) => void;
  seekDeck: (deck: DeckId, position: number) => void;
  setDeckWaveformData: (deck: DeckId, waveformData: number[]) => void;
  setDeckFX: (deck: DeckId, partial: Partial<DeckFXState>) => void;
  setChannelGain: (channelId: string, gain: number) => void;
  setChannelEq: (channelId: string, band: 'hi' | 'mid' | 'low', value: number) => void;
  setCrossfader: (value: number) => void;
  setMasterVolume: (value: number) => void;
  toggleMuted: () => void;
  setTelemetry: (telemetry: DJTelemetry) => void;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clamp100 = (value: number) => Math.max(0, Math.min(100, value));
const clampPitch = (value: number) => Math.max(-16, Math.min(16, value));

const defaultDeckState = (): DeckState => ({
  track: null,
  bpm: null,
  key: null,
  isPlaying: false,
  pitch: 0,
  cuePoints: [],
  waveformPosition: 0,
  durationSeconds: 0,
  waveformData: [],
  fx: {
    filter: 0.5,
    reverb: 0,
    delay: 0,
  },
});

const defaultMixerChannels: MixerState['channels'] = {
  'deck-a': { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
  'deck-b': { gain: 70, eq: { hi: 50, mid: 50, low: 50 } },
  mic: { gain: 65, eq: { hi: 50, mid: 50, low: 50 } },
  aux: { gain: 65, eq: { hi: 50, mid: 50, low: 50 } },
  master: { gain: 80, eq: { hi: 50, mid: 50, low: 50 } },
};

let engineBridge: Partial<EngineBridge> = {};

function toEngineEQGain(value: number): number {
  return ((clamp100(value) - 50) / 50) * 12;
}

function mixerBandToEQBand(band: 'hi' | 'mid' | 'low'): EQBand {
  if (band === 'low') return 'low';
  if (band === 'mid') return 'mid';
  return 'high';
}

export const useStudioStore = create<StudioState>((set, get) => ({
  decks: {
    A: defaultDeckState(),
    B: defaultDeckState(),
  },
  mixer: {
    channels: defaultMixerChannels,
    crossfader: 50,
    masterVolume: 80,
    muted: false,
  },
  telemetry: null,
  telemetryTick: 0,
  setEngineBridge: (bridge) => {
    engineBridge = { ...engineBridge, ...bridge };
  },
  setDeckTrack: (deck, track) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          track,
          bpm: track?.bpm ?? state.decks[deck].bpm,
          key: track?.key ?? state.decks[deck].key,
          durationSeconds: track?.duration ?? state.decks[deck].durationSeconds,
        },
      },
    }));
  },
  setDeckPlayback: (deck, isPlaying) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          isPlaying,
        },
      },
    }));
  },
  toggleDeckPlayback: async (deck) => {
    if (engineBridge.togglePlayPause) {
      await engineBridge.togglePlayPause();
      return;
    }

    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          isPlaying: !state.decks[deck].isPlaying,
        },
      },
    }));
  },
  setDeckPitch: (deck, pitch) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          pitch: clampPitch(pitch),
        },
      },
    }));
  },
  setDeckCuePoints: (deck, cuePoints) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          cuePoints,
        },
      },
    }));
  },
  seekDeck: (deck, position) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          waveformPosition: clamp01(position),
        },
      },
    }));
  },
  setDeckWaveformData: (deck, waveformData) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          waveformData,
        },
      },
    }));
  },
  setDeckFX: (deck, partial) => {
    set((state) => ({
      decks: {
        ...state.decks,
        [deck]: {
          ...state.decks[deck],
          fx: {
            ...state.decks[deck].fx,
            ...partial,
          },
        },
      },
    }));
  },
  setChannelGain: (channelId, gain) => {
    set((state) => ({
      mixer: {
        ...state.mixer,
        channels: {
          ...state.mixer.channels,
          [channelId]: {
            ...(state.mixer.channels[channelId] ?? { gain: 70, eq: { hi: 50, mid: 50, low: 50 } }),
            gain: clamp100(gain),
          },
        },
      },
    }));
  },
  setChannelEq: (channelId, band, value) => {
    const nextValue = clamp100(value);
    set((state) => ({
      mixer: {
        ...state.mixer,
        channels: {
          ...state.mixer.channels,
          [channelId]: {
            ...(state.mixer.channels[channelId] ?? { gain: 70, eq: { hi: 50, mid: 50, low: 50 } }),
            eq: {
              ...(state.mixer.channels[channelId]?.eq ?? { hi: 50, mid: 50, low: 50 }),
              [band]: nextValue,
            },
          },
        },
      },
    }));

    if (channelId === 'master' && engineBridge.setEQ) {
      engineBridge.setEQ(mixerBandToEQBand(band), toEngineEQGain(nextValue));
    }
  },
  setCrossfader: (value) => {
    set((state) => ({
      mixer: {
        ...state.mixer,
        crossfader: clamp100(value),
      },
    }));
  },
  setMasterVolume: (value) => {
    const next = clamp100(value);
    set((state) => ({
      mixer: {
        ...state.mixer,
        masterVolume: next,
        muted: next === 0,
      },
    }));

    engineBridge.setMasterVolume?.(next / 100);
  },
  toggleMuted: () => {
    const nextMuted = !get().mixer.muted;
    const nextVolume = nextMuted ? 0 : 80;
    set((state) => ({
      mixer: {
        ...state.mixer,
        muted: nextMuted,
        masterVolume: nextVolume,
      },
    }));
    engineBridge.setMasterVolume?.(nextVolume / 100);
  },
  setTelemetry: (telemetry) => {
    set((state) => ({
      telemetry,
      telemetryTick: state.telemetryTick + 1,
      decks: {
        ...state.decks,
        A: {
          ...state.decks.A,
          waveformPosition: telemetry.transport.progress,
          durationSeconds: telemetry.transport.durationSeconds,
          isPlaying: telemetry.transport.isPlaying,
        },
      },
    }));
  },
}));
