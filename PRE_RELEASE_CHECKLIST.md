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
