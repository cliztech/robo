# Scheduling Structured Events: Minimal Schema and Alert Map

This document defines a minimal structured-event contract for scheduler/instrumentation paths that need alerting coverage.

## Minimal Event Schema

Each event should be emitted as one JSON object.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `event_name` | string | yes | Stable identifier in `domain.action.outcome` format. |
| `event_version` | string | yes | Schema version, start with `v1`. |
| `occurred_at` | string | yes | UTC ISO-8601 timestamp. |
| `level` | string | yes | One of `debug`, `info`, `warning`, `error`, `critical`. |
| `component` | string | yes | Emitting module (for example `backend.scheduling`). |
| `correlation_id` | string | no | Request/run identifier for event stitching. |
| `message` | string | yes | Human-readable summary. |
| `metadata` | object | no | Path-specific key/value context. |

### Log Level Semantics

- `debug`: local troubleshooting, never alertable.
- `info`: expected lifecycle progress, optionally dashboarded.
- `warning`: recoverable anomaly; alert only on burst/threshold.
- `error`: failed operation requiring intervention; alertable.
- `critical`: service continuity or recovery path activated; page immediately.

## Alertable Critical-Path Event Map

| Critical path | Event name | Level | Alertable condition |
| --- | --- | --- | --- |
| Startup validation success | `scheduler.startup_validation.succeeded` | `info` | No immediate alert; monitor for absence over deploy window. |
| Startup validation failure | `scheduler.startup_validation.failed` | `error` | Alert on any occurrence. |
| Schedule load/parse error | `scheduler.schedule_parse.failed` | `error` | Alert on any occurrence, include schedule file and parser error in metadata. |
| Backup creation action | `scheduler.backup.created` | `info` | Optional alert when backup count drops below policy. |
| Backup restore action | `scheduler.backup.restored` | `warning` | Alert on unexpected restore outside maintenance window. |
| Crash-recovery activation | `scheduler.crash_recovery.activated` | `critical` | Immediate page on any occurrence. |

## Required Metadata by Event

- `scheduler.startup_validation.*`: `validation_target`, `validation_stage`, `duration_ms`.
- `scheduler.schedule_parse.failed`: `schedule_path`, `error_type`, `error_excerpt`.
- `scheduler.backup.created`: `backup_path`, `source_path`, `backup_size_bytes`.
- `scheduler.backup.restored`: `backup_path`, `restore_target`, `initiator`.
- `scheduler.crash_recovery.activated`: `trigger`, `recovery_plan`, `last_known_checkpoint`.
