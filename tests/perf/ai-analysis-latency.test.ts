import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'vitest';

import { AnalysisService, type TrackAnalysisInput } from '@/lib/ai/analysisService';

interface BatchDefinition {
    id: string;
    records: TrackAnalysisInput[];
}

function percentile(values: number[], target: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
    return Number(sorted[index].toFixed(2));
}

function asMarkdownArtifact(payload: {
    generatedAt: string;
    sampleCount: number;
    p50Ms: number;
    p95Ms: number;
    cache: { hit: number; miss: number };
    thresholdsMs: { p50Max: number; p95Max: number };
}): string {
    return [
        '# AI Analysis Latency Verification',
        '',
        `- Generated At: ${payload.generatedAt}`,
        `- Samples: ${payload.sampleCount}`,
        `- p50 Latency (ms): ${payload.p50Ms}`,
        `- p95 Latency (ms): ${payload.p95Ms}`,
        `- Cache Hit/Miss: ${payload.cache.hit}/${payload.cache.miss}`,
        `- Thresholds (ms): p50<=${payload.thresholdsMs.p50Max}, p95<=${payload.thresholdsMs.p95Max}`,
    ].join('\n');
}

describe('analysis latency verification', () => {
    it('captures p50/p95 distribution and writes machine-readable artifacts', async () => {
        const adapter = {
            analyzeTrack: async (input: TrackAnalysisInput) => {
                const jitterMs = 4 + (input.trackId.charCodeAt(0) % 6);
                await new Promise((resolve) => setTimeout(resolve, jitterMs));
                return {
                    energy: 0.7,
                    mood: 'uplifting',
                    era: '2020s',
                    genreConfidence: 0.8,
                };
            },
        };

        const service = new AnalysisService({
            adapter,
            promptVersion: 'v5.latency',
        });

        const batches: BatchDefinition[] = [
            {
                id: 'batch-a',
                records: [
                    { trackId: 'alpha-01', title: 'A01', artist: 'ops', genre: 'house', bpm: 128 },
                    { trackId: 'alpha-02', title: 'A02', artist: 'ops', genre: 'house', bpm: 124 },
                    { trackId: 'alpha-03', title: 'A03', artist: 'ops', genre: 'house', bpm: 130 },
                    { trackId: 'alpha-01', title: 'A01', artist: 'ops', genre: 'house', bpm: 128 },
                ],
            },
            {
                id: 'batch-b',
                records: [
                    { trackId: 'beta-01', title: 'B01', artist: 'ops', genre: 'pop', bpm: 116 },
                    { trackId: 'beta-02', title: 'B02', artist: 'ops', genre: 'pop', bpm: 110 },
                    { trackId: 'beta-03', title: 'B03', artist: 'ops', genre: 'pop', bpm: 121 },
                    { trackId: 'beta-02', title: 'B02', artist: 'ops', genre: 'pop', bpm: 110 },
                ],
            },
            {
                id: 'batch-c',
                records: [
                    { trackId: 'gamma-01', title: 'G01', artist: 'ops', genre: 'dnb', bpm: 174 },
                    { trackId: 'gamma-02', title: 'G02', artist: 'ops', genre: 'dnb', bpm: 170 },
                    { trackId: 'gamma-03', title: 'G03', artist: 'ops', genre: 'dnb', bpm: 168 },
                    { trackId: 'gamma-01', title: 'G01', artist: 'ops', genre: 'dnb', bpm: 174 },
                ],
            },
        ];

        const samples: number[] = [];
        for (const batch of batches) {
            for (const input of batch.records) {
                const startedAt = performance.now();
                await service.analyze(input);
                samples.push(performance.now() - startedAt);
            }
            expect(batch.records.length).toBeGreaterThan(0);
        }

        const p50Ms = percentile(samples, 50);
        const p95Ms = percentile(samples, 95);
        const telemetry = service.getCacheTelemetry();

        const thresholdsMs = {
            p50Max: 10,
            p95Max: 14,
        };

        const generatedAt = new Date().toISOString();
        const payload = {
            generatedAt,
            sampleCount: samples.length,
            p50Ms,
            p95Ms,
            cache: telemetry,
            thresholdsMs,
            rawSamplesMs: samples.map((entry) => Number(entry.toFixed(2))),
        };

        const artifactRoot = join(process.cwd(), 'docs', 'artifacts', 'analysis-latency');
        const jsonPath = join(artifactRoot, 'analysis-latency-report.json');
        const markdownPath = join(artifactRoot, 'analysis-latency-report.md');

        await mkdir(dirname(jsonPath), { recursive: true });
        await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
        await writeFile(markdownPath, `${asMarkdownArtifact(payload)}\n`, 'utf-8');

        expect(telemetry.hit).toBe(3);
        expect(telemetry.miss).toBe(9);
        expect(p50Ms).toBeLessThanOrEqual(thresholdsMs.p50Max);
        expect(p95Ms).toBeLessThanOrEqual(thresholdsMs.p95Max);
    });
});
