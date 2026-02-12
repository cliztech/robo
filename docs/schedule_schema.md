# Schedule Schema Specification

This document defines the canonical `schedule` record format for RoboDJ scheduling data stored in `config/schedules.json`.

## Root Envelope

`schedules.json` MUST use an object root with a schema version marker:

```json
{
  "schema_version": 2,
  "schedules": []
}
```

### Root fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `schema_version` | integer | Yes | Current schema version for the file format. Use `2` for this specification. |
| `schedules` | array of `schedule` | Yes | List of schedule records. |

## Schedule Object (v2)

Each item in `schedules` MUST follow this schema.

### Required fields

| Field | Type | Allowed values / format | Description |
|---|---|---|---|
| `id` | string | Stable unique identifier (UUID preferred). | Primary identifier for updates and references. |
| `name` | string | 1..120 chars. | Human-readable schedule name shown in UI. |
| `enabled` | boolean | `true` / `false`. | Runtime switch for scheduler execution. |
| `timezone` | string | IANA tz database name (e.g., `UTC`, `America/New_York`). | Timezone used to evaluate all date/time rules. |
| `ui_state` | string | `draft`, `active`, `paused`, `archived`. | Frontend-facing lifecycle state for editing and visibility rules. |
| `priority` | integer | 0..100 (higher number = higher priority). | Conflict resolution and ordering weight. |
| `start_window` | object | See below. | Earliest run eligibility constraints. |
| `end_window` | object | See below. | Latest run eligibility constraints. |
| `content_refs` | array of object | At least 1 entry. | References to playable/generated content resources. |
| `schedule_spec` | object | Exactly one mode: `one_off`, `rrule`, or `cron`. | Recurrence definition for when the schedule should run. |

### `schedule_spec`

`schedule_spec.mode` defines how recurrence is interpreted:

- `one_off`: single point-in-time schedule.
- `rrule`: RFC 5545-like recurrence rule string.
- `cron`: five-field cron-like expression.

```json
{
  "mode": "rrule",
  "rrule": "FREQ=DAILY;INTERVAL=1;BYHOUR=9;BYMINUTE=0;BYSECOND=0"
}
```

Validation requirements:

- `mode=one_off` requires `run_at` (ISO-8601 datetime with timezone offset or `Z`).
- `mode=rrule` requires `rrule` string.
- `mode=cron` requires `cron` string (five-field format: minute hour day-of-month month day-of-week).
- Only the field matching the selected mode may be present.

### `start_window` and `end_window`

These fields define inclusive scheduling boundaries.

```json
"start_window": {
  "type": "datetime",
  "value": "2026-01-01T00:00:00Z"
},
"end_window": {
  "type": "datetime",
  "value": "2026-12-31T23:59:59Z"
}
```

Rules:

- `type` currently supports `datetime`.
- `value` must be ISO-8601 datetime.
- `start_window.value` must be <= `end_window.value` when both are finite bounds.
- Open-ended ranges can use `null` values only if explicitly supported by consuming code; default expectation is finite bounds.

### `content_refs`

Each referenced item must include source and identifier details.

| Field | Type | Required | Description |
|---|---|---:|---|
| `type` | string | Yes | Content category (e.g., `prompt`, `script`, `playlist`, `music_bed`). |
| `ref_id` | string | Yes | Stable internal identifier for resource lookup. |
| `label` | string | No | Display label for UI selection chips/dropdowns. |
| `weight` | integer | No | Relative selection weight in multi-content schedules. |

---

## Examples

### 1) One-off schedule

```json
{
  "id": "sch_4f8a1f88-5ca1-47e9-8bb1-3e0db3ac3c8c",
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
      "label": "New Year Countdown Script",
      "weight": 100
    }
  ]
}
```

### 2) Daily schedule (RRULE)

```json
{
  "id": "sch_2a22aab0-bbd7-4b54-9363-a818d2fb27aa",
  "name": "Morning Top-of-Hour Update",
  "enabled": true,
  "timezone": "America/New_York",
  "ui_state": "active",
  "priority": 70,
  "schedule_spec": {
    "mode": "rrule",
    "rrule": "FREQ=DAILY;INTERVAL=1;BYHOUR=9;BYMINUTE=0;BYSECOND=0"
  },
  "start_window": {
    "type": "datetime",
    "value": "2026-01-01T00:00:00-05:00"
  },
  "end_window": {
    "type": "datetime",
    "value": "2026-12-31T23:59:59-05:00"
  },
  "content_refs": [
    {
      "type": "prompt",
      "ref_id": "prompt:morning_update",
      "label": "Morning Update Prompt",
      "weight": 100
    }
  ]
}
```

### 3) Weekly schedule (cron-like)

```json
{
  "id": "sch_f6e37af8-f2cf-4b39-bf9f-4c12d56f9b9d",
  "name": "Friday Drive-Time Show",
  "enabled": true,
  "timezone": "Europe/London",
  "ui_state": "paused",
  "priority": 80,
  "schedule_spec": {
    "mode": "cron",
    "cron": "30 17 * * 5"
  },
  "start_window": {
    "type": "datetime",
    "value": "2026-01-01T00:00:00Z"
  },
  "end_window": {
    "type": "datetime",
    "value": "2026-12-31T23:59:59Z"
  },
  "content_refs": [
    {
      "type": "playlist",
      "ref_id": "playlist:friday_drive",
      "label": "Friday Drive",
      "weight": 100
    },
    {
      "type": "music_bed",
      "ref_id": "music_bed:drive_time_bed",
      "label": "Drive Time Bed",
      "weight": 40
    }
  ]
}
```

---

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

- required fields are missing,
- `ui_state` is not one of `draft|active|paused|archived`,
- `schedule_spec` mode and payload mismatch,
- timezone is not IANA-compatible,
- content reference list is empty.
