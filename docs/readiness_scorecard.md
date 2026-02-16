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
| 2026-02-15 | 2026.02 | 62% | Initial scorecard created from readiness baseline. |
