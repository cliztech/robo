# Autonomy Policy Layer (Scheduler + Agent Orchestrator)

This module adds a policy layer for AI autonomy in scheduling/orchestration decisions.

## Policy Model

Global modes:
- `manual`
- `assisted`
- `autonomous`

Decision permissions matrix covers:
- `track_selection`
- `script_generation`
- `voice_persona_selection`
- `caller_simulation_usage`
- `breaking_news_weather_interruption`

Overrides:
- `show_overrides` (per show)
- `timeslot_overrides` (per day/time slot, optional show-scoped)

Conflict resolution:
- `timeslot_override > show_override > station_default`

Validation diagnostics:
- Detects duplicate `timeslot_overrides[].id` values
- Detects overlapping day/time ranges within the same day + show scope
- Detects contradictory show-level vs show-scoped timeslot intent
- `PUT /api/v1/autonomy-policy` returns `422` with human-readable conflict details and suggested resolutions

Persistence:
- JSON policy config in `config/autonomy_policy.json`
- JSONL audit events in `config/logs/autonomy_audit_events.jsonl`

## FastAPI Endpoints

- `GET /api/v1/autonomy-policy` - read policy
- `PUT /api/v1/autonomy-policy` - update policy
- `GET /api/v1/autonomy-policy/effective?show_id=...&timeslot_id=...` - evaluate effective policy using override precedence
- `POST /api/v1/autonomy-policy/audit-events` - write event marking AI vs human-directed decision
- `GET /api/v1/autonomy-policy/audit-events?limit=100` - list recent audit events

## Usage

Run with Uvicorn from repository root:

```bash
uvicorn backend.app:app --reload
```

Then read/edit policy and record decision-origin audit events using the endpoints above.
