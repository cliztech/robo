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
| 2026-02-22 | 50% | Planned | Planned | Planned | None recorded | Sprint checklist published; execution started next cycle. |

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

## Monthly governance review

- Revalidate category weights against business goals.
- Reassess target thresholds for next milestone.
- Confirm roadmap variant selection (Security-first / UX-first / Scale-first / Balanced).

## Version history

| Date (UTC) | Version | Weighted Total | Summary |
| --- | --- | ---: | --- |
| 2026-02-15 | 2026.02 | 62% | Initial scorecard created from readiness baseline. |
| 2026-02-16 | 2026.02 | 62% | Added Track A ownership, weekly security score updates, and readiness inflation guard for unresolved critical security items. |
