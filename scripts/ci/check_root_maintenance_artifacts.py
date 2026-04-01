#!/usr/bin/env python3
"""Fail CI when unapproved root-level maintenance scripts/diffs are added."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATTERNS = ("fix_*.py", "patch_tests_*.py", "modify_test.py", "*.diff")


# Explicitly blocked in repository root; these files must live under scripts/*.
def main() -> int:
    violations: set[Path] = set()
    for pattern in PATTERNS:
        for path in ROOT.glob(pattern):
            if path.is_file():
                violations.add(path.relative_to(ROOT))

    if not violations:
        print("✅ Root maintenance artifact hygiene check passed.")
        return 0

    print("❌ Unapproved root-level maintenance artifacts detected:")
    for violation in sorted(violations):
        print(f"  - {violation}")
    print(
        "Move reusable utilities to scripts/maintenance/ and one-off migrations to "
        "scripts/migrations/ (archive if needed)."
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
