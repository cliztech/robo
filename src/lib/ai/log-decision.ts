import { createServerClient } from '@/lib/supabase/server'

export interface AIDecisionLog {
  stationId: string
  decisionType: string
  decisionData: any
  alternativesConsidered?: any
  reasoning: string
  confidenceScore: number
  modelUsed: string
  tokensUsed: number
  costUSD: number
  latencyMs: number
  status?: 'pending' | 'approved' | 'rejected' | 'auto_applied'
}

export interface TrackAnalysisDecisionPayload {
  trackId: string;
  stationId: string;
  model: string;
  latencyMs: number;
  tokensUsed: number;
  costUSD: number;
  confidenceScore: number;
  outcomeStatus: 'success' | 'error';
  analysis: TrackAnalysis;
}

export async function logAIDecision(log: AIDecisionLog): Promise<string> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('ai_decisions')
    .insert({
      station_id: log.stationId,
      decision_type: log.decisionType,
      decision_data: log.decisionData,
      alternatives_considered: log.alternativesConsidered || null,
      reasoning: log.reasoning,
      confidence_score: log.confidenceScore,
      model_used: log.modelUsed,
      tokens_used: log.tokensUsed,
      cost_usd: log.costUSD,
      latency_ms: log.latencyMs,
      status: log.status || 'auto_applied',
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}

export async function logTrackAnalysisDecision(payload: TrackAnalysisDecisionPayload): Promise<string> {
  return logAIDecision({
    stationId: payload.stationId,
    decisionType: 'track_analysis',
    decisionData: {
      trackId: payload.trackId,
      stationId: payload.stationId,
      model: payload.model,
      latencyMs: payload.latencyMs,
      tokensUsed: payload.tokensUsed,
      costUSD: payload.costUSD,
      confidenceScore: payload.confidenceScore,
      outcomeStatus: payload.outcomeStatus,
      analysis: payload.analysis,
    },
    reasoning: typeof payload.analysis.reasoning === 'string' ? payload.analysis.reasoning : 'Track analysis completed',
    confidenceScore: payload.confidenceScore,
    modelUsed: payload.model,
    tokensUsed: payload.tokensUsed,
    costUSD: payload.costUSD,
    latencyMs: payload.latencyMs,
    status: payload.outcomeStatus === 'success' ? 'auto_applied' : 'rejected',
  })
}


export async function logTrackAnalysisDecisionSafely(payload: TrackAnalysisDecisionPayload): Promise<void> {
  try {
    await logTrackAnalysisDecision(payload)
  } catch (error) {
    emitDecisionLogWarning({
      stationId: payload.stationId,
      trackId: payload.trackId,
      decisionType: 'track_analysis',
      model: payload.model,
      error,
    })
  }
}

export function emitDecisionLogWarning(details: {
  stationId: string
  trackId: string
  decisionType: 'track_analysis'
  model: string
  error: unknown
}): void {
  const message = details.error instanceof Error ? details.error.message : String(details.error)

  console.warn(
    JSON.stringify({
      event: 'ai_decision_log_failure',
      severity: 'warning',
      decisionType: details.decisionType,
      stationId: details.stationId,
      trackId: details.trackId,
      model: details.model,
      errorMessage: message,
    })
  )
}

export async function getAIDecisions(
  stationId: string,
  options: {
    limit?: number
    decisionType?: string
    status?: string
  } = {}
) {
  const supabase = createServerClient()

  let query = supabase
    .from('ai_decisions')
    .select('*')
    .eq('station_id', stationId)
    .order('created_at', { ascending: false })

  if (options.decisionType) {
    query = query.eq('decision_type', options.decisionType)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) throw error

  return data
}
