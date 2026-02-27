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

        expect(result).toMatchObject({
            status: 'analyzed',
            executionStatus: 'success',
            outcome: 'success',
            source: 'ai',
        });
        expect(result.record).not.toBeNull();
        expect(result.record).toMatchObject({
            source: 'ai',
            fingerprint: 'track-001|neon wave|dgn|house|128||v5.1',
            energy: 1,
            mood: 'energetic',
            genreConfidence: 0,
            confidence: 0.5,
            modelVersion: 'gpt-4o-mini-2026-02',
            promptProfileVersion: 'analysis-profile-v1',
            analyzedAt: '2026-02-26T12:00:00.000Z',
        });
    });

    it('retries and then uses fallback when adapter repeatedly fails', async () => {
        const adapter = { analyzeTrack: vi.fn().mockRejectedValue(new Error('rate limited')) };
        const onRetry = vi.fn();

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.2',
            maxRetries: 2,
            onRetry,
        });

        const result = await service.analyze({ trackId: 'track-002', title: 'Speed Run', artist: 'Aether', bpm: 140 });

        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(result).toMatchObject({ executionStatus: 'degraded', outcome: 'degraded', source: 'fallback' });
        expect(result.record).toMatchObject({ source: 'fallback', attempts: 3, energy: 0.82, mood: 'energetic' });
    });

    it('returns skipped status for existing idempotency key', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.8 }),
        };

        const service = new AnalysisService({ adapter, promptVersion: 'v5.3' });
        const input = { trackId: 'track-003', title: 'Loopback', artist: 'Node City' };

        const first = await service.analyze(input);
        const second = await service.analyze(input);

        expect(first.status).toBe('analyzed');
        expect(second.status).toBe('skipped');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(1);
        expect(service.getTelemetry()).toEqual({ cacheHits: 1, cacheMisses: 1 });
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
        await service.analyze(input);
        nowMs += 500;
        const second = await service.analyze(input);
        nowMs += 1100;
        const third = await service.analyze(input);

        expect(second.status).toBe('skipped');
        expect(third.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
        expect(service.getCacheStats()).toMatchObject({ hits: 1, misses: 2, expirations: 1 });
    });

    it('evicts least recently used entry when maxCacheEntries is exceeded', async () => {
        const adapter = { analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.6 }) };
        const onCacheEvent = vi.fn();

        const service = new AnalysisService({ adapter, promptVersion: 'v5.4', maxCacheEntries: 2, onCacheEvent });

        await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' });
        await service.analyze({ trackId: 'track-b', title: 'B', artist: 'DJ' });
        await service.analyze({ trackId: 'track-c', title: 'C', artist: 'DJ' });
        const refreshed = await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' });

        expect(refreshed.status).toBe('analyzed');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(4);
        expect(service.getCacheSize()).toBe(2);
        expect(service.getCacheStats()).toMatchObject({ size: 2, evictions: 2, misses: 4, hits: 0, expirations: 0 });
        expect(onCacheEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'evict' }));
    });

    it('builds distinct idempotency keys when model or prompt profile changes', async () => {
        const input = { trackId: 'track-9', title: 'Gamma', artist: 'C', genre: 'house', bpm: 126, durationSeconds: 200 };
        const adapter = { analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.6, mood: 'chill', era: '2020s', genreConfidence: 0.8 }) };

        const serviceA = new AnalysisService({ adapter, promptVersion: 'v5.4', modelVersion: 'gpt-4o-v1', promptProfileVersion: 'profile-a' });
        const serviceB = new AnalysisService({ adapter, promptVersion: 'v5.4', modelVersion: 'gpt-4o-v2', promptProfileVersion: 'profile-a' });

        const resultA = await serviceA.analyze(input);
        const resultB = await serviceB.analyze(input);

        expect(resultA.record?.idempotencyKey).not.toEqual(resultB.record?.idempotencyKey);
    });

    it('returns failed outcome when track id is empty', async () => {
        const adapter = { analyzeTrack: vi.fn() };
        const service = new AnalysisService({ adapter, promptVersion: 'v5.5' });

        const result = await service.analyze({ trackId: '   ', title: 'Untitled', artist: 'Unknown' });

        expect(adapter.analyzeTrack).not.toHaveBeenCalled();
        expect(result).toEqual({
            status: 'analyzed',
            executionStatus: 'degraded',
            outcome: 'failed',
            source: 'fallback',
            record: null,
        });
    });
});
