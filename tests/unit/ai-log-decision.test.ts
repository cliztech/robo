import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  logTrackAnalysisDecision,
  logTrackAnalysisDecisionSafely,
  emitDecisionLogWarning,
} from '@/lib/ai/log-decision'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: fromMock,
  }),
}))

describe('logTrackAnalysisDecision', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    fromMock.mockReset()
  })

  const payload = {
    trackId: 'track-9',
    stationId: 'station-3',
    model: 'gpt-4o-mini',
    latencyMs: 380,
    tokensUsed: 512,
    costUSD: 0.0012,
    confidenceScore: 0.91,
    outcomeStatus: 'success' as const,
    analysis: {
      genre: 'electronic',
      mood: 'energetic',
      confidenceScore: 0.91,
      reasoning: 'High-tempo electronic composition',
    },
  }

  it('persists a single normalized decision record with expected fields', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: 'decision-1' }, error: null })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })

    fromMock.mockReturnValue({ insert: insertMock })

    const id = await logTrackAnalysisDecision(payload)

    expect(id).toBe('decision-1')
    expect(fromMock).toHaveBeenCalledWith('ai_decisions')
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        station_id: 'station-3',
        decision_type: 'track_analysis',
        model_used: 'gpt-4o-mini',
        tokens_used: 512,
        cost_usd: 0.0012,
        latency_ms: 380,
        confidence_score: 0.91,
        status: 'auto_applied',
        decision_data: {
          trackId: 'track-9',
          stationId: 'station-3',
          model: 'gpt-4o-mini',
          latencyMs: 380,
          tokensUsed: 512,
          costUSD: 0.0012,
          confidenceScore: 0.91,
          outcomeStatus: 'success',
          analysis: payload.analysis,
        },
      })
    )
  })

  it('swallows persistence errors in safe logger and emits structured warning telemetry', async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: null, error: new Error('insert failed') })
    const selectMock = vi.fn().mockReturnValue({ single: singleMock })
    const insertMock = vi.fn().mockReturnValue({ select: selectMock })
    fromMock.mockReturnValue({ insert: insertMock })

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(logTrackAnalysisDecisionSafely(payload)).resolves.toBeUndefined()

    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(() => JSON.parse(String(warnSpy.mock.calls[0]?.[0]))).not.toThrow()
    expect(JSON.parse(String(warnSpy.mock.calls[0]?.[0]))).toEqual(
      expect.objectContaining({
        event: 'ai_decision_log_failure',
        severity: 'warning',
        decisionType: 'track_analysis',
        stationId: 'station-3',
        trackId: 'track-9',
        model: 'gpt-4o-mini',
        errorMessage: 'insert failed',
      })
    )
  })

  it('emits structured warning telemetry for arbitrary errors', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    emitDecisionLogWarning({
      stationId: 'station-1',
      trackId: 'track-1',
      decisionType: 'track_analysis',
      model: 'gpt-4o',
      error: 'unknown failure',
    })

    const payload = JSON.parse(String(warnSpy.mock.calls[0]?.[0]))
    expect(payload).toEqual(
      expect.objectContaining({
        event: 'ai_decision_log_failure',
        severity: 'warning',
        stationId: 'station-1',
        trackId: 'track-1',
        model: 'gpt-4o',
        errorMessage: 'unknown failure',
      })
    )
  })
})
