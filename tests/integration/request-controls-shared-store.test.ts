import { beforeEach, describe, expect, it, vi } from 'vitest'

type SharedEntry = { value: string; expiresAtMs: number | null }

function createUpstashFetchMock() {
  const values = new Map<string, SharedEntry>()

  const gc = (key: string) => {
    const entry = values.get(key)
    if (!entry) return null
    if (entry.expiresAtMs !== null && entry.expiresAtMs <= Date.now()) {
      values.delete(key)
      return null
    }
    return entry
  }

  return vi.fn(async (input: string | URL) => {
    const url = String(input)
    const parts = new URL(url).pathname
      .split('/')
      .filter(Boolean)
      .map((part) => decodeURIComponent(part))

    const [command, ...args] = parts

    if (!command) {
      return new Response(JSON.stringify({ error: 'missing command' }), { status: 400 })
    }

    let result: unknown = null

    if (command === 'get') {
      const key = args[0]
      result = gc(key)?.value ?? null
    } else if (command === 'set') {
      const [key, value, ttlKind, ttlValue] = args
      if (!key || !value) {
        return new Response(JSON.stringify({ error: 'invalid arguments for set' }), { status: 400 })
      }
      const ttlMs = ttlKind === 'PX' && ttlValue ? Number.parseInt(ttlValue, 10) : null
    } else if (command === 'del') {
      const key = args[0]
      result = values.delete(key) ? 1 : 0
    } else if (command === 'pttl') {
      const key = args[0]
      const entry = gc(key)
      if (!entry) result = -2
      else if (entry.expiresAtMs === null) result = -1
      else result = Math.max(0, entry.expiresAtMs - Date.now())
    } else if (command === 'incr') {
      const key = args[0]
      const entry = gc(key)
      const nextValue = (entry ? Number.parseInt(entry.value, 10) : 0) + 1
      values.set(key, { value: String(nextValue), expiresAtMs: entry?.expiresAtMs ?? null })
      result = nextValue
    } else if (command === 'pexpire') {
      const [key, ttlStr] = args
      const entry = gc(key)
      if (!entry) result = 0
      else {
        entry.expiresAtMs = Date.now() + Number.parseInt(ttlStr, 10)
        values.set(key, entry)
        result = 1
      }
    } else {
      return new Response(JSON.stringify({ error: `unsupported command ${command}` }), { status: 400 })
    }

    return new Response(JSON.stringify({ result }), { status: 200 })
  })
}

describe('request-controls shared backend cross-instance semantics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shares rate-limit state across isolated imports (instance A -> instance B)', async () => {
    vi.stubEnv('AI_REQUEST_CONTROLS_BACKEND', 'shared')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.local')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')

    const fetchMock = createUpstashFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
    const instanceA = await import('@/lib/api/request-controls')
    const first = await instanceA.consumeSlidingWindowToken({ key: 'user-a:route-x', maxHits: 1, windowMs: 60_000 })
    expect(first.allowed).toBe(true)

    vi.resetModules()
    const instanceB = await import('@/lib/api/request-controls')
    const second = await instanceB.consumeSlidingWindowToken({ key: 'user-a:route-x', maxHits: 1, windowMs: 60_000 })
    expect(second.allowed).toBe(false)
    expect(second.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('replays idempotency results across isolated imports (instance A -> instance B)', async () => {
    vi.stubEnv('AI_REQUEST_CONTROLS_BACKEND', 'shared')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://upstash.local')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token')

    const fetchMock = createUpstashFetchMock()
    vi.stubGlobal('fetch', fetchMock)

    vi.resetModules()
    const instanceA = await import('@/lib/api/request-controls')

    await instanceA.storeIdempotencyResult({
      scopeKey: 'user-a:/api/ai/batch-analyze',
      idempotencyKey: 'idem-1',
      fingerprint: 'abc123',
      status: 200,
      payload: { ok: true },
      ttlMs: 120_000,
    })

    vi.resetModules()
    const instanceB = await import('@/lib/api/request-controls')
    const replay = await instanceB.getIdempotencyReplay({
      scopeKey: 'user-a:/api/ai/batch-analyze',
      idempotencyKey: 'idem-1',
      fingerprint: 'abc123',
    })

    expect(replay).toEqual({
      type: 'replay',
      status: 200,
      payload: { ok: true },
    })
  })
})
