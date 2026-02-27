import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, processAnalysisQueue } from '@/lib/ai/analysisService';

describe('processAnalysisQueue', () => {
    it('skips identical input and re-analyzes when input mutates', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockResolvedValueOnce({ energy: 0.7, mood: 'uplifting', era: '2020s', genreConfidence: 0.9 })
                .mockResolvedValueOnce({ energy: 0.75, mood: 'energetic', era: '2020s', genreConfidence: 0.85 })
                .mockResolvedValueOnce({ energy: 0.2, mood: 'ambient', era: '1990s', genreConfidence: 0.4 }),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.4',
            modelVersion: 'gpt-4o-mini-2026-02',
            promptProfileVersion: 'analysis-profile-v3',
        });

        const results = await processAnalysisQueue(
            [
                { id: 'job-1', input: { trackId: 'track-1', title: 'Alpha', artist: 'A', genre: 'house' } },
                { id: 'job-2', input: { trackId: 'track-1', title: 'Alpha', artist: 'A', genre: 'house' } },
                { id: 'job-2b', input: { trackId: 'track-1', title: 'Alpha (VIP)', artist: 'A' } },
                { id: 'job-3', input: { trackId: 'track-1', title: 'Alpha', artist: 'A', genre: 'techno' } },
            ],
            service
        );

        expect(results).toEqual([
            { itemId: 'job-1', status: 'analyzed', outcome: 'success', source: 'ai' },
            { itemId: 'job-2', status: 'skipped', outcome: 'success', source: 'ai' },
            { itemId: 'job-2b', status: 'analyzed', outcome: 'success', source: 'ai' },
            { itemId: 'job-3', status: 'analyzed', outcome: 'success', source: 'ai' },
        ]);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(3);
    });

    it('maps degraded and failed outcomes from service analysis', async () => {
        const adapter = {
            analyzeTrack: vi
                .fn()
                .mockRejectedValueOnce(new Error('timeout'))
                .mockRejectedValueOnce(new Error('timeout'))
                .mockRejectedValueOnce(new Error('timeout')),
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.5',
            maxRetries: 1,
        });

        const results = await processAnalysisQueue(
            [
                { id: 'job-1', input: { trackId: 'track-degraded', title: 'Gamma', artist: 'C', bpm: 128 } },
                { id: 'job-2', input: { trackId: ' ', title: 'Broken', artist: 'D', bpm: 128 } },
            ],
            service
        );

        expect(results).toEqual([
            { itemId: 'job-1', status: 'analyzed', outcome: 'degraded', source: 'fallback' },
            { itemId: 'job-2', status: 'analyzed', outcome: 'failed', source: 'fallback' },
        ]);
    });
});
