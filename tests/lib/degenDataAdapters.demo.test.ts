import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('degenDataAdapters Demo Mode', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('NEXT_PUBLIC_DEGEN_DEMO_DATA', 'true');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('resolveTrackLibraryData returns demo data when enabled', async () => {
        const { resolveTrackLibraryData, DEMO_TRACK_LIBRARY } = await import('@/lib/degenDataAdapters');
        const result = resolveTrackLibraryData();
        expect(result).toEqual(DEMO_TRACK_LIBRARY);
    });

    it('resolveScheduleSegmentData returns demo data when enabled', async () => {
        const { resolveScheduleSegmentData, DEMO_SCHEDULE_SEGMENTS } = await import('@/lib/degenDataAdapters');
        const result = resolveScheduleSegmentData();
        expect(result).toEqual(DEMO_SCHEDULE_SEGMENTS);
    });

    it('resolveScheduleCurrentHour returns demo hour when enabled', async () => {
        const { resolveScheduleCurrentHour } = await import('@/lib/degenDataAdapters');
        const result = resolveScheduleCurrentHour();
        expect(result).toBe(9.5);
    });

    it('resolveTransportTrack returns default track when enabled', async () => {
        const { resolveTransportTrack, DEFAULT_TRANSPORT_TRACK } = await import('@/lib/degenDataAdapters');
        const result = resolveTransportTrack();
        expect(result).toEqual(DEFAULT_TRANSPORT_TRACK);
    });
});
