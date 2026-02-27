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
    promptVersion: string;
    analyzedAt: string;
}

export interface AnalysisResult {
    status: 'analyzed' | 'skipped';
    record: TrackIntelligenceRecord;
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
    const confidence = clamp01(Number(((energy + genreConfidence) / 2).toFixed(4)));

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
            return { status: 'skipped', record: cached };
        }

        let attempt = 0;
        let normalized: TrackIntelligenceRecord | null = null;

        while (attempt <= this.maxRetries && !normalized) {
            attempt += 1;
            try {
                const raw = await this.adapter.analyzeTrack(input, this.promptVersion);
                normalized = this.normalize(raw, input, idempotencyKey, 'ai', attempt);
            } catch (error) {
                if (attempt > this.maxRetries) {
                    const fallback = createFallbackAnalysis(input);
                    normalized = this.normalize(fallback, input, idempotencyKey, 'fallback', attempt);
                    break;
                }
                this.onRetry?.(attempt, error);
            }
        }

        if (!normalized) {
            throw new Error('Analysis did not complete.');
        }

        this.byIdempotencyKey.set(idempotencyKey, normalized);
        return { status: 'analyzed', record: normalized };
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
            source: outcome.record.source,
        });
    }

    return results;
}
