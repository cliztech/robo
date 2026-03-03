#!/usr/bin/env python3
"""Startup reliability and safety controls for RoboDJ."""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "config"))
CONFIG_DIR = REPO_ROOT / "config"
BACKUP_DIR = CONFIG_DIR / "backups"
LOG_DIR = CONFIG_DIR / "logs"
SNAPSHOT_PREFIX = "config_snapshot_"
SNAPSHOT_FILES = ["schedules.json", "prompt_variables.json"]
SNAPSHOT_SECRET_FILES = ["secret.key", "secret_v2.key"]
EVENT_LOG_PATH = LOG_DIR / "startup_safety_events.jsonl"

RECOVERY_HINTS = {
    "DB settings.db": "Run `python config/inspect_db.py` to verify DB path/permissions.",
    "DB user_content.db": "Run `python config/inspect_db.py` to verify DB path/permissions.",
    "Key secret.key": "Restore `config/secret.key` from a known-good backup.",
    "Key secret_v2.key": "Restore `config/secret_v2.key` from a known-good backup.",
    "Audio devices": "Enable an audio playback device in OS settings and relaunch.",
}


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str
    warning: bool = False


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_event_log(event: str, payload: dict) -> Path:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    row = {"event": event, "created_at_utc": _utc_now(), **payload}
    with EVENT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row) + "\n")
    return EVENT_LOG_PATH


def _print_result(result: CheckResult) -> None:
    status = "PASS" if result.ok and not result.warning else "WARN" if result.warning else "FAIL"
    print(f"[{status}] {result.name}: {result.detail}")
    if not result.ok and result.name in RECOVERY_HINTS:
        print(f"        hint: {RECOVERY_HINTS[result.name]}")


def _load_config_validator() -> tuple[list[dict], type[Exception], Callable]:
    from validate_config import TARGETS, ValidationError, validate_target

    return TARGETS, ValidationError, validate_target


def validate_launch_config() -> list[str]:
    errors: list[str] = []
    try:
        targets, validation_error, validate_target = _load_config_validator()
    except Exception as exc:  # noqa: BLE001
        message = f"[launch_config_validation] Validator could not be loaded: {exc}"
        _append_event_log("startup_validator_error", {"status": "failed", "error": str(exc)})
        return [message]

    for target in targets:
        try:
            errors.extend(validate_target(target["name"], target["config"], target["schema"]))
        except validation_error as exc:  # type: ignore[misc]
            errors.append(f"[{target['name']}] {exc}")

    return errors


def _check_db_readable(db_path: Path) -> CheckResult:
    if not db_path.exists():
        return CheckResult(f"DB {db_path.name}", False, "file not found")

    uri = f"file:{db_path.as_posix()}?mode=ro"
    try:
        conn = sqlite3.connect(uri, uri=True)
        try:
            conn.execute("SELECT name FROM sqlite_master LIMIT 1;").fetchone()
        finally:
            conn.close()
    except sqlite3.Error as exc:
        return CheckResult(f"DB {db_path.name}", False, f"unreadable: {exc}")

    return CheckResult(f"DB {db_path.name}", True, "readable")


def _check_key_file(key_path: Path) -> CheckResult:
    if not key_path.exists():
        return CheckResult(f"Key {key_path.name}", False, "missing")

    try:
        size = key_path.stat().st_size
    except OSError as exc:
        return CheckResult(f"Key {key_path.name}", False, f"unable to stat: {exc}")

    if size < 16:
        return CheckResult(f"Key {key_path.name}", False, f"size too small ({size} bytes)")

    return CheckResult(f"Key {key_path.name}", True, f"present ({size} bytes)")


def _check_audio_devices() -> CheckResult:
    if sys.platform.startswith("win"):
        try:
            import ctypes

            count = ctypes.windll.winmm.waveOutGetNumDevs()  # type: ignore[attr-defined]
            if count < 1:
                return CheckResult("Audio devices", False, "no output devices detected")
            return CheckResult("Audio devices", True, f"{count} output device(s) detected")
        except Exception as exc:  # noqa: BLE001
            return CheckResult("Audio devices", False, f"probe failed: {exc}")

    return CheckResult("Audio devices", True, "non-Windows environment; probe skipped", warning=True)


def run_startup_diagnostics() -> bool:
    checks = [
        lambda: _check_db_readable(CONFIG_DIR / "settings.db"),
        lambda: _check_db_readable(CONFIG_DIR / "user_content.db"),
        lambda: _check_key_file(CONFIG_DIR / "secret.key"),
        lambda: _check_key_file(CONFIG_DIR / "secret_v2.key"),
        _check_audio_devices,
    ]

    with ThreadPoolExecutor(max_workers=len(checks)) as executor:
        results = list(executor.map(lambda fn: fn(), checks))

    has_failures = False
    for result in results:
        _print_result(result)
        if not result.ok:
            has_failures = True

    _append_event_log(
        "startup_diagnostics",
        {
            "status": "failed" if has_failures else "success",
            "results": [r.__dict__ for r in results],
            "has_failures": has_failures,
        },
    )
    return not has_failures


def _snapshot_name() -> str:
    return f"{SNAPSHOT_PREFIX}{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"


def _files_for_snapshot(include_secrets: bool) -> list[str]:
    files = list(SNAPSHOT_FILES)
    if include_secrets:
        files.extend(SNAPSHOT_SECRET_FILES)
    return files


def create_backup_snapshot(*, include_secrets: bool = False, snapshot_type: str = "last_known_good_config") -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_dir = BACKUP_DIR / _snapshot_name()
    snapshot_dir.mkdir(parents=True, exist_ok=False)

    copied: list[str] = []
    for relative in _files_for_snapshot(include_secrets):
        source = CONFIG_DIR / relative
        if source.exists():
            shutil.copy2(source, snapshot_dir / relative)
            copied.append(relative)

    manifest = {
        "created_at_utc": _utc_now(),
        "snapshot_type": snapshot_type,
        "includes_secrets": include_secrets,
        "files": copied,
    }
    (snapshot_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    log_path = _append_event_log(
        "create_backup_snapshot",
        {
            "status": "success",
            "snapshot": snapshot_dir.name,
            "includes_secrets": include_secrets,
            "copied_files": copied,
            "snapshot_type": snapshot_type,
        },
    )
    print(f"Created config snapshot: {snapshot_dir}")
    print(f"Snapshot event logged to: {log_path}")
    return snapshot_dir


def _list_snapshot_dirs() -> list[Path]:
    if not BACKUP_DIR.exists():
        return []
    snapshots = [p for p in BACKUP_DIR.iterdir() if p.is_dir() and p.name.startswith(SNAPSHOT_PREFIX)]
    return sorted(snapshots, key=lambda p: p.name, reverse=True)


def _latest_snapshot_dir() -> Path | None:
    snapshots = _list_snapshot_dirs()
    return snapshots[0] if snapshots else None


def _prompt_snapshot_selection(snapshots: list[Path]) -> Path | None:
    print("Guided restore: choose a snapshot to restore.")
    for index, snapshot in enumerate(snapshots, start=1):
        print(f"  {index}. {snapshot.name}")

    raw_selection = input("Enter number to restore, or press Enter to cancel: ").strip()
    if not raw_selection:
        return None
    if not raw_selection.isdigit():
        return None

    selected_index = int(raw_selection)
    if selected_index < 1 or selected_index > len(snapshots):
        return None

    return snapshots[selected_index - 1]


def restore_last_known_good_config(
    snapshot_dir: Path | None = None,
    *,
    include_secrets: bool = False,
) -> bool:
    started_at = time.monotonic()
    chosen_snapshot = snapshot_dir or _latest_snapshot_dir()
    if chosen_snapshot is None:
        print("No snapshot found in config/backups/.")
        _append_event_log("restore_last_known_good", {"status": "failed", "reason": "no_snapshot"})
        return False

    pre_restore_snapshot = create_backup_snapshot(
        include_secrets=include_secrets,
        snapshot_type="pre_restore_checkpoint",
    )

    restored_files: list[str] = []
    for relative in _files_for_snapshot(include_secrets):
        source = chosen_snapshot / relative
        if source.exists():
            shutil.copy2(source, CONFIG_DIR / relative)
            restored_files.append(relative)

    if not restored_files:
        print(f"Snapshot {chosen_snapshot.name} did not contain restorable files.")
        _append_event_log(
            "restore_last_known_good",
            {
                "status": "failed",
                "reason": "empty_snapshot",
                "snapshot": chosen_snapshot.name,
                "pre_restore_snapshot": pre_restore_snapshot.name,
            },
        )
        return False

    post_restore_errors = validate_launch_config()
    duration_seconds = round(time.monotonic() - started_at, 2)

    if post_restore_errors:
        print("Recovery validation failed. Rolling back to pre-restore checkpoint...")
        rolled_back_files: list[str] = []
        for relative in _files_for_snapshot(include_secrets):
            source = pre_restore_snapshot / relative
            if source.exists():
                shutil.copy2(source, CONFIG_DIR / relative)
                rolled_back_files.append(relative)

        rollback_errors = validate_launch_config()
        status = "failed_rollback_requires_operator" if rollback_errors else "failed_rolled_back"
        _append_event_log(
            "restore_last_known_good",
            {
                "status": status,
                "reason": "post_restore_validation_failed",
                "snapshot": chosen_snapshot.name,
                "pre_restore_snapshot": pre_restore_snapshot.name,
                "restored_files": restored_files,
                "rolled_back_files": rolled_back_files,
                "post_restore_errors": post_restore_errors,
                "rollback_errors": rollback_errors,
                "recovery_duration_seconds": duration_seconds,
                "recovery_under_120_seconds": duration_seconds <= 120,
                "includes_secrets": include_secrets,
            },
        )
        return False

    log_path = _append_event_log(
        "restore_last_known_good",
        {
            "status": "success",
            "snapshot": chosen_snapshot.name,
            "pre_restore_snapshot": pre_restore_snapshot.name,
            "restored_files": restored_files,
            "recovery_duration_seconds": duration_seconds,
            "recovery_under_120_seconds": duration_seconds <= 120,
            "includes_secrets": include_secrets,
        },
    )
    print(f"Restore event logged to: {log_path}")
    print(f"Recovery duration: {duration_seconds}s (target <= 120s)")
    return True


def launch_gate(*, include_secrets_in_snapshot: bool = False) -> int:
    diagnostics_ok = run_startup_diagnostics()
    config_errors = validate_launch_config()

    if config_errors:
        print("Configuration validation failed at launch:")
        for error in config_errors:
            print(f" - {error}")
        print("Attempting crash recovery using last-known-good snapshot...")

        restored = restore_last_known_good_config(include_secrets=include_secrets_in_snapshot)
        if restored:
            print("Recovery succeeded: restored config validates.")
            post_restore_errors = validate_launch_config()
            if post_restore_errors:
                print("Recovery failed: restored snapshot is still invalid.")
                for error in post_restore_errors:
                    print(f" - {error}")
                return 1
        else:
            print("Recovery unavailable. Startup blocked to prevent runtime failure.")
            print("Run guided restore manually: python config/scripts/startup_safety.py --guided-restore")
            return 1

    if not diagnostics_ok:
        print("Startup diagnostics failed. Startup blocked.")
        return 1

    create_backup_snapshot(include_secrets=include_secrets_in_snapshot)
    print("Startup safety gate passed.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="RoboDJ startup reliability controls")
    parser.add_argument("--on-launch", action="store_true", help="Run startup gate checks")
    parser.add_argument("--create-backup", action="store_true", help="Create backup snapshot and exit")
    parser.add_argument(
        "--restore-last-known-good",
        action="store_true",
        help="Restore latest snapshot from config/backups/ and exit",
    )
    parser.add_argument("--guided-restore", action="store_true", help="Interactively restore a chosen snapshot")
    parser.add_argument(
        "--include-secrets",
        action="store_true",
        help="Break-glass mode: include secret.key and secret_v2.key in snapshot flows.",
    )
    args = parser.parse_args()

    if args.create_backup:
        create_backup_snapshot(include_secrets=args.include_secrets)
        return 0
    if args.restore_last_known_good:
        return 0 if restore_last_known_good_config(include_secrets=args.include_secrets) else 1
    if args.guided_restore:
        snapshots = _list_snapshot_dirs()
        if not snapshots:
            print("No snapshot found in config/backups/.")
            return 1

        selected_snapshot = _prompt_snapshot_selection(snapshots)
        if selected_snapshot is None:
            print("Guided restore cancelled.")
            return 1

        print(f"Selected snapshot: {selected_snapshot.name}")
        started = time.monotonic()
        restored = restore_last_known_good_config(selected_snapshot, include_secrets=args.include_secrets)
        if not restored:
            return 1

        errors = validate_launch_config()
        if errors:
            print("Restore completed, but configuration is still invalid:")
            for error in errors:
                print(f" - {error}")
            return 1

        elapsed = time.monotonic() - started
        print(f"Guided restore succeeded and config validates in {elapsed:.1f}s.")
        if elapsed > 120:
            print("Warning: restore completed outside the 2-minute recovery SLA target.")
        return 0
    if args.on_launch:
        return launch_gate(include_secrets_in_snapshot=args.include_secrets)

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
