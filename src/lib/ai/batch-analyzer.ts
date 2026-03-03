import PQueue from 'p-queue'
import { createServerClient } from '@/lib/supabase/server'
import { analyzeTrack } from './analyze-track'

export interface BatchAnalysisOptions {
  stationId: string
  concurrency?: number
  onProgress?: (progress: {
    completed: number
    total: number
    current?: string
  }) => void
  onError?: (trackId: string, error: Error) => void
}

export async function batchAnalyzeTracks(options: BatchAnalysisOptions): Promise<{
  successful: number
  failed: number
  totalCost: number
  totalTokens: number
}> {
  const { stationId, concurrency = 3, onProgress, onError } = options

  const supabase = createServerClient()

  // Get unanalyzed tracks
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('station_id', stationId)
    .eq('ai_analyzed', false)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!tracks || tracks.length === 0) {
    return { successful: 0, failed: 0, totalCost: 0, totalTokens: 0 }
  }

  // Create queue with concurrency limit
  const queue = new PQueue({ concurrency })

  let successful = 0
  let failed = 0
  let totalCost = 0
  let totalTokens = 0

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
          })
          .eq('id', track.id)

        successful++
        totalCost += result.costUSD
        totalTokens += result.tokensUsed
      } catch (error: any) {
        failed++
        onError?.(track.id, error)
      }
    })
  )

  await Promise.all(promises)

  onProgress?.({
    completed: successful + failed,
    total: tracks.length,
  })

  return {
    successful,
    failed,
    totalCost,
    totalTokens,
  }
}
