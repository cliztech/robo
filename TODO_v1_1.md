# TODO v1.1 Companion Task Board (Must Items)

This task board breaks out the v1.1 **Must** scope from `FEATURE_HEAVY_ROADMAP_TODO.md` into independently shippable slices.

## v1.1 Must-only board

| Task | Owner role | Target date | Release flag (partial ship) | Definition of done (v1.1 exit-criteria linked) | Validation command / manual check path |
|---|---|---|---|---|---|
| Startup diagnostics panel (DB checks, key checks, audio device checks) | Runtime engineer | 2026-03-06 | `feature_startup_diagnostics` | Diagnostics panel runs during boot and reports pass/fail for DB connectivity, key presence/integrity, and audio device availability. On failure, operator gets actionable recovery guidance without app crash, supporting faster recovery from bad startup state toward the “recover in under 2 minutes” exit goal. | `python config/inspect_db.py` (DB readability) + launch via `./RoboDJ_Launcher.bat` and verify diagnostics statuses in startup UI/logs. |
| Config validator on launch for `schedules.json` and `prompt_variables.json` | Config owner | 2026-03-08 | `feature_launch_config_validation` | Launch path blocks runtime start when config schema or references are invalid, with clear error messages naming file and key path. Valid configs continue startup normally. This directly satisfies the v1.1 requirement to block invalid JSON/config references before runtime failures. | `python config/validate_config.py` (expected pass/fail cases) + manual startup check through `./RoboDJ_Launcher.bat` to confirm boot blocking on invalid input. |
| Crash-recovery flow with “restore last known good config” | Runtime engineer | 2026-03-12 | `feature_crash_recovery_restore_lkg` | After a forced bad config or crash scenario, operator can restore last known good config in one guided flow and return to ready state within 2 minutes. Restore action is logged and uses known backup path conventions. This maps directly to the v1.1 recovery-time exit criterion. | Manual path: simulate bad config in `config/schedules.json` or `config/prompt_variables.json` → run launcher → execute restore flow → verify app reaches ready state and logs restore event under `config/logs/`. |
| One-click config backup snapshot (timestamped) | Config owner | 2026-03-04 | `feature_one_click_backup_snapshot` | Operator can trigger a one-click backup that writes timestamped snapshot artifacts to `config/backups/` without overwriting prior snapshots. Backup is callable pre-change and from recovery context, enabling safe rollback support for the under-2-minute recovery objective. | Manual path: trigger backup action in app/launcher flow, then verify newly created timestamped files in `config/backups/` and confirm snapshot is selectable by restore flow. |

## Partial-release sequencing (behind flags)

1. Ship `feature_one_click_backup_snapshot` first as low-risk safety baseline.
2. Ship `feature_launch_config_validation` second to prevent bad-runtime starts.
3. Ship `feature_startup_diagnostics` for faster failure triage.
4. Ship `feature_crash_recovery_restore_lkg` after backup + diagnostics are stable.

Each item above is designed to be merged and released independently while preserving forward compatibility with the full v1.1 exit criteria.
