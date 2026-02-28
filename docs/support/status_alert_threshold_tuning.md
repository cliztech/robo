# Status Dashboard Threshold Tuning and Alert Latency

## Telemetry Inputs

`/api/v1/status/dashboard` now evaluates alerts from live telemetry at `config/logs/status_telemetry.json`.
Expected payload shape:

```json
{
  "observed_at": "2026-02-27T18:55:00+00:00",
  "queue_depth": {
    "current_depth": 42,
    "observed_at": "2026-02-27T18:55:00+00:00"
  },
  "rotation": {
    "last_successful_rotation_at": "2026-02-27T18:18:00+00:00"
  },
  "service_health": {
    "status": "healthy",
    "reason": "all services nominal",
    "observed_at": "2026-02-27T18:55:00+00:00"
  }
}
```

If the file is missing, the API falls back to safe defaults (queue depth `0`, rotation recency `5m`, health `healthy`).

## Threshold Configuration

Thresholds are evaluated deterministically by `StatusThresholds`:

- `queue_warning` (default `30`)
- `queue_critical` (default `50`)
- `rotation_stale_after_minutes` (default `30`)

Tuning guidance:

1. Set `queue_warning` near the upper bound of normal burst traffic.
2. Set `queue_critical` high enough to avoid flapping, low enough to preserve operator reaction time.
3. Set `rotation_stale_after_minutes` to at least 2x the expected rotation publish cadence.

## Alert Lifecycle and Latency

Lifecycle is persisted in `config/logs/status_alerts.db`:

- Alert appears when evaluator returns active condition.
- Existing alert severity/title/description update in-place for transitions (for example warning → critical).
- Alert resolves automatically when condition clears (`resolved_at` stamped).
- Acknowledgement only applies to unresolved alerts.

Latency model:

- Detection latency is bounded by telemetry freshness + API poll interval.
- With a 10-second telemetry emitter and 10-second UI polling, worst-case operator-visible latency is ~20 seconds.
- Keep telemetry emit interval below one-third of your target operator reaction SLA.
