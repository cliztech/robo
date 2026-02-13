# Autonomy Policy Layer (Scheduler + Agent Orchestrator)

This module adds policy and schedule-editing APIs for AI autonomy and scheduling/orchestration decisions.

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

Persistence:
- JSON policy config in `config/autonomy_policy.json`
- JSONL audit events in `config/logs/autonomy_audit_events.jsonl`

## FastAPI Endpoints

### Autonomy policy

- `GET /api/v1/autonomy-policy` - read policy
- `PUT /api/v1/autonomy-policy` - update policy
- `GET /api/v1/autonomy-policy/effective?show_id=...&timeslot_id=...` - evaluate effective policy using override precedence
- `POST /api/v1/autonomy-policy/audit-events` - write event marking AI vs human-directed decision
- `GET /api/v1/autonomy-policy/audit-events?limit=100` - list recent audit events

### Scheduler UI module (Scheduling 2.0)

- `GET /api/v1/scheduler-ui/state` - return schedule envelope, derived week/day timeline blocks, and detected conflicts.
- `PUT /api/v1/scheduler-ui/state` - validate and persist schedules to `config/schedules.json`; rejects writes with unresolved conflicts.
- `POST /api/v1/scheduler-ui/validate` - detect inline conflicts (`overlap`, `invalid_window`) and suggestion actions prior to save.
- `POST /api/v1/scheduler-ui/templates/apply` - quick-apply `weekday`, `weekend`, or `overnight` templates.
- `POST /api/v1/scheduler-ui/preview` - return `schedule_spec` translation preview (`one_off`, `rrule`, `cron`).

## Usage

Run with Uvicorn from repository root:

```bash
uvicorn backend.app:app --reload
```

Then read/edit policy and scheduler state through the endpoints above.
