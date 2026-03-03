#!/usr/bin/env python3
"""Validate tracked issue markdown files have one TI header, one status block, and one DoD section."""

from __future__ import annotations

from pathlib import Path
import re

TRACKED_ISSUES_DIR = Path('docs/exec-plans/active/tracked-issues')
HEADER_RE = re.compile(r'^# TI-\d{3}\b', re.MULTILINE)
STATUS_RE = re.compile(r'^- \*\*Status:\*\*\s+', re.MULTILINE)
DOD_RE = re.compile(r'^## Definition of done\s*$', re.MULTILINE)


def main() -> int:
    failures: list[str] = []

    for path in sorted(TRACKED_ISSUES_DIR.glob('TI-*.md')):
        content = path.read_text(encoding='utf-8')
        header_count = len(HEADER_RE.findall(content))
        status_count = len(STATUS_RE.findall(content))
        dod_count = len(DOD_RE.findall(content))

        if header_count != 1 or status_count != 1 or dod_count != 1:
            failures.append(
                f"{path}: header={header_count}, status={status_count}, definition_of_done={dod_count}"
            )

    if failures:
        print('Tracked issue format validation failed:')
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f'Validated {len(list(TRACKED_ISSUES_DIR.glob("TI-*.md")))} tracked issue files.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
