export interface TrackLibraryTrack {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    key: string;
    duration: number;
    genre: string;
    energy: number;
}

export interface ScheduleSegmentData {
    id: string;
    type: 'music' | 'ai-host' | 'ad' | 'jingle' | 'news';
    title: string;
    startHour: number;
    durationMinutes: number;
    description?: string;
}

export interface TransportTrack {
    title: string;
    artist: string;
    album?: string;
    bpm?: number;
    key?: string;
    duration?: number;
}

export interface TransportTelemetry {
    progress: number;
    volume: number;
    vuLeft: number;
    vuRight: number;
}

export interface MixerChannel {
    id: string;
    label: string;
    color: string;
    type: 'deck' | 'mic' | 'aux' | 'master';
}

export interface MixerChannelState {
    volume: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    eq: { hi: number; mid: number; lo: number };
    vuLevel: number;
}

export const DEGEN_DEMO_DATA_ENABLED =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEGEN_DEMO_DATA === 'true';

export const DEMO_TRACK_LIBRARY: TrackLibraryTrack[] = [
    { id: '1', title: 'Neural Drift v2.1', artist: 'SynthKong', bpm: 128, key: 'Am', duration: 234, genre: 'Deep House', energy: 7 },
    { id: '2', title: 'Bass Gorilla', artist: 'DJ DegenApe', bpm: 140, key: 'Fm', duration: 198, genre: 'DnB', energy: 9 },
    { id: '3', title: 'Quantum Entanglement', artist: 'PixelVault', bpm: 124, key: 'Cm', duration: 312, genre: 'Techno', energy: 6 },
    { id: '4', title: 'Zero Knowledge Proof', artist: 'HashRate', bpm: 132, key: 'Gm', duration: 276, genre: 'Electro', energy: 8 },
    { id: '5', title: 'Liquidation Event', artist: 'Margin Call', bpm: 138, key: 'Dm', duration: 186, genre: 'DnB', energy: 10 },
    { id: '6', title: 'Smart Contract', artist: 'Eth Gardener', bpm: 120, key: 'Bbm', duration: 298, genre: 'Deep House', energy: 5 },
    { id: '7', title: 'Fork This', artist: 'GitPush', bpm: 126, key: 'Em', duration: 204, genre: 'Tech House', energy: 7 },
    { id: '8', title: 'Block Height', artist: 'MinerBot', bpm: 136, key: 'Ab', duration: 245, genre: 'Techno', energy: 8 },
    { id: '9', title: 'Rug Pull Blues', artist: 'Sad Pepe', bpm: 118, key: 'Eb', duration: 190, genre: 'Lo-Fi', energy: 3 },
    { id: '10', title: 'Diamond Hands', artist: 'HODL Gang', bpm: 145, key: 'Fm', duration: 222, genre: 'Hardstyle', energy: 10 },
];

export const DEMO_SCHEDULE_SEGMENTS: ScheduleSegmentData[] = [
    { id: '1', type: 'music', title: 'Morning Bass Set', startHour: 6, durationMinutes: 90, description: 'Deep house mix' },
    { id: '2', type: 'ai-host', title: 'AI Morning Show', startHour: 7.5, durationMinutes: 30, description: 'AI persona intro' },
    { id: '3', type: 'jingle', title: 'Station ID', startHour: 8, durationMinutes: 5 },
    { id: '4', type: 'ad', title: 'Sponsor Block', startHour: 8.08, durationMinutes: 15 },
    { id: '5', type: 'music', title: 'Midday Vibes', startHour: 8.33, durationMinutes: 120 },
    { id: '6', type: 'news', title: 'Crypto News', startHour: 10.33, durationMinutes: 15 },
    { id: '7', type: 'ai-host', title: 'AI Commentary', startHour: 10.58, durationMinutes: 20 },
    { id: '8', type: 'music', title: 'Afternoon Mix', startHour: 10.92, durationMinutes: 180 },
    { id: '9', type: 'ad', title: 'Ad Break', startHour: 13.92, durationMinutes: 10 },
    { id: '10', type: 'jingle', title: 'Station ID', startHour: 14.08, durationMinutes: 5 },
    { id: '11', type: 'music', title: 'Evening Sessions', startHour: 14.17, durationMinutes: 240 },
    { id: '12', type: 'ai-host', title: 'Overnight AI', startHour: 18.17, durationMinutes: 120 },
];

export const DEFAULT_TRANSPORT_TRACK: TransportTrack = {
    title: 'Neural Drift v2.1',
    artist: 'SynthKong',
    album: 'Quantum Bass EP',
    bpm: 128,
    key: 'Am',
    duration: 234,
};

export const DEFAULT_TRANSPORT_TELEMETRY: TransportTelemetry = {
    progress: 0.42,
    volume: 85,
    vuLeft: 0.72,
    vuRight: 0.68,
};

export const DEFAULT_MIXER_CHANNELS: MixerChannel[] = [
    { id: 'deck-a', label: 'DECK A', color: '#aaff00', type: 'deck' },
    { id: 'deck-b', label: 'DECK B', color: '#9933ff', type: 'deck' },
    { id: 'mic', label: 'MIC', color: '#00bfff', type: 'mic' },
    { id: 'aux', label: 'AUX', color: '#ffcc00', type: 'aux' },
    { id: 'master', label: 'MASTER', color: '#ffffff', type: 'master' },
];

export function resolveTrackLibraryData(tracks?: TrackLibraryTrack[]): TrackLibraryTrack[] {
    if (tracks) return tracks;
    return DEGEN_DEMO_DATA_ENABLED ? DEMO_TRACK_LIBRARY : [];
}

export function resolveScheduleSegmentData(segments?: ScheduleSegmentData[]): ScheduleSegmentData[] {
    if (segments) return segments;
    return DEGEN_DEMO_DATA_ENABLED ? DEMO_SCHEDULE_SEGMENTS : [];
}

export function resolveScheduleCurrentHour(currentHour?: number): number {
    if (typeof currentHour === 'number') return currentHour;
    return DEGEN_DEMO_DATA_ENABLED ? 9.5 : 0;
}

export function resolveTransportTrack(track?: TransportTrack): TransportTrack {
    if (track) return track;
    return DEGEN_DEMO_DATA_ENABLED ? DEFAULT_TRANSPORT_TRACK : { title: 'No track loaded', artist: '—' };
}

export function resolveTransportTelemetry(telemetry?: Partial<TransportTelemetry>): TransportTelemetry {
    return {
        ...DEFAULT_TRANSPORT_TELEMETRY,
        ...telemetry,
    };
}

export function buildDefaultMixerState(channels: MixerChannel[]): Record<string, MixerChannelState> {
    return channels.reduce(
        (acc, ch, index) => ({
            ...acc,
            [ch.id]: {
                volume: ch.type === 'master' ? 80 : 70,
                pan: 0,
                mute: false,
                solo: false,
                eq: { hi: 50, mid: 50, lo: 50 },
                vuLevel: 0.58 + (index % 4) * 0.08,
            },
        }),
        {} as Record<string, MixerChannelState>
    );
}

export function createDeterministicWaveform(length = 250): number[] {
    return Array.from({ length }, (_, i) => {
        const t = i / length;
        const envelope =
            0.24 +
            Math.sin(t * Math.PI) * 0.2 +
            Math.sin(t * Math.PI * 3.7) * 0.1 +
            Math.sin(t * Math.PI * 7.3) * 0.06 +
            Math.sin(t * Math.PI * 13.1) * 0.04;
        return Math.min(1, Math.max(0.04, envelope));
    });
}

export function buildDefaultEffectValues(controlKeys: string[]): Record<string, number> {
    return controlKeys.reduce((acc, key, index) => ({
        ...acc,
        [key]: 40 + (index % 5) * 10,
    }), {} as Record<string, number>);
}
