#!/usr/bin/env python3
"""Enforce canonical product naming in top-level documentation surfaces."""

from __future__ import annotations

import re
from pathlib import Path

CANONICAL_NAME = "DGN-DJ by DGNradio"
FORBIDDEN_TERMS = ("RoboDJ", "AetherRadio")

# Guardrail scope: high-visibility docs that must stay canonical.
CHECKED_FILES = (
    Path("README.md"),
    Path("AGENTS.md"),
    Path(".context/productContext.md"),
    Path(".context/activeContext.md"),
    Path(".context/progress.md"),
    Path("docs/productization/product_identity.md"),
)

# Explicit migration allowlist by file + term.
ALLOWED_OCCURRENCES: dict[Path, set[str]] = {
    Path("AGENTS.md"): {"RoboDJ"},  # legacy executable/launcher filenames
    Path(".context/productContext.md"): {"RoboDJ", "AetherRadio"},  # legacy aliases section
    Path("docs/productization/product_identity.md"): {"RoboDJ", "AetherRadio"},  # decision record
}


def find_violations(path: Path, text: str) -> list[str]:
    allowed_terms = ALLOWED_OCCURRENCES.get(path, set())
    violations: list[str] = []

    for term in FORBIDDEN_TERMS:
        if term in allowed_terms:
            continue
        pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            violations.append(f"{path}:{line}: forbidden legacy name '{term}'")

    return violations


def main() -> int:
    missing = [str(path) for path in CHECKED_FILES if not path.exists()]
    if missing:
        print("Naming check configuration error: missing files")
        for item in missing:
            print(f" - {item}")
        return 2

    violations: list[str] = []
    for path in CHECKED_FILES:
        text = path.read_text(encoding="utf-8")
        violations.extend(find_violations(path, text))

    if violations:
        print("Product naming check failed.")
        print(f"Canonical name: {CANONICAL_NAME}")
        print("Violations:")
        for violation in violations:
            print(f" - {violation}")
        print("\nAdd explicit migration exceptions in scripts/check_product_naming.py if justified.")
        return 1

    print(f"Product naming check passed. Canonical name: {CANONICAL_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
