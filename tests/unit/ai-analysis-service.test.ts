import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, validateAndNormalizeAnalysis } from '@/lib/ai/analysisService';

describe('AnalysisService', () => {
    describe('normalization', () => {
        it('clamps and canonicalizes model output into TrackIntelligenceRecord fields', async () => {
            const adapter = {
                analyzeTrack: vi.fn().mockResolvedValue({
                    energy: 1.4,
                    mood: 'PARTY',
                    era: ' 2010s ',
                    genreConfidence: -0.2,
                }),
            };

            const service = new AnalysisService({
                adapter,
                promptVersion: 'v5.1',
                modelVersion: 'gpt-4o-mini-2026-02-15',
                promptProfileVersion: 'profile-v1',
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
            expect(result.outcome).toBe('success');
            expect(result.source).toBe('ai');
            expect(result.record).toMatchObject({
                trackId: 'track-001',
                energy: 1,
                mood: 'energetic',
                era: '2010s',
                genreConfidence: 0,
                confidence: 0.5,
                source: 'ai',
                attempts: 1,
                modelVersion: 'gpt-4o-mini-2026-02-15',
                promptProfileVersion: 'profile-v1',
                promptVersion: 'v5.1',
                normalizationReasonCode: 'missing_required_fields',
                analyzedAt: '2026-02-26T12:00:00.000Z',
            });
        });

        it('marks invalid payloads as invalid_payload reason code', () => {
            const normalized = validateAndNormalizeAnalysis('not-an-object', {
                trackId: 'track-x',
                title: 'X',
                artist: 'Y',
            });

            expect(normalized.normalizationReasonCode).toBe('invalid_payload');
            expect(normalized.rationale.length).toBeGreaterThan(0);
        });
    });

    describe('retries and failures', () => {
        it('retries timeout errors and degrades to fallback', async () => {
            const adapter = {
                analyzeTrack: vi.fn().mockRejectedValue(new Error('request timed out')),
            };
            const onRetry = vi.fn();

            const service = new AnalysisService({
                adapter,
                promptVersion: 'v5.2',
                maxRetries: 2,
                onRetry,
            });

            const result = await service.analyze({
                trackId: 'track-timeout',
                title: 'Speed Run',
                artist: 'Aether',
                bpm: 140,
            });

            expect(adapter.analyzeTrack).toHaveBeenCalledTimes(3);
            expect(onRetry).toHaveBeenCalledTimes(2);
            expect(result.invocationStatus).toBe('degraded');
            expect(result.metadata.errorClassification).toBe('timeout');
            expect(result.status).toBe('analyzed');
            expect(result.outcome).toBe('degraded');
            expect(result.source).toBe('fallback');
            expect(result.record?.source).toBe('fallback');
        });

        it('returns failed outcome for invalid/unnormalizable input', async () => {
            const adapter = {
                analyzeTrack: vi.fn(),
            };

            const service = new AnalysisService({
                adapter,
                promptVersion: 'v5.2',
            });

            const result = await service.analyze({
                trackId: '   ',
                title: 'Broken',
                artist: 'Input',
            });

            expect(adapter.analyzeTrack).not.toHaveBeenCalled();
            expect(result.status).toBe('analyzed');
            expect(result.outcome).toBe('failed');
            expect(result.source).toBe('fallback');
            expect(result.record).toBeNull();
        });
    });

    describe('idempotency and cache invalidation', () => {
        it('skips duplicate analysis for same normalized input', async () => {
            const adapter = {
                analyzeTrack: vi.fn().mockResolvedValue({
                    energy: 0.55,
                    mood: 'chill',
                    era: '2000s',
                    genreConfidence: 0.8,
                }),
            };

            const service = new AnalysisService({ adapter, promptVersion: 'v5.3' });
            const input = { trackId: 'track-dup', title: 'Loopback', artist: 'Node City', genre: 'house' };

            const first = await service.analyze(input);
            const second = await service.analyze(input);

            expect(first.status).toBe('analyzed');
            expect(second.status).toBe('skipped');
            expect(adapter.analyzeTrack).toHaveBeenCalledTimes(1);
        });

        it('re-analyzes after TTL expiry', async () => {
            let nowMs = 1_700_000_000_000;
            const adapter = {
                analyzeTrack: vi.fn().mockResolvedValue({
                    energy: 0.5,
                    mood: 'chill',
                    era: '2000s',
                    genreConfidence: 0.7,
                }),
            };

            const service = new AnalysisService({
                adapter,
                promptVersion: 'v5.4',
                cacheTtlMs: 100,
                now: () => new Date(nowMs),
            });

            await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });
            nowMs += 50;
            const withinTtl = await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });
            nowMs += 101;
            const expired = await service.analyze({ trackId: 'track-ttl', title: 'TTL', artist: 'Ops' });

            expect(withinTtl.status).toBe('skipped');
            expect(expired.status).toBe('analyzed');
            expect(adapter.analyzeTrack).toHaveBeenCalledTimes(2);
        });

        it('evicts least recently used entries when max cache size is exceeded', async () => {
            const adapter = {
                analyzeTrack: vi
                    .fn()
                    .mockResolvedValue({ energy: 0.4, mood: 'calm', era: '1990s', genreConfidence: 0.6 }),
            };

            const service = new AnalysisService({
                adapter,
                promptVersion: 'v5.4',
                maxCacheEntries: 2,
            });

            await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' });
            await service.analyze({ trackId: 'track-b', title: 'B', artist: 'DJ' });
            await service.analyze({ trackId: 'track-a', title: 'A', artist: 'DJ' }); // refresh A
            await service.analyze({ trackId: 'track-c', title: 'C', artist: 'DJ' }); // evicts B
            const bAgain = await service.analyze({ trackId: 'track-b', title: 'B', artist: 'DJ' });

            expect(bAgain.status).toBe('analyzed');
            expect(adapter.analyzeTrack).toHaveBeenCalledTimes(4);
        });

        it('invalidates cache key when version dimensions change', async () => {
            const input = {
                trackId: 'track-version',
                title: 'Versioned Track',
                artist: 'DGN',
                genre: 'electronic',
                bpm: 128,
                durationSeconds: 210,
            };

            const adapterA = {
                analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.62, mood: 'chill', era: '2020s', genreConfidence: 0.75 }),
            };
            const adapterB = {
                analyzeTrack: vi.fn().mockResolvedValue({ energy: 0.62, mood: 'chill', era: '2020s', genreConfidence: 0.75 }),
            };

            const serviceA = new AnalysisService({
                adapter: adapterA,
                promptVersion: 'v5.3',
                modelVersion: 'gpt-4o-mini-2026-02-01',
                promptProfileVersion: 'profile-1',
            });
            const serviceB = new AnalysisService({
                adapter: adapterB,
                promptVersion: 'v5.3',
                modelVersion: 'gpt-4o-mini-2026-02-15',
                promptProfileVersion: 'profile-1',
            });

            const first = await serviceA.analyze(input);
            const second = await serviceB.analyze(input);

            expect(first.record?.fingerprint).not.toEqual(second.record?.fingerprint);
            expect(adapterA.analyzeTrack).toHaveBeenCalledTimes(1);
            expect(adapterB.analyzeTrack).toHaveBeenCalledTimes(1);
        });
    });
});
