// ═══════════════════════════════════════════════════════════════
//  DGN-DJ STUDIO — Core Type Definitions
// ═══════════════════════════════════════════════════════════════

export type DeckId = 'A' | 'B' | 'C' | 'D';

/** Metadata for a loaded track */
export interface TrackInfo {
    title: string;
    artist: string;
    bpm: number;
    key: string;           // Musical key e.g. "Am"
    camelotKey: string;     // Camelot notation e.g. "8A"
    duration: number;       // Total duration in seconds
    albumArt?: string;      // Data URL or path
    waveformData?: Float32Array; // Pre-computed peaks for overview waveform
}

/** State of a single deck */
export interface DeckState {
    id: DeckId;
    track: TrackInfo | null;
    playing: boolean;
    position: number;       // Current playback position in seconds
    pitch: number;          // Pitch adjustment in % (e.g. -2.5 = -2.5%)
    volume: number;         // 0-100
    isMaster: boolean;
    isSynced: boolean;
    cuePoint: number;       // Cue point in seconds
    loopIn: number | null;  // Loop start in seconds
    loopOut: number | null; // Loop end in seconds
    loopActive: boolean;
    slipMode: boolean;
    hotCues: (number | null)[]; // Up to 8 hot cue positions in seconds
}

/** State of a mixer channel */
export interface MixerChannelState {
    trim: number;    // 0-100, center = 50
    hi: number;      // 0-100, center = 50
    mid: number;     // 0-100, center = 50
    lo: number;      // 0-100, center = 50
    filter: number;  // 0-100, center = 50 (LP←→HP)
    fxAssign: boolean;
}

/** State of an FX slot */
export interface FXSlotState {
    name: string;
    wet: number;     // 0-100
    active: boolean;
    beatDiv: string; // '1/4' | '1/2' | '1' | '2' | '4'
}

/** Performance pad modes */
export const PAD_MODES = [
    'HOT CUE', 'LOOP', 'ROLL', 'SLICER',
    'SAMPLER', 'BEAT JUMP', 'KEY SHIFT', 'FX TRIGGER',
] as const;

export type PadMode = typeof PAD_MODES[number];

/** Deck color constants */
export const DECK_COLORS = {
    A: '#0091FF',
    B: '#FF5500',
    C: '#2ECC71',
    D: '#9B59B6',
} as const;

/** Actions dispatched to the DeckContext */
export type DeckAction =
    | { type: 'LOAD_TRACK'; deck: DeckId; track: TrackInfo }
    | { type: 'SET_PLAYING'; deck: DeckId; playing: boolean }
    | { type: 'SET_POSITION'; deck: DeckId; position: number }
    | { type: 'SET_PITCH'; deck: DeckId; pitch: number }
    | { type: 'SET_VOLUME'; deck: DeckId; volume: number }
    | { type: 'SET_MASTER'; deck: DeckId }
    | { type: 'TOGGLE_SYNC'; deck: DeckId }
    | { type: 'SET_CUE'; deck: DeckId; position: number }
    | { type: 'SET_LOOP'; deck: DeckId; loopIn: number | null; loopOut: number | null; active: boolean }
    | { type: 'TOGGLE_SLIP'; deck: DeckId }
    | { type: 'SET_HOT_CUE'; deck: DeckId; index: number; position: number | null }
    | { type: 'SET_MIXER'; deck: DeckId; mixer: Partial<MixerChannelState> }
    | { type: 'SET_CROSSFADER'; value: number };
