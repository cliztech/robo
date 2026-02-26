export type TrackMood = 'calm' | 'chill' | 'energetic' | 'intense' | 'uplifting';

export interface TrackAnalysisInput {
    trackId: string;
    title: string;
    artist: string;
    genre?: string;
    bpm?: number;
    durationSeconds?: number;
}

export interface RawTrackAnalysis {
    energy?: number;
    mood?: string;
    era?: string;
    genreConfidence?: number;
}

export interface TrackIntelligenceRecord {
    trackId: string;
    idempotencyKey: string;
    energy: number;
    mood: TrackMood;
    era: string;
    genreConfidence: number;
    confidence: number;
    source: 'ai' | 'fallback';
    attempts: number;
    promptVersion: string;
    analyzedAt: string;
}

export type InvocationStatus = 'success' | 'degraded' | 'failed';
export type ErrorClassification = 'timeout' | 'rate_limit' | 'invalid_payload' | 'unknown';
export type CacheBehavior = 'processed' | 'skipped';

export interface AnalysisResultMetadata {
    cacheBehavior: CacheBehavior;
    errorClassification?: ErrorClassification;
    attempts: number;
}

export interface AnalysisResult {
    invocationStatus: InvocationStatus;
    record?: TrackIntelligenceRecord;
    metadata: AnalysisResultMetadata;
}

export interface AnalysisAdapter {
    analyzeTrack(input: TrackAnalysisInput, promptVersion: string): Promise<RawTrackAnalysis>;
}

export interface AnalysisServiceOptions {
    adapter: AnalysisAdapter;
    promptVersion: string;
    maxRetries?: number;
    now?: () => Date;
    onRetry?: (attempt: number, error: unknown) => void;
}

const SUPPORTED_MOODS: TrackMood[] = ['calm', 'chill', 'energetic', 'intense', 'uplifting'];

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function normalizeMood(mood?: string): TrackMood {
    if (!mood) return 'chill';
    const normalized = mood.trim().toLowerCase();
    if (SUPPORTED_MOODS.includes(normalized as TrackMood)) {
        return normalized as TrackMood;
    }

    if (['focus', 'ambient', 'soft'].includes(normalized)) return 'calm';
    if (['happy', 'bright', 'positive'].includes(normalized)) return 'uplifting';
    if (['dance', 'party', 'club'].includes(normalized)) return 'energetic';
    if (['aggressive', 'heavy'].includes(normalized)) return 'intense';
    return 'chill';
}

function inferMoodFromEnergy(energy: number): TrackMood {
    if (energy >= 0.85) return 'intense';
    if (energy >= 0.65) return 'energetic';
    if (energy <= 0.3) return 'calm';
    return 'chill';
}

function inferEnergyFallback(input: TrackAnalysisInput): number {
    if (typeof input.bpm !== 'number') return 0.55;
    if (input.bpm >= 150) return 0.95;
    if (input.bpm >= 135) return 0.82;
    if (input.bpm >= 120) return 0.68;
    if (input.bpm >= 100) return 0.52;
    return 0.38;
}

function normalizeEra(era?: string): string {
    if (!era) return 'unknown';
    const clean = era.trim();
    return clean.length > 0 ? clean : 'unknown';
}

function createFallbackAnalysis(input: TrackAnalysisInput): RawTrackAnalysis {
    const energy = inferEnergyFallback(input);
    return {
        energy,
        mood: inferMoodFromEnergy(energy),
        era: 'unknown',
        genreConfidence: input.genre ? 0.6 : 0.3,
    };
}

function classifyError(error: unknown): ErrorClassification {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (/(timeout|timed out|abort)/i.test(message)) return 'timeout';
    if (/(rate\s*limit|429|too many requests)/i.test(message)) return 'rate_limit';
    if (/(invalid payload|malformed|schema|validation)/i.test(message)) return 'invalid_payload';
    return 'unknown';
}

function invocationStatusFromSource(source: 'ai' | 'fallback'): Exclude<InvocationStatus, 'failed'> {
    return source === 'ai' ? 'success' : 'degraded';
}

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
    private readonly promptVersion: string;
    private readonly maxRetries: number;
    private readonly now: () => Date;
    private readonly onRetry?: (attempt: number, error: unknown) => void;
    private readonly byIdempotencyKey = new Map<string, TrackIntelligenceRecord>();

    constructor(options: AnalysisServiceOptions) {
        this.adapter = options.adapter;
        this.promptVersion = options.promptVersion;
        this.maxRetries = options.maxRetries ?? 2;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
    }

    getCacheSize(): number {
        return this.byIdempotencyKey.size;
    }

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
        const idempotencyKey = this.buildIdempotencyKey(input.trackId, this.promptVersion);
        const cached = this.byIdempotencyKey.get(idempotencyKey);
        if (cached) {
            return {
                invocationStatus: invocationStatusFromSource(cached.source),
                record: cached,
                metadata: {
                    cacheBehavior: 'skipped',
                    attempts: 0,
                },
            };
        }

        let attempt = 0;
        while (attempt <= this.maxRetries) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
                const normalized = this.normalize(raw, input, idempotencyKey, 'ai', attempt);
                this.byIdempotencyKey.set(idempotencyKey, normalized);

                return {
                    invocationStatus: 'success',
                    record: normalized,
                    metadata: {
                        cacheBehavior: 'processed',
                        attempts: attempt,
                    },
                };
            } catch (error) {
                const errorClassification = classifyError(error);
                const isRetryable = errorClassification === 'timeout' || errorClassification === 'rate_limit';

                if (!isRetryable) {
                    return {
                        invocationStatus: 'failed',
                        metadata: {
                            cacheBehavior: 'processed',
                            errorClassification,
                            attempts: attempt,
                        },
                    };
                }

                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    const normalized = this.normalize(fallback, input, idempotencyKey, 'fallback', attempt);
                    this.byIdempotencyKey.set(idempotencyKey, normalized);

                    return {
                        invocationStatus: 'degraded',
                        record: normalized,
                        metadata: {
                            cacheBehavior: 'processed',
                            errorClassification,
                            attempts: attempt,
                        },
                    };
                }

                this.onRetry?.(attempt, error);
            }
        }

        return {
            invocationStatus: 'failed',
            metadata: {
                cacheBehavior: 'processed',
                errorClassification: 'unknown',
                attempts: attempt,
            },
        };
    }

    private buildIdempotencyKey(trackId: string, promptVersion: string): string {
        return `${trackId}:${promptVersion}`;
    }

    private normalize(
        raw: RawTrackAnalysis,
        input: TrackAnalysisInput,
        idempotencyKey: string,
        source: 'ai' | 'fallback',
        attempts: number
    ): TrackIntelligenceRecord {
        const energy = clamp01(typeof raw.energy === 'number' ? raw.energy : inferEnergyFallback(input));
        const mood = normalizeMood(raw.mood) ?? inferMoodFromEnergy(energy);
        const genreConfidence = clamp01(typeof raw.genreConfidence === 'number' ? raw.genreConfidence : input.genre ? 0.6 : 0.3);

        return {
            trackId: input.trackId,
            idempotencyKey,
            energy,
            mood,
            era: normalizeEra(raw.era),
            genreConfidence,
            confidence: clamp01((energy + genreConfidence) / 2),
            source,
            attempts,
            promptVersion: this.promptVersion,
            analyzedAt: this.now().toISOString(),
        };
    }
}

export interface AnalysisQueueItem {
    id: string;
    input: TrackAnalysisInput;
}

export interface AnalysisQueueResult {
    itemId: string;
    invocationStatus: InvocationStatus;
    cacheBehavior: CacheBehavior;
    source?: 'ai' | 'fallback';
    errorClassification?: ErrorClassification;
}

export async function processAnalysisQueue(
    items: AnalysisQueueItem[],
    service: AnalysisService
): Promise<AnalysisQueueResult[]> {
    const results: AnalysisQueueResult[] = [];

    for (const item of items) {
        const outcome = await service.analyze(item.input);
        results.push({
            itemId: item.id,
            invocationStatus: outcome.invocationStatus,
            cacheBehavior: outcome.metadata.cacheBehavior,
            source: outcome.record?.source,
            errorClassification: outcome.metadata.errorClassification,
        });
    }

    return results;
}
