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

    it('reanalyzes when metadata changes for the same trackId', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.5, mood: 'chill', era: '2000s', genreConfidence: 0.8 })
                .mockResolvedValueOnce({ energy: 0.75, mood: 'uplifting', era: '2010s', genreConfidence: 0.9 }),
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
    });
});
