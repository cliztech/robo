'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/primitives/button'

interface TrackAnalyzerProps {
  stationId: string
  trackCount: number
  analyzedCount: number
  onComplete?: () => void
}

export function TrackAnalyzer({ stationId, trackCount, analyzedCount, onComplete }: TrackAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [results, setResults] = useState<{
    successful: number
    failed: number
    totalCost: number
  } | null>(null)

  const unanalyzed = trackCount - analyzedCount
  const progressPercent = trackCount > 0 ? (analyzedCount / trackCount) * 100 : 0

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setResults(null)

    try {
      const response = await fetch('/api/ai/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setResults(data)
      setCurrentTrack(null)
      onComplete?.()
    } catch (error: unknown) {
      console.error('Batch analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-teal-500" />
            AI Track Analysis
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {analyzedCount} of {trackCount} tracks analyzed
          </p>
        </div>

        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
          {unanalyzed} pending
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-right text-xs text-zinc-500">{progressPercent.toFixed(0)}% complete</p>
      </div>

      {unanalyzed > 0 && (
        <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze {unanalyzed} Track{unanalyzed !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}

      {analyzing && currentTrack && <p className="text-center text-sm text-zinc-400">Analyzing: {currentTrack}</p>}

      {results && (
        <div className="space-y-2 rounded border border-zinc-700 bg-zinc-800/70 p-3 text-sm text-zinc-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
            <span>{results.successful} successfully analyzed</span>
          </div>
          {results.failed > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>{results.failed} failed</span>
            </div>
          )}
          <p className="text-xs text-zinc-500">Total cost: ${results.totalCost.toFixed(4)}</p>
        </div>
      )}
    </div>
  )
}
