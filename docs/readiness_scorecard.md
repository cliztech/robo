# Product Readiness Scorecard

**Version:** 2026.02
**Owner:** Management Team (Project Coordinator)
**Update cadence:** Weekly (metric refresh), monthly (weight/review recalibration)

## Purpose

See [docs/operations/execution_index.md](operations/execution_index.md) for active track ownership, source-of-truth status mapping, and stale-status rules.

This scorecard provides a versioned, repeatable way to track progress from roadmap execution to release readiness.

## Scoring model

| Category | Weight | Target | Current | Delta to Target |
| --- | ---: | ---: | ---: | ---: |
| Core functionality | 25% | 85% | 78% | -7% |
| Security & compliance | 20% | 80% | 50% | -30% |
| UX & operator workflows | 20% | 82% | 54% | -28% |
| Reliability & observability | 15% | 80% | 60% | -20% |
| DevEx & release process | 10% | 80% | 66% | -14% |
| Commercial readiness | 10% | 75% | 48% | -27% |
| **Weighted total** | **100%** | **80%+** | **62%** | **-18%** |

> Baseline values are sourced from `PRODUCT_READINESS_PLAN.md` and should be updated after each reporting cycle.

## Reliability drill-down metrics

| Metric | Target | Current | Evidence source | Owner |
| --- | ---: | ---: | --- | --- |
| Startup diagnostics pass rate | 100% | 100% | `config/scripts/startup_safety.py --on-launch` output archive | Runtime engineer |
| Config validation block rate (invalid configs) | 100% | 100% | `config/validate_config.py` + launch gate logs | Config owner |
| **Recovery SLA pass rate (`<=120s` launch gate to ready)** | **100% of documented runs** | **0% (0/1)** | `config/BACKUP_RECOVERY.md` evidence table + `config/logs/startup_safety_events.jsonl` | QA lead |

## Weekly update workflow

1. Refresh category metrics from current artifacts (tests, runbooks, contracts, release checks).
2. Recompute weighted total.
3. Add one log entry in the history table below.
4. Mark blocked tracks with explicit owner and unblock date.

## UX instrumentation baselines and targets (Track B)

| Metric | Baseline (2026.02) | MVP target (B1.1/B1.2) | Collection source | Owner |
| --- | ---: | ---: | --- | --- |
| Workflow completion time (median) | 14m 30s | <= 10m 00s | `ux_workflow_started` + `ux_workflow_completed` | Backend Observability (aggregation), Frontend Telemetry (events) |
| Workflow completion time (p95) | 31m 00s | <= 20m 00s | `ux_workflow_started` + `ux_workflow_completed` | Backend Observability (aggregation), Frontend Telemetry (events) |
| Intervention rate | 28% | 15–22% (healthy checkpoint usage band) | `ux_checkpoint_presented` + `ux_checkpoint_decision` | Backend Workflow Analytics |
| Rollback rate | 12% | <= 7% | `ux_rollback_initiated` + `ux_rollback_completed`/`ux_rollback_failed` | Backend Reliability Analytics |

Notes:
- Baselines are initial planning assumptions and become measured values once Track B telemetry is live.
- Targets are considered passing when maintained for 2 consecutive weekly reporting windows.
- Event schema and collection-point ownership are defined in `PRODUCT_READINESS_PLAN.md` (Track B4).

## Monthly governance review

- Revalidate category weights against business goals.
- Reassess target thresholds for next milestone.
- Confirm roadmap variant selection (Security-first / UX-first / Scale-first / Balanced).

## Version history

| Date (UTC) | Version | Weighted Total | Summary |
| --- | --- | ---: | --- |
| 2026-02-16 | 2026.02 | 62% | Added dedicated recovery SLA pass-rate metric and linked evidence source. |
| 2026-02-15 | 2026.02 | 62% | Initial scorecard created from readiness baseline. |
