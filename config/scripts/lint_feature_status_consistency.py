#!/usr/bin/env python3
"""Lint tracked feature sections for checklist-vs-status contradictions.

Usage:
    python config/scripts/lint_feature_status_consistency.py TODO_v1_1.md
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path


HEADER_RE = re.compile(
    r"^###\s+\d+\)\s+.+?\(`(?P<feature>feature_[^)`]+)`\)\s*$", re.MULTILINE
)
WEEKLY_HEADER_RE = re.compile(r"\*\*Weekly updates \(SoT for `(?P<feature>feature_[^`]+)`\)\*\*")
FRACTION_RE = re.compile(r"(?P<numerator>\d+)\s*/\s*(?P<denominator>\d+)")
OPEN_RE = re.compile(r"\b(open|pending|stale|not yet)\b", re.IGNORECASE)
CLOSED_RE = re.compile(r"\b(complete|completed|closed|done|100%)\b", re.IGNORECASE)


@dataclass
class FeatureSection:
    feature: str
    start: int
    end: int
    text: str


def iter_sections(text: str) -> list[FeatureSection]:
    matches = list(HEADER_RE.finditer(text))
    sections: list[FeatureSection] = []
    for idx, match in enumerate(matches):
        start = match.start()
        if idx + 1 < len(matches):
            end = matches[idx + 1].start()
        else:
            next_h2 = text.find("\n## ", start)
            end = next_h2 if next_h2 >= 0 else len(text)
        sections.append(
            FeatureSection(
                feature=match.group("feature"),
                start=start,
                end=end,
                text=text[start:end],
            )
        )
    return sections


def checklist_counts(section_text: str) -> tuple[int, int]:
    checked = len(re.findall(r"^- \[x\]", section_text, flags=re.MULTILINE))
    total = len(re.findall(r"^- \[(?:x| )\]", section_text, flags=re.MULTILINE))
    return checked, total


def extract_weekly_block(section_text: str, feature: str) -> str:
    marker = f"**Weekly updates (SoT for `{feature}`)**"
    marker_idx = section_text.find(marker)
    if marker_idx < 0:
        return ""
    remaining = section_text[marker_idx + len(marker) :]
    next_header_idx = remaining.find("\n### ")
    return remaining[: next_header_idx if next_header_idx >= 0 else len(remaining)]


def lint(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    issues: list[str] = []

    for section in iter_sections(text):
        checked, total = checklist_counts(section.text)
        if total == 0:
            continue

        weekly = extract_weekly_block(section.text, section.feature)
        if not weekly:
            continue

        for fraction_match in FRACTION_RE.finditer(weekly):
            observed_total = int(fraction_match.group("denominator"))
            observed_checked = int(fraction_match.group("numerator"))
            if observed_total != total or observed_checked != checked:
                issues.append(
                    f"{section.feature}: weekly status reports {observed_checked}/{observed_total} "
                    f"but checklist is {checked}/{total}."
                )

        if checked == total and OPEN_RE.search(weekly):
            issues.append(
                f"{section.feature}: checklist is fully complete ({checked}/{total}) but weekly block still signals open/pending/stale."
            )
        if checked < total and CLOSED_RE.search(weekly):
            issues.append(
                f"{section.feature}: checklist is incomplete ({checked}/{total}) but weekly block signals complete/closed."
            )

    return issues


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python config/scripts/lint_feature_status_consistency.py <markdown-file>")
        return 2

    target = Path(sys.argv[1])
    if not target.exists():
        print(f"error: file not found: {target}")
        return 2

    findings = lint(target)
    if findings:
        print("Feature status consistency check failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("Feature status consistency check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
