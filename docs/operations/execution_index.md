# Execution Index

**Purpose:** Single coordination index for active execution tracks.

This index lists active tracks, owners, and current status pointers. The status for each track is maintained in exactly one source-of-truth (SoT) location to avoid duplicate updates.

## Active tracks

| Track | Owner | Status | Source of truth |
| --- | --- | --- | --- |
| Startup diagnostics (`feature_startup_diagnostics`) | Runtime engineer | Complete | [`TODO_v1_1.md` → "1) Startup diagnostics panel"](../../TODO_v1_1.md#1-startup-diagnostics-panel-feature_startup_diagnostics) |
| Launch config validator (`feature_launch_config_validation`) | Config owner | Complete | [`TODO_v1_1.md` → "2) Launch config validator"](../../TODO_v1_1.md#2-launch-config-validator-feature_launch_config_validation) |
| Crash recovery restore (`feature_crash_recovery_restore_lkg`) | Runtime engineer | Complete | [`TODO_v1_1.md` → "3) Crash recovery: restore last known good config"](../../TODO_v1_1.md#3-crash-recovery-restore-last-known-good-config-feature_crash_recovery_restore_lkg) |
| One-click backup snapshot (`feature_one_click_backup_snapshot`) | Config owner | Complete | [`TODO_v1_1.md` → "4) One-click backup snapshot"](../../TODO_v1_1.md#4-one-click-backup-snapshot-feature_one_click_backup_snapshot) |
| Product readiness scorecard | Management Team (Project Coordinator) | Active weekly refresh | [`docs/readiness_scorecard.md` → "Scoring model"](../readiness_scorecard.md#scoring-model) |

## Planning runbooks

- [`BMAD Deep Research Runbook`](./bmad_deep_research_runbook.md) — Mandatory sequence and quality gates for Market Research → Domain Research → Technical Research → PRD → Architecture → Epics/Stories → Readiness Check.

## Weekly update protocol

Run this protocol once per week (or immediately after major scope/status shifts):

1. **Date (UTC):** Record update date (`YYYY-MM-DD`).
2. **Owner:** Name role/person making the update.
3. **Changed metrics:** List only metrics that changed since prior update (example: `weighted total 62% → 65%`, `2/4 checklist items complete`).
4. **Blockers:** Record current blockers with expected unblock date.
5. **Next step:** Add one concrete next action with owner.

Use this compact template when posting weekly updates in the SoT file for that track:

```md
- Date (UTC): 2026-02-22
- Owner: Runtime engineer
- Changed metrics: guided restore flow tasks complete 1/3 → 2/3
- Blockers: launcher UX copy review pending (ETA 2026-02-24)
- Next step: finalize restore confirmation UI and re-run manual recovery scenario
```

## Freshness rule (stale status)

- Any track status entry is considered **stale after 7 days** without an update in its SoT section.
- Stale tracks must be marked `⚠ stale` in planning discussions until refreshed.
- During weekly review, stale tracks are escalated to the listed owner for same-week refresh.

## Weekly updates log

- Date (UTC): 2026-02-24
- Owner: QA lead
- Changed metrics: recovery SLA pass rate `0% (0/1) -> 50% (1/2)` after timed recovery run `2026-02-24T01:34:19Z-02` (0.85s to ready state)
- Blockers: launcher `--on-launch` path can hit same-second snapshot-name collision during restore + post-pass snapshot creation; unblock target 2026-02-26
- Next step: harden snapshot naming to avoid collisions and rerun launcher-gate SLA drill for a second passing sample
