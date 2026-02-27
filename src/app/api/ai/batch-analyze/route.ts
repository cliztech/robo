import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { batchAnalyzeTracks } from '@/lib/ai/batch-analyzer'

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

    // Run batch analysis
    const results = await batchAnalyzeTracks({
      stationId,
      concurrency: 3,
    })

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Batch analysis error:', error)
    return NextResponse.json({ error: error.message || 'Failed to run batch analysis' }, { status: 500 })
  }
}
