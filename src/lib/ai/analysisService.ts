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
    fingerprint: string;
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
    executionStatus: 'success' | 'degraded';
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
    record: TrackIntelligenceRecord | null;
}

export interface AnalysisAdapter {
    analyzeTrack(input: TrackAnalysisInput, promptProfile: ResolvedPromptProfile): Promise<RawTrackAnalysis>;
}

export interface AnalysisCacheTelemetry {
    hit: number;
    miss: number;
}

export interface AnalysisCacheEvent {
    type: 'hit' | 'miss' | 'set' | 'evict' | 'expire';
    key: string;
    size: number;
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
    onCacheEvent?: (event: AnalysisCacheEvent) => void;
}

interface CacheEntry {
    record: TrackIntelligenceRecord;
    cachedAtMs: number;
    lastAccessAt: number;
}

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

export interface AnalysisQueueItem {
    id: string;
    input: TrackAnalysisInput;
}

export interface AnalysisQueueResult extends AnalysisResult {
    itemId: string;
}

const SUPPORTED_MOODS: TrackMood[] = ['calm', 'chill', 'energetic', 'intense', 'uplifting'];
const SUPPORTED_TEMPO_BUCKETS: TempoBucket[] = ['slow', 'mid', 'fast'];
const DEFAULT_RATIONALE = 'Model output was incomplete; deterministic fallback normalization was applied.';
const DEFAULT_PROMPT_PROFILE: ResolvedPromptProfile = {
    promptTemplate: 'Analyze this track.',
    promptProfileVersion: 'default',
};

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
    const candidate = (era ?? '').trim();
    return candidate.length > 0 ? candidate : 'unknown';
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

function classifyError(error: unknown): ErrorClassification {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (/(timeout|timed out|abort)/i.test(message)) return 'timeout';
    if (/(rate\s*limit|429|too many requests)/i.test(message)) return 'rate_limit';
    if (/(invalid payload|malformed|schema|validation)/i.test(message)) return 'invalid_payload';
    return 'unknown';
}

function isValidInput(input: TrackAnalysisInput): boolean {
    return !!normalizeText(input.trackId) && !!normalizeText(input.title) && !!normalizeText(input.artist);
}

export function validateAndNormalizeAnalysis(raw: unknown, input: TrackAnalysisInput): NormalizedAnalysisView {
    const payload = raw && typeof raw === 'object' ? (raw as RawTrackAnalysis) : {};

    const energy = clamp01(typeof payload.energy === 'number' ? payload.energy : inferEnergyFallback(input));
    const mood = normalizeMood(payload.mood) ?? inferMoodFromEnergy(energy);
    const genreConfidence = clamp01(typeof payload.genreConfidence === 'number' ? payload.genreConfidence : input.genre ? 0.6 : 0.3);
    const confidence = clamp01(Math.round(((energy + genreConfidence) / 2) * 10000) / 10000);

    return {
        energy,
        mood,
        era: normalizeEra(payload.era),
        genreConfidence,
        rationale: (payload.rationale ?? '').trim() || DEFAULT_RATIONALE,
        tempo_bucket: normalizeTempoBucket(payload.tempo_bucket) ?? inferTempoBucket(input),
        confidence,
        normalizationReasonCode: raw && typeof raw === 'object' ? 'none' : 'invalid_payload',
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

function fingerprintFor(input: TrackAnalysisInput, promptVersion?: string): string {
    return [
        input.trackId.trim(),
        normalizeText(input.title),
        normalizeText(input.artist),
        normalizeText(input.genre),
        normalizeOptionalNumber(input.bpm),
        normalizeOptionalNumber(input.durationSeconds),
        promptVersion ?? '',
    ].join('|');
}

function idempotencyKeyFor(input: TrackAnalysisInput, versions: { modelVersion: string; promptProfileVersion: string; promptVersion?: string }): string {
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
    private readonly onCacheEvent?: (event: AnalysisCacheEvent) => void;

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
        this.maxRetries = options.maxRetries ?? 2;
        this.maxCacheEntries = Math.max(1, options.maxCacheEntries ?? 512);
        this.cacheTtlMs = typeof options.cacheTtlMs === 'number' && options.cacheTtlMs >= 0 ? options.cacheTtlMs : undefined;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
        this.onCacheEvent = options.onCacheEvent;
    }

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
        if (!isValidInput(input)) {
            return {
                invocationStatus: 'failed',
                metadata: { cacheBehavior: 'processed', attempts: 0, errorClassification: 'invalid_payload' },
                status: 'analyzed',
                executionStatus: 'degraded',
                outcome: 'failed',
                source: 'fallback',
                record: null,
            };
        }

        const promptProfile = await this.resolvePromptProfile(input);
        const versions = {
            modelVersion: this.modelVersion,
            promptProfileVersion: this.promptProfileVersion ?? promptProfile.promptProfileVersion,
            promptVersion: this.promptVersion,
        };
        const key = idempotencyKeyFor(input, versions);
        const nowMs = this.now().getTime();
        const cached = this.byIdempotencyKey.get(key);

        if (cached) {
            if (typeof this.cacheTtlMs === 'number' && nowMs - cached.cachedAtMs > this.cacheTtlMs) {
                this.byIdempotencyKey.delete(key);
                this.expirationCount += 1;
                this.onCacheEvent?.({ type: 'expire', key, size: this.byIdempotencyKey.size });
            } else {
                cached.lastAccessAt = nowMs;
                this.cacheHitCount += 1;
                this.onCacheEvent?.({ type: 'hit', key, size: this.byIdempotencyKey.size });
                return {
                    invocationStatus: 'success',
                    metadata: { cacheBehavior: 'skipped', attempts: 0 },
                    status: 'skipped',
                    executionStatus: 'success',
                    outcome: 'success',
                    source: cached.record.source,
                    record: cached.record,
                };
            }
        }

        this.cacheMissCount += 1;
        this.onCacheEvent?.({ type: 'miss', key, size: this.byIdempotencyKey.size });

        let attempt = 0;
        while (attempt <= this.maxRetries) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, promptProfile);
                const normalized = validateAndNormalizeAnalysis(raw, input);
                const record: TrackIntelligenceRecord = {
                    trackId: input.trackId,
                    fingerprint: fingerprintFor(input, this.promptVersion),
                    idempotencyKey: key,
                    ...normalized,
                    source: 'ai',
                    attempts: attempt,
                    modelVersion: versions.modelVersion,
                    promptProfileVersion: versions.promptProfileVersion,
                    promptVersion: versions.promptVersion,
                    analyzedAt: this.now().toISOString(),
                };
                this.cacheRecord(key, record);
                return {
                    invocationStatus: 'success',
                    metadata: { cacheBehavior: 'processed', attempts: attempt },
                    status: 'analyzed',
                    executionStatus: 'success',
                    outcome: 'success',
                    source: 'ai',
                    record,
                };
            } catch (error) {
                const errorClassification = classifyError(error);
                const retryable = errorClassification === 'timeout' || errorClassification === 'rate_limit';
                if (!retryable) {
                    return {
                        invocationStatus: 'failed',
                        metadata: { cacheBehavior: 'processed', attempts: attempt, errorClassification },
                        status: 'analyzed',
                        executionStatus: 'degraded',
                        outcome: 'failed',
                        source: 'fallback',
                        record: null,
                    };
                }
                if (attempt > this.maxRetries) {
                    const fallback = validateAndNormalizeAnalysis(createFallbackAnalysis(input), input);
                    const record: TrackIntelligenceRecord = {
                        trackId: input.trackId,
                        fingerprint: fingerprintFor(input, this.promptVersion),
                        idempotencyKey: key,
                        ...fallback,
                        source: 'fallback',
                        attempts: attempt,
                        modelVersion: versions.modelVersion,
                        promptProfileVersion: versions.promptProfileVersion,
                        promptVersion: versions.promptVersion,
                        analyzedAt: this.now().toISOString(),
                    };
                    this.cacheRecord(key, record);
                    return {
                        invocationStatus: 'degraded',
                        metadata: { cacheBehavior: 'processed', attempts: attempt, errorClassification },
                        status: 'analyzed',
                        executionStatus: 'degraded',
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
            metadata: { cacheBehavior: 'processed', attempts: attempt },
            status: 'analyzed',
            executionStatus: 'degraded',
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
        if (typeof this.promptProfile === 'function') return this.promptProfile(input);
        return this.promptProfile;
    }

    private cacheRecord(key: string, record: TrackIntelligenceRecord): void {
        const nowMs = this.now().getTime();
        this.byIdempotencyKey.set(key, { record, cachedAtMs: nowMs, lastAccessAt: nowMs });
        this.onCacheEvent?.({ type: 'set', key, size: this.byIdempotencyKey.size });

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            let oldestKey: string | null = null;
            let oldestAccess = Number.POSITIVE_INFINITY;
            for (const [entryKey, entry] of this.byIdempotencyKey.entries()) {
                if (entry.lastAccessAt < oldestAccess) {
                    oldestAccess = entry.lastAccessAt;
                    oldestKey = entryKey;
                }
            }
            if (!oldestKey) break;
            this.byIdempotencyKey.delete(oldestKey);
            this.evictionCount += 1;
            this.onCacheEvent?.({ type: 'evict', key: oldestKey, size: this.byIdempotencyKey.size });
        }
    }
}

export async function processAnalysisQueue(items: AnalysisQueueItem[], service: AnalysisService): Promise<AnalysisQueueResult[]> {
    const out: AnalysisQueueResult[] = [];
    for (const item of items) {
        const result = await service.analyze(item.input);
        out.push({ itemId: item.id, ...result });
    }
    return out;
}
