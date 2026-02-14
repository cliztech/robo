# TODO v1.1 Companion Task Board (Must Items)

This board converts the v1.1 **Must** scope into an execution-ready TODO checklist with concrete completion criteria and validation steps.

## Active TODO checklist

### 1) Startup diagnostics panel (`feature_startup_diagnostics`)

- [ ] Add boot-time diagnostics runner for:
  - [ ] SQLite connectivity checks (`settings.db`, `user_content.db`)
  - [ ] Key presence/integrity checks (`secret.key`, `secret_v2.key`)
  - [ ] Audio device availability checks
- [ ] Render pass/fail state in startup UI and/or startup logs.
- [ ] Provide operator-facing recovery hints for each failed diagnostic.
- [ ] Ensure startup does not hard-crash on diagnostic failure.

**Owner:** Runtime engineer  
**Target date:** 2026-03-06  
**Definition of done:** Diagnostics execute during boot, report actionable status, and support recovery toward the “recover in under 2 minutes” goal.

**Validation path**

- `python config/inspect_db.py`
- Launch with `./RoboDJ_Launcher.bat` and verify startup diagnostics status output.

---

### 2) Launch config validator (`feature_launch_config_validation`)

- [ ] Validate `config/schedules.json` against schema and required references on launch.
- [ ] Validate `config/prompt_variables.json` against schema and required references on launch.
- [ ] Block runtime start when validation fails.
- [ ] Print clear errors including file name and failing key path.
- [ ] Allow normal startup when configs are valid.

**Owner:** Config owner  
**Target date:** 2026-03-08  
**Definition of done:** Runtime launch is gated by config validity with actionable failures.

**Validation path**

- `python config/validate_config.py`
- Launch with `./RoboDJ_Launcher.bat` and confirm bad configs block startup.

---

### 3) Crash recovery: restore last known good config (`feature_crash_recovery_restore_lkg`)

- [ ] Add guided restore flow in launcher/runtime startup path.
- [ ] Restore last known good `schedules.json` and `prompt_variables.json` from backup.
- [ ] Log restore event under `config/logs/` with timestamp and source snapshot.
- [ ] Verify post-restore readiness state can be reached in under 2 minutes.

**Owner:** Runtime engineer  
**Target date:** 2026-03-12  
**Definition of done:** Operator can complete guided restore and return to ready state inside the v1.1 recovery SLA.

**Validation path**

- Manual scenario:
  1. Corrupt `config/schedules.json` or `config/prompt_variables.json`.
  2. Run `./RoboDJ_Launcher.bat`.
  3. Execute restore flow.
  4. Verify app reaches ready state and restore is logged.

---

### 4) One-click backup snapshot (`feature_one_click_backup_snapshot`)

- [ ] Add one-click snapshot action in app/launcher flow.
- [ ] Write timestamped backup artifacts into `config/backups/`.
- [ ] Prevent overwrite of prior snapshots.
- [ ] Ensure snapshots are immediately available to restore flow.

**Owner:** Config owner  
**Target date:** 2026-03-04  
**Definition of done:** Operator can create deterministic timestamped backup snapshots for rollback safety.

**Validation path**

- Trigger backup action.
- Confirm new timestamped files in `config/backups/`.
- Confirm snapshot appears in restore flow selection.

## Release order (partial ships behind flags)

1. `feature_one_click_backup_snapshot`
2. `feature_launch_config_validation`
3. `feature_startup_diagnostics`
4. `feature_crash_recovery_restore_lkg`

## Exit criteria tracking (v1.1 Must)

- [ ] Invalid config is blocked before runtime start.
- [ ] Startup issues are visible with clear remediation.
- [ ] Last known good restore is guided and logged.
- [ ] End-to-end recovery path consistently completes in under 2 minutes.
