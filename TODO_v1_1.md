# TODO v1.1 Companion Task Board (Must Items)

This board converts the v1.1 **Must** scope into an execution-ready TODO checklist with concrete completion criteria and validation steps.

See [docs/operations/execution_index.md](docs/operations/execution_index.md) for cross-track ownership/status routing and weekly freshness protocol.

> Implementation note (current): `config/scripts/startup_safety.py` is now wired into `RoboDJ_Launcher.bat` as the launch gate for diagnostics, config validation, auto-restore attempt, and snapshot creation.

## Active TODO checklist

## Parallel workstreams (current build)

- **Lane A — startup diagnostics + operator hints**
  - Parallelized DB/key/audio checks to reduce boot-time wait.
  - Added failure hints and structured diagnostics log output.
- **Lane B — launch config validation gate**
  - Continue validating `schedules.json` and `prompt_variables.json` at launch.
  - Keep runtime blocked on invalid config and print actionable errors.
- **Lane C — crash recovery and LKG restore**
  - Keep automated restore flow from latest snapshot.
  - Added restore event logging under `config/logs/`.
- **Lane D — one-click backup snapshots**
  - Keep timestamped snapshots in `config/backups/` for restore readiness.

### 1) Startup diagnostics panel (`feature_startup_diagnostics`)

- [x] Add boot-time diagnostics runner for:
  - [x] SQLite connectivity checks (`settings.db`, `user_content.db`)
  - [x] Key presence/integrity checks (`secret.key`, `secret_v2.key`)
  - [x] Audio device availability checks
- [x] Render pass/fail state in startup UI and/or startup logs.
- [x] Provide operator-facing recovery hints for each failed diagnostic.
- [x] Ensure startup does not hard-crash on diagnostic failure.

**Owner:** Runtime engineer  
**Target date:** 2026-03-06  
**Definition of done:** Diagnostics execute during boot, report actionable status, and support recovery toward the “recover in under 2 minutes” goal.

**Validation path**

- `python config/inspect_db.py`
- Launch with `./RoboDJ_Launcher.bat` and verify startup diagnostics status output.

---

### 2) Launch config validator (`feature_launch_config_validation`)

- [x] Validate `config/schedules.json` against schema and required references on launch.
- [x] Validate `config/prompt_variables.json` against schema and required references on launch.
- [x] Block runtime start when validation fails.
- [x] Print clear errors including file name and failing key path.
- [x] Allow normal startup when configs are valid.

**Owner:** Config owner  
**Target date:** 2026-03-08  
**Definition of done:** Runtime launch is gated by config validity with actionable failures.

**Validation path**

- `python config/validate_config.py`
- Launch with `./RoboDJ_Launcher.bat` and confirm bad configs block startup.

---

### 3) Crash recovery: restore last known good config (`feature_crash_recovery_restore_lkg`)

- [x] Add guided restore flow in launcher/runtime startup path.
- [x] Restore last known good `schedules.json` and `prompt_variables.json` from backup.
- [x] Log restore event under `config/logs/` with timestamp and source snapshot.
- [ ] Verify post-restore readiness state can be reached in under 2 minutes. _(instrumented with recovery duration logging; manual timing validation pending)_
- [ ] **Subtask 3.2 — Recovery SLA run documented and passed**
  - **Owner:** QA lead
  - **Due date:** 2026-03-12
  - **Pass criteria (measurable):** At least one deterministic manual run in `config/BACKUP_RECOVERY.md` records launch-gate start/ready-state stop timestamps with elapsed time `<= 120s`, plus matching restore success evidence in `config/logs/startup_safety_events.jsonl`.

**Owner:** Runtime engineer  
**Target date:** 2026-03-12  
**Definition of done:** Operator can complete guided restore and return to ready state inside the v1.1 recovery SLA.

**Validation path**

- Follow `docs/recovery_manual_test_protocol.md`.
- Record run evidence in `config/BACKUP_RECOVERY.md`.
- Manual scenario:
  1. Corrupt `config/schedules.json` or `config/prompt_variables.json`.
  2. Run `./RoboDJ_Launcher.bat`.
  3. Execute restore flow (`python config/scripts/startup_safety.py --guided-restore`).
  4. Verify app reaches ready state and restore is logged.

---

### 4) One-click backup snapshot (`feature_one_click_backup_snapshot`)

- [x] Add one-click snapshot action in app/launcher flow.
- [x] Write timestamped backup artifacts into `config/backups/`.
- [x] Prevent overwrite of prior snapshots.
- [x] Ensure snapshots are immediately available to restore flow.

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

- [x] Invalid config is blocked before runtime start.
- [x] Startup issues are visible with clear remediation.
- [x] Last known good restore is guided and logged.
- [ ] End-to-end recovery path consistently completes in under 2 minutes.
