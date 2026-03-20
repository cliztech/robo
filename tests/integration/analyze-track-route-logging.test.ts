import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockTrackSingle = vi.fn()
const mockUpdateEq = vi.fn()
const mockAnalyzeTrack = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
    from: (table: string) => {
      if (table === 'tracks') {
        return {
          select: () => ({
            eq: () => ({
              single: mockTrackSingle,
            }),
          }),
          update: () => ({
            eq: mockUpdateEq,
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    },
  }),
}))

vi.mock('@/lib/ai/analyze-track', () => ({
  analyzeTrack: mockAnalyzeTrack,
}))

describe('POST /api/ai/analyze-track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invokes analysis once with station context for a successful request', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    })
    mockTrackSingle.mockResolvedValue({
      data: {
        id: 'track-1',
        title: 'Song',
        artist: 'Artist',
        album: 'Album',
        duration_seconds: 200,
        genre: 'house',
        year: 2024,
        codec: 'mp3',
        bitrate: 320000,
        sample_rate: 44100,
        channels: 2,
        ai_analyzed: false,
        stations: { user_id: 'user-1', id: 'station-1' },
      },
      error: null,
    })
    mockAnalyzeTrack.mockResolvedValue({
      analysis: {
        genre: 'electronic',
        subgenre: 'house',
        mood: 'energetic',
        secondaryMoods: [],
        energyLevel: 8,
        danceability: 9,
        bpm: 128,
        keySignature: 'C',
        scale: 'minor',
        timeSignature: '4/4',
        vocalStyle: 'instrumental',
        language: null,
        introSeconds: 10,
        outroSeconds: 8,
        hasBuildUp: true,
        hasDrop: true,
        bestForTime: ['night'],
        bestForContext: ['party'],
        similarArtists: ['A'],
        tags: ['club'],
        isExplicit: false,
        audioQualityIssues: [],
        confidenceScore: 0.9,
        reasoning: 'Test reasoning',
      },
      tokensUsed: 500,
      costUSD: 0.01,
    })
    mockUpdateEq.mockResolvedValue({ error: null })

    const { POST } = await import('@/app/api/ai/analyze-track/route')
    const request = {
      json: async () => ({ trackId: 'track-1' }),
    } as Request

    const response = await POST(request as any)

    expect(response.status).toBe(200)
    expect(mockAnalyzeTrack).toHaveBeenCalledTimes(1)
    expect(mockAnalyzeTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        stationId: 'station-1',
        trackId: 'track-1',
      })
    )
  })
})
