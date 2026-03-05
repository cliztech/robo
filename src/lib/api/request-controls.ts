import { createHash } from 'node:crypto'

export type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  resetAtMs: number
}

type WindowEntry = { hits: number[] }

const slidingWindowStore = new Map<string, WindowEntry>()

type IdempotencyEntry = {
  fingerprint: string
  status: number
  payload: unknown
  expiresAtMs: number
}

const idempotencyStore = new Map<string, IdempotencyEntry>()

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

export function resolveApiLimits() {
  return {
    analyzeTrack: {
      max: toPositiveInt(process.env.AI_ANALYZE_TRACK_RATE_LIMIT_MAX, 15),
      windowMs: toPositiveInt(process.env.AI_ANALYZE_TRACK_RATE_LIMIT_WINDOW_MS, 60_000),
    },
    batchAnalyze: {
      max: toPositiveInt(process.env.AI_BATCH_ANALYZE_RATE_LIMIT_MAX, 5),
      windowMs: toPositiveInt(process.env.AI_BATCH_ANALYZE_RATE_LIMIT_WINDOW_MS, 60_000),
    },
    idempotencyTtlMs: toPositiveInt(process.env.AI_BATCH_IDEMPOTENCY_TTL_MS, 120_000),
  }
}

export function consumeSlidingWindowToken(params: {
  key: string
  maxHits: number
  windowMs: number
  nowMs?: number
}): RateLimitDecision {
  const nowMs = params.nowMs ?? Date.now()
  const windowStart = nowMs - params.windowMs
  const current = slidingWindowStore.get(params.key) ?? { hits: [] }
  current.hits = current.hits.filter((timestamp) => timestamp > windowStart)

  if (current.hits.length >= params.maxHits) {
    const oldestTs = current.hits[0] ?? nowMs
    const retryAfterMs = Math.max(0, oldestTs + params.windowMs - nowMs)
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
    slidingWindowStore.set(params.key, current)
    return {
      allowed: false,
      limit: params.maxHits,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs: nowMs + retryAfterMs,
    }
  }

  current.hits.push(nowMs)
  slidingWindowStore.set(params.key, current)
  return {
    allowed: true,
    limit: params.maxHits,
    remaining: Math.max(0, params.maxHits - current.hits.length),
    retryAfterSeconds: 0,
    resetAtMs: nowMs + params.windowMs,
  }
}

export function toRateLimitErrorPayload(decision: RateLimitDecision) {
  return {
    error: {
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded. Retry after the provided delay.',
      retry_after_seconds: decision.retryAfterSeconds,
      limit: decision.limit,
    },
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`

  const objectValue = value as Record<string, unknown>
  const keys = Object.keys(objectValue).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(',')}}`
}

export function fingerprintPayload(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

export function getIdempotencyReplay(params: {
  scopeKey: string
  idempotencyKey: string
  fingerprint: string
  nowMs?: number
}):
  | { type: 'replay'; status: number; payload: unknown }
  | { type: 'mismatch' }
  | { type: 'miss' } {
  const nowMs = params.nowMs ?? Date.now()
  const key = `${params.scopeKey}:${params.idempotencyKey}`
  const entry = idempotencyStore.get(key)
  if (!entry) return { type: 'miss' }

  if (entry.expiresAtMs <= nowMs) {
    idempotencyStore.delete(key)
    return { type: 'miss' }
  }

  if (entry.fingerprint !== params.fingerprint) return { type: 'mismatch' }

  return { type: 'replay', status: entry.status, payload: entry.payload }
}

export function storeIdempotencyResult(params: {
  scopeKey: string
  idempotencyKey: string
  fingerprint: string
  status: number
  payload: unknown
  ttlMs: number
  nowMs?: number
}) {
  const nowMs = params.nowMs ?? Date.now()
  const key = `${params.scopeKey}:${params.idempotencyKey}`
  idempotencyStore.set(key, {
    fingerprint: params.fingerprint,
    status: params.status,
    payload: params.payload,
    expiresAtMs: nowMs + Math.max(1, params.ttlMs),
  })
}

export function __resetApiRequestControlStateForTests() {
  slidingWindowStore.clear()
  idempotencyStore.clear()
}
