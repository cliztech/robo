import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, processAnalysisQueue } from '@/lib/ai/analysisService';

describe('processAnalysisQueue', () => {
    it('processes queue items in order and preserves idempotent skips', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.7, mood: 'uplifting', era: '2020s', genreConfidence: 0.9 })
                .mockResolvedValueOnce({ energy: 0.2, mood: 'ambient', era: '1990s', genreConfidence: 0.4 }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
        });

        const results = await processAnalysisQueue(
            [
                {
                    id: 'job-1',
                    input: { trackId: 'track-1', title: 'Alpha', artist: 'A' },
                },
                {
                    id: 'job-2',
                    input: { trackId: 'track-1', title: 'Alpha', artist: 'A' },
                },
                {
                    id: 'job-3',
                    input: { trackId: 'track-2', title: 'Beta', artist: 'B' },
                },
            ],
            service
        );

        expect(results).toEqual([
            { itemId: 'job-1', invocationStatus: 'success', cacheBehavior: 'processed', source: 'ai', errorClassification: undefined },
            { itemId: 'job-2', invocationStatus: 'success', cacheBehavior: 'skipped', source: 'ai', errorClassification: undefined },
            { itemId: 'job-3', invocationStatus: 'success', cacheBehavior: 'processed', source: 'ai', errorClassification: undefined },
        ]);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    });

    it('propagates degraded and failed statuses with error classifications', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockRejectedValueOnce(new Error('request timeout from provider'))
                .mockRejectedValueOnce(new Error('request timeout from provider'))
                .mockRejectedValueOnce(new Error('invalid payload schema mismatch')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
            maxRetries: 1,
        });

        const results = await processAnalysisQueue(
            [
                {
                    id: 'job-timeout',
                    input: { trackId: 'track-timeout', title: 'Timeout Song', artist: 'A', bpm: 150 },
                },
                {
                    id: 'job-invalid',
                    input: { trackId: 'track-invalid', title: 'Invalid Song', artist: 'B' },
                },
            ],
            service
        );

        expect(results).toEqual([
            {
                itemId: 'job-timeout',
                invocationStatus: 'degraded',
                cacheBehavior: 'processed',
                source: 'fallback',
                errorClassification: 'timeout',
            },
            {
                itemId: 'job-invalid',
                invocationStatus: 'failed',
                cacheBehavior: 'processed',
                source: undefined,
                errorClassification: 'invalid_payload',
            },
        ]);
    });

});
