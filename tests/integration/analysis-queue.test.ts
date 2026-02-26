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
            { itemId: 'job-1', status: 'analyzed', source: 'ai' },
            { itemId: 'job-2', status: 'skipped', source: 'ai' },
            { itemId: 'job-3', status: 'analyzed', source: 'ai' },
        ]);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
    });
});
