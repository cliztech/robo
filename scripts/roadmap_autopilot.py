#!/usr/bin/env python3
"""Roadmap autopilot helper for surfacing the next actionable TODOs.

This utility scans markdown TODO boards, extracts open checkbox items, and
prints a deterministic execution queue. It can also run continuously to act as
an operator-facing loop while tasks are being completed.
"""

from __future__ import annotations

import argparse
import datetime as dt
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
CHECKBOX_PATTERN = re.compile(r"^\s*[-*]\s+\[(?P<state>[ xX])\]\s+(?P<text>.*\S)\s*$")
PHASE_PATTERN = re.compile(r"\bP(\d+)\b", re.IGNORECASE)
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
TI_REFERENCE_PATTERN = re.compile(r"\bTI-\d{3}\b", re.IGNORECASE)
CANONICAL_TASK_KEY_PATTERN = re.compile(
    r"\b(?:canonical[_ -]?task[_ -]?key|task[_ -]?key)\s*[:=]\s*([a-z0-9_.-]+)",
    re.IGNORECASE,
)
NON_ALNUM_PATTERN = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class OpenTask:
    """Single open task with minimal context for triage."""

    source: Path
    line_number: int
    section: str
    phase: str
    text: str


@dataclass(frozen=True)
class QueueItem:
    """Queue item from TODO checklists or roadmap/workflow action bullets."""

    source: Path
    line_number: int
    section: str
    phase: str
    phase_namespace: str
    text: str
    kind: str


VALID_PHASE_NAMESPACES = {"delivery", "workflow", "none"}


def classify_phase_namespace(kind: str) -> str:
    if kind == "todo":
        return "delivery"
    if kind == "workflow":
        return "workflow"
    return "none"


def validate_phase_namespace(tasks: list[QueueItem]) -> None:
    """Reject phase records missing an explicit namespace."""
    for task in tasks:
        if task.phase_namespace not in VALID_PHASE_NAMESPACES:
            rel_source = task.source.relative_to(ROOT)
            raise RuntimeError(
                "build plan generation aborted: missing/invalid phase namespace "
                f"for {rel_source}:{task.line_number} "
                f"(phase='{task.phase}', namespace='{task.phase_namespace}')"
            )
@dataclass(frozen=True)
class ReconciledSkip:
    """Task excluded during state reconciliation."""

    item: QueueItem
    reason: str
    matched_value: str


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

        task_match = CHECKBOX_PATTERN.match(raw_line)
        if task_match and task_match.group("state") == " ":
            open_tasks.append(
                OpenTask(
                    source=markdown_path,
                    line_number=line_number,
                    section=current_section,
                    phase=current_phase,
                    text=task_match.group("text"),
                )
            )

    return open_tasks


def collect_closed_tasks(markdown_path: Path) -> list[OpenTask]:
    """Collect checked markdown checklist items from a TODO board."""
    if not markdown_path.exists():
        return []

    current_section = "(root)"
    current_phase = "Unphased"
    closed_tasks: list[OpenTask] = []

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

        task_match = CHECKBOX_PATTERN.match(raw_line)
        if task_match and task_match.group("state").lower() == "x":
            closed_tasks.append(
                OpenTask(
                    source=markdown_path,
                    line_number=line_number,
                    section=current_section,
                    phase=current_phase,
                    text=task_match.group("text"),
                )
            )

    return closed_tasks


def normalized_title_fingerprint(text: str) -> str:
    lowered = text.lower()
    without_links = re.sub(r"\[[^\]]+\]\([^\)]+\)", " ", lowered)
    without_ti = TI_REFERENCE_PATTERN.sub(" ", without_links)
    without_metadata = re.sub(r"\([^\)]*\)", " ", without_ti)
    without_formatting = re.sub(r"[`*_#>]", " ", without_metadata)
    collapsed = NON_ALNUM_PATTERN.sub(" ", without_formatting)
    return " ".join(collapsed.split())


def extract_ti_references(text: str) -> set[str]:
    return {match.group(0).upper() for match in TI_REFERENCE_PATTERN.finditer(text)}


def extract_canonical_task_keys(text: str) -> set[str]:
    return {match.group(1).lower() for match in CANONICAL_TASK_KEY_PATTERN.finditer(text)}


def reconcile_tasks(
    tasks: list[QueueItem],
    closed_tasks: list[OpenTask],
) -> tuple[list[QueueItem], list[ReconciledSkip]]:
    """Drop open queue rows already closed in TODO.md tracked issue checklist."""
    closed_tis: set[str] = set()
    closed_keys: set[str] = set()
    closed_fingerprints: set[str] = set()

    for item in closed_tasks:
        ti_refs = extract_ti_references(item.text)
        if not ti_refs and not extract_canonical_task_keys(item.text):
            continue
        closed_tis.update(ti_refs)
        closed_keys.update(extract_canonical_task_keys(item.text))
        fingerprint = normalized_title_fingerprint(item.text)
        if fingerprint:
            closed_fingerprints.add(fingerprint)

    reconciled: list[QueueItem] = []
    skipped: list[ReconciledSkip] = []

    for item in tasks:
        item_tis = extract_ti_references(item.text)
        matched_ti = sorted(item_tis & closed_tis)
        if matched_ti:
            skipped.append(
                ReconciledSkip(item=item, reason="closed_ti_reference", matched_value=matched_ti[0])
            )
            continue

        item_keys = extract_canonical_task_keys(item.text)
        matched_key = sorted(item_keys & closed_keys)
        if matched_key:
            skipped.append(
                ReconciledSkip(item=item, reason="closed_canonical_task_key", matched_value=matched_key[0])
            )
            continue

        item_fingerprint = normalized_title_fingerprint(item.text)
        if item_fingerprint and item_fingerprint in closed_fingerprints:
            skipped.append(
                ReconciledSkip(
                    item=item,
                    reason="closed_title_fingerprint",
                    matched_value=item_fingerprint,
                )
            )
            continue

        reconciled.append(item)

    return reconciled, skipped


def render_queue(tasks: list[QueueItem], limit: int) -> str:
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
            f"{task.phase} [{task.phase_namespace}] | {task.section} -> {task.text}"
            f" ({task.kind})"
        )

    return "\n".join(lines)


def summarize_phases(tasks: list[QueueItem]) -> dict[str, int]:
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




def write_build_plan(
    tasks: list[QueueItem],
    output_path: Path,
    skipped_tasks: list[ReconciledSkip] | None = None,
) -> None:
    """Write a markdown build plan grouped by phase from unfinished tasks."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    validate_phase_namespace(tasks)

    by_phase: dict[str, list[QueueItem]] = {}
    for task in tasks:
        by_phase.setdefault(task.phase, []).append(task)

    generated_at = dt.datetime.now(dt.timezone.utc).isoformat()
    lines = [
        "# Unfinished Task Build Plan",
        "",
        f"Generated by `scripts/roadmap_autopilot.py` at {generated_at}.",
        "",
        f"Total unfinished tasks discovered: **{len(tasks)}**.",
        "",
    ]

    phase_totals = summarize_phases(tasks)
    lines.append(render_phase_summary(phase_totals))
    lines.append("")

    skipped = skipped_tasks or []
    lines.append(f"Reconciled/skipped tasks: **{len(skipped)}**.")
    lines.append("")

    if skipped:
        lines.append("## Reconciled / Skipped")
        lines.append("")
        for entry in sorted(
            skipped,
            key=lambda item: (str(item.item.source), item.item.line_number),
        ):
            rel_source = entry.item.source.relative_to(ROOT)
            lines.append(
                "- `"
                f"{rel_source}:{entry.item.line_number}` ({entry.item.kind}) "
                f"{entry.item.section} -> {entry.item.text} "
                f"[reason={entry.reason}; matched={entry.matched_value}]"
            )
        lines.append("")

    def sort_key(label: str) -> tuple[int, str]:
        match = PHASE_PATTERN.search(label)
        if match:
            return (int(match.group(1)), label)
        return (999, label)

    for phase in sorted(by_phase, key=sort_key):
        lines.append(f"## {phase}")
        lines.append("")
        for task in sorted(by_phase[phase], key=lambda item: (str(item.source), item.line_number)):
            rel_source = task.source.relative_to(ROOT)
            lines.append(
                f"- [ ] `{rel_source}:{task.line_number}` ({task.kind}) "
                f"[phase_namespace={task.phase_namespace}] "
                f"{task.section} -> {task.text}"
            )
        lines.append("")

    rendered = "\n".join(lines).rstrip() + "\n"
    generated_header = "Generated by `scripts/roadmap_autopilot.py` at "
    generated_header_count = sum(
        1 for line in rendered.splitlines() if line.startswith(generated_header)
    )
    if generated_header_count != 1:
        raise RuntimeError(
            "build plan generation aborted: duplicate or missing generated header "
            f"(count={generated_header_count})"
        )

    output_path.write_text(rendered, encoding="utf-8")

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
    parser.add_argument(
        "--build-plan",
        default="",
        help=(
            "Optional markdown path to write a generated build plan from all "
            "unfinished tasks."
        ),
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

        phase_match = PHASE_PATTERN.search(current_section)
        phase = f"P{int(phase_match.group(1))}" if phase_match else "Unphased"

        items.append(
            QueueItem(
                source=markdown_path,
                line_number=line_number,
                section=current_section,
                phase=phase,
                phase_namespace=classify_phase_namespace("workflow"),
                text=normalized,
                kind="workflow",
            )
        )

    return items


def run_once(
    todo_files: list[Path],
    workflow_files: list[Path],
    limit: int,
    build_plan: str = "",
) -> int:
    tasks: list[QueueItem] = []
    missing_files: list[Path] = []

    closed_todo_tracked_tasks: list[OpenTask] = []

    for markdown_path in todo_files:
        if markdown_path.exists():
            tasks.extend(
                QueueItem(
                    source=task.source,
                    line_number=task.line_number,
                    section=task.section,
                    phase=task.phase,
                    phase_namespace=classify_phase_namespace("todo"),
                    text=task.text,
                    kind="todo",
                )
                for task in collect_open_tasks(markdown_path)
            )
            if markdown_path.name == "TODO.md":
                closed_todo_tracked_tasks.extend(collect_closed_tasks(markdown_path))
        else:
            missing_files.append(markdown_path)

    for markdown_path in workflow_files:
        if markdown_path.exists():
            tasks.extend(collect_workflow_actions(markdown_path))
        else:
            missing_files.append(markdown_path)

    tasks.sort(key=lambda item: (str(item.source), item.line_number))
    tasks, skipped_tasks = reconcile_tasks(tasks, closed_todo_tracked_tasks)

    if missing_files:
        for missing in missing_files:
            print(f"warning: file not found: {missing}", file=sys.stderr)

    print(render_queue(tasks, limit=limit))

    if build_plan:
        output_path = (ROOT / build_plan).resolve()
        try:
            output_path.relative_to(ROOT)
        except ValueError:
            print(f"error: build plan path outside project root: {build_plan}", file=sys.stderr)
            return 2
        write_build_plan(tasks, output_path, skipped_tasks=skipped_tasks)
        rel_output = output_path.relative_to(ROOT)
        print(f"\nWrote build plan: {rel_output}")

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
        return run_once(
            todo_files,
            workflow_files=workflow_files,
            limit=args.limit,
            build_plan=args.build_plan,
        )

    try:
        while True:
            print(f"\n=== Roadmap loop tick @ {time.strftime('%Y-%m-%d %H:%M:%S')} ===")
            run_once(
                todo_files,
                workflow_files=workflow_files,
                limit=args.limit,
                build_plan=args.build_plan,
            )
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped roadmap loop.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
