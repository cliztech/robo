import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, processAnalysisQueue } from '@/lib/ai/analysisService';

describe('processAnalysisQueue', () => {
    it('returns public queue contract for success + idempotent skip', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockResolvedValue({
                energy: 0.7,
                mood: 'uplifting',
                era: '2020s',
                genreConfidence: 0.9,
            }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
            modelVersion: 'gpt-4o-mini-2026-02-15',
            promptProfileVersion: 'analysis-profile-v3',
        });

        const results = await processAnalysisQueue(
            [
                { id: 'job-1', input: { trackId: 'track-1', title: 'Alpha', artist: 'A', genre: 'house' } },
                { id: 'job-2', input: { trackId: 'track-1', title: 'Alpha', artist: 'A', genre: 'house' } },
                { id: 'job-3', input: { trackId: 'track-1', title: 'Alpha (VIP)', artist: 'A', genre: 'house' } },
            ],
            service
        );

        expect(results.map(({ itemId, status, outcome, source }) => ({ itemId, status, outcome, source }))).toEqual([
            { itemId: 'job-1', status: 'analyzed', outcome: 'success', source: 'ai' },
            { itemId: 'job-2', status: 'skipped', outcome: 'success', source: 'ai' },
            { itemId: 'job-3', status: 'analyzed', outcome: 'success', source: 'ai' },
        ]);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    });

    it('returns degraded and failed outcomes using only queue public fields', async () => {
        const adapter = {
            analyzeTrack: vi.fn().mockRejectedValue(new Error('request timeout from provider')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.5',
            maxRetries: 1,
        });

        const results = await processAnalysisQueue(
            [
                { id: 'job-timeout', input: { trackId: 'track-timeout', title: 'Timeout Song', artist: 'A', bpm: 150 } },
                { id: 'job-invalid', input: { trackId: ' ', title: 'Invalid Song', artist: 'B' } },
            ],
            service
        );

        expect(results.map(({ itemId, status, outcome, source }) => ({ itemId, status, outcome, source }))).toEqual([
            { itemId: 'job-timeout', status: 'analyzed', outcome: 'degraded', source: 'fallback' },
            { itemId: 'job-invalid', status: 'analyzed', outcome: 'failed', source: 'fallback' },
        ]);
    });
});
