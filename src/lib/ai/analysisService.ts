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

export interface AnalysisResult {
    status: 'analyzed' | 'skipped';
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

export class AnalysisService {
    private readonly adapter: AnalysisAdapter;
    private readonly promptVersion: string;
    private readonly maxRetries: number;
    private readonly maxCacheEntries: number;
    private readonly cacheTtlMs?: number;
    private readonly now: () => Date;
    private readonly onRetry?: (attempt: number, error: unknown) => void;
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
        this.maxRetries = options.maxRetries ?? 2;
        this.maxCacheEntries = Math.max(1, options.maxCacheEntries ?? 512);
        this.cacheTtlMs =
            typeof options.cacheTtlMs === 'number' && options.cacheTtlMs >= 0 ? options.cacheTtlMs : undefined;
        this.now = options.now ?? (() => new Date());
        this.onRetry = options.onRetry;
        this.onCacheEvent = options.onCacheEvent;
    }

    getCacheSize(): number {
        return this.byIdempotencyKey.size;
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
            return {
                status: 'skipped',
                outcome: cached.source === 'ai' ? 'success' : 'degraded',
                source: cached.source,
                record: cached,
            };
        }

        let attempt = 0;
        let normalized: TrackIntelligenceRecord | null = null;
        let source: 'ai' | 'fallback' = 'ai';

        while (attempt <= this.maxRetries && !normalized) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
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

    private emitCacheEvent(type: AnalysisCacheEvent['type'], key: string): void {
        this.onCacheEvent?.({
            type,
            key,
            size: this.byIdempotencyKey.size,
        });
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
    ): TrackIntelligenceRecord | null {
        if (input.trackId.trim().length === 0) {
            return null;
        }

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
