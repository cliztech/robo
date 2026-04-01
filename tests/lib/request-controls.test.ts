import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __describeRequestControlStoreForTests,
  __resetApiRequestControlStateForTests,
  consumeSlidingWindowToken,
  getIdempotencyReplay,
  storeIdempotencyResult,
} from '@/lib/api/request-controls'

describe('request-controls in-memory fallback', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetApiRequestControlStateForTests()
  })

  it('uses in-memory store when shared backend env is absent', async () => {
    const result = await consumeSlidingWindowToken({ key: 'u1:r1', maxHits: 2, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
    expect(__describeRequestControlStoreForTests()).toBe('memory')
  })

  it('enforces idempotency ttl expiration', async () => {
    await storeIdempotencyResult({
      scopeKey: 'u1:/api/ai/batch-analyze',
      idempotencyKey: 'k1',
      fingerprint: 'fp-1',
      status: 200,
      payload: { ok: true },
      ttlMs: 5,
    })

    const first = await getIdempotencyReplay({
      scopeKey: 'u1:/api/ai/batch-analyze',
      idempotencyKey: 'k1',
      fingerprint: 'fp-1',
    })
    expect(first.type).toBe('replay')

    await new Promise((resolve) => setTimeout(resolve, 15))

    const second = await getIdempotencyReplay({
      scopeKey: 'u1:/api/ai/batch-analyze',
      idempotencyKey: 'k1',
      fingerprint: 'fp-1',
    })
    expect(second).toEqual({ type: 'miss' })
  })

  it('scopes idempotency keys by scopeKey', async () => {
    await storeIdempotencyResult({
      scopeKey: 'u1:/api/ai/batch-analyze',
      idempotencyKey: 'shared-key',
      fingerprint: 'fp-1',
      status: 200,
      payload: { scope: 'a' },
      ttlMs: 60_000,
    })

    const sameScope = await getIdempotencyReplay({
      scopeKey: 'u1:/api/ai/batch-analyze',
      idempotencyKey: 'shared-key',
      fingerprint: 'fp-1',
    })

    const otherScope = await getIdempotencyReplay({
      scopeKey: 'u1:/api/ai/other-route',
      idempotencyKey: 'shared-key',
      fingerprint: 'fp-1',
    })

    expect(sameScope.type).toBe('replay')
    expect(otherScope).toEqual({ type: 'miss' })
  })
})
