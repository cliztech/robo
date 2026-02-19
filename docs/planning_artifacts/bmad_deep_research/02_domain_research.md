# 02 — Domain Research (BMAD)

## Status

**Pass**

## Domain model (operators + workflows)

- **Primary operator**: station/automation operator launching and supervising daily broadcast workflows.
- **Critical moments**:
  - Startup preflight (DB, key file, audio output checks).
  - Config validation before automation.
  - Crash/unclean restart and guided restore.
  - Manual backup snapshot before risky edits.

## Domain constraints

- Runtime ships as Windows desktop executable with launcher.
- SQLite DBs are read-only for agents.
- Configuration correctness is heavily centered on `schedules.json` and `prompt_variables.json`.
- Reliability and security constraints are expected but still lightweightly documented, creating risk of assumption drift.

## Assumptions

- Operators need clear remediation in-app, not log-driven troubleshooting.
- Hard-fail startup checks must block automation when integrity/readiness is compromised.
- Recovery actions should complete in minutes, not manual forensic workflows.

## Open questions

1. What specific failure classes must always hard-stop startup versus allow warning bypass?
2. What minimum backup retention policy is required for compliance and operational recovery?
3. Which telemetry events are mandatory to prove readiness improvements after v1.1 rollout?
