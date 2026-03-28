import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { __resetApiRequestControlStateForTests } from '@/lib/api/request-controls'

const getSessionMock = vi.fn()
const fromMock = vi.fn()
const analyzeTrackMock = vi.fn()
const logAIDecisionMock = vi.fn()
const batchAnalyzeTracksMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: { getSession: getSessionMock },
    from: fromMock,
  }),
}))

vi.mock('@/lib/ai/analyze-track', () => ({
  analyzeTrack: (...args: unknown[]) => analyzeTrackMock(...args),
}), { virtual: true })

vi.mock('@/lib/ai/log-decision', () => ({
  logAIDecision: (...args: unknown[]) => logAIDecisionMock(...args),
}), { virtual: true })

vi.mock('@/lib/ai/batch-analyzer', () => ({
  batchAnalyzeTracks: (...args: unknown[]) => batchAnalyzeTracksMock(...args),
}), { virtual: true })

function withAuth(userId = 'user-1') {
  getSessionMock.mockResolvedValue({ data: { session: { user: { id: userId } } } })
}

describe('AI route request controls', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    getSessionMock.mockReset()
    fromMock.mockReset()
    analyzeTrackMock.mockReset()
    logAIDecisionMock.mockReset()
    batchAnalyzeTracksMock.mockReset()
    __resetApiRequestControlStateForTests()
  })

  it('returns standardized 429 with Retry-After for repeated batch-analyze calls', async () => {
    const { POST: batchAnalyzeRoute } = await import('@/app/api/ai/batch-analyze/route')
    withAuth()
    vi.stubEnv('AI_BATCH_ANALYZE_RATE_LIMIT_MAX', '1')
    vi.stubEnv('AI_BATCH_ANALYZE_RATE_LIMIT_WINDOW_MS', '60000')

    fromMock.mockImplementation((table: string) => {
      if (table !== 'stations') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: 'user-1' }, error: null }),
          }),
        }),
      }
    })

    batchAnalyzeTracksMock.mockResolvedValue({ processed: 2, analyzed: 2, failed: 0 })

    const first = await batchAnalyzeRoute(
      new NextRequest('http://localhost/api/ai/batch-analyze', {
        method: 'POST',
        body: JSON.stringify({ stationId: 'station-1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(first.status).toBe(200)

    const second = await batchAnalyzeRoute(
      new NextRequest('http://localhost/api/ai/batch-analyze', {
        method: 'POST',
        body: JSON.stringify({ stationId: 'station-1' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await second.json()

    expect(second.status).toBe(429)
    expect(second.headers.get('Retry-After')).toBe('60')
    expect(body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Retry after the provided delay.',
        retry_after_seconds: 60,
        limit: 1,
      },
    })
    expect(batchAnalyzeTracksMock).toHaveBeenCalledTimes(1)
  })

  it('replays batch-analyze response when Idempotency-Key is reused with same payload', async () => {
    const { POST: batchAnalyzeRoute } = await import('@/app/api/ai/batch-analyze/route')
    withAuth()
    vi.stubEnv('AI_BATCH_ANALYZE_RATE_LIMIT_MAX', '5')

    fromMock.mockImplementation((table: string) => {
      if (table !== 'stations') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: 'user-1' }, error: null }),
          }),
        }),
      }
    })

    batchAnalyzeTracksMock.mockResolvedValue({ processed: 10, analyzed: 8, failed: 2 })

    const requestInit = {
      method: 'POST',
      body: JSON.stringify({ stationId: 'station-1' }),
      headers: {
        'content-type': 'application/json',
        'Idempotency-Key': 'batch-req-1',
      },
    }

    const first = await batchAnalyzeRoute(new NextRequest('http://localhost/api/ai/batch-analyze', requestInit))
    expect(first.status).toBe(200)

    const second = await batchAnalyzeRoute(new NextRequest('http://localhost/api/ai/batch-analyze', requestInit))
    const secondBody = await second.json()

    expect(second.status).toBe(200)
    expect(second.headers.get('Idempotency-Replayed')).toBe('true')
    expect(secondBody).toEqual({ processed: 10, analyzed: 8, failed: 2 })
    expect(batchAnalyzeTracksMock).toHaveBeenCalledTimes(1)
  })

  it('rejects idempotency key reuse when payload fingerprint differs', async () => {
    const { POST: batchAnalyzeRoute } = await import('@/app/api/ai/batch-analyze/route')
    withAuth()

    fromMock.mockImplementation((table: string) => {
      if (table !== 'stations') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { user_id: 'user-1' }, error: null }),
          }),
        }),
      }
    })

    batchAnalyzeTracksMock.mockResolvedValue({ processed: 1, analyzed: 1, failed: 0 })

    const first = await batchAnalyzeRoute(
      new NextRequest('http://localhost/api/ai/batch-analyze', {
        method: 'POST',
        body: JSON.stringify({ stationId: 'station-1' }),
        headers: { 'content-type': 'application/json', 'Idempotency-Key': 'same-key' },
      })
    )
    expect(first.status).toBe(200)

    const second = await batchAnalyzeRoute(
      new NextRequest('http://localhost/api/ai/batch-analyze', {
        method: 'POST',
        body: JSON.stringify({ stationId: 'station-2' }),
        headers: { 'content-type': 'application/json', 'Idempotency-Key': 'same-key' },
      })
    )
    const body = await second.json()

    expect(second.status).toBe(409)
    expect(body).toEqual({
      error: {
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency-Key was already used with a different request payload.',
      },
    })
  })
})
