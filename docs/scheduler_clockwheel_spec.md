# Scheduler Clockwheel Specification (Proposed v2)

## Current State and Scope

The current scheduler configuration in `config/schedules.json` is an empty JSON array (`[]`), which implies no persisted clockwheel schema is currently enforced in configuration. This document proposes a **next schema version (`v2`)** that adds explicit hourly templates, block-level constraints, and recurrence rules while preserving room for runtime overrides.

## 1) Clockwheel Block Model

A clockwheel is represented as an ordered list of timed blocks inside a one-hour template (`00:00` to `59:59`). Each block has a `type`, scheduling constraints, and fill behavior.

### Shared block fields

- `id`: unique block identifier within a template.
- `type`: one of `music`, `link`, `sweeper`, `legal_id`, `ad_break`, `weather_news_hit`.
- `target_start`: `HH:MM:SS` from top-of-hour.
- `target_duration_sec`: nominal duration target.
- `min_duration_sec` / `max_duration_sec`: tolerance band.
- `hard`: boolean; if true, block is protected by hard constraints.
- `content_selector`: query object used to fetch candidate content.
- `fallback_selector`: optional query object for secondary pool.
- `can_skip`: whether scheduler may skip when unresolved.
- `latest_start_sec`: max tolerated late start (seconds after `target_start`).

### Block types

- **music**: plays songs from music library; supports tempo, era, category, separation, and recurrence constraints.
- **link**: DJ voice link or generated break; can be live, pre-produced, or AI-generated.
- **sweeper**: station branding stinger between songs/segments.
- **legal_id**: compliance-required station identification near top-of-hour.
- **ad_break**: commercial cluster with pod duration target and optional make-good fill.
- **weather_news_hit**: short information insert (weather, headlines, traffic).

## 2) Rule Priorities

Rules are evaluated in priority tiers.

### Tier 1: Hard constraints (must satisfy)

1. Legal/compliance timing windows (e.g., legal ID in allowed interval).
2. Hour boundary integrity (no overrun beyond configurable tolerance).
3. Content eligibility filters (licensing, explicit flags, category allowlist).
4. Required minimum separations (artist/title cutoffs marked hard).
5. Ad break contractual windows and minimum pod delivery.

### Tier 2: Soft preferences (optimize when possible)

1. Tempo/energy flow between adjacent music items.
2. Genre/daypart affinity scoring.
3. Recurrent spacing goals (avoid fatigue, not strict ban).
4. Preferred placement of sweepers and links for station texture.
5. Optional weather/news placement frequency.

If a soft rule conflicts with a hard rule, hard rule prevails.

## 3) Conflict Resolution Strategy

When no candidate satisfies all active rules, resolve in this sequence:

1. **Fallback pool query**
   - Use block `fallback_selector` with reduced scoring criteria.
2. **Soft relaxation ladder**
   - Relax only soft constraints in defined order (e.g., tempo delta, then recurrent cool-down).
3. **Timeout behavior**
   - If selection exceeds `selection_timeout_ms`, commit best currently valid candidate.
4. **Skip logic**
   - If unresolved and `can_skip=true`, skip block and compensate with nearest flexible `music` or `sweeper` fill.
   - If unresolved and `hard=true`, escalate to emergency content class (e.g., legal-safe sweeper/music bed).
5. **Duration recovery**
   - Apply micro-adjustments using short sweepers/fillers to re-align to next fixed-time block.

### Suggested defaults

- `selection_timeout_ms`: 1200 for music blocks, 600 for utility blocks.
- `max_soft_relaxations`: 3 per block.
- `max_consecutive_skips`: 1 per 15-minute window.

## 4) Daypart Templates

The scheduler should map local time to daypart templates, each with distinct weighting and block density.

- **Morning Drive** (`06:00-10:00`)
  - Higher frequency `weather_news_hit` and shorter links.
  - Tighter pacing and more frequent sweepers.
- **Workday** (`10:00-15:00`)
  - Balanced music-heavy clock with moderate information hits.
- **Evening** (`15:00-20:00`)
  - More personality links and tempo arcs through quarter hours.
- **Overnight** (`20:00-06:00`)
  - Music-dominant with reduced spoken content and optional longer sets.

## 5) Rotation Policies

### Artist/title separation

- Enforce minimum artist separation (e.g., 90 minutes default, daypart-adjustable).
- Enforce title repeat separation (e.g., 6 hours for power categories, longer for non-currents).

### Recurrent limits

- Set per-category daily spin caps.
- Distinguish recurrent vs current recurrence windows.
- Apply fatigue dampening score after each spin.

### Tempo flow

- Keep adjacent BPM delta within preferred threshold.
- Permit larger transitions at ad-break exits or top-of-hour resets.
- Apply daypart energy curves (higher mornings/evenings, smoother overnight).

---

## Proposed `schedules.json` Schema v2

```json
{
  "schema_version": 2,
  "timezone": "America/New_York",
  "dayparts": [
    {
      "id": "morning_drive",
      "start": "06:00",
      "end": "10:00",
      "template_id": "tmpl_morning_a"
    },
    {
      "id": "workday",
      "start": "10:00",
      "end": "15:00",
      "template_id": "tmpl_workday_a"
    },
    {
      "id": "evening",
      "start": "15:00",
      "end": "20:00",
      "template_id": "tmpl_evening_a"
    },
    {
      "id": "overnight",
      "start": "20:00",
      "end": "06:00",
      "template_id": "tmpl_overnight_a"
    }
  ],
  "hourly_templates": [
    {
      "template_id": "tmpl_morning_a",
      "name": "Morning Drive Core",
      "blocks": [
        {
          "id": "b00_legal",
          "type": "legal_id",
          "target_start": "00:00:00",
          "target_duration_sec": 10,
          "min_duration_sec": 8,
          "max_duration_sec": 15,
          "hard": true,
          "content_selector": { "source": "legal_ids", "priority": "primary" },
          "can_skip": false,
          "latest_start_sec": 20
        },
        {
          "id": "b01_music",
          "type": "music",
          "target_start": "00:00:12",
          "target_duration_sec": 210,
          "min_duration_sec": 150,
          "max_duration_sec": 300,
          "hard": false,
          "content_selector": {
            "categories": ["power", "current", "recurrent"],
            "tempo_band": [95, 132]
          },
          "fallback_selector": { "categories": ["recurrent", "gold"] },
          "can_skip": false,
          "latest_start_sec": 35
        },
        {
          "id": "b02_weather",
          "type": "weather_news_hit",
          "target_start": "00:15:00",
          "target_duration_sec": 45,
          "min_duration_sec": 30,
          "max_duration_sec": 90,
          "hard": true,
          "content_selector": { "feeds": ["weather", "headlines"] },
          "fallback_selector": { "source": "evergreen_info" },
          "can_skip": false,
          "latest_start_sec": 60
        },
        {
          "id": "b03_ad",
          "type": "ad_break",
          "target_start": "00:20:00",
          "target_duration_sec": 180,
          "min_duration_sec": 120,
          "max_duration_sec": 210,
          "hard": true,
          "content_selector": { "pod_id": "A", "placement": "fixed" },
          "can_skip": false,
          "latest_start_sec": 30
        }
      ]
    }
  ],
  "recurrence_rules": {
    "artist_separation_minutes": {
      "default": 90,
      "by_daypart": {
        "morning_drive": 110,
        "workday": 90,
        "evening": 75,
        "overnight": 60
      },
      "hard": true
    },
    "title_separation_minutes": {
      "current": 360,
      "recurrent": 480,
      "gold": 720,
      "hard": true
    },
    "max_spins_per_day": {
      "power": 8,
      "current": 6,
      "recurrent": 4,
      "gold": 3
    },
    "tempo_flow": {
      "preferred_bpm_delta": 18,
      "max_bpm_delta": 30,
      "reset_points": ["ad_break_exit", "top_of_hour"]
    }
  },
  "resolution_policy": {
    "selection_timeout_ms": {
      "music": 1200,
      "utility": 600
    },
    "soft_relaxation_order": [
      "tempo_flow",
      "category_affinity",
      "recurrent_spacing",
      "sweeper_preference"
    ],
    "max_soft_relaxations": 3,
    "max_consecutive_skips": 1
  }
}
```

## Migration notes from current file

- Current `config/schedules.json` can be interpreted as an unconfigured state.
- Migration to v2 can default to a single all-day template before introducing multiple dayparts.
- Runtime should reject unknown `type` values and unknown hard rule keys to preserve deterministic behavior.
