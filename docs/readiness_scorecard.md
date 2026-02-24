# Product Readiness Scorecard

**Version:** 2026.02
**Owner:** Management Team (Project Coordinator)
**Update cadence:** Weekly (metric refresh), monthly (weight/review recalibration)
**Last refreshed (UTC):** 2026-02-24

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


## Weekly updates (SoT for Product readiness scorecard)

- ⚠ stale
  - Date (UTC): 2026-02-16
  - Owner: Management Team (Project Coordinator)
  - Changed metrics: weighted total unchanged at 62%; Track A governance controls added
  - Blockers: no active blocker log captured for critical P0 security items
  - Next step: refresh blocker ownership and immediate next action in current weekly cycle
- Date (UTC): 2026-02-24
  - Owner: Management Team (Project Coordinator)
  - Changed metrics: weighted total remains 62%; stale weekly logs refreshed with explicit blocker ETAs
  - Blockers: A1.1 implementation evidence pending (ETA 2026-02-26); A2.3 denylist enforcement proof pending (ETA 2026-02-27); A3.2 pre-release security gate evidence pending (ETA 2026-02-28)
  - Next step: publish updated Track A execution evidence and re-evaluate Security & compliance score in next weekly refresh

## Weekly update workflow

1. Refresh category metrics from current artifacts (tests, runbooks, contracts, release checks).
2. Recompute weighted total.
3. Add one log entry in the history table below.
4. Mark blocked tracks with explicit owner and unblock date.
5. Apply the **critical unresolved security items** rule before publishing a score increase.

## Track A ownership + due dates (sprint scope)

Source sprint board: `docs/track_a_security_sprint_checklist.md`.

| Task | Owner | Due date (UTC) | Weekly status owner |
| --- | --- | --- | --- |
| A1.1 | Design Team (UI/UX Agent) + DevOps Team (CI/CD Pipeline Agent) | 2026-02-24 | Management Team (Project Coordinator Agent) |
| A2.3 | SecOps Team (Compliance Agent) | 2026-02-26 | Management Team (Project Coordinator Agent) |
| A3.2 | Release Manager Agent | 2026-02-27 | Management Team (Project Coordinator Agent) |
| A1.2 | Design Team (Accessibility Auditor Agent) | 2026-03-05 | Management Team (Project Coordinator Agent) |
| A2.1 | SecOps Team (Secrets Auditor Agent) | 2026-03-06 | Management Team (Project Coordinator Agent) |
| A3.1 | QA Team (Test Generator Agent) | 2026-03-07 | Management Team (Project Coordinator Agent) |
| A2.2 | DevOps Team (Infrastructure Agent) + SecOps Team (Compliance Agent) | 2026-03-12 | Management Team (Project Coordinator Agent) |
| A1.3 | Management Team (Project Coordinator Agent) + SecOps Team (Compliance Agent) | 2026-03-14 | Management Team (Project Coordinator Agent) |

## Weekly Track A score updates

| Week ending (UTC) | Security score | A1.1 | A2.3 | A3.2 | Blockers | Notes |
| --- | ---: | --- | --- | --- | --- | --- |
| 2026-02-15 | 50% | Not started | Not started | Not started | None recorded | Baseline imported from readiness plan. |
| 2026-02-22 | 50% | Planned | Planned | Planned | ⚠ stale (older than 7 days) | Sprint checklist published; execution started next cycle. |
| 2026-02-24 | 50% | Planned | Planned | Planned | A1.1 evidence pending (ETA 2026-02-26); A2.3 denylist verification pending (ETA 2026-02-27); A3.2 security gate evidence pending (ETA 2026-02-28) | Weekly refresh aligned to execution index template; next actions assigned to owners. |

## Critical unresolved security items (readiness inflation guard)

If any **P0 security item** (A1.1, A2.3, A3.2) is unresolved, readiness reporting must not inflate scores.

- **Rule 1:** Security & compliance score is capped at **59%** while any P0 item is `Not started`, `In progress`, `Blocked`, or `Failed`.
- **Rule 2:** Weighted total cannot increase week-over-week if a P0 security item is blocked without an approved mitigation and new due date.
- **Rule 3:** Any failed pre-release security gate in `PRE_RELEASE_CHECKLIST.md` sets release readiness state to **Not Ready** regardless of weighted total.

### Active critical unresolved items

| Item | Severity | Owner | Target unblock date (UTC) | Current state | Mitigation evidence |
| --- | --- | --- | --- | --- | --- |
| A1.1 role-aware settings visibility | Critical (P0) | Design Team + DevOps Team | 2026-02-24 | Planned | Pending implementation evidence in frontend response contracts. |
| A2.3 redaction denylist enforcement | Critical (P0) | SecOps Team | 2026-02-26 | Planned | Pending denylist contract check evidence and release gate verification. |
| A3.2 pre-release security gate | Critical (P0) | Release Manager Agent | 2026-02-27 | Planned | Pending explicit security gate pass/fail and sign-off section. |

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
| 2026-02-16 | 2026.02 | 62% | Added Track A ownership, weekly security score updates, and readiness inflation guard for unresolved critical security items. |
