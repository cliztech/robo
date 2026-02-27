import { createHash } from 'node:crypto';

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
    rationale?: string;
    tempo_bucket?: string;
}

export type NormalizationReasonCode =
    | 'none'
    | 'invalid_payload'
    | 'missing_required_fields'
    | 'invalid_field_types'
    | 'empty_string_fields';

export type TempoBucket = 'slow' | 'mid' | 'fast';

export interface TrackIntelligenceRecord {
    trackId: string;
    fingerprint: string;
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
    modelVersion: string;
    promptProfileVersion: string;
    promptVersion: string;
    fingerprint: {
        trackContentHash: string;
        modelVersion: string;
        promptProfileVersion: string;
    };
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
    status: 'analyzed' | 'skipped';
    executionStatus: 'success' | 'degraded';
    record: TrackIntelligenceRecord;
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
    modelVersion: string;
    promptProfile: ResolvedPromptProfile | PromptProfileResolver;
    promptVersion: string;
    modelVersion?: string;
    promptProfileVersion?: string;
    resolveVersionProfile?: (input: TrackAnalysisInput) => { modelVersion: string; promptProfileVersion: string };
    maxRetries?: number;
    maxCacheEntries?: number;
    cacheTtlMs?: number;
    now?: () => Date;
    onRetry?: (attempt: number, error: unknown) => void;
    onCacheEvent?: (event: AnalysisCacheEvent) => void;
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

export interface AnalysisCacheEntry {
    record: TrackIntelligenceRecord;
    cachedAtMs: number;
}

export interface AnalysisCacheEvent {
    type: 'hit' | 'miss' | 'set' | 'evict' | 'expire';
    key: string;
    size: number;
}

interface AnalysisVersionProfile {
    modelVersion: string;
    promptProfileVersion: string;
}

interface CacheEntry {
    record: TrackIntelligenceRecord;
    cachedAt: number;
    lastAccessAt: number;
}

export interface AnalysisTelemetry {
    cacheHits: number;
    cacheMisses: number;
}

// Canonical moods persisted in track intelligence records.
// Non-canonical/unknown model output should not be forced to a fixed default;
// fallback selection is decided at call sites (typically derived from energy).
const SUPPORTED_MOODS: TrackMood[] = ['calm', 'chill', 'energetic', 'intense', 'uplifting'];
const SUPPORTED_TEMPO_BUCKETS: TempoBucket[] = ['slow', 'mid', 'fast'];
const DEFAULT_RATIONALE = 'Model output was incomplete; deterministic fallback normalization was applied.';

type ValidationIssue = 'missing_required_fields' | 'invalid_field_types' | 'empty_string_fields';

interface ParsedAnalysisSchema {
    energy?: number;
    mood?: string;
    era?: string;
    genreConfidence?: number;
    rationale?: string;
    tempo_bucket?: TempoBucket;
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

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

// Alias table maps known model vocabulary to canonical moods.
// Unknown free-text values intentionally return undefined so callers can
// apply explicit fallback policy (e.g., infer from energy thresholds).
function normalizeMood(mood?: string): TrackMood | undefined {
    if (!mood) return undefined;
    const normalized = mood.trim().toLowerCase();
    if (SUPPORTED_MOODS.includes(normalized as TrackMood)) {
        return normalized as TrackMood;
    }

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
    if (!era) return 'unknown';
    const clean = era.trim();
    return clean.length > 0 ? clean : 'unknown';
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
    if (SUPPORTED_TEMPO_BUCKETS.includes(normalized as TempoBucket)) {
        return normalized as TempoBucket;
    }
    return undefined;
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

function parseRawTrackAnalysis(raw: unknown): { parsed: ParsedAnalysisSchema; reasonCode: NormalizationReasonCode } {
    if (!raw || typeof raw !== 'object') {
        return { parsed: {}, reasonCode: 'invalid_payload' };
    }

    const source = raw as Record<string, unknown>;
    const parsed: ParsedAnalysisSchema = {};
    const issues = new Set<ValidationIssue>();

    if ('energy' in source) {
        if (typeof source.energy === 'number' && Number.isFinite(source.energy)) {
            parsed.energy = source.energy;
        } else {
            issues.add('invalid_field_types');
        }
    }

    if ('mood' in source) {
        if (typeof source.mood === 'string') {
            const mood = asNonEmptyString(source.mood);
            if (mood) {
                parsed.mood = mood;
            } else {
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
        if (typeof source.era === 'string') {
            const era = asNonEmptyString(source.era);
            if (era) {
                parsed.era = era;
            } else {
                issues.add('empty_string_fields');
            }
        } else {
            issues.add('invalid_field_types');
        }
    }

    if ('genreConfidence' in source) {
        if (typeof source.genreConfidence === 'number' && Number.isFinite(source.genreConfidence)) {
            parsed.genreConfidence = source.genreConfidence;
        } else {
            issues.add('invalid_field_types');
        }
    }

    if ('rationale' in source) {
        if (typeof source.rationale === 'string') {
            const rationale = asNonEmptyString(source.rationale);
            if (rationale) {
                parsed.rationale = rationale;
            } else {
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
            if (tempoBucket) {
                parsed.tempo_bucket = tempoBucket;
            } else {
                issues.add('invalid_field_types');
            }
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
    const rationale = parsed.rationale ?? DEFAULT_RATIONALE;
    const tempo_bucket = parsed.tempo_bucket ?? inferTempoBucket(input);
    const confidence = clamp01(Math.round(((energy + genreConfidence) / 2) * 10000) / 10000);

    return {
        energy,
        mood,
        era: normalizeEra(parsed.era),
        genreConfidence,
        rationale,
        tempo_bucket,
        confidence,
        normalizationReasonCode: reasonCode,
    };
function normalizeText(value?: string): string {
    return (value ?? '').trim().toLowerCase();
}

function normalizeOptionalNumber(value?: number): string {
    return typeof value === 'number' && Number.isFinite(value) ? `${value}` : '';
}

function buildAnalysisInputCanonicalPayload(input: TrackAnalysisInput): string {
    const normalized = {
        trackId: normalizeText(input.trackId),
        title: normalizeText(input.title),
        artist: normalizeText(input.artist),
        genre: normalizeText(input.genre),
        bpm: normalizeOptionalNumber(input.bpm),
        durationSeconds: normalizeOptionalNumber(input.durationSeconds),
    };

    return JSON.stringify(normalized);
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

function normalizeFingerprintInput(input: TrackAnalysisInput): Record<string, number | string | null> {
    return {
        trackId: input.trackId.trim(),
        title: input.title.trim().toLowerCase(),
        artist: input.artist.trim().toLowerCase(),
        genre: input.genre?.trim().toLowerCase() ?? null,
        bpm: typeof input.bpm === 'number' && Number.isFinite(input.bpm) ? input.bpm : null,
        durationSeconds: typeof input.durationSeconds === 'number' && Number.isFinite(input.durationSeconds) ? input.durationSeconds : null,
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
function buildFingerprint(payload: Record<string, number | string | null>): string {
    const canonicalPayload = Object.fromEntries(Object.entries(payload).sort());
    const canonical = JSON.stringify(canonicalPayload);
    return createHash('sha256').update(canonical).digest('hex');
}

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
    private readonly modelVersion: string;
    private readonly promptProfile: ResolvedPromptProfile | PromptProfileResolver;
    private readonly promptVersion: string;
    private readonly modelVersion: string;
    private readonly promptProfileVersion: string;
    private readonly modelVersion?: string;
    private readonly promptProfileVersion?: string;
    private readonly resolveVersionProfile?: (input: TrackAnalysisInput) => AnalysisVersionProfile;
    private readonly maxRetries: number;
    private readonly maxCacheEntries: number;
    private readonly cacheTtlMs?: number;
    private readonly now: () => Date;
    private readonly onRetry?: (attempt: number, error: unknown) => void;
    private readonly byIdempotencyKey = new Map<string, TrackIntelligenceRecord>();
    private cacheHitCount = 0;
    private cacheMissCount = 0;
    private readonly byFingerprint = new Map<string, TrackIntelligenceRecord>();
    private readonly telemetry: AnalysisTelemetry = {
        cacheHits: 0,
        cacheMisses: 0,
    private readonly byIdempotencyKey = new Map<string, CacheEntry>();
    private readonly onCacheEvent?: (event: AnalysisCacheEvent) => void;
    private readonly byIdempotencyKey = new Map<string, AnalysisCacheEntry>();
    private readonly cacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        expirations: 0,
    };

    constructor(options: AnalysisServiceOptions) {
        this.adapter = options.adapter;
        this.promptProfile = options.promptProfile;
        this.promptVersion = options.promptVersion;
        this.modelVersion = options.modelVersion;
        this.promptProfileVersion = options.promptProfileVersion;
        this.resolveVersionProfile = options.resolveVersionProfile;
        this.maxRetries = options.maxRetries ?? 2;
        this.maxCacheEntries = options.maxCacheEntries ?? Number.POSITIVE_INFINITY;
        this.cacheTtlMs = options.cacheTtlMs;
        this.maxCacheEntries = Math.max(1, options.maxCacheEntries ?? 512);
        this.cacheTtlMs =
            typeof options.cacheTtlMs === 'number' && options.cacheTtlMs >= 0 ? options.cacheTtlMs : undefined;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
        this.onCacheEvent = options.onCacheEvent;
    }

    getCacheSize(): number {
        return this.byFingerprint.size;
    }

    getTelemetry(): AnalysisTelemetry {
        return { ...this.telemetry };
    }

    getCacheStats(): AnalysisCacheStats {
        return {
            size: this.byIdempotencyKey.size,
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            evictions: this.cacheStats.evictions,
            expirations: this.cacheStats.expirations,
        };
    }

    getCacheTelemetry(): AnalysisCacheTelemetry {
        return {
            hit: this.cacheHitCount,
            miss: this.cacheMissCount,
        };
    }

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
        const fingerprint = this.buildFingerprint(input);
        const idempotencyKey = this.buildIdempotencyKey(fingerprint);
        const promptProfile = await this.resolvePromptProfile(input);
        const promptProfileVersion = promptProfile.promptProfileVersion;
        const idempotencyKey = this.buildIdempotencyKey(input.trackId, promptProfileVersion);
        const fingerprint = this.buildFingerprint(input, this.promptVersion);
        const cached = this.byFingerprint.get(fingerprint);
        if (cached) {
            this.telemetry.cacheHits += 1;
            return { status: 'skipped', executionStatus: 'success', record: cached };
        this.evictExpiredEntries();

        const idempotencyKey = this.buildIdempotencyKey(input.trackId, this.promptVersion);
        const idempotencyKey = this.buildFingerprintKey(input);
        const versionProfile = this.resolveVersionProfile?.(input) ?? {
            modelVersion: this.modelVersion ?? 'unknown-model',
            promptProfileVersion: this.promptProfileVersion ?? this.promptVersion,
        };
        const idempotencyKey = this.buildIdempotencyKey(input, versionProfile);
        const cached = this.byIdempotencyKey.get(idempotencyKey);
        if (input.trackId.trim().length === 0) {
            return {
                status: 'analyzed',
                outcome: 'failed',
                source: 'fallback',
                record: null,
            };
        }

        const idempotencyKey = this.buildIdempotencyKey(input.trackId, this.promptVersion);
        const cached = this.getCachedRecord(idempotencyKey);
        if (cached) {
            this.cacheHitCount += 1;
            return { status: 'skipped', record: cached };
            return {
                invocationStatus: invocationStatusFromSource(cached.source),
                record: cached,
                metadata: {
                    cacheBehavior: 'skipped',
                    attempts: 0,
                },
            cached.lastAccessAt = this.now().getTime();
            return { status: 'skipped', record: cached.record };
            return {
                status: 'skipped',
                outcome: cached.source === 'ai' ? 'success' : 'degraded',
                source: cached.source,
                record: cached,
            };
        }
        this.cacheMissCount += 1;

        this.telemetry.cacheMisses += 1;

        let attempt = 0;
        while (attempt <= this.maxRetries) {
        let normalized: TrackIntelligenceRecord | null = null;
        let source: 'ai' | 'fallback' = 'ai';

        while (attempt <= this.maxRetries && !normalized) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, promptProfile);
                normalized = this.normalize(raw, input, idempotencyKey, 'ai', attempt, promptProfileVersion);
            } catch (error) {
                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, idempotencyKey, 'fallback', attempt, promptProfileVersion);
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
                normalized = this.normalize(raw, input, idempotencyKey, fingerprint, 'ai', attempt);
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
                normalized = this.normalize(raw, input, fingerprint, 'ai', attempt);
            } catch (error) {
                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, fingerprint, 'fallback', attempt);
                normalized = this.normalize(raw, input, idempotencyKey, versionProfile, 'ai', attempt);
            } catch (error) {
                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, idempotencyKey, versionProfile, 'fallback', attempt);
                normalized = this.normalize(raw, input, idempotencyKey, 'ai', attempt);
                source = 'ai';
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
                    normalized = this.normalize(fallback, input, idempotencyKey, fingerprint, 'fallback', attempt);
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
                    normalized = this.normalize(fallback, input, idempotencyKey, 'fallback', attempt);
                    source = 'fallback';
                    break;
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
        if (!normalized) {
            return {
                status: 'analyzed',
                outcome: 'failed',
                source,
                record: null,
            };
        }

        this.byFingerprint.set(fingerprint, normalized);
        return {
            status: 'analyzed',
            executionStatus: normalized.source === 'ai' ? 'success' : 'degraded',
            record: normalized,
        };
    }

    private buildFingerprint(input: TrackAnalysisInput, promptVersion: string): string {
        const stablePayload = [
            input.trackId,
            input.title.trim().toLowerCase(),
            input.artist.trim().toLowerCase(),
            (input.genre ?? '').trim().toLowerCase(),
            String(input.bpm ?? ''),
            String(input.durationSeconds ?? ''),
            promptVersion,
        ];

        return stablePayload.join('|');
        const nowMs = this.now().getTime();
        this.byIdempotencyKey.set(idempotencyKey, {
            record: normalized,
            cachedAt: nowMs,
            lastAccessAt: nowMs,
        });
        this.enforceCacheBounds();
        this.cacheRecord(idempotencyKey, normalized);
        return { status: 'analyzed', record: normalized };
        this.byIdempotencyKey.set(idempotencyKey, normalized);
        return {
            status: 'analyzed',
            outcome: normalized.source === 'ai' ? 'success' : 'degraded',
            source: normalized.source,
            record: normalized,
        };
    }

    private getCachedRecord(idempotencyKey: string): TrackIntelligenceRecord | null {
        const cached = this.byIdempotencyKey.get(idempotencyKey);
        if (!cached) {
            this.cacheStats.misses += 1;
            this.emitCacheEvent('miss', idempotencyKey);
            return null;
        }

        if (this.cacheTtlMs !== undefined) {
            const ageMs = this.now().getTime() - cached.cachedAtMs;
            if (ageMs > this.cacheTtlMs) {
                this.byIdempotencyKey.delete(idempotencyKey);
                this.cacheStats.expirations += 1;
                this.cacheStats.misses += 1;
                this.emitCacheEvent('expire', idempotencyKey);
                this.emitCacheEvent('miss', idempotencyKey);
                return null;
            }
        }

        this.byIdempotencyKey.delete(idempotencyKey);
        this.byIdempotencyKey.set(idempotencyKey, cached);
        this.cacheStats.hits += 1;
        this.emitCacheEvent('hit', idempotencyKey);
        return cached.record;
    }

    private cacheRecord(idempotencyKey: string, record: TrackIntelligenceRecord): void {
        if (this.byIdempotencyKey.has(idempotencyKey)) {
            this.byIdempotencyKey.delete(idempotencyKey);
        }

        this.byIdempotencyKey.set(idempotencyKey, {
            record,
            cachedAtMs: this.now().getTime(),
        });

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            const oldestKey = this.byIdempotencyKey.keys().next().value;
            if (!oldestKey) {
                break;
            }
            this.byIdempotencyKey.delete(oldestKey);
            this.cacheStats.evictions += 1;
            this.emitCacheEvent('evict', oldestKey);
        }

        this.emitCacheEvent('set', idempotencyKey);
    }

    private buildFingerprintKey(input: TrackAnalysisInput): string {
        const payload = JSON.stringify({
            analysisInput: buildAnalysisInputCanonicalPayload(input),
            versions: {
                promptVersion: this.promptVersion,
                modelVersion: this.modelVersion,
                promptProfileVersion: this.promptProfileVersion,
            },
        });

        const hash = createHash('sha256').update(payload).digest('hex');
        const debugPrefix = normalizeText(input.trackId).slice(0, 24) || 'unknown-track';
        return `analysis:${debugPrefix}:${hash}`;
    private emitCacheEvent(type: AnalysisCacheEvent['type'], key: string): void {
        this.onCacheEvent?.({
            type,
            key,
            size: this.byIdempotencyKey.size,
        });
    }

    private getCachedRecord(idempotencyKey: string): TrackIntelligenceRecord | null {
        const cached = this.byIdempotencyKey.get(idempotencyKey);
        if (!cached) {
            this.cacheStats.misses += 1;
            this.emitCacheEvent('miss', idempotencyKey);
            return null;
        }

        if (this.cacheTtlMs !== undefined) {
            const ageMs = this.now().getTime() - cached.cachedAtMs;
            if (ageMs > this.cacheTtlMs) {
                this.byIdempotencyKey.delete(idempotencyKey);
                this.cacheStats.expirations += 1;
                this.cacheStats.misses += 1;
                this.emitCacheEvent('expire', idempotencyKey);
                this.emitCacheEvent('miss', idempotencyKey);
                return null;
            }
        }

        this.byIdempotencyKey.delete(idempotencyKey);
        this.byIdempotencyKey.set(idempotencyKey, cached);
        this.cacheStats.hits += 1;
        this.emitCacheEvent('hit', idempotencyKey);
        return cached.record;
    }

    private cacheRecord(idempotencyKey: string, record: TrackIntelligenceRecord): void {
        if (this.byIdempotencyKey.has(idempotencyKey)) {
            this.byIdempotencyKey.delete(idempotencyKey);
        }

        this.byIdempotencyKey.set(idempotencyKey, {
            record,
            cachedAtMs: this.now().getTime(),
        });

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            const oldestKey = this.byIdempotencyKey.keys().next().value;
            if (!oldestKey) {
                break;
            }
            this.byIdempotencyKey.delete(oldestKey);
            this.cacheStats.evictions += 1;
            this.emitCacheEvent('evict', oldestKey);
        }

        this.emitCacheEvent('set', idempotencyKey);
    }

    private evictExpiredEntries(): void {
        if (typeof this.cacheTtlMs !== 'number' || this.cacheTtlMs < 0) {
            return;
        }

        const nowMs = this.now().getTime();
        for (const [key, entry] of this.byIdempotencyKey.entries()) {
            if (nowMs - entry.cachedAt > this.cacheTtlMs) {
                this.byIdempotencyKey.delete(key);
            }
        }
    }

    private enforceCacheBounds(): void {
        if (!Number.isFinite(this.maxCacheEntries) || this.maxCacheEntries < 0) {
            return;
        }

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            let lruKey: string | null = null;
            let lruAccess = Number.POSITIVE_INFINITY;

            for (const [key, entry] of this.byIdempotencyKey.entries()) {
                if (entry.lastAccessAt < lruAccess) {
                    lruAccess = entry.lastAccessAt;
                    lruKey = key;
                }
            }

            if (!lruKey) {
                break;
            }

            this.byIdempotencyKey.delete(lruKey);
        }
    }

    private async resolvePromptProfile(input: TrackAnalysisInput): Promise<ResolvedPromptProfile> {
        if (typeof this.promptProfile === 'function') {
            return await this.promptProfile(input);
        }
        return this.promptProfile;
    }

    private buildFingerprint(input: TrackAnalysisInput): TrackIntelligenceRecord['fingerprint'] {
        const metadata = {
            artist: normalizeFingerprintString(input.artist),
            bpm: typeof input.bpm === 'number' ? input.bpm : null,
            durationSeconds: typeof input.durationSeconds === 'number' ? input.durationSeconds : null,
            genre: normalizeFingerprintString(input.genre),
            title: normalizeFingerprintString(input.title),
        };

        return {
            trackContentHash: deterministicHash(canonicalizePreimage(metadata)),
            modelVersion: this.modelVersion,
            promptProfileVersion: this.promptVersion,
        };
    }

    private buildIdempotencyKey(fingerprint: TrackIntelligenceRecord['fingerprint']): string {
        return deterministicHash(canonicalizePreimage(fingerprint));
    private buildIdempotencyKey(trackId: string, promptVersion: string): string {
        return `${trackId}:${promptVersion}`;
    private emitCacheEvent(type: AnalysisCacheEvent['type'], key: string): void {
        this.onCacheEvent?.({
            type,
            key,
            size: this.byIdempotencyKey.size,
        });
    }

    private buildIdempotencyKey(input: TrackAnalysisInput, versionProfile: AnalysisVersionProfile): string {
        return buildFingerprint({
            ...normalizeFingerprintInput(input),
            modelVersion: versionProfile.modelVersion,
            promptProfileVersion: versionProfile.promptProfileVersion,
        });
    }

    private normalize(
        raw: RawTrackAnalysis,
        input: TrackAnalysisInput,
        fingerprint: string,
        idempotencyKey: string,
        fingerprint: TrackIntelligenceRecord['fingerprint'],
        versionProfile: AnalysisVersionProfile,
        source: 'ai' | 'fallback',
        attempts: number,
        promptProfileVersion: string
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
        attempts: number
    ): TrackIntelligenceRecord | null {
        if (input.trackId.trim().length === 0) {
            return null;
        }

        const energy = clamp01(typeof raw.energy === 'number' ? raw.energy : inferEnergyFallback(input));
        const mood = normalizeMood(raw.mood) ?? inferMoodFromEnergy(energy);
        const genreConfidence = clamp01(typeof raw.genreConfidence === 'number' ? raw.genreConfidence : input.genre ? 0.6 : 0.3);

        return {
            trackId: input.trackId,
            fingerprint,
            energy,
            mood,
            era: normalizeEra(raw.era),
            genreConfidence,
            confidence: clamp01((energy + genreConfidence) / 2),
            source,
            attempts,
            modelVersion: versionProfile.modelVersion,
            promptProfileVersion: versionProfile.promptProfileVersion,
            promptVersion: this.promptVersion,
            fingerprint,
            analyzedAt: this.now().toISOString(),
        };
    }
}

function normalizeFingerprintString(value?: string): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
    return normalized.length > 0 ? normalized : null;
}

function canonicalizePreimage(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((entry) => canonicalizePreimage(entry)).join(',')}]`;
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
        return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalizePreimage(entry)}`).join(',')}}`;
    }

    return JSON.stringify(value);
}

function deterministicHash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
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
    status: 'analyzed' | 'skipped';
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
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
            status: outcome.status,
            outcome: outcome.outcome,
            source: outcome.source,
        });
    }

    return results;
}
