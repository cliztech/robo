import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { batchAnalyzeTracks } from '@/lib/ai/batch-analyzer'
import {
  consumeSlidingWindowToken,
  fingerprintPayload,
  getIdempotencyReplay,
  resolveApiLimits,
  storeIdempotencyResult,
  toRateLimitErrorPayload,
} from '@/lib/api/request-controls'

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
    const { stationId } = body

    if (!stationId) {
      return NextResponse.json({ error: 'Missing stationId' }, { status: 400 })
    }

    // Verify ownership
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('user_id')
      .eq('id', stationId)
      .single()

    if (stationError || !station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    if (station.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limits = resolveApiLimits()
    const route = '/api/ai/batch-analyze'
    const routeKey = [session.user.id, stationId, route].join(':')
    const idempotencyScopeKey = [session.user.id, route].join(':')

    const rateLimit = consumeSlidingWindowToken({
      key: routeKey,
      maxHits: limits.batchAnalyze.max,
      windowMs: limits.batchAnalyze.windowMs,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(toRateLimitErrorPayload(rateLimit), {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      })
    }

    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    const requestFingerprint = fingerprintPayload({ stationId })
    if (idempotencyKey) {
      const cached = getIdempotencyReplay({
        scopeKey: idempotencyScopeKey,
        idempotencyKey,
        fingerprint: requestFingerprint,
      })

      if (cached.type === 'mismatch') {
        return NextResponse.json(
          {
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'Idempotency-Key was already used with a different request payload.',
            },
          },
          { status: 409 }
        )
      }

      if (cached.type === 'replay') {
        return NextResponse.json(cached.payload, {
          status: cached.status,
          headers: {
            'Idempotency-Replayed': 'true',
          },
        })
      }
    }

    // Run batch analysis
    const results = await batchAnalyzeTracks({
      stationId,
      concurrency: 3,
    })

    if (idempotencyKey) {
      storeIdempotencyResult({
        scopeKey: idempotencyScopeKey,
        idempotencyKey,
        fingerprint: requestFingerprint,
        status: 200,
        payload: results,
        ttlMs: limits.idempotencyTtlMs,
      })
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Batch analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to run batch analysis' }, { status: 500 })
  }
}
