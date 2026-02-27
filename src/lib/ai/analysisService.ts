import { createHash } from 'node:crypto';

export type TrackMood = 'calm' | 'chill' | 'energetic' | 'intense' | 'uplifting';
export type TempoBucket = 'slow' | 'mid' | 'fast';

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
    rationale?: string;
    tempo_bucket?: string;
}

export type NormalizationReasonCode =
    | 'none'
    | 'invalid_payload'
    | 'missing_required_fields'
    | 'invalid_field_types'
    | 'empty_string_fields';

export type InvocationStatus = 'success' | 'degraded' | 'failed';
export type ErrorClassification = 'timeout' | 'rate_limit' | 'invalid_payload' | 'unknown';
export type CacheBehavior = 'processed' | 'skipped';

export interface TrackIntelligenceRecord {
    trackId: string;
    idempotencyKey: string;
    energy: number;
    mood: TrackMood;
    era: string;
    genreConfidence: number;
    rationale: string;
    tempo_bucket?: TempoBucket;
    confidence: number;
    normalizationReasonCode: NormalizationReasonCode;
    source: 'ai' | 'fallback';
    attempts: number;
    modelVersion: string;
    promptProfileVersion: string;
    promptVersion?: string;
    analyzedAt: string;
}

export interface AnalysisResultMetadata {
    cacheBehavior: CacheBehavior;
    errorClassification?: ErrorClassification;
    attempts: number;
}

export interface AnalysisResult {
    invocationStatus: InvocationStatus;
    metadata: AnalysisResultMetadata;
    status: 'analyzed' | 'skipped';
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
    record: TrackIntelligenceRecord | null;
}

export interface AnalysisAdapter {
    analyzeTrack(input: TrackAnalysisInput, promptProfile: ResolvedPromptProfile): Promise<RawTrackAnalysis>;
}

export interface ResolvedPromptProfile {
    promptTemplate: string;
    promptProfileVersion: string;
}

export type PromptProfileResolver = (input: TrackAnalysisInput) => Promise<ResolvedPromptProfile> | ResolvedPromptProfile;

export interface AnalysisServiceOptions {
    adapter: AnalysisAdapter;
    promptProfile?: ResolvedPromptProfile | PromptProfileResolver;
    modelVersion?: string;
    promptProfileVersion?: string;
    promptVersion?: string;
    maxRetries?: number;
    maxCacheEntries?: number;
    cacheTtlMs?: number;
    now?: () => Date;
    onRetry?: (attempt: number, error: unknown) => void;
}

export interface AnalysisCacheTelemetry {
    hit: number;
    miss: number;
}

export interface AnalysisCacheStats {
    size: number;
    hits: number;
    misses: number;
    evictions: number;
    expirations: number;
}

export interface AnalysisTelemetry {
    cacheHits: number;
    cacheMisses: number;
}

const SUPPORTED_MOODS: TrackMood[] = ['calm', 'chill', 'energetic', 'intense', 'uplifting'];
const SUPPORTED_TEMPO_BUCKETS: TempoBucket[] = ['slow', 'mid', 'fast'];
const DEFAULT_RATIONALE = 'Model output was incomplete; deterministic fallback normalization was applied.';
const DEFAULT_PROMPT_PROFILE: ResolvedPromptProfile = {
    promptTemplate: 'Analyze this track.',
    promptProfileVersion: 'default',
};

type ValidationIssue = 'missing_required_fields' | 'invalid_field_types' | 'empty_string_fields';

interface NormalizedAnalysisView {
    energy: number;
    mood: TrackMood;
    era: string;
    genreConfidence: number;
    rationale: string;
    tempo_bucket?: TempoBucket;
    confidence: number;
    normalizationReasonCode: NormalizationReasonCode;
}

interface CacheEntry {
    record: TrackIntelligenceRecord;
    cachedAt: number;
    lastAccessAt: number;
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function normalizeText(value?: string): string {
    return (value ?? '').trim().toLowerCase();
}

function normalizeOptionalNumber(value?: number): string {
    return typeof value === 'number' && Number.isFinite(value) ? `${value}` : '';
}

function normalizeMood(mood?: string): TrackMood | undefined {
    if (!mood) return undefined;
    const normalized = mood.trim().toLowerCase();
    if (SUPPORTED_MOODS.includes(normalized as TrackMood)) return normalized as TrackMood;
    if (['focus', 'ambient', 'soft'].includes(normalized)) return 'calm';
    if (['happy', 'bright', 'positive'].includes(normalized)) return 'uplifting';
    if (['dance', 'party', 'club'].includes(normalized)) return 'energetic';
    if (['aggressive', 'heavy'].includes(normalized)) return 'intense';
    return undefined;
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
    return era?.trim() ? era.trim() : 'unknown';
}

function inferTempoBucket(input: TrackAnalysisInput): TempoBucket | undefined {
    if (typeof input.bpm !== 'number') return undefined;
    if (input.bpm < 100) return 'slow';
    if (input.bpm <= 130) return 'mid';
    return 'fast';
}

function normalizeTempoBucket(value?: string): TempoBucket | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    return SUPPORTED_TEMPO_BUCKETS.includes(normalized as TempoBucket) ? (normalized as TempoBucket) : undefined;
}

function asNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function resolveNormalizationReason(issues: Set<ValidationIssue>, payloadInvalid: boolean): NormalizationReasonCode {
    if (payloadInvalid) return 'invalid_payload';
    if (issues.has('missing_required_fields')) return 'missing_required_fields';
    if (issues.has('invalid_field_types')) return 'invalid_field_types';
    if (issues.has('empty_string_fields')) return 'empty_string_fields';
    return 'none';
}

function parseRawTrackAnalysis(raw: unknown): { parsed: RawTrackAnalysis; reasonCode: NormalizationReasonCode } {
    if (!raw || typeof raw !== 'object') {
        return { parsed: {}, reasonCode: 'invalid_payload' };
    }

    const source = raw as Record<string, unknown>;
    const parsed: RawTrackAnalysis = {};
    const issues = new Set<ValidationIssue>();

    if ('energy' in source) {
        if (typeof source.energy === 'number' && Number.isFinite(source.energy)) parsed.energy = source.energy;
        else issues.add('invalid_field_types');
    }

    if ('mood' in source) {
        if (typeof source.mood === 'string') {
            const mood = asNonEmptyString(source.mood);
            if (mood) parsed.mood = mood;
            else {
                issues.add('empty_string_fields');
                issues.add('missing_required_fields');
            }
        } else {
            issues.add('invalid_field_types');
        }
    } else {
        issues.add('missing_required_fields');
    }

    if ('era' in source) {
        if (typeof source.era === 'string') parsed.era = source.era;
        else issues.add('invalid_field_types');
    }

    if ('genreConfidence' in source) {
        if (typeof source.genreConfidence === 'number' && Number.isFinite(source.genreConfidence)) parsed.genreConfidence = source.genreConfidence;
        else issues.add('invalid_field_types');
    }

    if ('rationale' in source) {
        if (typeof source.rationale === 'string') {
            const rationale = asNonEmptyString(source.rationale);
            if (rationale) parsed.rationale = rationale;
            else {
                issues.add('empty_string_fields');
                issues.add('missing_required_fields');
            }
        } else {
            issues.add('invalid_field_types');
        }
    } else {
        issues.add('missing_required_fields');
    }

    if ('tempo_bucket' in source) {
        if (typeof source.tempo_bucket === 'string') {
            const tempoBucket = normalizeTempoBucket(source.tempo_bucket);
            if (tempoBucket) parsed.tempo_bucket = tempoBucket;
            else issues.add('invalid_field_types');
        } else {
            issues.add('invalid_field_types');
        }
    }

    return { parsed, reasonCode: resolveNormalizationReason(issues, false) };
}

export function validateAndNormalizeAnalysis(raw: unknown, input: TrackAnalysisInput): NormalizedAnalysisView {
    const { parsed, reasonCode } = parseRawTrackAnalysis(raw);
    const energy = clamp01(typeof parsed.energy === 'number' ? parsed.energy : inferEnergyFallback(input));
    const mood = normalizeMood(parsed.mood) ?? inferMoodFromEnergy(energy);
    const genreConfidence = clamp01(typeof parsed.genreConfidence === 'number' ? parsed.genreConfidence : input.genre ? 0.6 : 0.3);
    const confidence = clamp01(Math.round(((energy + genreConfidence) / 2) * 10000) / 10000);

    return {
        energy,
        mood,
        era: normalizeEra(parsed.era),
        genreConfidence,
        rationale: parsed.rationale ?? DEFAULT_RATIONALE,
        tempo_bucket: normalizeTempoBucket(parsed.tempo_bucket) ?? inferTempoBucket(input),
        confidence,
        normalizationReasonCode: reasonCode,
    };
}

function createFallbackAnalysis(input: TrackAnalysisInput): RawTrackAnalysis {
    const energy = inferEnergyFallback(input);
    return {
        energy,
        mood: inferMoodFromEnergy(energy),
        era: 'unknown',
        genreConfidence: input.genre ? 0.6 : 0.3,
        rationale: DEFAULT_RATIONALE,
        tempo_bucket: inferTempoBucket(input),
    };
}

function classifyError(error: unknown): ErrorClassification {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (/(timeout|timed out|abort)/i.test(message)) return 'timeout';
    if (/(rate\s*limit|429|too many requests)/i.test(message)) return 'rate_limit';
    if (/(invalid payload|malformed|schema|validation)/i.test(message)) return 'invalid_payload';
    return 'unknown';
}

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
    private readonly promptProfile: ResolvedPromptProfile | PromptProfileResolver;
    private readonly modelVersion: string;
    private readonly promptVersion?: string;
    private readonly promptProfileVersion?: string;
    private readonly maxRetries: number;
    private readonly maxCacheEntries: number;
    private readonly cacheTtlMs?: number;
    private readonly now: () => Date;
    private readonly onRetry?: (attempt: number, error: unknown) => void;

    private readonly byIdempotencyKey = new Map<string, CacheEntry>();

    private cacheHitCount = 0;
    private cacheMissCount = 0;
    private evictionCount = 0;
    private expirationCount = 0;

    constructor(options: AnalysisServiceOptions) {
        this.adapter = options.adapter;
        this.promptProfile = options.promptProfile ?? DEFAULT_PROMPT_PROFILE;
        this.modelVersion = options.modelVersion ?? 'unknown-model';
        this.promptVersion = options.promptVersion;
        this.promptProfileVersion = options.promptProfileVersion;
        this.maxRetries = Math.max(0, options.maxRetries ?? 2);
        this.maxCacheEntries = Math.max(1, options.maxCacheEntries ?? 1000);
        this.cacheTtlMs = options.cacheTtlMs;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
    }

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
        // 1) validate input
        if (!input.trackId?.trim()) {
            return {
                invocationStatus: 'failed',
                metadata: { cacheBehavior: 'processed', attempts: 0, errorClassification: 'invalid_payload' },
                status: 'analyzed',
                outcome: 'failed',
                source: 'fallback',
                record: null,
            };
        }

        const promptProfile = await this.resolvePromptProfile(input);
        const key = this.buildIdempotencyKey(input, {
            modelVersion: this.modelVersion,
            promptProfileVersion: this.promptProfileVersion ?? promptProfile.promptProfileVersion,
            promptVersion: this.promptVersion,
        });

        // 2) cache lookup (LRU + optional TTL)
        const cached = this.getCachedRecord(key);
        if (cached) {
            return {
                invocationStatus: cached.source === 'ai' ? 'success' : 'degraded',
                metadata: { cacheBehavior: 'skipped', attempts: 0 },
                status: 'skipped',
                outcome: cached.source === 'ai' ? 'success' : 'degraded',
                source: cached.source,
                record: cached,
            };
        }

        // 3) bounded retry invoke
        let attempt = 0;
        let errorClassification: ErrorClassification | undefined;

        while (attempt <= this.maxRetries) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, promptProfile);

                // 5) structured result mapping
                const record = this.normalize(raw, input, key, 'ai', attempt, {
                    modelVersion: this.modelVersion,
                    promptProfileVersion: this.promptProfileVersion ?? promptProfile.promptProfileVersion,
                    promptVersion: this.promptVersion,
                });
                this.cacheRecord(key, record);
                return {
                    invocationStatus: 'success',
                    metadata: { cacheBehavior: 'processed', attempts: attempt },
                    status: 'analyzed',
                    outcome: 'success',
                    source: 'ai',
                    record,
                };
            } catch (error) {
                errorClassification = classifyError(error);
                const isRetryable = errorClassification === 'timeout' || errorClassification === 'rate_limit';
                if (!isRetryable) {
                    return {
                        invocationStatus: 'failed',
                        metadata: { cacheBehavior: 'processed', attempts: attempt, errorClassification },
                        status: 'analyzed',
                        outcome: 'failed',
                        source: 'fallback',
                        record: null,
                    };
                }

                if (attempt > this.maxRetries) {
                    // 4) fallback normalize
                    const fallback = createFallbackAnalysis(input);
                    const record = this.normalize(fallback, input, key, 'fallback', attempt, {
                        modelVersion: this.modelVersion,
                        promptProfileVersion: this.promptProfileVersion ?? promptProfile.promptProfileVersion,
                        promptVersion: this.promptVersion,
                    });
                    this.cacheRecord(key, record);
                    return {
                        invocationStatus: 'degraded',
                        metadata: { cacheBehavior: 'processed', attempts: attempt, errorClassification },
                        status: 'analyzed',
                        outcome: 'degraded',
                        source: 'fallback',
                        record,
                    };
                }

                this.onRetry?.(attempt, error);
            }
        }

        return {
            invocationStatus: 'failed',
            metadata: { cacheBehavior: 'processed', attempts: attempt, errorClassification },
            status: 'analyzed',
            outcome: 'failed',
            source: 'fallback',
            record: null,
        };
    }

    getCacheTelemetry(): AnalysisCacheTelemetry {
        return { hit: this.cacheHitCount, miss: this.cacheMissCount };
    }

    getTelemetry(): AnalysisTelemetry {
        return { cacheHits: this.cacheHitCount, cacheMisses: this.cacheMissCount };
    }

    getCacheSize(): number {
        return this.byIdempotencyKey.size;
    }

    getCacheStats(): AnalysisCacheStats {
        return {
            size: this.byIdempotencyKey.size,
            hits: this.cacheHitCount,
            misses: this.cacheMissCount,
            evictions: this.evictionCount,
            expirations: this.expirationCount,
        };
    }

    private async resolvePromptProfile(input: TrackAnalysisInput): Promise<ResolvedPromptProfile> {
        if (typeof this.promptProfile === 'function') {
            return this.promptProfile(input);
        }
        return this.promptProfile;
    }

    private buildIdempotencyKey(
        input: TrackAnalysisInput,
        versions: { modelVersion: string; promptProfileVersion: string; promptVersion?: string }
    ): string {
        const canonical = JSON.stringify({
            trackId: normalizeText(input.trackId),
            title: normalizeText(input.title),
            artist: normalizeText(input.artist),
            genre: normalizeText(input.genre),
            bpm: normalizeOptionalNumber(input.bpm),
            durationSeconds: normalizeOptionalNumber(input.durationSeconds),
            modelVersion: versions.modelVersion,
            promptProfileVersion: versions.promptProfileVersion,
            promptVersion: versions.promptVersion ?? '',
        });

        return createHash('sha256').update(canonical).digest('hex');
    }

    private getCachedRecord(idempotencyKey: string): TrackIntelligenceRecord | null {
        const entry = this.byIdempotencyKey.get(idempotencyKey);
        if (!entry) {
            this.cacheMissCount += 1;
            return null;
        }

        const nowMs = this.now().getTime();
        if (this.cacheTtlMs !== undefined && nowMs - entry.cachedAt > this.cacheTtlMs) {
            this.byIdempotencyKey.delete(idempotencyKey);
            this.cacheMissCount += 1;
            this.expirationCount += 1;
            return null;
        }

        entry.lastAccessAt = nowMs;
        this.cacheHitCount += 1;
        return entry.record;
    }

    private cacheRecord(idempotencyKey: string, record: TrackIntelligenceRecord): void {
        const nowMs = this.now().getTime();
        this.byIdempotencyKey.set(idempotencyKey, {
            record,
            cachedAt: nowMs,
            lastAccessAt: nowMs,
        });

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            let lruKey: string | null = null;
            let lruAccess = Number.POSITIVE_INFINITY;
            for (const [key, entry] of this.byIdempotencyKey.entries()) {
                if (entry.lastAccessAt < lruAccess) {
                    lruAccess = entry.lastAccessAt;
                    lruKey = key;
                }
            }
            if (!lruKey) break;
            this.byIdempotencyKey.delete(lruKey);
            this.evictionCount += 1;
        }
    }

    private normalize(
        raw: unknown,
        input: TrackAnalysisInput,
        idempotencyKey: string,
        source: 'ai' | 'fallback',
        attempts: number,
        versions: { modelVersion: string; promptProfileVersion: string; promptVersion?: string }
    ): TrackIntelligenceRecord {
        const normalized = validateAndNormalizeAnalysis(raw, input);
        return {
            trackId: input.trackId,
            idempotencyKey,
            energy: normalized.energy,
            mood: normalized.mood,
            era: normalized.era,
            genreConfidence: normalized.genreConfidence,
            rationale: normalized.rationale,
            tempo_bucket: normalized.tempo_bucket,
            confidence: normalized.confidence,
            normalizationReasonCode: normalized.normalizationReasonCode,
            source,
            attempts,
            modelVersion: versions.modelVersion,
            promptProfileVersion: versions.promptProfileVersion,
            promptVersion: versions.promptVersion,
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
    status: 'analyzed' | 'skipped';
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
}

export async function processAnalysisQueue(
    queue: AnalysisQueueItem[],
    service: AnalysisService
): Promise<AnalysisQueueResult[]> {
    const results: AnalysisQueueResult[] = [];
    for (const item of queue) {
        const outcome = await service.analyze(item.input);
        results.push({
            itemId: item.id,
            status: outcome.status,
            outcome: outcome.outcome,
            source: outcome.source,
        });
    }
    return results;
}
