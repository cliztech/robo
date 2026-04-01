import { ZodError, z } from 'zod'
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
import { apiError } from '@/lib/api/error'

const MAX_BODY_BYTES = 8 * 1024

const batchAnalyzeRequestSchema = z.object({
  stationId: z.string().uuid().max(64),
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
    const invalidContentType = ensureJsonContentType(request)
    if (invalidContentType) {
      return invalidContentType
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return apiError(401, 'UNAUTHORIZED', 'Unauthorized')
    }

    const body = await parseJsonWithLimit(request)
    const parsedBody = batchAnalyzeRequestSchema.safeParse(body)

    if (!parsedBody.success) {
      return apiError(400, 'INVALID_REQUEST_BODY', 'Invalid request body', {
        issues: parsedBody.error.issues,
      })
    }

    const { stationId } = parsedBody.data

    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select('user_id')
      .eq('id', stationId)
      .single()

    if (stationError || !station) {
      return apiError(404, 'STATION_NOT_FOUND', 'Station not found')
    }

    if (station.user_id !== session.user.id) {
      return apiError(403, 'FORBIDDEN', 'Forbidden')
    }

    const limits = resolveApiLimits()
    const route = '/api/ai/batch-analyze'
    const routeKey = [session.user.id, stationId, route].join(':')
    const idempotencyScopeKey = [session.user.id, route].join(':')

    const rateLimit = await consumeSlidingWindowToken({
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
    const requestFingerprint = fingerprintPayload(body)
    if (idempotencyKey) {
      const cached = await getIdempotencyReplay({
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
      await storeIdempotencyResult({
        scopeKey: idempotencyScopeKey,
        idempotencyKey,
        fingerprint: requestFingerprint,
        status: 200,
        payload: results,
        ttlMs: limits.idempotencyTtlMs,
      })
    }

    return NextResponse.json(results)
  } catch (error: unknown) {
    if (error instanceof Response) {
      return error
    }

    if (error instanceof ZodError) {
      return apiError(400, 'INVALID_REQUEST_BODY', 'Invalid request body', {
        issues: error.issues,
      })
    }

    console.error('Batch analysis error:', error)
    return apiError(500, 'BATCH_ANALYSIS_FAILED', 'Failed to run batch analysis')
  }
}
