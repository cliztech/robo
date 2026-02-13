# RoboDJ End-to-End Instrumentation Kit

This folder adds an operational telemetry layer around the compiled RoboDJ runtime.

## What this implements

1. **Playout decision logging** with full decision inputs and selected rule path.
2. **Metrics capture** for:
   - Dead-air incidents
   - Fallback rate
   - Script rejection rate
   - Average transition quality score
   - Repetition score per daypart
3. **Operator dashboard data views** for:
   - Live queue health
   - AI confidence trend
   - Persona activity
   - Ad delivery completion
4. **Searchable timeline** query for “what happened on-air at minute X”.
5. **SLO support** through uptime and decision-latency tracking in metrics data.

## Files

- `schema.sql`: Telemetry tables + materialized query views.
- `telemetry_store.py`: CLI to initialize schema, ingest events, and query dashboard/timeline metrics.
- `../SLOS.md`: Service-level objectives and alert thresholds.

## Quick start

```bash
cd config/scripts/instrumentation
python telemetry_store.py init-db
```

Log a playout decision:

```bash
python telemetry_store.py log-decision \
  --decision-ts "2026-02-12 14:33:00" \
  --slot-start-ts "2026-02-12 14:34:00" \
  --daypart "afternoon_drive" \
  --inputs-json '{"persona":"energetic","current_song":"Track A","next_song":"Track B"}' \
  --selected-rule-path "rules.music_rotation.afternoon_drive.rule_12" \
  --selected-item-id "track_1029" \
  --ai-confidence 0.86 \
  --decision-latency-ms 420
```

Log dead-air and script rejection examples:

```bash
python telemetry_store.py log-event \
  --event-ts "2026-02-12 14:35:10" \
  --event-type "dead_air" \
  --severity "critical" \
  --metadata-json '{"duration_seconds":4.1}'

python telemetry_store.py log-script-outcome \
  --outcome-ts "2026-02-12 14:35:30" \
  --script-id "script_283" \
  --prompt-type "back_announce" \
  --status "rejected" \
  --rejection-reason "policy_violation"
```

Query dashboard payload:

```bash
python telemetry_store.py dashboard
```

Search “minute X” timeline:

```bash
python telemetry_store.py timeline --minute-ts "2026-02-12 14:35:00" --window-minutes 1
```

Query daily metric rollups:

```bash
python telemetry_store.py metrics --day 2026-02-12
```
