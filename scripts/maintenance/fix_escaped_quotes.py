#!/usr/bin/env python3
"""Normalize escaped double quotes in UTF-8 text files.

Usage:
  python scripts/maintenance/fix_escaped_quotes.py <file> [<file> ...]
"""

from __future__ import annotations

import argparse
from pathlib import Path


def fix_file(path: Path, *, write: bool) -> bool:
    original = path.read_text(encoding="utf-8")
    normalized = original.replace('\\"', '"')
    changed = normalized != original

    if changed and write:
        path.write_text(normalized, encoding="utf-8")
    return changed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help="Text file paths to normalize")
    parser.add_argument(
        "--write",
        action="store_true",
        help="Apply changes in-place (default is dry-run)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    changed_count = 0

    for path in args.paths:
        if not path.exists() or not path.is_file():
            print(f"[skip] {path} (not a file)")
            continue

        changed = fix_file(path, write=args.write)
        if changed:
            changed_count += 1
            action = "updated" if args.write else "would update"
            print(f"[{action}] {path}")
        else:
            print(f"[ok] {path}")

    if not args.write:
        print("Dry-run mode enabled. Re-run with --write to apply changes.")
        if changed_count > 0:
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
