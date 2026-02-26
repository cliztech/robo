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

        expect(result.invocationStatus).toBe('success');
        expect(result.metadata.cacheBehavior).toBe('processed');
        expect(result.record).toBeDefined();
        expect(result.record?.source).toBe('ai');
        expect(result.record?.energy).toBe(1);
        expect(result.record?.mood).toBe('energetic');
        expect(result.record?.genreConfidence).toBe(0);
        expect(result.record?.confidence).toBe(0.5);
        expect(result.record?.analyzedAt).toBe('2026-02-26T12:00:00.000Z');
    });

    it('retries timeout errors and then uses fallback', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('request timed out')),
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
        expect(result.invocationStatus).toBe('degraded');
        expect(result.metadata.errorClassification).toBe('timeout');
        expect(result.record).toBeDefined();
        expect(result.record?.source).toBe('fallback');
        expect(result.record?.attempts).toBe(3);
        expect(result.record?.energy).toBe(0.82);
        expect(result.record?.mood).toBe('energetic');
    });

    it('retries rate-limit errors and then uses fallback', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('429 Too Many Requests: rate limit exceeded')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.2',
            maxRetries: 1,
            now: () => new Date('2026-02-26T12:00:00.000Z'),
        });

        const result = await service.analyze({
            trackId: 'track-002b',
            title: 'Throttle',
            artist: 'Aether',
            bpm: 120,
        });

        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
        expect(result.invocationStatus).toBe('degraded');
        expect(result.metadata.errorClassification).toBe('rate_limit');
        expect(result.record?.source).toBe('fallback');
    });

    it('returns failed status for unknown non-recoverable errors', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('socket hangup from upstream edge')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.2',
            maxRetries: 3,
        });

        const result = await service.analyze({
            trackId: 'track-002c',
            title: 'Dead End',
            artist: 'Aether',
        });

        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(1);
        expect(result.invocationStatus).toBe('failed');
        expect(result.record).toBeUndefined();
        expect(result.metadata.errorClassification).toBe('unknown');
        expect(result.metadata.attempts).toBe(1);
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

        expect(first.invocationStatus).toBe('success');
        expect(first.metadata.cacheBehavior).toBe('processed');
        expect(second.metadata.cacheBehavior).toBe('skipped');
        expect(second.invocationStatus).toBe('success');
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(1);
    });
});
