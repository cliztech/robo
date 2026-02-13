# Schedule Schema Specification

This document defines the canonical schedule format for `config/schedules.json` and the fail-fast validation behavior enforced by `config/validate_config.py`.

## Frontend response contract linkage

Scheduler UX responses should use `contracts/frontend_responses/frontend_schedule_response.schema.json`.
That contract aligns with timeline/clockwheel behavior in `docs/scheduler_clockwheel_spec.md`
and dual-time local+UTC presentation requirements in `ONLINE_RADIO_DJ_DESIGN.md`.

## Root Envelope

`schedules.json` must use an object root:

```json
{
  "schema_version": 2,
  "schedules": []
}
```

| Field | Type | Required | Rules |
|---|---|---:|---|
| `schema_version` | integer | Yes | Must be exactly `2`. |
| `schedules` | array | Yes | List of schedule records. |

## TODO Roadmap Gates

- [ ] Document canonical schedule entities:
  - show block
  - override
  - template
  - conflict type
- [ ] Finalize validation rules and edge cases:
  - overnight rollover handling
  - holiday override precedence and fallback behavior
- [ ] Add schema versioning guidance with a migration strategy for older schedule files.
- [ ] Mark schema freeze as a prerequisite milestone before timeline/conflict/template implementation begins.

## Schedule Object (v2)
---

## Schedule Record Shapes

Each schedule must include `id`, `name`, and `enabled`.

### 1) Standalone schedule (fully concrete)

A standalone schedule must include all runtime fields directly on the schedule:

- `timezone`
- `ui_state`
- `priority`
- `start_window`
- `end_window`
- `content_refs`
- `schedule_spec`

### 2) Template-compatible schedule

A template-compatible schedule references shared defaults and may override selected runtime fields.

```json
{
  "id": "sch_hourly_news",
  "name": "Hourly News",
  "enabled": true,
  "template_ref": {
    "id": "tpl_news_base",
    "version": 3
  },
  "overrides": {
    "timezone": "America/New_York",
    "schedule_spec": {
      "mode": "cron",
      "cron": "0 * * * *"
    }
  }
}
```

Template rules:

- `template_ref` requires:
  - `id` (non-empty string)
  - `version` (integer `>= 1`)
- `overrides` is optional, but if present must be an object.
- `overrides` keys are limited to:
  - `timezone`, `ui_state`, `priority`, `start_window`, `end_window`, `content_refs`, `schedule_spec`
- Ambiguity is rejected: a field may not appear both at top-level and inside `overrides`.
- `overrides` cannot exist without `template_ref`.

---

## Required Fields and Allowed Enums

| Field | Type | Required | Allowed values / constraints |
|---|---|---:|---|
| `id` | string | Yes | Non-empty, unique across file. |
| `name` | string | Yes | Non-empty, unique (case-insensitive) across file. |
| `enabled` | boolean | Yes | `true` or `false`. |
| `timezone` | string | Standalone: Yes / Template: Optional | Must be valid IANA timezone (`UTC`, `Europe/London`, etc.). |
| `ui_state` | string | Standalone: Yes / Template: Optional | `draft`, `active`, `paused`, `archived`. |
| `priority` | integer | Standalone: Yes / Template: Optional | `0..100` (higher = stronger precedence). |
| `start_window` | object | Standalone: Yes / Template: Optional | `{"type":"datetime","value":"<ISO-8601-with-offset-or-Z>"}` |
| `end_window` | object | Standalone: Yes / Template: Optional | Same format as `start_window`. |
| `content_refs` | array | Standalone: Yes / Template: Optional | Non-empty array of valid content refs. |
| `schedule_spec` | object | Standalone: Yes / Template: Optional | Exactly one schedule mode payload. |

### `schedule_spec` modes

| `mode` | Required payload | Forbidden payload keys |
|---|---|---|
| `one_off` | `run_at` (ISO-8601 datetime with timezone) | `rrule`, `cron` |
| `rrule` | `rrule` string containing `FREQ=` | `run_at`, `cron` |
| `cron` | `cron` five-field expression (`min hour dom mon dow`) | `run_at`, `rrule` |

### `content_refs` entries

Each entry must be an object with:

- `type`: one of `prompt`, `script`, `playlist`, `music_bed`
- `ref_id`: non-empty string
- optional `weight`: integer `1..100`

### `ui_interaction` (drag/drop editing contract)

This optional object defines behavior for schedule editors that support direct timeline manipulation.

| Field | Type | Required | Description |
|---|---|---:|---|
| `drag_enabled` | boolean | No | Enables pointer drag/drop for moving and resizing blocks. Default `true`. |
| `keyboard_enabled` | boolean | No | Enables keyboard-equivalent move/resize/inspect/fix actions. Default `true`. |
| `live_validation` | boolean | No | Runs conflict validation continuously during drag/resize, not only on save. Default `true`. |
| `conflict_classes` | array of string | No | Allowed values: `overlap`, `missing_legal_id_window`, `incompatible_show_preset`, `ad_quota_breach`. |
| `inline_fix_policy` | string | No | `manual_only`, `suggest_and_apply`, `auto_apply_safe_only`. Recommended `suggest_and_apply`. |
| `consequence_preview` | boolean | No | Show before/after impact preview before commit. Default `true`. |

#### UI conflict object shape

When `live_validation=true`, UI implementations SHOULD normalize each conflict to:

```json
{
  "class": "overlap",
  "severity": "error",
  "target_schedule_id": "sch_...",
  "target_block_id": "b03_ad",
  "message": "Ad break overlaps weather hit by 00:00:35.",
  "suggestions": [
    {
      "id": "shift_after_weather",
      "label": "Move ad break to 00:20:45",
      "action": "shift_start",
      "delta_sec": 45
    }
  ],
  "consequence_preview": {
    "hour_fill_delta_sec": -10,
    "legal_id_status": "ok",
    "ad_quota_delta_sec": 0
  }
}
```

Validation notes:

- `class` MUST be one of the four conflict classes.
- `severity` SHOULD be `error` for publish-blocking issues and `warning` for non-blocking degradations.
- `suggestions` SHOULD be sorted by lowest operational risk first.
- `consequence_preview` SHOULD be present when a suggested fix changes timing, legal compliance, or ad delivery.

---

## Conflict and Ambiguity Rules

Validation fails fast if any of these are detected:

1. Duplicate `id` values.
2. Duplicate `name` values (case-insensitive).
3. For standalone active schedules (`enabled=true`, `ui_state=active`):
   - same `timezone`
   - same `priority`
   - identical `schedule_spec`
   - overlapping `start_window`/`end_window`

   This combination is treated as **ambiguous conflict** and rejected.
4. `start_window.value > end_window.value`.
5. Template ambiguity (same field defined at top-level and in `overrides`).

---

## Representative Examples

### Valid: standalone one-off

```json
{
  "id": "sch_new_year_countdown",
  "name": "New Year Countdown",
  "enabled": true,
  "timezone": "UTC",
  "ui_state": "active",
  "priority": 90,
  "schedule_spec": {
    "mode": "one_off",
    "run_at": "2026-01-01T00:00:00Z"
  },
  "start_window": {
    "type": "datetime",
    "value": "2025-12-31T23:50:00Z"
  },
  "end_window": {
    "type": "datetime",
    "value": "2026-01-01T00:10:00Z"
  },
  "content_refs": [
    {
      "type": "script",
      "ref_id": "script:new_year_countdown",
      "weight": 100
    }
  ]
}
```

### Valid: template + override

```json
{
  "id": "sch_hourly_news",
  "name": "Hourly News",
  "enabled": true,
  "template_ref": {
    "id": "tpl_news_base",
    "version": 3
  },
  "overrides": {
    "timezone": "America/New_York",
    "ui_state": "active",
    "priority": 80,
    "schedule_spec": {
      "mode": "cron",
      "cron": "0 * * * *"
    }
  }
}
```

### Invalid: mode payload mismatch

```json
{
  "id": "sch_bad_mode",
  "name": "Bad Mode",
  "enabled": true,
  "timezone": "UTC",
  "ui_state": "active",
  "priority": 50,
  "schedule_spec": {
    "mode": "one_off",
    "run_at": "2026-01-01T00:00:00Z",
    "cron": "0 * * * *"
  },
  "start_window": {
    "type": "datetime",
    "value": "2026-01-01T00:00:00Z"
  },
  "end_window": {
    "type": "datetime",
    "value": "2026-02-01T00:00:00Z"
  },
  "content_refs": [
    {
      "type": "prompt",
      "ref_id": "prompt:headline"
    }
  ]
}
```

Reason: `mode=one_off` may not include `cron`.

### Invalid: template ambiguity

```json
{
  "id": "sch_ambiguous_override",
  "name": "Ambiguous Override",
  "enabled": true,
  "timezone": "UTC",
  "template_ref": {
    "id": "tpl_base",
    "version": 1
  },
  "overrides": {
    "timezone": "America/Chicago"
  }
}
```

Reason: `timezone` appears both top-level and in `overrides`.

### Invalid: active conflict pair (ambiguous dispatch)

```json
[
  {
    "id": "sch_a",
    "name": "Top Hour A",
    "enabled": true,
    "timezone": "UTC",
    "ui_state": "active",
    "priority": 75,
    "schedule_spec": { "mode": "cron", "cron": "0 * * * *" },
    "start_window": { "type": "datetime", "value": "2026-01-01T00:00:00Z" },
    "end_window": { "type": "datetime", "value": "2026-12-31T23:59:59Z" },
    "content_refs": [{ "type": "script", "ref_id": "script:a" }]
  },
  {
    "id": "sch_b",
    "name": "Top Hour B",
    "enabled": true,
    "timezone": "UTC",
    "ui_state": "active",
    "priority": 75,
    "schedule_spec": { "mode": "cron", "cron": "0 * * * *" },
    "start_window": { "type": "datetime", "value": "2026-06-01T00:00:00Z" },
    "end_window": { "type": "datetime", "value": "2026-10-01T00:00:00Z" },
    "content_refs": [{ "type": "script", "ref_id": "script:b" }]
  }
]
```

Reason: active schedules have identical trigger + priority in overlapping windows.
## Migration Behavior

The scheduler should migrate legacy records to schema version `2` before use.

### Legacy forms to accept

1. **Array root (v1 implicit)**
   - Old file format: `[]` or `[ { ...schedule... } ]`
2. **Object root without `schema_version`**
   - Example: `{ "schedules": [ ... ] }`
3. **Schedules without explicit `ui_state`**
   - Legacy records may only have `enabled`.

### Migration rules

1. If root is an array, wrap into:
   - `{ "schema_version": 2, "schedules": <old_array> }`
2. If root is object with missing `schema_version`, set `schema_version: 2`.
3. For each schedule missing `ui_state`:
   - `enabled=true` => `ui_state="active"`
   - `enabled=false` => `ui_state="paused"`
4. If `schedule_spec` is missing but legacy recurrence fields exist:
   - map legacy one-time datetime -> `schedule_spec: {"mode":"one_off","run_at":...}`
   - map legacy rrule string -> `schedule_spec: {"mode":"rrule","rrule":...}`
   - map legacy cron string -> `schedule_spec: {"mode":"cron","cron":...}`
5. If `priority` is missing, default to `50`.
6. If `start_window`/`end_window` are missing, populate conservative defaults:
   - `start_window = {"type":"datetime","value":"1970-01-01T00:00:00Z"}`
   - `end_window = {"type":"datetime","value":"9999-12-31T23:59:59Z"}`
7. Persist migrated output back to disk in v2 envelope format.

### Post-migration validation

After migration, reject invalid schedules where:

- required fields are missing
- `ui_state` is not one of `draft|active|paused|archived`
- `schedule_spec` mode and payload mismatch
- timezone is not IANA-compatible
- content reference list is empty

## Scheduling UX Success Metrics

Implementations that support drag/drop + live validation should track:

- **Reduced scheduling time**: median time to place and finalize a one-hour clock decreases by at least 20% from baseline.
- **Reduced publish-time conflicts**: number of conflicts first detected at publish decreases by at least 50% from baseline.
