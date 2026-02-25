from __future__ import annotations

import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "config" / "scripts"))

import startup_safety  # noqa: E402


@pytest.fixture
def isolated_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    config_dir = tmp_path / "config"
    backup_dir = config_dir / "backups"
    log_dir = config_dir / "logs"

    config_dir.mkdir(parents=True, exist_ok=True)
    (config_dir / "schedules.json").write_text('{"schedule": []}', encoding="utf-8")
    (config_dir / "prompt_variables.json").write_text('{"variables": {}}', encoding="utf-8")

    monkeypatch.setattr(startup_safety, "CONFIG_DIR", config_dir)
    monkeypatch.setattr(startup_safety, "BACKUP_DIR", backup_dir)
    monkeypatch.setattr(startup_safety, "LOG_DIR", log_dir)
    monkeypatch.setattr(startup_safety, "EVENT_LOG_PATH", log_dir / "startup_safety_events.jsonl")


def test_create_backup_snapshot_rapid_calls_are_unique(isolated_paths: None) -> None:
    snapshots = [startup_safety.create_backup_snapshot() for _ in range(30)]

    names = [snapshot.name for snapshot in snapshots]
    assert len(names) == len(set(names))
    assert all(name.startswith(startup_safety.SNAPSHOT_PREFIX) for name in names)


def test_create_backup_snapshot_retries_after_collision(
    monkeypatch: pytest.MonkeyPatch, isolated_paths: None
) -> None:
    startup_safety.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    collision_name = f"{startup_safety.SNAPSHOT_PREFIX}collision"
    (startup_safety.BACKUP_DIR / collision_name).mkdir(parents=True, exist_ok=False)

    names = iter([collision_name, f"{startup_safety.SNAPSHOT_PREFIX}unique"])
    monkeypatch.setattr(startup_safety, "_snapshot_name", lambda: next(names))

    snapshot_dir = startup_safety.create_backup_snapshot()

    assert snapshot_dir.name.endswith("unique")
    assert snapshot_dir.exists()


def test_create_backup_snapshot_raises_clear_error_after_max_retries(
    monkeypatch: pytest.MonkeyPatch, isolated_paths: None
) -> None:
    startup_safety.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    collision_name = f"{startup_safety.SNAPSHOT_PREFIX}collision"
    (startup_safety.BACKUP_DIR / collision_name).mkdir(parents=True, exist_ok=False)

    monkeypatch.setattr(startup_safety, "_snapshot_name", lambda: collision_name)
    monkeypatch.setattr(startup_safety, "SNAPSHOT_CREATE_MAX_ATTEMPTS", 3)

    with pytest.raises(RuntimeError, match="Unable to create a unique backup snapshot directory after 3 attempts"):
        startup_safety.create_backup_snapshot()
