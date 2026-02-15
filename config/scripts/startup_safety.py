#!/usr/bin/env python3
"""Startup reliability and safety controls for RoboDJ.

Implements v1.1 baseline tasks:
- launch-time diagnostics (DB, key files, audio devices)
- config validation using config/validate_config.py validator flow
- crash recovery restore from config/backups/
- one-click timestamped backup snapshots
"""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "config"))
from validate_config import TARGETS, ValidationError, validate_target
CONFIG_DIR = REPO_ROOT / "config"
BACKUP_DIR = CONFIG_DIR / "backups"
SNAPSHOT_PREFIX = "config_snapshot_"
LOG_DIR = CONFIG_DIR / "logs"
SNAPSHOT_FILES = [
    "schedules.json",
    "prompt_variables.json",
    "secret.key",
    "secret_v2.key",
]

RECOVERY_HINTS = {
    "DB settings.db": "Run `python config/inspect_db.py` to inspect DB schema and verify the file path/permissions.",
    "DB user_content.db": "Run `python config/inspect_db.py` to inspect DB schema and verify the file path/permissions.",
    "Key secret.key": "Restore `config/secret.key` from your latest backup snapshot in `config/backups/`.",
    "Key secret_v2.key": "Restore `config/secret_v2.key` from your latest backup snapshot in `config/backups/`.",
    "Audio devices": "Confirm at least one playback device is enabled in the OS sound settings, then relaunch.",
}


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str
    warning: bool = False


def _log_event(filename_prefix: str, payload: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_path = LOG_DIR / f"{filename_prefix}_{stamp}.json"
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _print_result(result: CheckResult) -> None:
    if result.ok and not result.warning:
        status = "PASS"
    elif result.ok and result.warning:
        status = "WARN"
    else:
        status = "FAIL"
    print(f"[{status}] {result.name}: {result.detail}")
    if not result.ok:
        hint = RECOVERY_HINTS.get(result.name)
        if hint:
            print(f"        hint: {hint}")


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
        except Exception as exc:  # best-effort diagnostics
            return CheckResult("Audio devices", False, f"probe failed: {exc}")

    try:
        import sounddevice as sd  # type: ignore[import-not-found]

        devices = sd.query_devices()
        outputs = [d for d in devices if d.get("max_output_channels", 0) > 0]
        if not outputs:
            return CheckResult("Audio devices", False, "no output devices detected")
        return CheckResult("Audio devices", True, f"{len(outputs)} output device(s) detected")
    except Exception:
        return CheckResult(
            "Audio devices",
            True,
            "audio probe unavailable in this runtime (startup warning only)",
            warning=True,
        )


def run_startup_diagnostics() -> bool:
    print("Running RoboDJ startup diagnostics...")
    check_steps = [
        lambda: _check_db_readable(CONFIG_DIR / "settings.db"),
        lambda: _check_db_readable(CONFIG_DIR / "user_content.db"),
        lambda: _check_key_file(CONFIG_DIR / "secret.key"),
        lambda: _check_key_file(CONFIG_DIR / "secret_v2.key"),
        _check_audio_devices,
    ]
    with ThreadPoolExecutor(max_workers=len(check_steps)) as executor:
        checks = list(executor.map(lambda check: check(), check_steps))

    has_failures = False
    for check in checks:
        _print_result(check)
        if not check.ok:
            has_failures = True

    _log_event(
        "startup_diagnostics",
        {
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "results": [
                {"name": check.name, "ok": check.ok, "warning": check.warning, "detail": check.detail}
                for check in checks
            ],
            "has_failures": has_failures,
        },
    )

    return not has_failures


def validate_launch_config() -> list[str]:
    errors: list[str] = []
    for target in TARGETS:
        try:
            errors.extend(validate_target(target["name"], target["config"], target["schema"]))
        except ValidationError as exc:
            errors.append(f"[{target['name']}] {exc}")
    return errors


def _snapshot_name() -> str:
    return f"{SNAPSHOT_PREFIX}{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"


def create_backup_snapshot() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    snapshot_dir = BACKUP_DIR / _snapshot_name()
    snapshot_dir.mkdir(parents=True, exist_ok=False)

    copied: list[str] = []
    for relative in SNAPSHOT_FILES:
        source = CONFIG_DIR / relative
        if source.exists():
            shutil.copy2(source, snapshot_dir / relative)
            copied.append(relative)

    manifest = {
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "snapshot_type": "last_known_good_config",
        "files": copied,
    }
    (snapshot_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Created config snapshot: {snapshot_dir}")
    return snapshot_dir


def _latest_snapshot_dir() -> Path | None:
    if not BACKUP_DIR.exists():
        return None
    snapshots = [
        p for p in BACKUP_DIR.iterdir() if p.is_dir() and p.name.startswith(SNAPSHOT_PREFIX)
    ]
    if not snapshots:
        return None
    return sorted(snapshots, key=lambda p: p.name)[-1]


def restore_last_known_good_config() -> bool:
    snapshot_dir = _latest_snapshot_dir()
    if snapshot_dir is None:
        print("No snapshot found in config/backups/.")
        return False

    restored_files: list[str] = []
    for relative in SNAPSHOT_FILES:
        source = snapshot_dir / relative
        if source.exists():
            shutil.copy2(source, CONFIG_DIR / relative)
            restored_files.append(relative)

    if not restored_files:
        print(f"Snapshot {snapshot_dir} did not contain restorable files.")
        return False

    print(f"Restored last-known-good files from {snapshot_dir.name}: {', '.join(restored_files)}")
    _log_event(
        "restore_event",
        {
            "created_at_utc": datetime.now(timezone.utc).isoformat(),
            "snapshot": snapshot_dir.name,
            "restored_files": restored_files,
        },
    )
    return True


def launch_gate() -> int:
    diagnostics_ok = run_startup_diagnostics()
    config_errors = validate_launch_config()

    if config_errors:
        print("Configuration validation failed at launch:")
        for error in config_errors:
            print(f" - {error}")
        print("Attempting crash recovery using last-known-good snapshot...")

        restored = restore_last_known_good_config()
        if restored:
            post_restore_errors = validate_launch_config()
            if post_restore_errors:
                print("Recovery failed: restored snapshot is still invalid.")
                for error in post_restore_errors:
                    print(f" - {error}")
                return 1
            print("Recovery succeeded: restored config validates.")
        else:
            print("Recovery unavailable. Startup blocked to prevent runtime failure.")
            return 1

    if not diagnostics_ok:
        print("Startup diagnostics failed. Startup blocked.")
        return 1

    create_backup_snapshot()
    print("Startup safety gate passed.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="RoboDJ startup reliability controls")
    parser.add_argument("--on-launch", action="store_true", help="Run startup gate checks")
    parser.add_argument(
        "--create-backup", action="store_true", help="Create timestamped backup snapshot and exit"
    )
    parser.add_argument(
        "--restore-last-known-good",
        action="store_true",
        help="Restore latest snapshot from config/backups/ and exit",
    )
    args = parser.parse_args()

    if args.create_backup:
        create_backup_snapshot()
        return 0
    if args.restore_last_known_good:
        return 0 if restore_last_known_good_config() else 1
    if args.on_launch:
        return launch_gate()

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
