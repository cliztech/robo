# Product Readiness Scorecard

**Version:** 2026.02
**Owner:** Management Team (Project Coordinator)
**Update cadence:** Weekly (metric refresh), monthly (weight/review recalibration)

## Purpose

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

## Monthly governance review

- Revalidate category weights against business goals.
- Reassess target thresholds for next milestone.
- Confirm roadmap variant selection (Security-first / UX-first / Scale-first / Balanced).

## Version history

| Date (UTC) | Version | Weighted Total | Summary |
| --- | --- | ---: | --- |
| 2026-02-16 | 2026.02 | 62% | Added dedicated recovery SLA pass-rate metric and linked evidence source. |
| 2026-02-15 | 2026.02 | 62% | Initial scorecard created from readiness baseline. |
