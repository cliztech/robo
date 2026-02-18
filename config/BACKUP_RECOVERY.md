# Backup & Recovery Conventions (v1.1 Reliability Baseline)

## Backup location convention
- All launch safety snapshots are stored under `config/backups/`.
- Snapshot folders use UTC timestamped names:
  - `config_snapshot_YYYYMMDD_HHMMSS`
- Each snapshot includes:
  - `schedules.json`
  - `prompt_variables.json`
  - `secret.key` (if present)
  - `secret_v2.key` (if present)
  - `manifest.json`

## One-click backup
From repository root:

```bash
python config/scripts/startup_safety.py --create-backup
```

This creates an immediate timestamped snapshot in `config/backups/`.

## Launch-time safety flow
The launcher now calls:

```bash
python config/scripts/startup_safety.py --on-launch
```

At launch it performs:
1. Startup diagnostics
   - DB readability checks (`config/settings.db`, `config/user_content.db`)
   - Key presence/integrity checks (`config/secret.key`, `config/secret_v2.key`)
   - Audio device availability check
2. Config validation using existing validator logic from `config/validate_config.py`
   - `config/schedules.json`
   - `config/prompt_variables.json`
3. Crash recovery path
   - If config validation fails, restore latest snapshot from `config/backups/`
   - Re-validate after restore
   - Block startup if still invalid

## Acceptance criteria (v1.1 exit alignment)
- Invalid config is blocked before runtime when launch validation fails.
- Operators can execute restore from latest snapshot in under 2 minutes using either:

```bash
python config/scripts/startup_safety.py --restore-last-known-good
python config/scripts/startup_safety.py --guided-restore
```
