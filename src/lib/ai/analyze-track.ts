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
      model: openai(AI_CONFIG.models.analysis) as any,
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
