import PQueue from 'p-queue'
import { createServerClient } from '@/lib/supabase/server'

const DEFAULT_PAGE_SIZE = 250
const MAX_DB_UPDATE_RETRIES = 3
const DB_RETRY_BASE_DELAY_MS = 100

type AnalyzeTrackFn = (params: {
  trackId: string
  metadata: {
    title: string
    artist?: string
    album?: string
    duration: number
    genre?: string
    year?: number
  }
  audioFeatures: {
    codec?: string | null
    bitrate?: number | null
    sampleRate?: number | null
    channels?: number | null
  }
}) => Promise<{
  analysis: {
    genre: string
    subgenre: string
    mood: string
    energyLevel: number
    danceability: number
    vocalStyle: string
    language: string
    bpm: number
    keySignature: string
    scale: string
    timeSignature: string
    introSeconds: number
    outroSeconds: number
    bestForTime: string[]
    bestForContext: string[]
    similarArtists: string[]
    tags: string[]
    confidenceScore: number
    isExplicit: boolean
  }
  tokensUsed: number
  costUSD: number
}>

async function getAnalyzeTrackFn(): Promise<AnalyzeTrackFn> {
  const module = await import('./analyze-track')
  return module.analyzeTrack
}

interface ProgressPayload {
  completed: number
  total: number
  current?: string
}

export interface BatchAnalysisOptions {
  stationId: string
  concurrency?: number
  pageSize?: number
  onProgress?: (progress: ProgressPayload) => void
  onError?: (trackId: string, error: Error) => void
  analyzeTrackFn?: AnalyzeTrackFn
}

export interface BatchAnalysisResult {
  successful: number
  failed: number
  totalCost: number
  totalTokens: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as { code?: string; status?: number; message?: string; details?: string }

  if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
    return true
  }

  if (maybeError.code && ['40001', '40P01', '53300', '57P01', '57014'].includes(maybeError.code)) {
    return true
  }

  const text = `${maybeError.message ?? ''} ${maybeError.details ?? ''}`.toLowerCase()
  return ['timeout', 'timed out', 'deadlock', 'connection reset', 'connection terminated', 'too many connections'].some((needle) =>
    text.includes(needle)
  )
}

async function updateTrackWithRetry(
  updateFn: () => Promise<{ error: unknown }>,
  maxRetries: number = MAX_DB_UPDATE_RETRIES
): Promise<{ error: unknown }> {
  for (let attempt = 0; ; attempt++) {
    const result = await updateFn()

    if (!result.error) {
      return result
    }

    if (attempt >= maxRetries || !isTransientDbError(result.error)) {
      return result
    }

    const jitterMs = Math.floor(Math.random() * 50)
    const backoffMs = DB_RETRY_BASE_DELAY_MS * 2 ** attempt + jitterMs
    await delay(backoffMs)
  }
}

export async function batchAnalyzeTracks(options: BatchAnalysisOptions): Promise<BatchAnalysisResult> {
  const { stationId, concurrency = 3, onProgress, onError, pageSize = DEFAULT_PAGE_SIZE, analyzeTrackFn } = options

  const supabase = await createServerClient()

  const { count, error: countError } = await supabase
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .eq('station_id', stationId)
    .eq('ai_analyzed', false)

  if (countError) throw countError

  const totalTracks = count ?? 0
  if (totalTracks === 0) {
    return { successful: 0, failed: 0, totalCost: 0, totalTokens: 0 }
  }

  let successful = 0
  let failed = 0
  let totalCost = 0
  let totalTokens = 0
  let cursorId: string | null = null

  while (successful + failed < totalTracks) {
    let query = supabase
      .from('tracks')
      .select('*')
      .eq('station_id', stationId)
      .eq('ai_analyzed', false)
      .order('id', { ascending: true })
      .limit(pageSize)

    if (cursorId) {
      query = query.gt('id', cursorId)
    }

  // Process tracks
  const promises = tracks.map((track) =>
    queue.add(async () => {
      try {
        onProgress?.({
          completed: successful + failed,
          total: tracks.length,
          current: track.title,
        })

        const result = await analyzeTrack({
          stationId,
          trackId: track.id,
          metadata: {
            title: track.title,
            artist: track.artist || undefined,
            album: track.album || undefined,
            duration: Number(track.duration_seconds),
            genre: track.genre || undefined,
            year: track.year || undefined,
          },
          audioFeatures: {
            codec: track.codec,
            bitrate: track.bitrate,
            sampleRate: track.sample_rate,
            channels: track.channels,
          },
        })

        // Update track
        await supabase
          .from('tracks')
          .update({
            ai_analyzed: true,
            ai_genre: result.analysis.genre,
            ai_subgenre: result.analysis.subgenre,
            ai_mood: result.analysis.mood,
            ai_energy_level: result.analysis.energyLevel,
            ai_danceability: result.analysis.danceability,
            ai_vocal_style: result.analysis.vocalStyle,
            ai_language: result.analysis.language,
            ai_bpm: result.analysis.bpm,
            ai_key_signature: result.analysis.keySignature,
            ai_scale: result.analysis.scale,
            ai_time_signature: result.analysis.timeSignature,
            ai_intro_seconds: result.analysis.introSeconds,
            ai_outro_seconds: result.analysis.outroSeconds,
            ai_best_for_time: result.analysis.bestForTime,
            ai_best_for_context: result.analysis.bestForContext,
            ai_similar_artists: result.analysis.similarArtists,
            ai_tags: result.analysis.tags,
            ai_confidence_score: result.analysis.confidenceScore,
            ai_analysis_tokens_used: result.tokensUsed,
            ai_analysis_cost_usd: result.costUSD,
            is_explicit: result.analysis.isExplicit,
    const { data: tracks, error } = await query

    if (error) throw error

    const page = tracks ?? []
    if (page.length === 0) {
      break
    }

    const queue = new PQueue({ concurrency })

    const promises = page.map((track) =>
      queue.add(async () => {
        try {
          onProgress?.({
            completed: successful + failed,
            total: totalTracks,
            current: track.title,
          })

          const result = await analyzeTrack({
            trackId: track.id,
            metadata: {
              title: track.title,
              artist: track.artist || undefined,
              album: track.album || undefined,
              duration: Number(track.duration_seconds),
              genre: track.genre || undefined,
              year: track.year || undefined,
            },
            audioFeatures: {
              codec: track.codec,
              bitrate: track.bitrate,
              sampleRate: track.sample_rate,
              channels: track.channels,
            },
          })

          const { error: updateError } = await updateTrackWithRetry(() =>
            supabase
              .from('tracks')
              .update({
                ai_analyzed: true,
                ai_genre: result.analysis.genre,
                ai_subgenre: result.analysis.subgenre,
                ai_mood: result.analysis.mood,
                ai_energy_level: result.analysis.energyLevel,
                ai_danceability: result.analysis.danceability,
                ai_vocal_style: result.analysis.vocalStyle,
                ai_language: result.analysis.language,
                ai_bpm: result.analysis.bpm,
                ai_key_signature: result.analysis.keySignature,
                ai_scale: result.analysis.scale,
                ai_time_signature: result.analysis.timeSignature,
                ai_intro_seconds: result.analysis.introSeconds,
                ai_outro_seconds: result.analysis.outroSeconds,
                ai_best_for_time: result.analysis.bestForTime,
                ai_best_for_context: result.analysis.bestForContext,
                ai_similar_artists: result.analysis.similarArtists,
                ai_tags: result.analysis.tags,
                ai_confidence_score: result.analysis.confidenceScore,
                ai_analysis_tokens_used: result.tokensUsed,
                ai_analysis_cost_usd: result.costUSD,
                is_explicit: result.analysis.isExplicit,
              })
              .eq('id', track.id)
          )

          if (updateError) {
            failed++
            const dbError = updateError instanceof Error ? updateError : new Error(String(updateError))
            onError?.(track.id, dbError)
            return
          }

          successful++
          totalCost += result.costUSD
          totalTokens += result.tokensUsed
        } catch (error: unknown) {
          failed++
          const err = error instanceof Error ? error : new Error(String(error))
          onError?.(track.id, err)
        }
      })
    )

    await Promise.all(promises)

    cursorId = page[page.length - 1]?.id ?? cursorId
  }

  onProgress?.({
    completed: successful + failed,
    total: totalTracks,
  })

  const finishedAt = Date.now()
  const { error: summaryError } = await supabase.from('ai_batch_analysis_runs').insert({
    station_id: stationId,
    total_tracks: totalTracks,
    successful,
    failed,
    total_cost_usd: totalCost,
    total_tokens: totalTokens,
    elapsed_ms: finishedAt - startedAt,
    started_at: new Date(startedAt).toISOString(),
    finished_at: new Date(finishedAt).toISOString(),
  })

  if (summaryError) {
    console.warn('Failed to persist batch analysis summary', summaryError)
  }

  return {
    successful,
    failed,
    totalCost,
    totalTokens,
  }
}
