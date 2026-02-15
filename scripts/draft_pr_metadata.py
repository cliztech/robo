#!/usr/bin/env python3
"""Render consistent Draft PR markdown from a JSON metadata file.

Usage:
  python scripts/draft_pr_metadata.py --init draft_pr_metadata.json
  python scripts/draft_pr_metadata.py --metadata draft_pr_metadata.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


SAMPLE_METADATA: dict[str, Any] = {
    "scope": {
        "in": ["Add Draft PR workflow section to CONTRIBUTING.md"],
        "out": ["No CI pipeline changes"],
    },
    "risks": [
        {
            "risk": "Review policy interpreted inconsistently",
            "mitigation": "Use template-generated PR body and checklist",
        }
    ],
    "test_plan": {
        "completed": ["git diff --check"],
        "pending": ["Collect reviewer approvals"],
    },
    "known_gaps": ["None"],
    "next_checkpoints": [
        {"item": "Address initial feedback", "status": "todo"},
        {"item": "Promote to Ready for Review", "status": "todo"},
    ],
}


def _load_metadata(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, dict):
        raise ValueError("Metadata root must be a JSON object.")
    return data


def _format_nested_list(items: list[str], fallback: str = "None") -> str:
    if not items:
        return f"  - {fallback}"
    return "\n".join(f"  - {item}" for item in items)


def _format_risks(items: list[dict[str, str]]) -> str:
    if not items:
        return "- None"

    rendered: list[str] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        risk_text = item.get("risk", "Unspecified risk")
        mitigation = item.get("mitigation", "Not provided")
        rendered.append(f"- Risk: {risk_text}\n  - Mitigation / rollback: {mitigation}")
    return "\n".join(rendered) if rendered else "- None"


def _format_checkpoints(items: list[dict[str, str]]) -> str:
    if not items:
        return "- [ ] None"

    rendered: list[str] = []
    for item in items:
        text = item.get("item", "Unnamed checkpoint")
        status = str(item.get("status", "todo")).lower()
        checkbox = "x" if status in {"done", "complete", "completed"} else " "
        rendered.append(f"- [{checkbox}] {text}")
    return "\n".join(rendered)


def render_markdown(metadata: dict[str, Any]) -> str:
    scope = metadata.get("scope", {})
    scope_in = scope.get("in", []) if isinstance(scope, dict) else []
    scope_out = scope.get("out", []) if isinstance(scope, dict) else []

    risks = metadata.get("risks", [])
    if not isinstance(risks, list):
        risks = []

    test_plan = metadata.get("test_plan", {})
    completed = test_plan.get("completed", []) if isinstance(test_plan, dict) else []
    pending = test_plan.get("pending", []) if isinstance(test_plan, dict) else []

    known_gaps = metadata.get("known_gaps", [])
    if not isinstance(known_gaps, list):
        known_gaps = []

    checkpoints = metadata.get("next_checkpoints", [])
    if not isinstance(checkpoints, list):
        checkpoints = []

    known_gaps_block = "\n".join(f"- {item}" for item in known_gaps) if known_gaps else "- None"

    return (
        "## Scope\n"
        "- In scope:\n"
        f"{_format_nested_list(scope_in)}\n"
        "- Out of scope:\n"
        f"{_format_nested_list(scope_out)}\n\n"
        "## Risks\n"
        f"{_format_risks(risks)}\n\n"
        "## Test Plan\n"
        "- Completed:\n"
        f"{_format_nested_list(completed)}\n"
        "- Pending:\n"
        f"{_format_nested_list(pending)}\n\n"
        "## Known Gaps\n"
        f"{known_gaps_block}\n\n"
        "## Next Checkpoints\n"
        f"{_format_checkpoints(checkpoints)}\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Draft PR metadata helper")
    parser.add_argument(
        "--metadata",
        type=Path,
        help="Path to JSON metadata used to render Draft PR markdown.",
    )
    parser.add_argument(
        "--init",
        type=Path,
        help="Write a sample metadata JSON file to the given path.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.init:
        args.init.write_text(json.dumps(SAMPLE_METADATA, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote sample metadata to {args.init}")
        return 0

    if not args.metadata:
        raise SystemExit("Provide --metadata <path> or --init <path>.")

    metadata = _load_metadata(args.metadata)
    print(render_markdown(metadata))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
