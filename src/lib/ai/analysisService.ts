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
}

export interface TrackIntelligenceRecord {
    trackId: string;
    fingerprint: string;
    energy: number;
    mood: TrackMood;
    era: string;
    genreConfidence: number;
    confidence: number;
    source: 'ai' | 'fallback';
    attempts: number;
    modelVersion: string;
    promptProfileVersion: string;
    promptVersion: string;
    analyzedAt: string;
}

export interface AnalysisResult {
    status: 'analyzed' | 'skipped';
    executionStatus: 'success' | 'degraded';
    record: TrackIntelligenceRecord;
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
    record: TrackIntelligenceRecord | null;
}

export interface AnalysisAdapter {
    analyzeTrack(input: TrackAnalysisInput, promptVersion: string): Promise<RawTrackAnalysis>;
}

export interface AnalysisServiceOptions {
    adapter: AnalysisAdapter;
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

function buildFingerprint(payload: Record<string, number | string | null>): string {
    const canonicalPayload = Object.fromEntries(Object.entries(payload).sort());
    const canonical = JSON.stringify(canonicalPayload);
    return createHash('sha256').update(canonical).digest('hex');
}

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
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

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
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
            cached.lastAccessAt = this.now().getTime();
            return { status: 'skipped', record: cached.record };
            return {
                status: 'skipped',
                outcome: cached.source === 'ai' ? 'success' : 'degraded',
                source: cached.source,
                record: cached,
            };
        }

        this.telemetry.cacheMisses += 1;

        let attempt = 0;
        let normalized: TrackIntelligenceRecord | null = null;
        let source: 'ai' | 'fallback' = 'ai';

        while (attempt <= this.maxRetries && !normalized) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
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
                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, idempotencyKey, 'fallback', attempt);
                    source = 'fallback';
                    break;
                }
                this.onRetry?.(attempt, error);
            }
        }

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
        versionProfile: AnalysisVersionProfile,
        source: 'ai' | 'fallback',
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
    items: AnalysisQueueItem[],
    service: AnalysisService
): Promise<AnalysisQueueResult[]> {
    const results: AnalysisQueueResult[] = [];

    for (const item of items) {
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
