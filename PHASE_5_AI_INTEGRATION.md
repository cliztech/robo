# Phase 5: AI Integration & Track Analysis

**Timeline:** Day 11-13  
**Goal:** Implement OpenAI-powered track analysis for automatic genre, mood, and energy detection.

## Prerequisites

- [ ] Phase 0-4 completed
- [ ] OpenAI API key obtained
- [ ] At least 5 test tracks uploaded
- [ ] Database `tracks` table populated

## Overview

This phase adds intelligent track analysis using OpenAI models to classify tracks by:

- Genre & subgenre
- Mood & emotion
- Energy level (1-10)
- Danceability (1-10)
- BPM
- Key signature & scale
- Vocal style & language
- Optimal playback timing
- Similar artists

## Step 1: Setup OpenAI Integration

### 1.1 Install dependencies

```bash
pnpm add ai @ai-sdk/openai zod p-queue
```

### 1.2 Configure environment

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
AI_MAX_REQUESTS_PER_HOUR=100
AI_COST_LIMIT_USD=50.00
```

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
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
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
