# Phase 5: AI Integration & Track Analysis

**Timeline:** Day 11–13  
**Goal:** Implement OpenAI-powered track analysis for automatic genre, mood, and energy detection.

## Prerequisites

- [ ] Phase 0–4 completed
- [ ] OpenAI API key obtained
- [ ] At least 5 test tracks uploaded
- [ ] Database `tracks` table populated

## Overview

This phase implements intelligent track analysis using OpenAI GPT-4o to automatically classify tracks by:

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

### 1.1 Install AI SDK

```bash
pnpm add ai @ai-sdk/openai zod
```

### 1.2 Configure Environment

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
AI_MAX_REQUESTS_PER_HOUR=100
AI_COST_LIMIT_USD=50.00
```

### 1.3 Create AI Configuration

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
}
```

## Step 2: Create AI Track Analyzer

Create `src/lib/ai/analyze-track.ts` with:

- Zod schema for track analysis output
- `analyzeTrack()` function that calls `generateObject()`
- confidence threshold validation
- token/cost accounting
- context builder for metadata/audio features

## Step 3: Create AI Decision Logging

Create `src/lib/ai/log-decision.ts` with:

- `AIDecisionLog` interface
- `logAIDecision()` insert function for `ai_decisions`
- `getAIDecisions()` query helper

## Step 4: Create Track Analysis API Route

Create `src/app/api/ai/analyze-track/route.ts` with:

- session authentication check
- `trackId` request validation
- ownership verification via joined `stations`
- existing-analysis short-circuit
- AI analysis execution
- `tracks` table update with AI fields
- AI decision logging

## Step 5: Create Batch Analysis System

Create `src/lib/ai/batch-analyzer.ts` with:

- station-level fetch of unanalyzed tracks
- configurable concurrency queue (e.g., `p-queue`)
- progress callback support
- per-track error handling callback
- aggregate usage/cost reporting

## Step 6: Create Analysis UI Component

Create `src/components/ai/TrackAnalyzer.tsx` with:

- station progress summary
- analyze button for pending tracks
- loading/progress states
- completion alert with success/failure counts
- displayed cost summary

## Verification Checklist

- [ ] OpenAI API key configured
- [ ] Track analysis returns valid results
- [ ] Confidence scores above threshold
- [ ] Cost tracking works
- [ ] Batch analysis processes multiple tracks
- [ ] AI decisions logged to database
- [ ] Analysis UI displays progress
- [ ] Track metadata updated correctly

## Cost Management Tips

- Cache analysis results (avoid re-analysis of unchanged tracks)
- Use GPT-4o-mini for quick validations/re-checks
- Batch process to reduce overhead
- Set daily limits to avoid runaway costs
- Monitor token usage by station

## Next Steps

Proceed to **Phase 6: Playlist Generation** to use AI analysis for intelligent playlist creation.

- **Estimated time:** 6–8 hours
- **Estimated cost:** $5–10 for 100 track analyses

---

**Last Updated:** February 14, 2026
