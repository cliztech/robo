import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}))

import { batchAnalyzeTracks } from '@/lib/ai/batch-analyzer'

type Track = {
  id: string
  title: string
  artist: string
  album: string
  duration_seconds: number
  genre: string
  year: number
  codec: string
  bitrate: number
  sample_rate: number
  channels: number
  created_at: string
  ai_analyzed: boolean
}

function buildTrack(index: number): Track {
  return {
    id: `track-${index}`,
    title: `Track ${index}`,
    artist: 'Artist',
    album: 'Album',
    duration_seconds: 180,
    genre: 'house',
    year: 2020,
    codec: 'mp3',
    bitrate: 320,
    sample_rate: 44100,
    channels: 2,
    created_at: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
    ai_analyzed: false,
  }
}

function createSupabaseStub(params: {
  tracks: Track[]
  updateErrorsByTrackId?: Record<string, unknown[]>
}) {
  const { tracks } = params
  const workingTracks = tracks.map((t) => ({ ...t }))
  const pageCalls: Array<{ cursor: string | null; limit: number }> = []
  const summaryInserts: Record<string, unknown>[] = []

  const updateErrorsByTrackId = new Map<string, unknown[]>(
    Object.entries(params.updateErrorsByTrackId ?? {}).map(([trackId, errors]) => [trackId, [...errors]])
  )

  const supabase = {
    from(table: string) {
      if (table === 'tracks') {
        return {
          select(_cols: string, options?: { count?: 'exact'; head?: boolean }) {
            if (options?.head && options.count === 'exact') {
              let eqCalls = 0
              const countQuery = {
                eq(_column: string, _value: unknown) {
                  eqCalls += 1
                  if (eqCalls >= 2) {
                    return Promise.resolve({ count: workingTracks.filter((t) => !t.ai_analyzed).length, error: null })
                  }
                  return countQuery
                },
              }

              return countQuery
            }

            let cursor: string | null = null
            let pageLimit = 0

            const dataQuery = {
              eq(_column: string, _value: unknown) {
                return dataQuery
              },
              order(_column: string, _opts: { ascending: boolean }) {
                return dataQuery
              },
              limit(value: number) {
                pageLimit = value
                return dataQuery
              },
              gt(_column: string, value: string) {
                cursor = value
                return dataQuery
              },
              then(resolve: (value: { data: Track[]; error: null }) => void) {
                const pending = workingTracks
                  .filter((t) => !t.ai_analyzed)
                  .filter((t) => (cursor ? t.id > cursor : true))
                  .slice(0, pageLimit)
                pageCalls.push({ cursor, limit: pageLimit })
                resolve({ data: pending, error: null })
              },
            }

            return dataQuery
          },
          update(_payload: Record<string, unknown>) {
            return {
              async eq(_column: string, value: string) {
                const queuedErrors = updateErrorsByTrackId.get(value)
                if (queuedErrors && queuedErrors.length > 0) {
                  const error = queuedErrors.shift() ?? null
                  return { error }
                }

                const track = workingTracks.find((item) => item.id === value)
                if (!track) {
                  return { error: new Error('missing track') }
                }
                track.ai_analyzed = true
                return { error: null }
              },
            }
          },
        }
      }

      if (table === 'ai_batch_analysis_runs') {
        return {
          async insert(payload: Record<string, unknown>) {
            summaryInserts.push(payload)
            return { error: null }
          },
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  }

  return { supabase, pageCalls, summaryInserts }
}

const analyzeTrackFn = vi.fn().mockResolvedValue({
  analysis: {
    genre: 'house',
    subgenre: 'deep house',
    mood: 'uplifting',
    energyLevel: 0.8,
    danceability: 0.75,
    vocalStyle: 'instrumental',
    language: 'en',
    bpm: 124,
    keySignature: 'C',
    scale: 'major',
    timeSignature: '4/4',
    introSeconds: 8,
    outroSeconds: 12,
    bestForTime: ['night'],
    bestForContext: ['mix'],
    similarArtists: ['Artist X'],
    tags: ['club'],
    confidenceScore: 0.9,
    isExplicit: false,
  },
  tokensUsed: 200,
  costUSD: 0.02,
})

describe('batchAnalyzeTracks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    analyzeTrackFn.mockClear()
  })

  it('tracks partial update failures and keeps counters consistent', async () => {
    const tracks = [buildTrack(1), buildTrack(2), buildTrack(3)]
    const dbError = Object.assign(new Error('deadlock detected'), { code: '40P01', status: 503 })
    const { supabase, summaryInserts } = createSupabaseStub({
      tracks,
      updateErrorsByTrackId: {
        'track-2': [dbError, dbError, dbError, dbError],
      },
    })

    createServerClientMock.mockReturnValue(supabase)

    const onError = vi.fn()
    const result = await batchAnalyzeTracks({
      stationId: 'station-1',
      concurrency: 2,
      pageSize: 2,
      onError,
      analyzeTrackFn,
    })

    expect(result).toEqual({ successful: 2, failed: 1, totalCost: 0.04, totalTokens: 400 })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0]?.[0]).toBe('track-2')
    expect(summaryInserts).toHaveLength(1)
    expect(summaryInserts[0]).toMatchObject({ total_tracks: 3, successful: 2, failed: 1 })
  })

  it('paginates large datasets using range windows', async () => {
    const tracks = Array.from({ length: 610 }, (_, idx) => buildTrack(idx + 1))
    const { supabase, pageCalls } = createSupabaseStub({ tracks })
    createServerClientMock.mockReturnValue(supabase)

    const result = await batchAnalyzeTracks({
      stationId: 'station-2',
      pageSize: 250,
      concurrency: 8,
      analyzeTrackFn,
    })

    expect(result.successful).toBe(610)
    expect(result.failed).toBe(0)
    expect(pageCalls).toHaveLength(3)
    expect(pageCalls[0]).toEqual({ cursor: null, limit: 250 })
    expect(pageCalls[1]?.limit).toBe(250)
    expect(pageCalls[1]?.cursor).not.toBeNull()
    expect(pageCalls[2]?.limit).toBe(250)
    expect(pageCalls[2]?.cursor).not.toBeNull()
  })

  it('reports stable final progress counters', async () => {
    const tracks = Array.from({ length: 7 }, (_, idx) => buildTrack(idx + 1))
    const { supabase } = createSupabaseStub({ tracks })
    createServerClientMock.mockReturnValue(supabase)

    const onProgress = vi.fn()
    const result = await batchAnalyzeTracks({
      stationId: 'station-3',
      concurrency: 3,
      pageSize: 3,
      onProgress,
      analyzeTrackFn,
    })

    expect(result.successful + result.failed).toBe(7)
    expect(onProgress).toHaveBeenLastCalledWith({ completed: 7, total: 7 })
  })
})
