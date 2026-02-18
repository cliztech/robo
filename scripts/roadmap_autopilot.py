#!/usr/bin/env python3
"""Roadmap autopilot helper for surfacing the next actionable TODOs.

This utility scans markdown TODO boards, extracts open checkbox items, and
prints a deterministic execution queue. It can also run continuously to act as
an operator-facing loop while tasks are being completed.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TODO_FILES = [
    ROOT / "TODO.md",
    ROOT / "TODO_v1_1.md",
    ROOT / "FEATURE_HEAVY_ROADMAP_TODO.md",
]
DEFAULT_WORKFLOW_FILES = [
    ROOT / "MASSIVE_WORKFLOW_BLUEPRINT.md",
    ROOT / "ROADMAP_AI_RADIO_STATION.md",
    ROOT / "ROADMAP_SUMMARY.md",
    ROOT / "docs" / "massive_workflow_blueprint.md",
    ROOT / "docs" / "parallel_agent_organization_roadmap.md",
]

HEADER_PATTERN = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
TASK_PATTERN = re.compile(r"^\s*[-*]\s+\[\s\]\s+(.*\S)\s*$")
BULLET_PATTERN = re.compile(r"^\s*[-*]\s+(?!\[)(.*\S)\s*$")
NUMBERED_PATTERN = re.compile(r"^\s*\d+[.)]\s+(.*\S)\s*$")
ACTION_HEADING_PATTERN = re.compile(
    r"(workflow|workstream|roadmap|backlog|deliverable|game plan|execution|"
    r"horizon|release order|todo)",
    re.IGNORECASE,
)
ACTION_TEXT_PATTERN = re.compile(
    r"^(add|build|create|define|deploy|design|document|enable|implement|"
    r"introduce|launch|monitor|optimize|publish|run|ship|track|update|"
    r"validate|verify|write|restore)\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class OpenTask:
    """Single open task with minimal context for triage."""

    source: Path
    line_number: int
    section: str
    text: str


@dataclass(frozen=True)
class QueueItem:
    """Queue item from TODO checklists or roadmap/workflow action bullets."""

    source: Path
    line_number: int
    section: str
    text: str
    kind: str


def collect_open_tasks(markdown_path: Path) -> list[OpenTask]:
    """Collect unchecked markdown checklist items from a TODO board."""
    if not markdown_path.exists():
        return []

    current_section = "(root)"
    open_tasks: list[OpenTask] = []

    for line_number, raw_line in enumerate(
        markdown_path.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        header_match = HEADER_PATTERN.match(raw_line)
        if header_match:
            current_section = header_match.group(2)
            continue

        task_match = TASK_PATTERN.match(raw_line)
        if task_match:
            open_tasks.append(
                OpenTask(
                    source=markdown_path,
                    line_number=line_number,
                    section=current_section,
                    text=task_match.group(1),
                )
            )

    return open_tasks


def render_queue(tasks: list[QueueItem], limit: int) -> str:
    """Render the open-task queue with stable ordering and truncation."""
    if not tasks:
        return "No open tasks found in the selected roadmap files."

    lines: list[str] = [
        f"Open task queue ({min(limit, len(tasks))}/{len(tasks)} shown):"
    ]
    for index, task in enumerate(tasks[:limit], start=1):
        rel_source = task.source.relative_to(ROOT)
        lines.append(
            f"{index:>2}. [{rel_source}:{task.line_number}] "
            f"{task.section} ({task.kind}) -> {task.text}"
        )

    return "\n".join(lines)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Continuously scan roadmap TODO markdown files and show the next "
            "actionable queue."
        )
    )
    parser.add_argument(
        "--file",
        action="append",
        default=[],
        help="Specific markdown TODO file to scan (can be passed multiple times).",
    )
    parser.add_argument(
        "--workflow-file",
        action="append",
        default=[],
        help=(
            "Specific roadmap/workflow markdown file to scan for unfinished "
            "action bullets (can be passed multiple times)."
        ),
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=12,
        help="Maximum number of open tasks to display per cycle.",
    )
    parser.add_argument(
        "--loop",
        action="store_true",
        help="Continuously refresh the open-task queue.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=30.0,
        help="Loop refresh interval in seconds (used with --loop).",
    )
    parser.add_argument(
        "--todos-only",
        action="store_true",
        help="Only scan TODO checklist files and skip roadmap/workflow action bullets.",
    )
    return parser.parse_args()


def resolve_files(raw_files: list[str]) -> list[Path]:
    if not raw_files:
        return [path for path in DEFAULT_TODO_FILES if path.exists()]

    resolved: list[Path] = []
    for raw in raw_files:
        candidate = (ROOT / raw).resolve()
        try:
            candidate.relative_to(ROOT)
            resolved.append(candidate)
        except ValueError:
            print(f"error: file outside project root: {raw}", file=sys.stderr)
    return resolved


def collect_workflow_actions(markdown_path: Path) -> list[QueueItem]:
    """Collect roadmap/workflow action bullets that look unfinished and actionable."""
    if not markdown_path.exists():
        return []

    current_section = "(root)"
    section_is_actionable = False
    items: list[QueueItem] = []

    for line_number, raw_line in enumerate(
        markdown_path.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        header_match = HEADER_PATTERN.match(raw_line)
        if header_match:
            current_section = header_match.group(2)
            section_is_actionable = bool(ACTION_HEADING_PATTERN.search(current_section))
            continue

        match = BULLET_PATTERN.match(raw_line) or NUMBERED_PATTERN.match(raw_line)
        if not match or not section_is_actionable:
            continue

        text = match.group(1).strip()
        normalized = re.sub(r"^\*\*([^*]+)\*\*:?\s*", "", text).strip()
        if not normalized or not ACTION_TEXT_PATTERN.match(normalized):
            continue

        items.append(
            QueueItem(
                source=markdown_path,
                line_number=line_number,
                section=current_section,
                text=normalized,
                kind="workflow",
            )
        )

    return items


def run_once(todo_files: list[Path], workflow_files: list[Path], limit: int) -> int:
    tasks: list[QueueItem] = []
    missing_files: list[Path] = []

    for markdown_path in todo_files:
        if markdown_path.exists():
            tasks.extend(
                QueueItem(
                    source=task.source,
                    line_number=task.line_number,
                    section=task.section,
                    text=task.text,
                    kind="todo",
                )
                for task in collect_open_tasks(markdown_path)
            )
        else:
            missing_files.append(markdown_path)

    for markdown_path in workflow_files:
        if markdown_path.exists():
            tasks.extend(collect_workflow_actions(markdown_path))
        else:
            missing_files.append(markdown_path)

    tasks.sort(key=lambda item: (str(item.source), item.line_number))

    if missing_files:
        for missing in missing_files:
            print(f"warning: file not found: {missing}", file=sys.stderr)

    print(render_queue(tasks, limit=limit))
    return 0 if tasks else 1


def main() -> int:
    args = parse_args()

    if args.limit < 1:
        print("error: --limit must be at least 1", file=sys.stderr)
        return 2
    if args.interval <= 0:
        print("error: --interval must be greater than 0", file=sys.stderr)
        return 2

    todo_files = resolve_files(args.file)
    workflow_files = []
    if not args.todos_only:
        workflow_files = resolve_files(args.workflow_file) if args.workflow_file else [
            path for path in DEFAULT_WORKFLOW_FILES if path.exists()
        ]

    if not todo_files and not workflow_files:
        print("error: no roadmap files found to scan", file=sys.stderr)
        return 2

    if not args.loop:
        return run_once(todo_files, workflow_files=workflow_files, limit=args.limit)

    try:
        while True:
            print(f"\n=== Roadmap loop tick @ {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
            run_once(todo_files, workflow_files=workflow_files, limit=args.limit)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped roadmap loop.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
