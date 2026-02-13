# Persona Ops for Hosts/Presenters

This document defines a practical operations model for managing AI host personas end-to-end in RoboDJ-style radio automation.

## 1) Persona Schema

Each persona is represented as a structured object with creative constraints and voice settings.

### Required fields
- `persona_id`: Stable identifier for the presenter persona.
- `display_name`: On-air presenter name.
- `tone`: One or more tone presets (e.g., `warm`, `energetic`, `conversational`).
- `pace`: Target words-per-minute range and pacing style.
- `vocabulary_limits`: Banned/allowed lexical controls and complexity limit.
- `taboo_topics`: Topics the persona should not discuss.
- `voice_model`: Primary TTS provider/model/voice ID.
- `fallback_voice`: Backup provider/model/voice ID.

### Example
```json
{
  "persona_id": "host_ava",
  "display_name": "Ava",
  "tone": ["warm", "upbeat"],
  "pace": {
    "style": "moderate",
    "target_wpm": { "min": 135, "max": 165 }
  },
  "vocabulary_limits": {
    "max_grade_level": 8,
    "banned_words": ["guys"],
    "preferred_phrases": ["good to have you here", "up next"]
  },
  "taboo_topics": ["political endorsements", "medical advice"],
  "voice_model": {
    "provider": "elevenlabs",
    "model": "eleven_multilingual_v2",
    "voice_id": "voice_ava_primary"
  },
  "fallback_voice": {
    "provider": "openai",
    "model": "gpt-4o-mini-tts",
    "voice_id": "alloy"
  }
}
```

## 2) Versioning + Rollback

Personas use lifecycle states:
- `draft`: Editable working copy.
- `approved`: Editorially approved candidate.
- `live`: Active production version.

### Version model
- `version_id` is immutable and semver-like (e.g., `1.3.0`).
- `parent_version_id` links lineage for traceability.
- Every transition writes an audit event with `actor`, `timestamp`, and `reason`.

### Rollback model
- Rollback means repointing `live_pointer` to a prior approved/live version.
- Rollback never mutates history; it appends a new `rollback` event.
- Optional `rollback_policy` can auto-rollback when KPI guardrails are violated.

## 3) A/B Testing by Daypart or Audience Segment

Experiment routing supports:
- **Daypart routing**: morning/afternoon/drive/evening/overnight.
- **Audience segment routing**: e.g., `new_listeners`, `loyal_weekday`, `gen_z_pop`.

### Routing rules
- Experiments are attached to persona versions, not mutable persona drafts.
- Split allocation can be weighted (e.g., `A=70%, B=30%`).
- A deterministic hash (`listener_id` + date) keeps listeners in the same variant for consistency.
- `start_date`, `end_date`, and minimum sample thresholds are required before declaring winners.

## 4) Quality Rubric Scoring

Each generated break/script gets rubric scores (1-5) with optional model + human review:
- `warmth`
- `clarity`
- `authenticity`
- `brand_fit`

### Composite score
```text
composite = 0.25*warmth + 0.25*clarity + 0.25*authenticity + 0.25*brand_fit
```

### Guardrails
- Hard fail if any dimension <= 2.
- Candidate persona versions require a rolling composite >= 4.0 during trial windows.

## 5) Listener Feedback Tracking

Feedback is captured against the active persona variant for each aired segment.

### Input channels
- Thumbs up/down in player UI.
- Optional sentiment extracted from comments/messages.
- Skip/retention proxy metrics (e.g., session drop within 60s of talk break).

### Data linkage
- Every feedback event links to:
  - `persona_id`
  - `persona_version_id`
  - `experiment_id` and `variant_id` (if applicable)
  - `daypart`
  - `audience_segment`

### Iteration loop
1. Aggregate rubric + listener feedback weekly.
2. Detect underperforming dimensions by daypart/segment.
3. Create new `draft` with targeted changes (tone, pace, lexicon, or voice).
4. Re-run approval and A/B testing.

## 6) Suggested Operational KPIs

- Rubric composite trend by version.
- Positive feedback rate by variant.
- Retention delta vs. control variant.
- Rollback frequency and mean time to recovery.

## 7) Implementation Artifact

A concrete configuration artifact is provided in `config/persona_ops.json` with:
- schema definition,
- versioned persona records,
- experiment routing,
- rubric history,
- listener feedback events.
