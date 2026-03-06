import { ZodError, z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { analyzeTrack } from '@/lib/ai/analyze-track'
import { logAIDecision } from '@/lib/ai/log-decision'
import { consumeSlidingWindowToken, resolveApiLimits, toRateLimitErrorPayload } from '@/lib/api/request-controls'
import { apiError } from '@/lib/api/error'

const MAX_BODY_BYTES = 8 * 1024

const analyzeTrackRequestSchema = z.object({
  trackId: z.string().uuid().max(64),
})

function ensureJsonContentType(request: NextRequest): NextResponse | null {
  const contentType = request.headers.get('content-type')

  if (!contentType || !contentType.toLowerCase().startsWith('application/json')) {
    return apiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json', {
      expected: 'application/json',
      received: contentType ?? null,
    })
  }

  return null
}

async function parseJsonWithLimit(request: NextRequest): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10)
    if (Number.isFinite(parsedLength) && parsedLength > MAX_BODY_BYTES) {
      throw apiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds size limit', {
        limit_bytes: MAX_BODY_BYTES,
        received_bytes: parsedLength,
      })
    }
  }

  const rawBody = await request.text()
  const byteLength = Buffer.byteLength(rawBody, 'utf8')

  if (byteLength > MAX_BODY_BYTES) {
    throw apiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds size limit', {
      limit_bytes: MAX_BODY_BYTES,
      received_bytes: byteLength,
    })
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    throw apiError(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const invalidContentType = ensureJsonContentType(request)
    if (invalidContentType) {
      return invalidContentType
    }

    const supabase = createServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return apiError(401, 'UNAUTHORIZED', 'Unauthorized')
    }

    const body = await parseJsonWithLimit(request)
    const parsedBody = analyzeTrackRequestSchema.safeParse(body)

    if (!parsedBody.success) {
      return apiError(400, 'INVALID_REQUEST_BODY', 'Invalid request body', {
        issues: parsedBody.error.issues,
      })
    }

    const { trackId } = parsedBody.data

    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*, stations!inner(user_id, id)')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return apiError(404, 'TRACK_NOT_FOUND', 'Track not found')
    }

    if (track.stations.user_id !== session.user.id) {
      return apiError(403, 'FORBIDDEN', 'Forbidden')
    }

    if (track.ai_analyzed) {
      return NextResponse.json({
        message: 'Track already analyzed',
        analysis: {
          genre: track.ai_genre,
          mood: track.ai_mood,
          energyLevel: track.ai_energy_level,
        },
      })
    }

    const limits = resolveApiLimits()
    const routeKey = [session.user.id, track.stations.id, '/api/ai/analyze-track'].join(':')
    const rateLimit = consumeSlidingWindowToken({
      key: routeKey,
      maxHits: limits.analyzeTrack.max,
      windowMs: limits.analyzeTrack.windowMs,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(toRateLimitErrorPayload(rateLimit), {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      })
    }

    // Perform AI analysis
    const { analysis, tokensUsed, costUSD, latencyMs } = await analyzeTrack({
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

    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        ai_analyzed: true,
        ai_genre: analysis.genre,
        ai_subgenre: analysis.subgenre,
        ai_mood: analysis.mood,
        ai_energy_level: analysis.energyLevel,
        ai_danceability: analysis.danceability,
        ai_vocal_style: analysis.vocalStyle,
        ai_language: analysis.language,
        ai_bpm: analysis.bpm,
        ai_key_signature: analysis.keySignature,
        ai_scale: analysis.scale,
        ai_time_signature: analysis.timeSignature,
        ai_intro_seconds: analysis.introSeconds,
        ai_outro_seconds: analysis.outroSeconds,
        ai_best_for_time: analysis.bestForTime,
        ai_best_for_context: analysis.bestForContext,
        ai_similar_artists: analysis.similarArtists,
        ai_tags: analysis.tags,
        ai_confidence_score: analysis.confidenceScore,
        ai_analysis_tokens_used: tokensUsed,
        ai_analysis_cost_usd: costUSD,
        is_explicit: analysis.isExplicit,
      })
      .eq('id', trackId)

    if (updateError) throw updateError

    await logTrackAnalysisDecisionSafely({
      trackId,
    await logAIDecision({
      stationId: track.stations.id,
      model: AI_CONFIG.models.analysis,
      latencyMs,
      tokensUsed,
      costUSD,
      latencyMs: 0,
      status: 'auto_applied',
    })

    return NextResponse.json({
      success: true,
      analysis,
      tokensUsed,
      costUSD,
    })
  } catch (error: unknown) {
    if (error instanceof Response) {
      return error
    }

    if (error instanceof ZodError) {
      return apiError(400, 'INVALID_REQUEST_BODY', 'Invalid request body', {
        issues: error.issues,
      })
    }

    console.error('Track analysis error:', error)
    return apiError(500, 'TRACK_ANALYSIS_FAILED', 'Failed to analyze track')
  }
}
