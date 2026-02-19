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

## Deterministic manual recovery protocol

Follow `docs/recovery_manual_test_protocol.md` for the canonical corruption seed, restore trigger, timing boundaries, and evidence requirements.

## Operator runbook: last-known-good restore (LKG)

### Expected completion times

- Detect + trigger restore from launch gate: **15-30 seconds**
- Restore + post-restore validation: **30-60 seconds**
- Reach ready state after gate pass: **30 seconds**
- **Total expected completion:** **<= 120 seconds** (SLA)

### Steps

1. **Prepare known-good backup**

```bash
python config/scripts/startup_safety.py --create-backup
```

2. **Seed deterministic corruption** (for test runs only)
   - In `config/schedules.json`, replace the first `{` with `[`.

3. **Trigger launch recovery gate**

```bash
python config/scripts/startup_safety.py --on-launch
```

4. **Confirm restore outcome**
   - Terminal must print:
     - `Attempting crash recovery using last-known-good snapshot...`
     - `Recovery succeeded: restored config validates.`
     - `Startup safety gate passed.`

5. **Collect log evidence**

# On Linux/macOS, use 'tail'. On Windows, use PowerShell's 'Get-Content -Tail'.
tail -n 5 config/logs/startup_safety_events.jsonl

   - Confirm a `restore_last_known_good` event with `status` = `success`.

## Acceptance criteria (v1.1 exit alignment)
- Invalid config is blocked before runtime when launch validation fails.
- Operators can execute restore from latest snapshot in under 2 minutes using either:

```bash
python config/scripts/startup_safety.py --restore-last-known-good
python config/scripts/startup_safety.py --guided-restore
```

## Recovery SLA evidence log

| Run ID (UTC) | Corruption seed | Launch gate start (UTC) | Ready state (UTC) | Elapsed (s) | SLA <=120s | Restore log evidence |
| --- | --- | --- | --- | ---: | --- | --- |
| 2026-02-16T14:15:54Z-01 | `schedules.json` first `{` -> `[` | 2026-02-16T14:15:54.731850Z | N/A (gate blocked: baseline config schema failures) | 0.43 | Fail (no ready state) | `restore_last_known_good` success at `2026-02-16T14:15:55.115230Z`, snapshot `config_snapshot_20260216_141542` |

> Note: TODO recovery SLA completion remains open until a run reaches **ready state** within 120 seconds.
