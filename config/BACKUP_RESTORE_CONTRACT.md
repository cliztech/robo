# Backup & Restore Contract

This note defines the operational contract for configuration backups and restores.

## 1) Backup scope

### Included
- All JSON configuration files directly under `config/` (`config/*.json`).
- Optional metadata manifest generated at backup time (for traceability), stored with the backup artifact.

### Explicit exclusions
- Sensitive key material is excluded from backup snapshots:
  - `config/secret.key`
  - `config/secret_v2.key`
- SQLite database files are excluded from this contract:
  - `config/settings.db`
  - `config/user_content.db`
  - any other `config/*.db`
- Temporary lock/signal/runtime files are excluded unless explicitly required by a future design update.

### Data integrity rule
- Backup and restore operations must never perform direct edits to `.db` files. Database handling remains a separate operational process.

## 2) Backup location and filename format

### Storage location
- Backup artifacts are stored under `config/backups/`.

### Naming format
- Use UTC timestamped names to ensure lexical sort order and deterministic retention.
- Recommended format:
  - `config_snapshot_YYYYMMDDTHHMMSSZ.json`
- Example:
  - `config_snapshot_20260213T101530Z.json`

### Atomicity expectation
- Write to a temporary file in `config/backups/` and then atomically rename to the final filename to avoid partial snapshots.

## 3) Restore semantics

### Full restore
- Replaces all managed `config/*.json` files from a single selected snapshot.
- Excluded files remain untouched (keys, `.db`, runtime files).

### Selective restore
- Operator selects one or more target JSON files from a snapshot.
- Only selected files are replaced; all others remain unchanged.

### Validation gate
- Any restore mode must run config validation before finalizing success.
- If validation fails after file replacement, rollback behavior (below) applies.

## 4) Retention policy

Apply both count and age limits, deleting oldest first when needed:
- Keep at most **30** snapshots.
- Keep snapshots no older than **90 days**.

This dual-policy prevents unbounded growth while ensuring recent recovery points.

## 5) Operator confirmation prompts and rollback behavior

### Required confirmations
- **Backup creation prompt** (for risky operations):
  - Confirm backup intent and show destination path.
- **Restore prompt**:
  - Show snapshot timestamp and mode (full/selective).
  - Require explicit confirmation before overwrite.
- **Destructive retention cleanup prompt** (manual mode only):
  - Show candidate files to prune and require confirmation.

### Rollback behavior
- Before restore, create a pre-restore snapshot of current `config/*.json` state.
- If restore validation fails:
  1. Auto-restore from the pre-restore snapshot.
  2. Re-run validation.
  3. Surface error details and mark restore as failed.
- If auto-rollback fails, stop further writes and require operator intervention with clear diagnostics.

## 6) Contract ownership

- This contract is the source of truth for backup/restore implementation and operations procedures.
- Any implementation that deviates from these rules must update this document first.
