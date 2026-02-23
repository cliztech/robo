// ═══════════════════════════════════════════════════════════════
//  DGN-DJ STUDIO — Demo Track Library
//  Provides mock track metadata and procedurally generated
//  audio for testing all features without real audio files.
// ═══════════════════════════════════════════════════════════════

import type { TrackInfo } from '../types';

/** Demo track metadata — BPM and key are musically accurate */
export const DEMO_TRACKS: TrackInfo[] = [
    {
        title: 'Neon Pulse',
        artist: 'Synthwave Collective',
        bpm: 128.00,
        key: 'Am',
        camelotKey: '8A',
        duration: 245,
    },
    {
        title: 'Midnight City',
        artist: 'M83',
        bpm: 126.50,
        key: 'Db',
        camelotKey: '3B',
        duration: 318,
    },
    {
        title: 'Strobe',
        artist: 'deadmau5',
        bpm: 128.00,
        key: 'Am',
        camelotKey: '8A',
        duration: 622,
    },
    {
        title: 'Ghosts n Stuff',
        artist: 'deadmau5',
        bpm: 130.00,
        key: 'A',
        camelotKey: '11B',
        duration: 355,
    },
    {
        title: 'Levels',
        artist: 'Avicii',
        bpm: 126.00,
        key: 'Db',
        camelotKey: '3B',
        duration: 208,
    },
    {
        title: 'In My Mind',
        artist: 'Ivan Gough & Feenixpawl',
        bpm: 128.00,
        key: 'Bbm',
        camelotKey: '3A',
        duration: 398,
    },
    {
        title: 'Summer',
        artist: 'Calvin Harris',
        bpm: 128.00,
        key: 'Gm',
        camelotKey: '6A',
        duration: 223,
    },
    {
        title: 'Titanium',
        artist: 'David Guetta ft. Sia',
        bpm: 126.00,
        key: 'Bb',
        camelotKey: '6B',
        duration: 245,
    },
    {
        title: 'Clarity',
        artist: 'Zedd ft. Foxes',
        bpm: 128.00,
        key: 'Ebm',
        camelotKey: '2A',
        duration: 271,
    },
    {
        title: 'Animals',
        artist: 'Martin Garrix',
        bpm: 128.00,
        key: 'Dm',
        camelotKey: '7A',
        duration: 303,
    },
    {
        title: 'Barbra Streisand',
        artist: 'Duck Sauce',
        bpm: 130.00,
        key: 'F',
        camelotKey: '7B',
        duration: 254,
    },
    {
        title: 'Runaway (U & I)',
        artist: 'Galantis',
        bpm: 126.00,
        key: 'E',
        camelotKey: '12B',
        duration: 215,
    },
    {
        title: 'Lean On',
        artist: 'Major Lazer & DJ Snake',
        bpm: 98.00,
        key: 'Gm',
        camelotKey: '6A',
        duration: 176,
    },
    {
        title: 'Don\'t You Worry Child',
        artist: 'Swedish House Mafia',
        bpm: 129.00,
        key: 'A',
        camelotKey: '11B',
        duration: 348,
    },
    {
        title: 'Language',
        artist: 'Porter Robinson',
        bpm: 128.00,
        key: 'F#m',
        camelotKey: '11A',
        duration: 363,
    },
    {
        title: 'Spectrum',
        artist: 'Zedd ft. Matthew Koma',
        bpm: 128.00,
        key: 'Fm',
        camelotKey: '4A',
        duration: 268,
    },
];

/** Format seconds as M:SS */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format seconds as MM:SS */
export function formatTimeLong(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
