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
