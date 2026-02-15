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

HEADER_PATTERN = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")
TASK_PATTERN = re.compile(r"^\s*[-*]\s+\[\s\]\s+(.*\S)\s*$")
PHASE_PATTERN = re.compile(r"\bP(\d+)\b", re.IGNORECASE)


@dataclass(frozen=True)
class OpenTask:
    """Single open task with minimal context for triage."""

    source: Path
    line_number: int
    section: str
    phase: str
    text: str


def collect_open_tasks(markdown_path: Path) -> list[OpenTask]:
    """Collect unchecked markdown checklist items from a TODO board."""
    if not markdown_path.exists():
        return []

    current_section = "(root)"
    current_phase = "Unphased"
    open_tasks: list[OpenTask] = []

    for line_number, raw_line in enumerate(
        markdown_path.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        header_match = HEADER_PATTERN.match(raw_line)
        if header_match:
            current_section = header_match.group(2)
            phase_match = PHASE_PATTERN.search(current_section)
            current_phase = (
                f"P{int(phase_match.group(1))}" if phase_match else "Unphased"
            )
            continue

        task_match = TASK_PATTERN.match(raw_line)
        if task_match:
            open_tasks.append(
                OpenTask(
                    source=markdown_path,
                    line_number=line_number,
                    section=current_section,
                    phase=current_phase,
                    text=task_match.group(1),
                )
            )

    return open_tasks


def render_queue(tasks: list[OpenTask], limit: int) -> str:
    """Render the open-task queue with stable ordering and truncation."""
    if not tasks:
        return "No open tasks found in the selected roadmap files."

    phase_totals = summarize_phases(tasks)
    next_phase = identify_next_phase(phase_totals)

    lines: list[str] = [f"Open task queue ({min(limit, len(tasks))}/{len(tasks)} shown):"]
    if next_phase:
        lines.append(f"Next unfinished phase: {next_phase}")
    lines.append(render_phase_summary(phase_totals))

    for index, task in enumerate(tasks[:limit], start=1):
        rel_source = task.source.relative_to(ROOT)
        lines.append(
            f"{index:>2}. [{rel_source}:{task.line_number}] "
            f"{task.phase} | {task.section} -> {task.text}"
        )

    return "\n".join(lines)


def summarize_phases(tasks: list[OpenTask]) -> dict[str, int]:
    phase_totals: dict[str, int] = {}
    for task in tasks:
        phase_totals[task.phase] = phase_totals.get(task.phase, 0) + 1
    return phase_totals


def identify_next_phase(phase_totals: dict[str, int]) -> str | None:
    phased_entries: list[tuple[int, str]] = []
    unphased_labels: list[str] = []

    for phase_label in phase_totals:
        match = PHASE_PATTERN.search(phase_label)
        if match:
            phased_entries.append((int(match.group(1)), phase_label))
        else:
            unphased_labels.append(phase_label)

    if phased_entries:
        phased_entries.sort(key=lambda item: item[0])
        return phased_entries[0][1]

    if unphased_labels:
        unphased_labels.sort()
        return unphased_labels[0]

    return None


def render_phase_summary(phase_totals: dict[str, int]) -> str:
    if not phase_totals:
        return "Open tasks by phase: n/a"

    def sort_key(item: tuple[str, int]) -> tuple[int, str]:
        label, _ = item
        match = PHASE_PATTERN.search(label)
        if match:
            return (int(match.group(1)), label)
        return (999, label)

    summary_bits = [
        f"{label}={count}" for label, count in sorted(phase_totals.items(), key=sort_key)
    ]
    return "Open tasks by phase: " + ", ".join(summary_bits)


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


def run_once(todo_files: list[Path], limit: int) -> int:
    tasks: list[OpenTask] = []
    missing_files: list[Path] = []

    for markdown_path in todo_files:
        if markdown_path.exists():
            tasks.extend(collect_open_tasks(markdown_path))
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
    if not todo_files:
        print("error: no roadmap files found to scan", file=sys.stderr)
        return 2

    if not args.loop:
        return run_once(todo_files, limit=args.limit)

    try:
        while True:
            print(f"\n=== Roadmap loop tick @ {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
            run_once(todo_files, limit=args.limit)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped roadmap loop.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
