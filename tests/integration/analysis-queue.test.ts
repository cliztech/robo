import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, processAnalysisQueue } from '@/lib/ai/analysisService';

describe('processAnalysisQueue', () => {
    it('processes queue items in order and preserves idempotent skips for same fingerprint', async () => {
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
            modelVersion: 'gpt-4o-mini-2026-02-01',
            promptProfileVersion: 'profile-a',
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
                    id: 'job-2b',
                    input: { trackId: 'track-1', title: 'Alpha (VIP)', artist: 'A' },
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
            { itemId: 'job-2b', status: 'analyzed', source: 'ai' },
            { itemId: 'job-3', status: 'analyzed', source: 'ai' },
        ]);
        expect(adapter.analyzeTrack).toHaveBeenCalledTimes(3);
    });

    it('produces different fingerprint keys when version dimensions change', async () => {
        const input = {
            trackId: 'track-9',
            title: 'Gamma',
            artist: 'C',
            genre: 'house',
            bpm: 126,
            durationSeconds: 200,
        };

        const adapterA = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.6, mood: 'chill', era: '2020s', genreConfidence: 0.8 }),
        };
        const adapterB = {
            analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.6, mood: 'chill', era: '2020s', genreConfidence: 0.8 }),
        };

        const serviceA = new AnalysisService({
            adapter: adapterA,
            promptVersion: 'v5.4',
            modelVersion: 'gpt-4o-mini-2026-02-01',
            promptProfileVersion: 'profile-a',
        });
        const serviceB = new AnalysisService({
            adapter: adapterB,
            promptVersion: 'v5.5',
            modelVersion: 'gpt-4o-mini-2026-02-01',
            promptProfileVersion: 'profile-a',
        });

        const [resultA] = await processAnalysisQueue([{ id: 'v1', input }], serviceA);
        const [resultB] = await processAnalysisQueue([{ id: 'v2', input }], serviceB);

        expect(resultA.status).toBe('analyzed');
        expect(resultB.status).toBe('analyzed');

        const recordA = (await serviceA.analyze(input)).record;
        const recordB = (await serviceB.analyze(input)).record;
        expect(recordA.idempotencyKey).not.toEqual(recordB.idempotencyKey);
    });
});
