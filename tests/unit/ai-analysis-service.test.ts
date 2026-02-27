import { describe, expect, it, vi } from 'vitest';

import { AnalysisService } from '@/lib/ai/analysisService';

describe('AnalysisService', () => {
    it('normalizes successful adapter output', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({
                energy: 1.4,
                mood: 'PARTY',
                era: '2010s',
                genreConfidence: -0.2,
            }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.1',
            modelVersion: 'gpt-4o-mini-2026-02',
            promptProfileVersion: 'analysis-profile-v1',
            now: () => new Date('2026-02-26T12:00:00.000Z'),
        });

        const result = await service.analyze({
            trackId: 'track-001',
            title: 'Neon Wave',
            artist: 'DGN',
            genre: 'house',
            bpm: 128,
        });

        expect(result.status).toBe('analyzed');
        expect(result.record.source).toBe('ai');
        expect(result.record.energy).toBe(1);
        expect(result.record.mood).toBe('energetic');
        expect(result.record.genreConfidence).toBe(0);
        expect(result.record.confidence).toBe(0.5);
        expect(result.record.modelVersion).toBe('gpt-4o-mini-2026-02');
        expect(result.record.promptProfileVersion).toBe('analysis-profile-v1');
        expect(result.record.analyzedAt).toBe('2026-02-26T12:00:00.000Z');
        expect(result.outcome).toBe('success');
        expect(result.source).toBe('ai');
        expect(result.record).not.toBeNull();
        expect(result.record!.source).toBe('ai');
        expect(result.record!.energy).toBe(1);
        expect(result.record!.mood).toBe('energetic');
        expect(result.record!.genreConfidence).toBe(0);
        expect(result.record!.confidence).toBe(0.5);
        expect(result.record!.analyzedAt).toBe('2026-02-26T12:00:00.000Z');
    });

    it('retries and then uses fallback when adapter repeatedly fails', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('rate limited')),
        };

        const onRetry = vi.fn();

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.2',
            maxRetries: 2,
            onRetry,
            now: () => new Date('2026-02-26T12:00:00.000Z'),
        });

        const result = await service.analyze({
            trackId: 'track-002',
            title: 'Speed Run',
            artist: 'Aether',
            bpm: 140,
        });

        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(result.outcome).toBe('degraded');
        expect(result.source).toBe('fallback');
        expect(result.record).not.toBeNull();
        expect(result.record!.source).toBe('fallback');
        expect(result.record!.attempts).toBe(3);
        expect(result.record!.energy).toBe(0.82);
        expect(result.record!.mood).toBe('energetic');
    });

    it('returns skipped status for existing idempotency key', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({
                energy: 0.5,
                mood: 'chill',
                era: '2000s',
                genreConfidence: 0.8,
            }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.3',
        });

        const input = {
            trackId: 'track-003',
            title: 'Loopback',
            artist: 'Node City',
        };

        const first = await service.analyze(input);
        const second = await service.analyze(input);

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('skipped');
        expect(first.outcome).toBe('success');
        expect(second.outcome).toBe('success');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(1);
    });

    it('re-analyzes after TTL expiry', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.4, mood: 'chill', era: '2010s', genreConfidence: 0.5 })
                .mockResolvedValueOnce({ energy: 0.7, mood: 'energetic', era: '2020s', genreConfidence: 0.8 }),
        };

        let nowMs = new Date('2026-02-26T12:00:00.000Z').getTime();
        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
            cacheTtlMs: 1000,
            now: () => new Date(nowMs),
        });

        const input = { trackId: 'track-ttl', title: 'Clock Drift', artist: 'DGN' };

        const first = await service.analyze(input);
        nowMs += 500;
        const second = await service.analyze(input);
        nowMs += 1100;
        const third = await service.analyze(input);

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('skipped');
        expect(third.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    });

    it('evicts least recently used entry when cache exceeds max entries', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.6 }),
        };

        let nowMs = new Date('2026-02-26T12:00:00.000Z').getTime();
        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.5',
            maxCacheEntries: 2,
            now: () => new Date(nowMs),
        });

        await service.analyze({ trackId: 'track-a', title: 'A', artist: 'A' });
        nowMs += 1;
        await service.analyze({ trackId: 'track-b', title: 'B', artist: 'B' });
        nowMs += 1;
        await service.analyze({ trackId: 'track-a', title: 'A', artist: 'A' }); // refresh access recency
        nowMs += 1;
        await service.analyze({ trackId: 'track-c', title: 'C', artist: 'C' });
        nowMs += 1;
        const bResult = await service.analyze({ trackId: 'track-b', title: 'B', artist: 'B' });

        expect(service.getCacheSize()).toBe(2);
        expect(bResult.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(4);
    });

    it('updates access metadata on cache hit to protect hot entries from eviction', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.6 }),
        };

        let nowMs = new Date('2026-02-26T12:00:00.000Z').getTime();
        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.6',
            maxCacheEntries: 2,
            now: () => new Date(nowMs),
        });

        await service.analyze({ trackId: 'track-old', title: 'Old', artist: 'O' });
        nowMs += 1;
        await service.analyze({ trackId: 'track-hot', title: 'Hot', artist: 'H' });
        nowMs += 1;
        const hit = await service.analyze({ trackId: 'track-old', title: 'Old', artist: 'O' });
        nowMs += 1;
        await service.analyze({ trackId: 'track-new', title: 'New', artist: 'N' });
        nowMs += 1;
        const hotAfterEviction = await service.analyze({ trackId: 'track-hot', title: 'Hot', artist: 'H' });
        const oldAfterEviction = await service.analyze({ trackId: 'track-old', title: 'Old', artist: 'O' });

        expect(hit.status).toBe('skipped');
        expect(hotAfterEviction.status).toBe('analyzed');
        expect(oldAfterEviction.status).toBe('analyzed');
    it('reanalyzes when metadata changes for the same trackId', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.8 })
                .mockResolvedValueOnce({ energy: 0.75, mood: 'uplifting', era: '2010s', genreConfidence: 0.9 }),
    it('re-analyzes when normalized metadata changes', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({
                energy: 0.5,
                mood: 'chill',
                era: '2000s',
                genreConfidence: 0.8,
            }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.3',
            modelVersion: 'gpt-4o-mini-2026-02-01',
            promptProfileVersion: 'profile-1',
        });

        const first = await service.analyze({
            trackId: 'track-004',
            title: 'Neon Loop',
            artist: 'Node City',
            genre: 'House',
            bpm: 124,
        });
        const second = await service.analyze({
            trackId: 'track-004',
            title: 'Neon Loop (Radio Edit)',
            artist: 'Node City',
            genre: 'House',
            bpm: 124,
            modelVersion: 'gpt-4o',
            promptProfileVersion: 'analysis-profile-v2',
        });

        const first = await service.analyze({
            trackId: 'track-003',
            title: 'Loopback',
            artist: 'Node City',
            genre: 'house',
        });

        const second = await service.analyze({
            trackId: 'track-003',
            title: 'Loopback',
            artist: 'Node City',
            genre: 'techno',
        });

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('analyzed');
        expect(first.record.idempotencyKey).not.toEqual(second.record.idempotencyKey);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    });

    it('reanalyzes when a version dimension changes', async () => {
        const input = {
            trackId: 'track-005',
            title: 'Versioned Track',
            artist: 'DGN',
            genre: 'electronic',
            bpm: 128,
            durationSeconds: 210,
        };

        const adapterOne = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.62, mood: 'chill', era: '2020s', genreConfidence: 0.75 }),
        };
        const adapterTwo = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.62, mood: 'chill', era: '2020s', genreConfidence: 0.75 }),
        };

        const serviceV1 = new AnalysisService({
            adapter: adapterOne,
            promptVersion: 'v5.3',
            modelVersion: 'gpt-4o-mini-2026-02-01',
            promptProfileVersion: 'profile-1',
        });

        const serviceV2 = new AnalysisService({
            adapter: adapterTwo,
            promptVersion: 'v5.3',
            modelVersion: 'gpt-4o-mini-2026-02-15',
            promptProfileVersion: 'profile-1',
        });

        const first = await serviceV1.analyze(input);
        const second = await serviceV2.analyze(input);

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('analyzed');
        expect(first.record.idempotencyKey).not.toEqual(second.record.idempotencyKey);
        expect(first.record.idempotencyKey).not.toBe(second.record.idempotencyKey);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    it('evicts least recently used entry when maxCacheEntries is exceeded', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.1, mood: 'calm', era: '1980s', genreConfidence: 0.5 })
                .mockResolvedValueOnce({ energy: 0.2, mood: 'chill', era: '1990s', genreConfidence: 0.6 })
                .mockResolvedValueOnce({ energy: 0.3, mood: 'energetic', era: '2000s', genreConfidence: 0.7 })
                .mockResolvedValueOnce({ energy: 0.15, mood: 'calm', era: '1980s', genreConfidence: 0.5 }),
        };

        const onCacheEvent = vi.fn();
        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
            maxCacheEntries: 2,
            onCacheEvent,
        });

        await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' });
        await service.analyze({ trackId: 'track-b', title: 'B', artist: 'DJ' });
        await service.analyze({ trackId: 'track-c', title: 'C', artist: 'DJ' });

        const refreshed = await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' });

        expect(refreshed.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(4);
        expect(service.getCacheSize()).toBe(2);
        expect(service.getCacheStats()).toMatchObject({
            size: 2,
            evictions: 2,
            misses: 4,
            hits: 0,
            expirations: 0,
        });
        expect(onCacheEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'evict', key: 'track-a:v5.4' }));
    });

    it('expires stale entries and refreshes analysis after cacheTtlMs', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.4, mood: 'chill', era: '2000s', genreConfidence: 0.5 })
                .mockResolvedValueOnce({ energy: 0.8, mood: 'party', era: '2010s', genreConfidence: 0.9 }),
        };

        let nowMs = 0;
        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.5',
            cacheTtlMs: 1_000,
            now: () => new Date(nowMs),
        });

        const first = await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });
        nowMs = 500;
        const second = await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });
        nowMs = 1_501;
        const third = await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('skipped');
        expect(third.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
        expect(service.getCacheStats()).toMatchObject({
            size: 1,
            hits: 1,
            misses: 2,
            evictions: 0,
            expirations: 1,
        });
    });

    it('keeps cache size stable with repeated unique inputs under capped cache', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({
                energy: 0.6,
                mood: 'uplifting',
                era: '2020s',
                genreConfidence: 0.7,
            }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.6',
            maxCacheEntries: 3,
        });

        for (let i = 0; i < 20; i += 1) {
            await service.analyze({
                trackId: `track-unique-${i}`,
                title: `Track ${i}`,
                artist: 'Load Gen',
            });
        }

        expect(service.getCacheSize()).toBe(3);
        expect(service.getCacheStats()).toMatchObject({
            size: 3,
            misses: 20,
            hits: 0,
            expirations: 0,
            evictions: 17,
        });
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(20);
    it('returns failed outcome when neither AI nor fallback can normalize a valid record', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('provider unavailable')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.5',
            maxRetries: 1,
        });

        const result = await service.analyze({
            trackId: '   ',
            title: 'Untitled',
            artist: 'Unknown',
        });

        expect(result.status).toBe('analyzed');
        expect(result.outcome).toBe('failed');
        expect(result.source).toBe('fallback');
        expect(result.record).toBeNull();
    });
});
