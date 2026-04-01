import { createHash } from 'node:crypto'

export type RateLimitDecision = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  resetAtMs: number
}

type IdempotencyEntry = {
  fingerprint: string
  status: number
  payload: unknown
}

type WindowIncrementResult = {
  count: number
  ttlMs: number
}

export interface RequestControlStore {
  get(key: string): Promise<string | null> | string | null
  set(key: string, value: string, ttlMs: number): Promise<void> | void
  delete(key: string): Promise<void> | void
  ttl(key: string): Promise<number | null> | number | null
  incrementWindow(key: string, windowMs: number): Promise<WindowIncrementResult> | WindowIncrementResult
}

type MemoryEntry = { value: string; expiresAtMs: number }

class InMemoryRequestControlStore implements RequestControlStore {
  private readonly values = new Map<string, MemoryEntry>()

  private nowMs() {
    return Date.now()
  }

  private gcKey(key: string): MemoryEntry | null {
    const entry = this.values.get(key)
    if (!entry) return null
    if (entry.expiresAtMs <= this.nowMs()) {
      this.values.delete(key)
      return null
    }
    return entry
  }

  get(key: string): string | null {
    return this.gcKey(key)?.value ?? null
  }

  set(key: string, value: string, ttlMs: number): void {
    this.values.set(key, {
      value,
      expiresAtMs: this.nowMs() + Math.max(1, ttlMs),
    })

    if (this.values.size > 20000) {
      const firstKey = this.values.keys().next().value
      if (firstKey) this.values.delete(firstKey)
    }
  }

  delete(key: string): void {
    this.values.delete(key)
  }

  ttl(key: string): number | null {
    const entry = this.gcKey(key)
    if (!entry) return null
    return Math.max(0, entry.expiresAtMs - this.nowMs())
  }

  incrementWindow(key: string, windowMs: number): WindowIncrementResult {
    const nowMs = this.nowMs()
    const current = this.gcKey(key)
    if (!current) {
      this.values.set(key, { value: '1', expiresAtMs: nowMs + Math.max(1, windowMs) })
      return { count: 1, ttlMs: Math.max(1, windowMs) }
    }

    const nextCount = Number.parseInt(current.value, 10) + 1
    this.values.set(key, { value: String(nextCount), expiresAtMs: current.expiresAtMs })
    return {
      count: nextCount,
      ttlMs: Math.max(0, current.expiresAtMs - nowMs),
    }
  }

  clearForTests() {
    this.values.clear()
  }
}

class UpstashRequestControlStore implements RequestControlStore {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async run<T>(command: string[], expectedResultType: 'string' | 'number' | 'array' = 'string'): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}/${command.map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Upstash request-controls command failed: ${response.status} ${text}`)
    }

    const body = await response.json() as { result?: unknown; error?: string }
    if (body.error) throw new Error(`Upstash request-controls command error: ${body.error}`)

    if (expectedResultType === 'number') return Number(body.result ?? 0) as T
    if (expectedResultType === 'array') return (body.result ?? []) as T
    return (body.result ?? null) as T
  }

  async get(key: string): Promise<string | null> {
    return await this.run<string | null>(['get', key])
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.run(['set', key, value, 'PX', String(Math.max(1, ttlMs))])
  }

  async delete(key: string): Promise<void> {
    await this.run(['del', key])
  }

  async ttl(key: string): Promise<number | null> {
    const ttlMs = await this.run<number>(['pttl', key], 'number')
    if (ttlMs < 0) return null
    return ttlMs
  }

  async incrementWindow(key: string, windowMs: number): Promise<WindowIncrementResult> {
    const count = await this.run<number>(['incr', key], 'number')
    if (count === 1) {
      await this.run(['pexpire', key, String(Math.max(1, windowMs))])
      return { count, ttlMs: Math.max(1, windowMs) }
    }

    const ttlMs = (await this.ttl(key)) ?? 0
    return { count, ttlMs }
  }
}

const memoryStore = new InMemoryRequestControlStore()
let activeStore: RequestControlStore | null = null
let activeStoreMode: 'memory' | 'upstash' = 'memory'

function resolveStoreMode() {
  if (process.env.AI_REQUEST_CONTROLS_BACKEND === 'shared') return 'shared'
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return 'shared'
  return 'memory'
}

function getRequestControlStore(): RequestControlStore {
  if (activeStore) return activeStore

  const mode = resolveStoreMode()
  if (mode === 'shared') {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      throw new Error('AI request-control shared backend enabled but UPSTASH_REDIS_REST_URL/TOKEN is missing')
    }
    activeStore = new UpstashRequestControlStore(url, token)
    activeStoreMode = 'upstash'
    return activeStore
  }

  activeStore = memoryStore
  activeStoreMode = 'memory'
  return activeStore
}

const KEY_NAMESPACE = 'ai:reqctl:v1'

function scopedRateLimitKey(key: string) {
  return `${KEY_NAMESPACE}:rate:${key}`
}

function scopedIdempotencyKey(scopeKey: string, idempotencyKey: string) {
  return `${KEY_NAMESPACE}:idem:${scopeKey}:${idempotencyKey}`
}

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

export async function consumeSlidingWindowToken(params: {
  key: string
  maxHits: number
  windowMs: number
  nowMs?: number
}): Promise<RateLimitDecision> {
  const nowMs = params.nowMs ?? Date.now()
  const store = getRequestControlStore()
  const window = await store.incrementWindow(scopedRateLimitKey(params.key), params.windowMs)

  if (window.count > params.maxHits) {
    const retryAfterSeconds = Math.max(1, Math.ceil(Math.max(1, window.ttlMs) / 1000))
    return {
      allowed: false,
      limit: params.maxHits,
      remaining: 0,
      retryAfterSeconds,
      resetAtMs: nowMs + Math.max(1, window.ttlMs),
    }
  }

  return {
    allowed: true,
    limit: params.maxHits,
    remaining: Math.max(0, params.maxHits - window.count),
    retryAfterSeconds: 0,
    resetAtMs: nowMs + Math.max(1, window.ttlMs),
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

function stableStringify(value: unknown, depth = 0): string {
  if (depth > 20) throw new Error('Max depth exceeded')
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry, depth + 1)).join(',')}]`

  const objectValue = value as Record<string, unknown>
  const keys = Object.keys(objectValue).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key], depth + 1)}`).join(',')}}`
}

export function fingerprintPayload(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

export async function getIdempotencyReplay(params: {
  scopeKey: string
  idempotencyKey: string
  fingerprint: string
  nowMs?: number
}): Promise<
  | { type: 'replay'; status: number; payload: unknown }
  | { type: 'mismatch' }
  | { type: 'miss' }
> {
  const key = scopedIdempotencyKey(params.scopeKey, params.idempotencyKey)
  const raw = await getRequestControlStore().get(key)
  if (!raw) return { type: 'miss' }

  let entry: IdempotencyEntry
  try {
    entry = JSON.parse(raw) as IdempotencyEntry
  } catch {
    await getRequestControlStore().delete(key)
    return { type: 'miss' }
  }

  if (entry.fingerprint !== params.fingerprint) return { type: 'mismatch' }

  return { type: 'replay', status: entry.status, payload: entry.payload }
}

export async function storeIdempotencyResult(params: {
  scopeKey: string
  idempotencyKey: string
  fingerprint: string
  status: number
  payload: unknown
  ttlMs: number
  nowMs?: number
}) {
  const key = scopedIdempotencyKey(params.scopeKey, params.idempotencyKey)
  const ttlMs = Math.max(1, params.ttlMs)
  const value = JSON.stringify({
    fingerprint: params.fingerprint,
    status: params.status,
    payload: params.payload,
  } satisfies IdempotencyEntry)

  await getRequestControlStore().set(key, value, ttlMs)
}

export function __setRequestControlStoreForTests(store: RequestControlStore | null) {
  activeStore = store
}

export function __resetApiRequestControlStateForTests() {
  memoryStore.clearForTests()
  activeStore = null
  activeStoreMode = 'memory'
}

export function __describeRequestControlStoreForTests() {
  return activeStoreMode
}
