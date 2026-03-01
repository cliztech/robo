import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    TrackLibraryTrack,
    ScheduleSegmentData,
    TransportTrack,
    TransportTelemetry,
    MixerChannel,
    DEMO_TRACK_LIBRARY,
    DEMO_SCHEDULE_SEGMENTS,
    DEFAULT_TRANSPORT_TRACK,
    DEFAULT_TRANSPORT_TELEMETRY,
    buildDefaultMixerState,
    createDeterministicWaveform,
    buildDefaultEffectValues
} from '@/lib/degenDataAdapters';

// We import the *types* above, but we will dynamically import the *functions* in tests
// to allow re-evaluation of the top-level DEGEN_DEMO_DATA_ENABLED constant.

describe('degenDataAdapters', () => {

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe('when Demo Data is ENABLED', () => {
        let adapters: any;

        beforeEach(async () => {
            // Set environment variables BEFORE importing the module
            vi.stubEnv('NODE_ENV', 'development');
            vi.stubEnv('NEXT_PUBLIC_DEGEN_DEMO_DATA', 'true');

            // Re-import the module to trigger evaluation of top-level constants
            adapters = await import('@/lib/degenDataAdapters');
        });

        it('resolveTrackLibraryData returns demo library when no tracks provided', () => {
            const result = adapters.resolveTrackLibraryData();
            expect(result).toEqual(adapters.DEMO_TRACK_LIBRARY);
            expect(result.length).toBeGreaterThan(0);
        });

        it('resolveScheduleSegmentData returns demo segments when no segments provided', () => {
            const result = adapters.resolveScheduleSegmentData();
            expect(result).toEqual(adapters.DEMO_SCHEDULE_SEGMENTS);
            expect(result.length).toBeGreaterThan(0);
        });

        it('resolveScheduleCurrentHour returns demo hour (9.5) when no hour provided', () => {
            const result = adapters.resolveScheduleCurrentHour();
            expect(result).toBe(9.5);
        });

        it('resolveTransportTrack returns default transport track when no track provided', () => {
            const result = adapters.resolveTransportTrack();
            expect(result).toEqual(adapters.DEFAULT_TRANSPORT_TRACK);
        });
    });

    describe('when Demo Data is DISABLED', () => {
        let adapters: any;

        beforeEach(async () => {
            // Set environment variables to disable demo data
            vi.stubEnv('NODE_ENV', 'production');
            vi.stubEnv('NEXT_PUBLIC_DEGEN_DEMO_DATA', 'false'); // Explicitly false

            adapters = await import('@/lib/degenDataAdapters');
        });

        it('resolveTrackLibraryData returns empty array when no tracks provided', () => {
            const result = adapters.resolveTrackLibraryData();
            expect(result).toEqual([]);
        });

        it('resolveScheduleSegmentData returns empty array when no segments provided', () => {
            const result = adapters.resolveScheduleSegmentData();
            expect(result).toEqual([]);
        });

        it('resolveScheduleCurrentHour returns 0 when no hour provided', () => {
            const result = adapters.resolveScheduleCurrentHour();
            expect(result).toBe(0);
        });

        it('resolveTransportTrack returns fallback "No track loaded" object', () => {
            const result = adapters.resolveTransportTrack();
            expect(result).toEqual({ title: 'No track loaded', artist: '—' });
        });
    });

    describe('Common Behavior (Input Priority)', () => {
        // We can test this under either environment, but let's just pick one or test generically.
        // The implementation always returns the input if provided, regardless of the env var.

        let adapters: any;
        beforeEach(async () => {
             // Default setup
             vi.stubEnv('NODE_ENV', 'test');
             adapters = await import('@/lib/degenDataAdapters');
        });

        it('resolveTrackLibraryData prefers provided tracks over defaults', () => {
            const mockTracks = [{ id: '99', title: 'Test', artist: 'Test', bpm: 100, key: 'Cm', duration: 100, genre: 'Test', energy: 5 }];
            const result = adapters.resolveTrackLibraryData(mockTracks);
            expect(result).toBe(mockTracks);
        });

        it('resolveScheduleSegmentData prefers provided segments over defaults', () => {
            const mockSegments = [{ id: 'seg1', type: 'music', title: 'Test', startHour: 10, durationMinutes: 60 }];
            const result = adapters.resolveScheduleSegmentData(mockSegments);
            expect(result).toBe(mockSegments);
        });

        it('resolveScheduleCurrentHour prefers provided hour over defaults', () => {
            const result = adapters.resolveScheduleCurrentHour(14.5);
            expect(result).toBe(14.5);
        });

        it('resolveScheduleCurrentHour respects 0 as a valid input', () => {
            const result = adapters.resolveScheduleCurrentHour(0);
            expect(result).toBe(0);
        });

        it('resolveTransportTrack prefers provided track over defaults', () => {
            const mockTrack = { title: 'Custom', artist: 'Artist' };
            const result = adapters.resolveTransportTrack(mockTrack);
            expect(result).toBe(mockTrack);
        });
    });

    describe('Utility Functions (Environment Independent)', () => {
        // These functions don't rely on the flag, so we can test them directly or via dynamic import.

        let adapters: any;
        beforeEach(async () => {
            adapters = await import('@/lib/degenDataAdapters');
        });

        it('resolveTransportTelemetry merges defaults with provided partials', () => {
            const partial = { volume: 50 };
            const result = adapters.resolveTransportTelemetry(partial);
            expect(result).toEqual({ ...DEFAULT_TRANSPORT_TELEMETRY, volume: 50 });
        });

        it('buildDefaultMixerState generates correct channel structure', () => {
            const channels: MixerChannel[] = [
                { id: 'ch1', label: 'CH1', color: 'red', type: 'deck' },
                { id: 'master', label: 'MST', color: 'white', type: 'master' }
            ];
            const state = adapters.buildDefaultMixerState(channels);
            expect(state.ch1.volume).toBe(70);
            expect(state.master.volume).toBe(80);
        });

        it('createDeterministicWaveform generates normalized values', () => {
            const wave = adapters.createDeterministicWaveform(100);
            expect(wave).toHaveLength(100);
            wave.forEach((val: number) => {
                expect(val).toBeGreaterThanOrEqual(0.04);
                expect(val).toBeLessThanOrEqual(1);
            });
        });

        it('buildDefaultEffectValues generates deterministic values', () => {
            const keys = ['fx1', 'fx2'];
            const values = adapters.buildDefaultEffectValues(keys);
            expect(values.fx1).toBe(40);
            expect(values.fx2).toBe(50);
        });
    });
});
