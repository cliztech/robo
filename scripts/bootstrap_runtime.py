#!/usr/bin/env python3
"""Bootstrap local runtime files from versioned templates."""

from __future__ import annotations

import argparse
import shutil
import sqlite3
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RUNTIME_DIR = REPO_ROOT / "runtime"
TEMPLATE_DIR = REPO_ROOT / "config" / "templates"


def copy_if_missing(src: Path, dst: Path, force: bool) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and not force:
        print(f"skip: {dst} (already exists)")
        return
    shutil.copy2(src, dst)
    print(f"copy: {src} -> {dst}")


def ensure_db(dst: Path, template: Path | None, force: bool) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and not force:
        print(f"skip: {dst} (already exists)")
        return

    if template and template.exists():
        shutil.copy2(template, dst)
        print(f"copy: {template} -> {dst}")
        return

    conn = sqlite3.connect(dst)
    conn.close()
    print(f"create: {dst} (empty sqlite database)")


def bootstrap(runtime_dir: Path, force: bool) -> None:
    runtime_config = runtime_dir / "config"

    template_map = {
        TEMPLATE_DIR / "schedules.json": runtime_config / "schedules.json",
        TEMPLATE_DIR / "prompt_variables.json": runtime_config / "prompt_variables.json",
        REPO_ROOT / "config" / "secret.key.example": runtime_config / "secret.key",
        REPO_ROOT / "config" / "secret_v2.key.example": runtime_config / "secret_v2.key",
    }

    for src, dst in template_map.items():
        if not src.exists():
            raise FileNotFoundError(f"Required template missing: {src}")
        copy_if_missing(src, dst, force=force)

    ensure_db(runtime_config / "settings.db", TEMPLATE_DIR / "settings.db", force=force)
    ensure_db(runtime_config / "user_content.db", TEMPLATE_DIR / "user_content.db", force=force)

    for folder in ["prompts", "scripts", "music_beds", "logs", "cache", "backups"]:
        path = runtime_config / folder
        path.mkdir(parents=True, exist_ok=True)
        print(f"ensure: {path}")

    print("\nBootstrap complete.")
    print(f"Runtime config directory: {runtime_config}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize local runtime state from versioned templates.")
    parser.add_argument(
        "--runtime-dir",
        default=str(DEFAULT_RUNTIME_DIR),
        help="Target runtime directory (default: ./runtime)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing runtime files.",
    )
    args = parser.parse_args()

    bootstrap(Path(args.runtime_dir).resolve(), force=args.force)


if __name__ == "__main__":
    main()
