# Autonomy Policy Layer (Scheduler + Agent Orchestrator)

This module adds a policy layer for AI autonomy in scheduling/orchestration decisions.

## Policy Model

Global modes:
- `manual_assist`
- `semi_auto`
- `auto_with_human_override`
- `full_auto_guardrailed`
- `lights_out_overnight`

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

Persistence:
- JSON policy config in `config/autonomy_policy.json`
- JSONL audit events in `config/logs/autonomy_audit_events.jsonl`

## FastAPI Endpoints

- `GET /api/v1/autonomy-policy` - read policy
- `PUT /api/v1/autonomy-policy` - update policy
- `GET /api/v1/autonomy-policy/effective?show_id=...&timeslot_id=...` - evaluate effective policy using override precedence
- `GET /api/v1/autonomy-policy/mode-definitions` - mode labels/summaries/tooltips sourced from `docs/autonomy_modes.md`
- `GET /api/v1/autonomy-policy/control-center` - autonomy control center UI
- `POST /api/v1/autonomy-policy/audit-events` - write event marking AI vs human-directed decision
- `GET /api/v1/autonomy-policy/audit-events?limit=100` - list recent audit events

## Usage

Run with Uvicorn from repository root:

```bash
uvicorn backend.app:app --reload
```

Then use the Autonomy Control Center at:

```text
http://127.0.0.1:8000/api/v1/autonomy-policy/control-center
```
