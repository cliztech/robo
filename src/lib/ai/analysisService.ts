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
    idempotencyKey: string;
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
    outcome: 'success' | 'degraded' | 'failed';
    source: 'ai' | 'fallback';
    record: TrackIntelligenceRecord | null;
}

export interface AnalysisAdapter {
    analyzeTrack(input: TrackAnalysisInput, promptVersion: string): Promise<RawTrackAnalysis>;
}

export interface AnalysisCacheStats {
    size: number;
    hits: number;
    misses: number;
    evictions: number;
    expirations: number;
}

export interface AnalysisCacheEvent {
    type: 'hit' | 'miss' | 'set' | 'evict' | 'expire';
    key: string;
    size: number;
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

export interface AnalysisTelemetry {
    cacheHits: number;
    cacheMisses: number;
}

interface AnalysisVersionProfile {
    modelVersion: string;
    promptProfileVersion: string;
}

interface CacheEntry {
    record: TrackIntelligenceRecord;
    cachedAtMs: number;
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

function normalizeText(value?: string): string {
    return (value ?? '').trim().toLowerCase();
}

function normalizeOptionalNumber(value?: number): string {
    return typeof value === 'number' && Number.isFinite(value) ? `${value}` : '';
}

function normalizeEra(era?: string): string {
    const candidate = (era ?? '').trim();
    return candidate.length > 0 ? candidate : 'unknown';
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

function buildHash(payload: Record<string, number | string | null>): string {
    const canonical = JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b))));
    return createHash('sha256').update(canonical).digest('hex');
}

function normalizeFingerprintInput(input: TrackAnalysisInput): Record<string, number | string | null> {
    return {
        trackId: input.trackId.trim(),
        title: normalizeText(input.title),
        artist: normalizeText(input.artist),
        genre: normalizeText(input.genre) || null,
        bpm: typeof input.bpm === 'number' && Number.isFinite(input.bpm) ? input.bpm : null,
        durationSeconds: typeof input.durationSeconds === 'number' && Number.isFinite(input.durationSeconds) ? input.durationSeconds : null,
    };
}

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
    private readonly promptVersion: string;
    private readonly modelVersion?: string;
    private readonly promptProfileVersion?: string;
    private readonly resolveVersionProfile?: (input: TrackAnalysisInput) => AnalysisVersionProfile;
    private readonly maxRetries: number;
    private readonly maxCacheEntries: number;
    private readonly cacheTtlMs?: number;
    private readonly now: () => Date;
    private readonly onRetry?: (attempt: number, error: unknown) => void;
    private readonly onCacheEvent?: (event: AnalysisCacheEvent) => void;

    private readonly byIdempotencyKey = new Map<string, CacheEntry>();
    private readonly telemetry: AnalysisTelemetry = { cacheHits: 0, cacheMisses: 0 };
    private readonly cacheStats: AnalysisCacheStats = { size: 0, hits: 0, misses: 0, evictions: 0, expirations: 0 };

    constructor(options: AnalysisServiceOptions) {
        this.adapter = options.adapter;
        this.promptVersion = options.promptVersion;
        this.modelVersion = options.modelVersion;
        this.promptProfileVersion = options.promptProfileVersion;
        this.resolveVersionProfile = options.resolveVersionProfile;
        this.maxRetries = options.maxRetries ?? 2;
        this.maxCacheEntries = Math.max(1, options.maxCacheEntries ?? 512);
        this.cacheTtlMs = typeof options.cacheTtlMs === 'number' && options.cacheTtlMs >= 0 ? options.cacheTtlMs : undefined;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
        this.onCacheEvent = options.onCacheEvent;
    }

    getCacheSize(): number {
        return this.byIdempotencyKey.size;
    }

    getTelemetry(): AnalysisTelemetry {
        return { ...this.telemetry };
    }

    getCacheStats(): AnalysisCacheStats {
        return {
            ...this.cacheStats,
            size: this.byIdempotencyKey.size,
        };
    }

    async analyze(input: TrackAnalysisInput): Promise<AnalysisResult> {
        if (input.trackId.trim().length === 0) {
            return { status: 'analyzed', executionStatus: 'degraded', outcome: 'failed', source: 'fallback', record: null };
        }

        const versionProfile = this.resolveVersionProfile?.(input) ?? {
            modelVersion: this.modelVersion ?? 'unknown-model',
            promptProfileVersion: this.promptProfileVersion ?? this.promptVersion,
        };
        const idempotencyKey = this.buildIdempotencyKey(input, versionProfile);
        const cached = this.getCachedRecord(idempotencyKey);
        if (cached) {
            this.telemetry.cacheHits += 1;
            return {
                status: 'skipped',
                executionStatus: cached.source === 'ai' ? 'success' : 'degraded',
                outcome: cached.source === 'ai' ? 'success' : 'degraded',
                source: cached.source,
                record: cached,
            };
        }

        this.telemetry.cacheMisses += 1;

        let attempts = 0;
        let normalized: TrackIntelligenceRecord | null = null;
        let source: 'ai' | 'fallback' = 'ai';

        while (attempts <= this.maxRetries && !normalized) {
            attempts += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
                normalized = this.normalize(raw, input, versionProfile, idempotencyKey, 'ai', attempts);
                source = 'ai';
            } catch (error) {
                if (attempts > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, versionProfile, idempotencyKey, 'fallback', attempts);
                    source = 'fallback';
                    break;
                }
                this.onRetry?.(attempts, error);
            }
        }

        if (!normalized) {
            return { status: 'analyzed', executionStatus: 'degraded', outcome: 'failed', source, record: null };
        }

        this.cacheRecord(idempotencyKey, normalized);
        const success = normalized.source === 'ai';
        return {
            status: 'analyzed',
            executionStatus: success ? 'success' : 'degraded',
            outcome: success ? 'success' : 'degraded',
            source: normalized.source,
            record: normalized,
        };
    }

    private emitCacheEvent(type: AnalysisCacheEvent['type'], key: string): void {
        this.onCacheEvent?.({ type, key, size: this.byIdempotencyKey.size });
    }

    private getCachedRecord(idempotencyKey: string): TrackIntelligenceRecord | null {
        const cached = this.byIdempotencyKey.get(idempotencyKey);
        if (!cached) {
            this.cacheStats.misses += 1;
            this.emitCacheEvent('miss', idempotencyKey);
            return null;
        }

        if (this.cacheTtlMs !== undefined) {
            const age = this.now().getTime() - cached.cachedAtMs;
            if (age > this.cacheTtlMs) {
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

        this.byIdempotencyKey.set(idempotencyKey, { record, cachedAtMs: this.now().getTime() });
        this.emitCacheEvent('set', idempotencyKey);

        while (this.byIdempotencyKey.size > this.maxCacheEntries) {
            const oldestKey = this.byIdempotencyKey.keys().next().value;
            if (!oldestKey) break;
            this.byIdempotencyKey.delete(oldestKey);
            this.cacheStats.evictions += 1;
            this.emitCacheEvent('evict', oldestKey);
        }
    }

    private buildFingerprint(input: TrackAnalysisInput): string {
        return [
            input.trackId,
            normalizeText(input.title),
            normalizeText(input.artist),
            normalizeText(input.genre),
            normalizeOptionalNumber(input.bpm),
            normalizeOptionalNumber(input.durationSeconds),
            this.promptVersion,
        ].join('|');
    }

    private buildIdempotencyKey(input: TrackAnalysisInput, versionProfile: AnalysisVersionProfile): string {
        return buildHash({
            ...normalizeFingerprintInput(input),
            promptVersion: this.promptVersion,
            modelVersion: versionProfile.modelVersion,
            promptProfileVersion: versionProfile.promptProfileVersion,
        });
    }

    private normalize(
        raw: RawTrackAnalysis,
        input: TrackAnalysisInput,
        versionProfile: AnalysisVersionProfile,
        idempotencyKey: string,
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
            fingerprint: this.buildFingerprint(input),
            idempotencyKey,
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

export async function processAnalysisQueue(items: AnalysisQueueItem[], service: AnalysisService): Promise<AnalysisQueueResult[]> {
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
