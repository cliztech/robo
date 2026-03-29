import { beforeEach, describe, expect, it, vi } from 'vitest'

import { batchAnalyzeTracks } from '@/lib/ai/batch-analyzer'

type TrackRow = {
  id: string
  title: string
  artist: string | null
  album: string | null
  duration_seconds: number
  genre: string | null
  year: number | null
  codec: string
  bitrate: number
  sample_rate: number
  channels: number
}

function createSupabaseMock(options: {
  tracks: TrackRow[]
  selectError?: Error | null
  updateErrorsByTrackId?: Record<string, Error | null>
}) {
  const { tracks, selectError = null, updateErrorsByTrackId = {} } = options

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: tracks, error: selectError })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(async (_column: string, trackId?: string) => ({
          error: trackId ? updateErrorsByTrackId[trackId] ?? null : null,
        })),
      })),
    })),
  }
}

const baseTracks: TrackRow[] = [
  {
    id: 'track-1',
    title: 'First',
    artist: 'A',
    album: null,
    duration_seconds: 180,
    genre: null,
    year: null,
    codec: 'mp3',
    bitrate: 320,
    sample_rate: 44100,
    channels: 2,
  },
  {
    id: 'track-2',
    title: 'Second',
    artist: 'B',
    album: null,
    duration_seconds: 200,
    genre: null,
    year: null,
    codec: 'mp3',
    bitrate: 320,
    sample_rate: 44100,
    channels: 2,
  },
]

function analysisResult() {
  return {
    analysis: {
      genre: 'pop',
      subgenre: 'indie-pop',
      mood: 'upbeat',
      energyLevel: 0.8,
      danceability: 0.7,
      vocalStyle: 'sung',
      language: 'en',
      bpm: 120,
      keySignature: 'C',
      scale: 'major',
      timeSignature: '4/4',
      introSeconds: 8,
      outroSeconds: 12,
      bestForTime: 'daytime',
      bestForContext: 'drive-time',
      similarArtists: ['Example'],
      tags: ['radio'],
      confidenceScore: 0.9,
      isExplicit: false,
    },
    tokensUsed: 123,
    costUSD: 0.01,
  }
}

describe('batchAnalyzeTracks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('increments failed and skips successful increment when DB update fails', async () => {
    const analyzeTrackMock = vi.fn().mockResolvedValue(analysisResult())
    const supabaseMock = createSupabaseMock({
      tracks: [baseTracks[0]],
      updateErrorsByTrackId: {
        'track-1': new Error('write timeout'),
      },
    })

    const onError = vi.fn()
    const result = await batchAnalyzeTracks({
      stationId: 'station-1',
      createServerClientFn: vi.fn().mockResolvedValue(supabaseMock) as never,
      analyzeTrackFn: analyzeTrackMock as never,
      onError,
    })

    expect(result).toMatchObject({
      successful: 0,
      failed: 1,
      totalCost: 0,
      totalTokens: 0,
    })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBe('track-1')
    expect(onError.mock.calls[0][1]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0][1].message).toContain('track track-1')
    expect(onError.mock.calls[0][1].message).toContain('write timeout')
  })

  it('keeps progress callback monotonic when write failures occur', async () => {
    const analyzeTrackMock = vi.fn().mockResolvedValue(analysisResult())
    const supabaseMock = createSupabaseMock({
      tracks: baseTracks,
      updateErrorsByTrackId: {
        'track-1': new Error('conflict'),
      },
    })

    const completedValues: number[] = []

    const result = await batchAnalyzeTracks({
      stationId: 'station-2',
      createServerClientFn: vi.fn().mockResolvedValue(supabaseMock) as never,
      analyzeTrackFn: analyzeTrackMock as never,
      concurrency: 2,
      onProgress: ({ completed }) => completedValues.push(completed),
    })

    expect(result).toMatchObject({ successful: 1, failed: 1 })
    for (let i = 1; i < completedValues.length; i++) {
      expect(completedValues[i]).toBeGreaterThanOrEqual(completedValues[i - 1])
    }
    expect(completedValues.at(-1)).toBe(2)
  })
})
