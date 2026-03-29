import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { __resetApiRequestControlStateForTests } from '@/lib/api/request-controls'

const getSessionMock = vi.fn()
const fromMock = vi.fn()
const analyzeTrackMock = vi.fn()
const logTrackAnalysisDecisionSafelyMock = vi.fn()

vi.mock('zod', () => {
  class MockZodError extends Error {
    issues: unknown[]

    constructor(issues: unknown[] = []) {
      super('Zod validation failed')
      this.issues = issues
    }
  }

  return {
    ZodError: MockZodError,
    z: {
      string: () => ({
        uuid: () => ({
          max: () => ({ type: 'uuid-string' }),
        }),
      }),
      object: () => ({
        safeParse: (value: unknown) => {
          const trackId = (value as { trackId?: unknown })?.trackId
          const looksLikeUuid =
            typeof trackId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trackId)

          if (looksLikeUuid) {
            return { success: true, data: { trackId } }
          }

          return { success: false, error: { issues: [{ path: ['trackId'], message: 'Invalid UUID' }] } }
        },
      }),
    },
  }
}, { virtual: true })

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
  logTrackAnalysisDecisionSafely: (...args: unknown[]) => logTrackAnalysisDecisionSafelyMock(...args),
}), { virtual: true })

function withAuth(userId = 'user-1') {
  getSessionMock.mockResolvedValue({ data: { session: { user: { id: userId } } } })
}

function baseTrack(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Track Title',
    artist: 'Artist',
    album: 'Album',
    duration_seconds: 210,
    genre: 'house',
    year: 2022,
    codec: 'mp3',
    bitrate: 320000,
    sample_rate: 44100,
    channels: 2,
    ai_analyzed: false,
    stations: {
      id: '22222222-2222-4222-8222-222222222222',
      user_id: 'user-1',
    },
    ...overrides,
  }
}

describe('POST /api/ai/analyze-track', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    getSessionMock.mockReset()
    fromMock.mockReset()
    analyzeTrackMock.mockReset()
    logTrackAnalysisDecisionSafelyMock.mockReset()
    __resetApiRequestControlStateForTests()
  })

  it('returns analysis payload on successful analysis path', async () => {
    withAuth('user-1')
    const track = baseTrack()

    const singleTrackMock = vi.fn().mockResolvedValue({ data: track, error: null })
    const selectMock = vi.fn().mockReturnValue({ eq: () => ({ single: singleTrackMock }) })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock })

    fromMock.mockImplementation((table: string) => {
      if (table !== 'tracks') throw new Error(`unexpected table ${table}`)
      return {
        select: selectMock,
        update: updateMock,
      }
    })

    const analysis = {
      genre: 'electronic',
      subgenre: 'progressive house',
      mood: 'energetic',
      secondaryMoods: ['uplifting'],
      energyLevel: 8,
      danceability: 9,
      bpm: 128,
      keySignature: 'Am',
      scale: 'minor',
      timeSignature: '4/4',
      vocalStyle: 'mixed',
      language: 'en',
      introSeconds: 8,
      outroSeconds: 12,
      hasBuildUp: true,
      hasDrop: true,
      bestForTime: ['night'],
      bestForContext: ['club'],
      similarArtists: ['Artist A'],
      tags: ['driving'],
      isExplicit: false,
      audioQualityIssues: [],
      confidenceScore: 0.94,
      reasoning: 'High-energy dance track',
    }

    analyzeTrackMock.mockResolvedValue({
      analysis,
      tokensUsed: 512,
      costUSD: 0.0012,
      latencyMs: 320,
    })
    logTrackAnalysisDecisionSafelyMock.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/ai/analyze-track/route')

    const response = await POST(
      new NextRequest('http://localhost/api/ai/analyze-track', {
        method: 'POST',
        body: JSON.stringify({ trackId: track.id }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: true,
      analysis,
      tokensUsed: 512,
      costUSD: 0.0012,
    })
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(logTrackAnalysisDecisionSafelyMock).toHaveBeenCalledTimes(1)
  })

  it('short-circuits when track is already analyzed', async () => {
    withAuth('user-1')
    const track = baseTrack({
      ai_analyzed: true,
      ai_genre: 'house',
      ai_mood: 'happy',
      ai_energy_level: 6,
    })

    const singleTrackMock = vi.fn().mockResolvedValue({ data: track, error: null })
    fromMock.mockImplementation((table: string) => {
      if (table !== 'tracks') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({ eq: () => ({ single: singleTrackMock }) }),
      }
    })

    const { POST } = await import('@/app/api/ai/analyze-track/route')

    const response = await POST(
      new NextRequest('http://localhost/api/ai/analyze-track', {
        method: 'POST',
        body: JSON.stringify({ trackId: track.id }),
        headers: { 'content-type': 'application/json' },
      })
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      message: 'Track already analyzed',
      analysis: {
        genre: 'house',
        mood: 'happy',
        energyLevel: 6,
      },
    })
    expect(analyzeTrackMock).not.toHaveBeenCalled()
    expect(logTrackAnalysisDecisionSafelyMock).not.toHaveBeenCalled()
  })

  it('does not fail request when decision logging throws unexpectedly', async () => {
    withAuth('user-1')
    const track = baseTrack()

    const singleTrackMock = vi.fn().mockResolvedValue({ data: track, error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })

    fromMock.mockImplementation((table: string) => {
      if (table !== 'tracks') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({ eq: () => ({ single: singleTrackMock }) }),
        update: () => ({ eq: updateEqMock }),
      }
    })

    analyzeTrackMock.mockResolvedValue({
      analysis: {
        genre: 'electronic',
        subgenre: null,
        mood: 'energetic',
        secondaryMoods: [],
        energyLevel: 7,
        danceability: 8,
        bpm: 124,
        keySignature: null,
        scale: null,
        timeSignature: null,
        vocalStyle: 'instrumental',
        language: null,
        introSeconds: null,
        outroSeconds: null,
        hasBuildUp: false,
        hasDrop: false,
        bestForTime: ['night'],
        bestForContext: ['workout'],
        similarArtists: [],
        tags: [],
        isExplicit: false,
        audioQualityIssues: [],
        confidenceScore: 0.9,
        reasoning: 'stable',
      },
      tokensUsed: 100,
      costUSD: 0.0004,
      latencyMs: 100,
    })

    logTrackAnalysisDecisionSafelyMock.mockRejectedValue(new Error('logger boom'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { POST } = await import('@/app/api/ai/analyze-track/route')

    const response = await POST(
      new NextRequest('http://localhost/api/ai/analyze-track', {
        method: 'POST',
        body: JSON.stringify({ trackId: track.id }),
        headers: { 'content-type': 'application/json' },
      })
    )

    expect(response.status).toBe(200)
    expect(warnSpy).toHaveBeenCalledWith('Non-fatal track analysis decision logging failure:', expect.any(Error))
  })

  it('returns unauthorized and forbidden responses for auth/ownership guards', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    const { POST } = await import('@/app/api/ai/analyze-track/route')

    const unauthorized = await POST(
      new NextRequest('http://localhost/api/ai/analyze-track', {
        method: 'POST',
        body: JSON.stringify({ trackId: '11111111-1111-4111-8111-111111111111' }),
        headers: { 'content-type': 'application/json' },
      })
    )
    expect(unauthorized.status).toBe(401)

    withAuth('user-1')
    const foreignTrack = baseTrack({ stations: { id: 'station-2', user_id: 'other-user' } })
    const singleTrackMock = vi.fn().mockResolvedValue({ data: foreignTrack, error: null })

    fromMock.mockImplementation((table: string) => {
      if (table !== 'tracks') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({ eq: () => ({ single: singleTrackMock }) }),
      }
    })

    const forbidden = await POST(
      new NextRequest('http://localhost/api/ai/analyze-track', {
        method: 'POST',
        body: JSON.stringify({ trackId: foreignTrack.id }),
        headers: { 'content-type': 'application/json' },
      })
    )

    expect(forbidden.status).toBe(403)
  })
})
