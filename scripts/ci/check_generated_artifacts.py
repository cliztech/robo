#!/usr/bin/env python3
"""Fail CI when generated packaging/build artifacts leak into app source paths."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

SCAN_ROOTS = (
    "src",
    "backend",
    "apps",
    "dgn-airwaves/src",
    "dgn-robo-rippa/src",
)

FORBIDDEN_DIR_NAMES = {
    "dist",
    "build",
    "site",
    "pip-wheel-metadata",
    ".eggs",
}

SKIP_DIR_NAMES = {
    ".git",
    "node_modules",
    ".next",
    ".venv",
    "venv",
    "env",
    "__pycache__",
}


def find_violations() -> list[str]:
    violations: list[str] = []

    for root_rel in SCAN_ROOTS:
        root_path = REPO_ROOT / root_rel
        if not root_path.exists():
            continue

        for path in root_path.rglob("*"):
            if not path.is_dir():
                continue

            if any(part in SKIP_DIR_NAMES for part in path.parts):
                continue

            name = path.name
            if name.endswith(".egg-info") or name in FORBIDDEN_DIR_NAMES:
                violations.append(str(path.relative_to(REPO_ROOT)))

    return sorted(set(violations))


def main() -> int:
    violations = find_violations()
    if not violations:
        print("✅ No generated build/package artifacts found in tracked app paths.")
        return 0

    print("❌ Generated artifacts detected in tracked app paths:")
    for item in violations:
        print(f" - {item}")
    print("\nClean these artifacts and redirect packaging/build outputs to a dedicated temp/build directory.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
