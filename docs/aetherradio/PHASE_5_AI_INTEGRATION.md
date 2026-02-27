# Phase 5 — AI Integration & Track Intelligence (Day 11–13)

## Objectives

- Integrate AI services for track metadata enrichment and mood tagging
- Generate transition suggestions between tracks for smoother sequencing
- Store AI output with confidence scores and operator override controls

## Flow

1. Uploaded track metadata is queued for AI analysis.
2. AI service returns tags (energy, mood, era, genre confidence).
3. Results are normalized and persisted in the track intelligence tables.
4. Playlist planner consumes tags to improve selection quality.
5. Operators can accept, edit, or reject AI suggestions.

## Requirements

- Async job processing with retries and idempotency keys
- Rate-limit handling for model APIs
- Prompt versioning for reproducible behavior
- Manual fallback when AI service is unavailable

## Canonical API Route (Contract Guardrail)

- Canonical endpoint for track analysis: `POST /api/v1/ai/track-analysis`.
- Legacy compatibility alias: `POST /api/v1/ai/analyze-track` (deprecated; same envelope and correlation-id behavior, emits deprecation headers).
- Shared response envelope for AI routes (`track-analysis` + `host-script`):
  - `success`, `status`, `correlation_id`, `data`, `error`, `latency_ms`, `cost_usd`, `cache_hit`, `prompt_profile_version`.

## Validation

```bash
pnpm test tests/unit/ai-analysis-service.test.ts
pnpm test tests/integration/analysis-queue.spec.ts
```

## Exit Criteria

- AI analysis completes for newly uploaded tracks
- Failed AI calls are retried and surfaced with actionable errors
- Track tags are visible to the playlist engine and operator UI
