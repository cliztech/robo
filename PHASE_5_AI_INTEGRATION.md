# Phase 5: AI Integration & Track Analysis

**Timeline:** Day 11-13  
**Goal:** Implement OpenAI-powered track analysis for automatic genre, mood, and energy detection
**Goal:** Implement OpenAI-powered track analysis for automatic genre, mood, and energy detection.

## Prerequisites

- [ ] Phase 0-4 completed
- [ ] OpenAI API key obtained
- [ ] At least 5 test tracks uploaded
- [ ] Database tracks table populated

## Overview

This phase implements intelligent track analysis using OpenAI's GPT-4o model to automatically classify tracks by:
- [ ] Database `tracks` table populated

## Overview

This phase adds intelligent track analysis using OpenAI models to classify tracks by:

- Genre & subgenre
- Mood & emotion
- Energy level (1-10)
- Danceability (1-10)
- BPM (beats per minute)
- BPM
- Key signature & scale
- Vocal style & language
- Optimal playback timing
- Similar artists

## Step 1: Setup OpenAI Integration

### 1.1: Install AI SDK

```bash
pnpm add ai @ai-sdk/openai zod
```

### 1.2: Configure Environment
### 1.1 Install dependencies

```bash
pnpm add ai @ai-sdk/openai zod p-queue
```

### 1.2 Configure environment

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Optional: Rate limiting
AI_MAX_REQUESTS_PER_HOUR=100
AI_COST_LIMIT_USD=50.00
```

### 1.3: Create AI Configuration

Create file: `src/lib/ai/config.ts`

```ts
export const AI_CONFIG = {
  // Model selection
  models: {
    analysis: 'gpt-4o', // Complex track analysis
    quick: 'gpt-4o-mini', // Quick checks
    embedding: 'text-embedding-3-small', // Similarity
  },

  // Cost limits (USD)
  costs: {
    maxPerTrack: 0.05, // Max $0.05 per track
    dailyLimit: 50.0, // Max $50/day
    monthlyLimit: 1000.0, // Max $1000/month
  },

  // Rate limiting
### 1.3 Add AI config

Create `src/lib/ai/config.ts`:

```ts
export const AI_CONFIG = {
  models: {
    analysis: 'gpt-4o',
    quick: 'gpt-4o-mini',
    embedding: 'text-embedding-3-small',
  },
  costs: {
    maxPerTrack: 0.05,
    dailyLimit: 50.0,
    monthlyLimit: 1000.0,
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    concurrentRequests: 3,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },

  // Analysis confidence thresholds
  confidence: {
    minimum: 0.7, // Reject below 70%
    high: 0.85, // Mark as high confidence
  },
}
```

## Step 2: Create AI Track Analyzer

Create file: `src/lib/ai/analyze-track.ts`

```ts
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { AI_CONFIG } from './config'

// Zod schema for track analysis
const TrackAnalysisSchema = z.object({
  // Primary classification
  genre: z.string().describe('Primary music genre (e.g., electronic, rock, hip-hop)'),
  subgenre: z.string().nullable().describe('Specific subgenre if applicable'),

  // Mood & emotion
  mood: z
    .enum([
      'happy',
      'sad',
      'energetic',
      'calm',
      'angry',
      'chill',
      'mysterious',
      'romantic',
      'melancholic',
      'uplifting',
    ])
    .describe('Primary emotional mood of the track'),

  secondaryMoods: z.array(z.string()).max(3).describe('Additional moods present'),

  // Energy & danceability
  energyLevel: z.number().min(1).max(10).describe('Energy level from 1 (very calm) to 10 (very intense)'),
  danceability: z.number().min(1).max(10).describe('How suitable for dancing, 1-10'),

  // Musical properties
  bpm: z.number().min(40).max(240).nullable().describe('Estimated beats per minute'),
  keySignature: z.string().nullable().describe('Musical key (C, D, E, etc.)'),
  scale: z.enum(['major', 'minor', 'other']).nullable().describe('Musical scale'),
  timeSignature: z.string().nullable().describe('Time signature (4/4, 3/4, etc.)'),

  // Vocals
  vocalStyle: z.enum(['male', 'female', 'mixed', 'instrumental', 'spoken']).describe('Vocal style'),
  language: z.string().nullable().describe('Language of lyrics (if applicable)'),

  // Track structure
  introSeconds: z.number().nullable().describe('Duration of intro before main content'),
  outroSeconds: z.number().nullable().describe('Duration of outro/fade out'),
  hasBuildUp: z.boolean().describe('Track has a build-up section'),
  hasDrop: z.boolean().describe('Track has a drop/climax'),

  // Context & timing
  bestForTime: z
    .array(z.enum(['morning', 'afternoon', 'evening', 'night', 'anytime']))
    .describe('Best times of day to play'),
  bestForContext: z.array(z.string()).describe('Best contexts (workout, study, party, relax, driving, etc.)'),

  // Recommendations
  similarArtists: z.array(z.string()).max(5).describe('Artists with similar sound'),
  tags: z.array(z.string()).max(10).describe('Descriptive tags'),

  // Quality checks
  isExplicit: z.boolean().describe('Contains explicit content'),
  audioQualityIssues: z.array(z.string()).describe('Any detected audio quality issues'),

  // Confidence
  confidenceScore: z.number().min(0).max(1).describe('AI confidence in analysis (0-1)'),
  reasoning: z.string().describe('Brief explanation of the analysis'),
})

export type TrackAnalysis = z.infer<typeof TrackAnalysisSchema>

export interface AnalyzeTrackOptions {
  trackId: string
  metadata: {
    title?: string
    artist?: string
    album?: string
    duration: number
    genre?: string // From ID3 tags
    year?: number
  }
  audioFeatures?: {
    codec: string
    bitrate: number
    sampleRate: number
    channels: number
  }
}

export async function analyzeTrack(options: AnalyzeTrackOptions): Promise<{
  analysis: TrackAnalysis
  tokensUsed: number
  costUSD: number
}> {
  const { trackId, metadata, audioFeatures } = options

  try {
    // Build context prompt
    const context = buildAnalysisContext(metadata, audioFeatures)

    // Call OpenAI
    const startTime = Date.now()
    const result = await generateObject({
      model: openai(AI_CONFIG.models.analysis),
      schema: TrackAnalysisSchema,
      prompt: `Analyze this music track and provide detailed classification:

${context}

Provide a comprehensive analysis focusing on:
1. Accurate genre and subgenre classification
2. Emotional mood and secondary moods
3. Energy level and danceability (be specific with numbers)
4. Musical properties (BPM, key, time signature)
5. Vocal style and language
6. Track structure (intro, outro, build-ups, drops)
7. Best times and contexts for playing
8. Similar artists and descriptive tags
9. Any quality issues or explicit content

Be precise and confident in your classifications. Use your training on millions of songs to make accurate assessments.`,
      temperature: 0.3, // Lower temperature for more consistent results
    })

    const latencyMs = Date.now() - startTime

    // Calculate cost
    const tokensUsed = result.usage?.totalTokens || 0
    const costUSD = calculateCost(tokensUsed, AI_CONFIG.models.analysis)

    // Validate confidence
    if (result.object.confidenceScore < AI_CONFIG.confidence.minimum) {
      throw new Error(`Low confidence score: ${result.object.confidenceScore}`)
    }

    // Log analysis
    await logAIDecision({
      trackId,
      decisionType: 'track_analysis',
      modelUsed: AI_CONFIG.models.analysis,
      tokensUsed,
      costUSD,
      latencyMs,
      confidenceScore: result.object.confidenceScore,
      result: result.object,
    })

    return {
      analysis: result.object,
      tokensUsed,
      costUSD,
    }
  } catch (error: any) {
    console.error('Track analysis error:', error)
    throw new Error(`Failed to analyze track: ${error.message}`)
  }
}

function buildAnalysisContext(
  metadata: AnalyzeTrackOptions['metadata'],
  audioFeatures?: AnalyzeTrackOptions['audioFeatures']
): string {
  const parts: string[] = []

  if (metadata.title) parts.push(`Title: "${metadata.title}"`)
  if (metadata.artist) parts.push(`Artist: "${metadata.artist}"`)
  if (metadata.album) parts.push(`Album: "${metadata.album}"`)
  if (metadata.year) parts.push(`Year: ${metadata.year}`)
  if (metadata.genre) parts.push(`ID3 Genre: "${metadata.genre}" (may not be accurate)`)

  parts.push(`Duration: ${metadata.duration.toFixed(1)} seconds`)

  if (audioFeatures) {
    parts.push('')
    parts.push('Audio Quality:')
    parts.push(`- Format: ${audioFeatures.codec.toUpperCase()}`)
    parts.push(`- Bitrate: ${audioFeatures.bitrate / 1000} kbps`)
    parts.push(`- Sample Rate: ${audioFeatures.sampleRate / 1000} kHz`)
    parts.push(`- Channels: ${audioFeatures.channels === 1 ? 'Mono' : 'Stereo'}`)
  }

  return parts.join('\n')
}

function calculateCost(tokens: number, model: string): number {
  // GPT-4o pricing (as of Feb 2026)
  const pricing = {
    'gpt-4o': {
      input: 2.5 / 1_000_000, // $2.50 per 1M input tokens
      output: 10.0 / 1_000_000, // $10.00 per 1M output tokens
    },
    'gpt-4o-mini': {
      input: 0.15 / 1_000_000,
      output: 0.6 / 1_000_000,
    },
  }

  const modelPricing = pricing[model as keyof typeof pricing]
  if (!modelPricing) return 0

  // Rough estimate (60% input, 40% output)
  const inputTokens = Math.floor(tokens * 0.6)
  const outputTokens = Math.floor(tokens * 0.4)

  return inputTokens * modelPricing.input + outputTokens * modelPricing.output
}

async function logAIDecision(data: {
  trackId: string
  decisionType: string
  modelUsed: string
  tokensUsed: number
  costUSD: number
  latencyMs: number
  confidenceScore: number
  result: any
}): Promise<void> {
  // Log to database for transparency
  // Implementation in Step 3
}
```

## Step 3: Create AI Decision Logging

Create file: `src/lib/ai/log-decision.ts`

```ts
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
```

## Step 4: Create Track Analysis API Route

Create file: `src/app/api/ai/analyze-track/route.ts`

```ts
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
```

## Step 5: Create Batch Analysis System

Create file: `src/lib/ai/batch-analyzer.ts`

```ts
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
```

## Step 6: Create Analysis UI Component

Create file: `src/components/ai/TrackAnalyzer.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

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
  const progressPercent = (analyzedCount / trackCount) * 100

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
    } catch (error: any) {
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

        <Badge variant={unanalyzed > 0 ? 'default' : 'secondary'}>{unanalyzed} pending</Badge>
      </div>

      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
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
        <Alert>
          <AlertDescription className="space-y-2">
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
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```
  confidence: {
    minimum: 0.7,
    high: 0.85,
  },
} as const
```

## Step 2: Create Track Analyzer

Create `src/lib/ai/analyze-track.ts` with:

- Zod schema for analysis output
- `analyzeTrack(...)` function using `generateObject`
- Confidence threshold validation
- Token and cost estimation
- Structured decision logging

> Reuse the schema and sample implementation from the design notes to cover genre, mood, energy, BPM, vocals, timing, tags, explicit flag, and confidence.

## Step 3: Add AI Decision Logging

Create `src/lib/ai/log-decision.ts`:

- `logAIDecision(log: AIDecisionLog)` to insert into `ai_decisions`
- `getAIDecisions(stationId, options)` for filtered history

Track:

- `decision_type`
- `model_used`
- `tokens_used`
- `cost_usd`
- `latency_ms`
- `confidence_score`

## Step 4: API Route for Single Track Analysis

Create `src/app/api/ai/analyze-track/route.ts`:

- Auth check
- Ownership check for `trackId`
- Skip if already analyzed
- Call `analyzeTrack(...)`
- Update `tracks` AI columns
- Log decision
- Return analysis + usage metadata

## Step 5: Batch Analysis

Create `src/lib/ai/batch-analyzer.ts`:

- Query unanalyzed tracks by `station_id`
- Process with bounded concurrency via `PQueue`
- Update each analyzed track
- Emit progress callbacks
- Aggregate usage and cost totals

## Step 6: UI Component

Create `src/components/ai/TrackAnalyzer.tsx` with:

- Pending/complete counts
- Progress bar
- Analyze button
- In-flight state
- Summary of success/fail and total cost

## Verification Checklist

- [ ] OpenAI API key configured
- [ ] Track analysis returns valid schema output
- [ ] Confidence scores above threshold
- [ ] Cost tracking works
- [ ] Batch analysis processes multiple tracks
- [ ] AI decisions are logged to database
- [ ] UI displays progress and final summary
- [ ] Track metadata columns updated correctly

## Cost Management Tips

- Cache analysis results (never re-analyze unchanged tracks)
- Use `gpt-4o-mini` for lightweight re-checks
- Use batch processing for throughput and queue control
- Enforce daily/monthly cost limits
- Monitor per-station token usage

## Next Steps

Proceed to **Phase 6: Playlist Generation** to use analysis features for intelligent sequencing and transitions.

---

**Estimated Time:** 6-8 hours  
**Estimated Cost:** $5-10 for ~100 track analyses  
**Last Updated:** February 14, 2026
