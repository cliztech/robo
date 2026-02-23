import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as adapters from '@/lib/degenDataAdapters';
import {
    resolveTrackLibraryData,
    resolveScheduleSegmentData,
    resolveScheduleCurrentHour,
    resolveTransportTrack,
    resolveTransportTelemetry,
    buildDefaultMixerState,
    createDeterministicWaveform,
    buildDefaultEffectValues,
    DEMO_TRACK_LIBRARY,
    DEMO_SCHEDULE_SEGMENTS,
    DEFAULT_TRANSPORT_TRACK,
    DEFAULT_TRANSPORT_TELEMETRY,
    MixerChannel
} from '@/lib/degenDataAdapters';

describe('degenDataAdapters', () => {

    describe('resolveTrackLibraryData', () => {
        it('returns provided tracks if argument is supplied', () => {
            const mockTracks = [{ id: '99', title: 'Test Track', artist: 'Tester', bpm: 100, key: 'Cm', duration: 100, genre: 'Test', energy: 5 }];
            const result = resolveTrackLibraryData(mockTracks);
            expect(result).toBe(mockTracks);
            expect(result).toHaveLength(1);
        });

        it('returns empty array or demo data when no tracks provided', () => {
            // By default in test env, DEGEN_DEMO_DATA_ENABLED should be false (NODE_ENV=test)
            // So we expect empty array unless env vars are somehow set.
            // We can check the value of the exported constant to know what to expect.
            const expected = adapters.DEGEN_DEMO_DATA_ENABLED ? DEMO_TRACK_LIBRARY : [];
            const result = resolveTrackLibraryData();
            expect(result).toEqual(expected);
        });
    });

    describe('resolveScheduleSegmentData', () => {
        it('returns provided segments if argument is supplied', () => {
            const mockSegments: any[] = [{ id: 'seg1', type: 'music', title: 'Test Seg', startHour: 10, durationMinutes: 60 }];
            const result = resolveScheduleSegmentData(mockSegments);
            expect(result).toBe(mockSegments);
        });

        it('returns empty array or demo data when no segments provided', () => {
            const expected = adapters.DEGEN_DEMO_DATA_ENABLED ? DEMO_SCHEDULE_SEGMENTS : [];
            const result = resolveScheduleSegmentData();
            expect(result).toEqual(expected);
        });
    });

    describe('resolveScheduleCurrentHour', () => {
        it('returns provided hour if argument is supplied', () => {
            const result = resolveScheduleCurrentHour(14.5);
            expect(result).toBe(14.5);
        });

        it('returns 0 returns 0 even if it is falsy (0)', () => {
             const result = resolveScheduleCurrentHour(0);
             expect(result).toBe(0);
        });

        it('returns 0 or demo hour when no hour provided', () => {
            const expected = adapters.DEGEN_DEMO_DATA_ENABLED ? 9.5 : 0;
            const result = resolveScheduleCurrentHour();
            expect(result).toBe(expected);
        });
    });

    describe('resolveTransportTrack', () => {
        it('returns provided track if argument is supplied', () => {
            const mockTrack = { title: 'My Track', artist: 'Me' };
            const result = resolveTransportTrack(mockTrack);
            expect(result).toBe(mockTrack);
        });

        it('returns fallback track when no track provided', () => {
            const expected = adapters.DEGEN_DEMO_DATA_ENABLED
                ? DEFAULT_TRANSPORT_TRACK
                : { title: 'No track loaded', artist: '—' };
            const result = resolveTransportTrack();
            expect(result).toEqual(expected);
        });
    });

    describe('resolveTransportTelemetry', () => {
        it('merges provided telemetry with default telemetry', () => {
            const partialTelemetry = { volume: 50, progress: 0.8 };
            const result = resolveTransportTelemetry(partialTelemetry);

            expect(result).toEqual({
                ...DEFAULT_TRANSPORT_TELEMETRY,
                volume: 50,
                progress: 0.8
            });
        });

        it('returns default telemetry when no argument provided', () => {
            const result = resolveTransportTelemetry();
            expect(result).toEqual(DEFAULT_TRANSPORT_TELEMETRY);
        });
    });

    describe('buildDefaultMixerState', () => {
        it('creates state for each channel', () => {
            const channels: MixerChannel[] = [
                { id: 'ch1', label: 'CH1', color: 'red', type: 'deck' },
                { id: 'master', label: 'MST', color: 'white', type: 'master' }
            ];

            const state = buildDefaultMixerState(channels);

            expect(Object.keys(state)).toHaveLength(2);
            expect(state.ch1).toBeDefined();
            expect(state.master).toBeDefined();

            // Check specific defaults
            expect(state.ch1.volume).toBe(70); // Non-master default
            expect(state.master.volume).toBe(80); // Master default
            expect(state.ch1.eq).toEqual({ hi: 50, mid: 50, lo: 50 });
        });
    });

    describe('createDeterministicWaveform', () => {
        it('creates waveform of specified length', () => {
            const length = 50;
            const waveform = createDeterministicWaveform(length);
            expect(waveform).toHaveLength(length);
        });

        it('values are normalized between 0 and 1 (mostly)', () => {
            // The function implementation: Math.min(1, Math.max(0.04, envelope));
            const waveform = createDeterministicWaveform(100);
            waveform.forEach(val => {
                expect(val).toBeGreaterThanOrEqual(0.04);
                expect(val).toBeLessThanOrEqual(1);
            });
        });

        it('is deterministic', () => {
            const wave1 = createDeterministicWaveform(50);
            const wave2 = createDeterministicWaveform(50);
            expect(wave1).toEqual(wave2);
        });
    });

    describe('buildDefaultEffectValues', () => {
        it('creates map of values for keys', () => {
            const keys = ['fx1', 'fx2', 'fx3'];
            const values = buildDefaultEffectValues(keys);

            expect(Object.keys(values)).toHaveLength(3);
            expect(values.fx1).toBeDefined();
            expect(values.fx2).toBeDefined();
            expect(values.fx3).toBeDefined();
        });

        it('assigns varying values', () => {
            // 40 + (index % 5) * 10
            const keys = ['k0', 'k1', 'k2', 'k3', 'k4', 'k5'];
            const values = buildDefaultEffectValues(keys);

            expect(values.k0).toBe(40);
            expect(values.k1).toBe(50);
            expect(values.k5).toBe(40); // wrap around
        });
    });
});
