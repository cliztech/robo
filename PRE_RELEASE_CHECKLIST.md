# Pre-release Checklist

## 1) Configuration validation

- [ ] **PASS/FAIL:** Run configuration validation.
  - Command: `python config/validate_config.py`
  - Pass criteria: Output includes `Configuration validation passed for schedules.json and prompt_variables.json.`
  - Fail criteria: Any validation error, traceback, or missing-file error.

## 2) Backup freshness for changed config files

- [ ] **PASS/FAIL:** Create timestamped backups for every changed config file before release.
  - Command (Bash example):
    - `ts=$(date +%Y%m%d_%H%M%S)`
    - `mkdir -p config/backups/$ts`
    - `cp config/schedules.json config/prompt_variables.json config/backups/$ts/`
  - Paths to verify: `config/backups/<timestamp>/schedules.json`, `config/backups/<timestamp>/prompt_variables.json`
  - Pass criteria: A new timestamped directory exists under `config/backups/` and contains backups of all changed config files.
  - Fail criteria: No new timestamped backup, or one/more changed config files missing from the new backup set.

## 3) Secret hygiene before commit/release

- [ ] **PASS/FAIL:** Confirm no real secrets are being committed (only `*.example` files tracked where intended).
  - Command: `git diff --cached --name-only`
  - Command: `git diff --cached | rg -n -i '(api[_-]?key|secret|token|password|private[_-]?key)'`
  - Command: `git ls-files | rg -n -i '(secret|token|password|private_key|\.key$)'`
  - Pass criteria: No staged secret values found; tracked sensitive-looking files are limited to approved placeholders/examples.
  - Fail criteria: Any real credential material appears in staged diffs or tracked files.

## 4) Autonomy policy audit-log write-path readiness

- [ ] **PASS/FAIL:** Validate write-path readiness for autonomy policy API/audit logs.
  - Target path: `config/logs/autonomy_audit_events.jsonl`
  - Command: `python -c "from pathlib import Path; p=Path('config/logs/autonomy_audit_events.jsonl'); p.parent.mkdir(parents=True, exist_ok=True); p.touch(exist_ok=True); open(p,'a',encoding='utf-8').write('{\"event\":\"pre_release_write_check\"}\n'); print('OK:', p)"`
  - Pass criteria: Command prints `OK:` and appends one valid JSONL line without permission/path errors.
  - Fail criteria: Path missing and cannot be created, or write operation fails.

## 5) Rollback drill (last known good config snapshot)

- [ ] **PASS/FAIL:** Identify the latest backup snapshot and list its contents.
  - Command: `latest=$(ls -1dt config/backups/* 2>/dev/null | head -n1); echo "$latest"; ls -la "$latest"`
  - Pass criteria: A latest snapshot path is shown and expected config files are present.
  - Fail criteria: No backup snapshot found or expected files are missing.

- [ ] **PASS/FAIL:** Simulate rollback command (dry run review).
  - Command: `echo cp "$latest"/schedules.json config/schedules.json && echo cp "$latest"/prompt_variables.json config/prompt_variables.json`
  - Pass criteria: Restore commands resolve to real files and correct target paths.
  - Fail criteria: Commands reference missing files or incorrect target paths.

- [ ] **PASS/FAIL:** Execute rollback drill (only in staging/non-production).
  - Command: `cp "$latest"/schedules.json config/schedules.json && cp "$latest"/prompt_variables.json config/prompt_variables.json`
  - Command: `python config/validate_config.py`
  - Pass criteria: Restore completes and configuration validation passes after restore.
  - Fail criteria: Copy/restore fails or validation fails after rollback.
> **Release gate:** Do **not** proceed with release until every item below is completed and signed off.

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm command output includes: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Archive backup snapshots in `config/backups/` for any risky configuration changes, and attach/archive those snapshots as release artifacts.

## Checklist Audit Sign-off

- **Checklist owner:** ____________________
- **Sign-off (name + date/time):** ____________________
## Baseline gates (run every release)

- [ ] Run configuration validation: `python config/validate_config.py`
- [ ] Confirm validation output is: `Configuration validation passed for schedules.json and prompt_variables.json.`
- [ ] Run runtime secret preflight: `python config/check_runtime_secrets.py --require-env-only`
- [ ] Confirm secret preflight output is: `Secret integrity check passed (key material redacted).`
- [ ] Review and enforce [Codex Environment Contract](docs/operations/codex_environment_contract.md) (required vars, source priority, and redaction rules).
- [ ] If validation fails, confirm output starts with: `Configuration validation failed:` and lists actionable field-level errors.
- [ ] Archive config backups in `config/backups/` for any risky config changes.

---

## v1.1 pass/fail gates

> Source roadmap section: [v1.1 — Reliability & Safety Baseline](FEATURE_HEAVY_ROADMAP_TODO.md#v11--reliability--safety-baseline)

### Must-item verification lines (all required)

- [ ] **Startup diagnostics panel (DB checks, key checks, audio device checks)**
  - **Command:** `./RoboDJ_Launcher.bat`
  - **Manual check (reproducible):** Open the startup diagnostics panel and capture status for all three checks.
  - **Pass criteria:** `database=PASS`, `key_integrity=PASS`, and `audio_device=PASS` are all visible before startup completes.
  - **Fail criteria:** Any check is `WARN`/`FAIL` or diagnostics panel does not render.

- [ ] **Config validator on launch for `schedules.json` and `prompt_variables.json`**
  - **Command (happy path):** `python config/validate_config.py`
  - **Command (negative test):**
    1. `cp config/schedules.json config/backups/schedules.pre_validation_gate.json`
    2. `printf '{"broken": true' > config/schedules.json`
    3. `python config/validate_config.py`
    4. `mv config/backups/schedules.pre_validation_gate.json config/schedules.json`
  - **Pass criteria:** Happy-path command prints the expected success message; negative test returns a validation error and blocks startup/save flow.
  - **Fail criteria:** Invalid JSON is accepted or launch/save proceeds without a validation block.

- [ ] **Crash-recovery flow with “restore last known good config”**
  - **Command sequence:**
    1. `cp config/schedules.json config/backups/schedules.lkg.test.json`
    2. Introduce a bad edit in `config/schedules.json` (for example, remove a closing brace).
    3. `./RoboDJ_Launcher.bat`
    4. Trigger recovery action: **Restore last known good config**.
    5. `python config/validate_config.py`
  - **Pass criteria:** Recovery completes and validation returns success within **120 seconds** from launcher start.
  - **Fail criteria:** Recovery takes longer than 120 seconds or restored config still fails validation.

- [ ] **One-click config backup snapshot (timestamped)**
  - **Command sequence:**
    1. `./RoboDJ_Launcher.bat`
    2. Trigger **One-click backup snapshot**.
    3. `ls -1 config/backups | tail -n 5`
  - **Pass criteria:** A new backup artifact appears in `config/backups/` with a timestamp in the name (`YYYYMMDD` or `YYYY-MM-DD`) and includes both schedule and prompt-variable config content.
  - **Fail criteria:** No new backup is created, name is not timestamped, or backup is incomplete.

### Exit-criteria gates

- [ ] **Recovery-time SLO gate**
  - **Measurement:** elapsed wall-clock time for crash-recovery test above.
  - **Pass criteria:** `t_recover <= 120s`.
  - **Fail criteria:** `t_recover > 120s`.

- [ ] **Validation-block gate**
  - **Measurement:** negative-test run in config-validator gate above.
  - **Pass criteria:** invalid config is blocked before runtime.
  - **Fail criteria:** runtime proceeds with invalid config.

---

## v1.2 pass/fail gates

> Source roadmap section: [v1.2 — Scheduling 2.0](FEATURE_HEAVY_ROADMAP_TODO.md#v12--scheduling-20)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - New weekly schedule setup time reduced by ~50%.
  - Conflicts surfaced before save/publish.

## v1.3 pass/fail gates

> Source roadmap section: [v1.3 — Prompt Intelligence & Content Quality](FEATURE_HEAVY_ROADMAP_TODO.md#v13--prompt-intelligence--content-quality)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Per-template rollback works without DB edits.
  - 100% variable substitutions previewable before run.

## v1.4 pass/fail gates

> Source roadmap section: [v1.4 — Audio Production Pipeline](FEATURE_HEAVY_ROADMAP_TODO.md#v14--audio-production-pipeline)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Default output meets target loudness profile.
  - Producer can audition composed segments before publish.

## v1.5 pass/fail gates

> Source roadmap section: [v1.5 — Library, Search, and Scale](FEATURE_HEAVY_ROADMAP_TODO.md#v15--library-search-and-scale)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Typical search response stays sub-second.
  - Duplicate issues detected before publish.

## v1.6 pass/fail gates

> Source roadmap section: [v1.6 — Integrations & Operations](FEATURE_HEAVY_ROADMAP_TODO.md#v16--integrations--operations)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - External triggers execute key automation paths reliably.
  - Actionable alerts arrive within minutes of failure.

## v2.0 pass/fail gates

> Source roadmap section: [v2.0 — Enterprise Readiness & Governance](FEATURE_HEAVY_ROADMAP_TODO.md#v20--enterprise-readiness--governance)

- [ ] All **Must** items demonstrated in release demo and recorded in release notes.
- [ ] Exit criteria validated with reproducible operator runbook steps:
  - Access controls + attribution enforced end-to-end.
  - Full-day simulation catches schedule/content errors before air.
## Startup Preflight Failure Runbook

When launching via `RoboDJ_Launcher.bat`, startup now runs config validation before opening the app.

1. If preflight fails, startup is blocked and the launcher prints:
   - `Configuration validation failed:`
   - One or more ` - [target] ...` error lines with JSON paths and expected values/types.
   - `Fix the fields above, then rerun: python config/validate_config.py`
   - `[RoboDJ] ERROR: Startup blocked because configuration validation failed.`
2. Fix only the reported config fields (`config/schedules.json`, `config/prompt_variables.json`).
3. Re-run `python config/validate_config.py` until the expected success string appears exactly:
   - `Configuration validation passed for schedules.json and prompt_variables.json.`
4. Relaunch using `RoboDJ_Launcher.bat`.
- [ ] Verify backup/restore operations align with `config/BACKUP_RESTORE_CONTRACT.md` (scope, retention, confirmations, rollback).

## Startup preflight behavior (operator runbook)

- `RoboDJ_Launcher.bat` now runs `config/validate_config.py` before launching the app.
- Startup continues only when validation prints:
  `Configuration validation passed for schedules.json and prompt_variables.json.`
- If validation fails, startup is blocked and the launcher keeps the actionable validator output visible.
- Operator actions on failure:
  1. Read each listed `[target]` error and fix the referenced field(s) in the matching config JSON.
  2. Re-run `python config/validate_config.py` until it prints the expected success string exactly.
  3. Re-launch `RoboDJ_Launcher.bat`.
- If startup is blocked because Python is missing, install Python 3 (or expose `py`/`python` on `PATH`) and rerun the launcher.
## Required Before Release Candidate

> Accountable signer for every gate item: **Release Manager**

- [ ] Config schema validation pass — Sign-off: Release Manager
- [ ] Backup/restore drill pass — Sign-off: Release Manager
- [ ] Crash recovery simulation pass — Sign-off: Release Manager
- [ ] Rollback path verified — Sign-off: Release Manager
- [ ] Execute the accessibility QA matrix in `REACT_BROWSER_UI_TEAM_BLUEPRINT.md` for shell, overlays, and scheduler interactions.
- [ ] Verify keyboard-only flow for all release-critical user paths (no pointer required).
- [ ] Verify visible, logical focus order and focus restoration behavior for overlays/modals.
- [ ] Verify screen-reader naming/instructions for controls, dialogs, timeline events, and state changes.
- [ ] Verify WCAG AA color contrast in all supported themes and interactive states.
- [ ] Verify reduced-motion behavior for all key transitions and timeline interactions.
- [ ] Verify zoom/reflow behavior at 200%+ with no blocked or clipped critical actions.
- [ ] Enforce **No Ship** when custom interactive widgets (drag/drop, tab strip, timeline blocks) lack keyboard and ARIA equivalents.
- [ ] Block release on any P0 accessibility failure; track and resolve any P1 accessibility failures before final approval.
