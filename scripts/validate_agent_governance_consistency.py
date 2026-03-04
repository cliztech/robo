#!/usr/bin/env python3
"""Validate governance docs remain aligned with canonical sections and IDs."""

from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

CANONICAL = ROOT / "docs/operations/agent_governance_canonical.md"
AGENTS = ROOT / "AGENTS.md"
EXEC = ROOT / "docs/operations/agent_execution_commands.md"
DERIVED_AGENTS = ROOT / "docs/operations/derived/agents_governance_view.md"
DERIVED_EXEC = ROOT / "docs/operations/derived/agent_execution_governance_view.md"

REQUIRED_GOV_IDS = [
    "team-topology",
    "route-selection",
    "completion-gates",
    "escalation-flow",
    "communication-rules",
]

REQUIRED_LINK_SNIPPETS = {
    AGENTS: ["docs/operations/agent_governance_canonical.md", "docs/operations/derived/agents_governance_view.md"],
    EXEC: ["docs/operations/agent_governance_canonical.md", "docs/operations/derived/agent_execution_governance_view.md"],
    DERIVED_AGENTS: [
        "agent_governance_canonical.md#team-topology",
        "agent_governance_canonical.md#route-selection-policy",
        "agent_governance_canonical.md#completion-gates",
        "agent_governance_canonical.md#escalation-flow",
        "agent_governance_canonical.md#personality-and-communication-rules",
    ],
    DERIVED_EXEC: [
        "../agent_governance_canonical.md#route-selection-policy",
        "../agent_governance_canonical.md#completion-gates",
        "../agent_governance_canonical.md#escalation-flow",
        "../agent_governance_canonical.md#personality-and-communication-rules",
    ],
}


def fail(message: str) -> None:
    print(f"❌ {message}")
    sys.exit(1)


def ensure_exists(path: Path) -> str:
    if not path.exists():
        fail(f"Missing required governance file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def main() -> int:
    canonical_text = ensure_exists(CANONICAL)

    for gov_id in REQUIRED_GOV_IDS:
        token = f"<!-- GOV:{gov_id} -->"
        if token not in canonical_text:
            fail(f"Canonical governance marker missing: {token}")

    changelog_header = "| Version | Date | Owner | Reason |"
    if changelog_header not in canonical_text:
        fail("Canonical changelog table header is missing or malformed")

    table_rows = re.findall(r"^\|\s*\d+\.\d+\.\d+\s*\|", canonical_text, flags=re.MULTILINE)
    if not table_rows:
        fail("Canonical changelog table must contain at least one semantic version row")

    for file_path, snippets in REQUIRED_LINK_SNIPPETS.items():
        text = ensure_exists(file_path)
        for snippet in snippets:
            if snippet not in text:
                fail(f"Missing canonical governance reference in {file_path.relative_to(ROOT)}: {snippet}")

    print("✅ Agent governance consistency checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
