import { describe, expect, it, vi } from 'vitest';

import { AnalysisService, validateAndNormalizeAnalysis } from '@/lib/ai/analysisService';

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
        expect(result.record.rationale).toBe('Model output was incomplete; deterministic fallback normalization was applied.');
        expect(result.record.tempo_bucket).toBe('mid');
        expect(result.record.normalizationReasonCode).toBe('missing_required_fields');
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
        expect(result.record.rationale).toBe('Model output was incomplete; deterministic fallback normalization was applied.');
        expect(result.record.tempo_bucket).toBe('fast');
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

    it('normalizes malformed payloads deterministically with reason codes', () => {
        const input = {
            trackId: 'track-004',
            title: 'Malformed Signals',
            artist: 'QA Bot',
            genre: 'electronic',
            bpm: 92,
        };

        expect(validateAndNormalizeAnalysis(undefined, input)).toEqual({
            energy: 0.38,
            mood: 'chill',
            era: 'unknown',
            genreConfidence: 0.6,
            rationale: 'Model output was incomplete; deterministic fallback normalization was applied.',
            tempo_bucket: 'slow',
            confidence: 0.49,
            normalizationReasonCode: 'invalid_payload',
        });

        expect(
            validateAndNormalizeAnalysis(
                {
                    energy: 'loud',
                    mood: 123,
                    era: 1990,
                    genreConfidence: 'high',
                    rationale: ['why'],
                    tempo_bucket: 'very_fast',
                },
                input
            )
        ).toEqual({
            energy: 0.38,
            mood: 'chill',
            era: 'unknown',
            genreConfidence: 0.6,
            rationale: 'Model output was incomplete; deterministic fallback normalization was applied.',
            tempo_bucket: 'slow',
            confidence: 0.49,
            normalizationReasonCode: 'invalid_field_types',
        });

        expect(
            validateAndNormalizeAnalysis(
                {
                    energy: 0.72,
                    mood: ' ',
                    era: '',
                    genreConfidence: 0.8,
                    rationale: '   ',
                },
                input
            )
        ).toEqual({
            energy: 0.72,
            mood: 'chill',
            era: 'unknown',
            genreConfidence: 0.8,
            rationale: 'Model output was incomplete; deterministic fallback normalization was applied.',
            tempo_bucket: 'slow',
            confidence: 0.76,
            normalizationReasonCode: 'missing_required_fields',
        });
    });
});
