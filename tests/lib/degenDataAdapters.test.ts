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
import { MixerChannel } from '@/lib/degenDataAdapters';

// We need to test the module in different environment configurations.
// Since the module reads process.env at the top level, we must use vi.resetModules()
// and import() the module dynamically for each test scenario.

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
    // Store original env to restore after tests
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Environment: Production/Test (Demo Data Disabled)', () => {
        beforeEach(() => {
            // Simulate production or test environment where demo data is disabled
            process.env.NODE_ENV = 'production';
            delete process.env.NEXT_PUBLIC_DEGEN_DEMO_DATA;
        });

        it('resolveTrackLibraryData returns empty array by default', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            expect(mod.DEGEN_DEMO_DATA_ENABLED).toBe(false);

            const result = mod.resolveTrackLibraryData();
            expect(result).toEqual([]);
        });

        it('resolveTrackLibraryData returns provided tracks', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const mockTracks = [{ id: '1', title: 'Test', artist: 'Test', bpm: 120, key: 'Am', duration: 100, genre: 'Test', energy: 5 }];

            const result = mod.resolveTrackLibraryData(mockTracks);
            expect(result).toBe(mockTracks);
        });

        it('resolveScheduleSegmentData returns empty array by default', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveScheduleSegmentData();
            expect(result).toEqual([]);
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
        it('resolveScheduleCurrentHour returns 0 by default', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveScheduleCurrentHour();
            expect(result).toBe(0);
        });

        it('resolveTransportTrack returns fallback object by default', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveTransportTrack();
            expect(result).toEqual({ title: 'No track loaded', artist: '—' });
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
    describe('Environment: Development (Demo Data Enabled)', () => {
        beforeEach(() => {
            // Simulate development environment with demo data enabled
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_DEGEN_DEMO_DATA = 'true';
        });

        it('resolveTrackLibraryData returns demo library', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            expect(mod.DEGEN_DEMO_DATA_ENABLED).toBe(true);

            const result = mod.resolveTrackLibraryData();
            expect(result).toBe(mod.DEMO_TRACK_LIBRARY);
            expect(result.length).toBeGreaterThan(0);
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
            const mockTracks: TrackLibraryTrack[] = [{ id: '99', title: 'Test', artist: 'Test', bpm: 100, key: 'Cm', duration: 100, genre: 'Test', energy: 5 }];
            const result = adapters.resolveTrackLibraryData(mockTracks);
            expect(result).toBe(mockTracks);
        });

        it('resolveScheduleSegmentData prefers provided segments over defaults', () => {
            const mockSegments = [{ id: 'seg1', type: 'music', title: 'Test', startHour: 10, durationMinutes: 60 }];
            const result = adapters.resolveScheduleSegmentData(mockSegments);
            expect(result).toBe(mockSegments);
        it('resolveTrackLibraryData prefers provided tracks over demo data', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const mockTracks = [{ id: 'custom', title: 'Custom', artist: 'Custom', bpm: 120, key: 'Am', duration: 100, genre: 'Test', energy: 5 }];

            const result = mod.resolveTrackLibraryData(mockTracks);
            expect(result).toBe(mockTracks);
        });

        it('resolveScheduleSegmentData returns demo segments', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveScheduleSegmentData();
            expect(result).toBe(mod.DEMO_SCHEDULE_SEGMENTS);
        });

        it('resolveScheduleCurrentHour returns demo hour (9.5)', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveScheduleCurrentHour();
            expect(result).toBe(9.5);
        });

        it('resolveTransportTrack returns default transport track', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const result = mod.resolveTransportTrack();
            expect(result).toBe(mod.DEFAULT_TRANSPORT_TRACK);
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
    describe('Pure Utility Functions (Environment Independent)', () => {
        // These can be imported once or dynamically, behavior shouldn't change

        it('resolveTransportTelemetry merges with defaults', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const partial = { volume: 50 };
            const result = mod.resolveTransportTelemetry(partial);

            expect(result).toEqual({
                ...mod.DEFAULT_TRANSPORT_TELEMETRY,
                volume: 50
            });
        });

        it('buildDefaultMixerState creates correct initial state', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const channels: MixerChannel[] = [
                { id: 'deck-a', label: 'DECK A', color: '#aaff00', type: 'deck' },
                { id: 'master', label: 'MASTER', color: '#ffffff', type: 'master' }
            ];

            const state = mod.buildDefaultMixerState(channels);
            expect(state['deck-a'].volume).toBe(70);
            expect(state['master'].volume).toBe(80);
        });

        it('createDeterministicWaveform generates consistent data', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const wave1 = mod.createDeterministicWaveform(50);
            const wave2 = mod.createDeterministicWaveform(50);

            expect(wave1).toHaveLength(50);
            expect(wave1).toEqual(wave2);
            // Verify normalization
            expect(wave1.every(v => v >= 0.04 && v <= 1)).toBe(true);
        });

        it('buildDefaultEffectValues assigns values deterministically', async () => {
            const mod = await import('@/lib/degenDataAdapters');
            const keys = ['reverb', 'delay', 'filter'];
            const values = mod.buildDefaultEffectValues(keys);

            expect(values.reverb).toBe(40); // 40 + (0 % 5) * 10
            expect(values.delay).toBe(50);  // 40 + (1 % 5) * 10
            expect(values.filter).toBe(60); // 40 + (2 % 5) * 10
        });
    });
});
