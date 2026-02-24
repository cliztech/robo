import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MixerChannel } from '@/lib/degenDataAdapters';

// We need to test the module in different environment configurations.
// Since the module reads process.env at the top level, we must use vi.resetModules()
// and import() the module dynamically for each test scenario.

describe('degenDataAdapters', () => {

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
    });

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
    });

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
