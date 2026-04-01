#!/usr/bin/env python3
"""Validate communication mode contract declarations in BMAD agent files."""

from __future__ import annotations

from pathlib import Path
import sys

AGENT_ROOTS = [Path("_bmad/bmm/agents"), Path("_bmad/core/agents")]
REQUIRED_TOKENS = {
    "activation_rule": "communication_mode: persona|ops",
    "contract_block": "<communication_mode_contract",
    "ops_mode_requirement": "<ops_mode>",
    "fallback_requirement": "<fallback_behavior>",
    "enforcement_rule": "Maintain active communication_mode behavior",
}


def iter_agent_files() -> list[Path]:
    files: list[Path] = []
    for root in AGENT_ROOTS:
        files.extend(sorted(root.rglob("*.md")))
    return files


def main() -> int:
    failures: list[str] = []

    for path in iter_agent_files():
        text = path.read_text(encoding="utf-8")
        missing = [name for name, token in REQUIRED_TOKENS.items() if token not in text]
        if missing:
            failures.append(f"{path}: missing {', '.join(missing)}")

    if failures:
        print("communication mode contract validation failed:")
        for failure in failures:
            print(f" - {failure}")
        return 1

    print("communication mode contract validation passed for all BMAD/core agent files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
