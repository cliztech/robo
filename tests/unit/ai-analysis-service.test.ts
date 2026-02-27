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
        expect(result.record.analyzedAt).toBe('2026-02-26T12:00:00.000Z');
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
        expect(result.record.source).toBe('fallback');
        expect(result.record.attempts).toBe(3);
        expect(result.record.energy).toBe(0.82);
        expect(result.record.mood).toBe('energetic');
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
    });
});
