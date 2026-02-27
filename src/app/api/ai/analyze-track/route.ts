import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { analyzeTrack } from '@/lib/ai/analyze-track'
import { logAIDecision } from '@/lib/ai/log-decision'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trackId } = body

    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId' }, { status: 400 })
    }

    // Get track from database
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*, stations!inner(user_id, id)')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    // Verify ownership
    if (track.stations.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if already analyzed
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

    // Perform AI analysis
    const { analysis, tokensUsed, costUSD } = await analyzeTrack({
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

    // Update track with AI analysis
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

    // Log AI decision
    await logAIDecision({
      stationId: track.stations.id,
      decisionType: 'track_analysis',
      decisionData: {
        trackId,
        analysis,
      },
      reasoning: analysis.reasoning,
      confidenceScore: analysis.confidenceScore,
      modelUsed: 'gpt-4o',
      tokensUsed,
      costUSD,
      latencyMs: 0, // Set in analyzeTrack function
      status: 'auto_applied',
    })

    return NextResponse.json({
      success: true,
      analysis,
      tokensUsed,
      costUSD,
    })
  } catch (error: any) {
    console.error('Track analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze track' }, { status: 500 })
  }
}
