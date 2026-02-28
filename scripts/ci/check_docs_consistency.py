from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
README_PATH = ROOT / 'README.md'
REQUIRED_DOCS = [
    Path('README.md'),
    Path('docs/PLANS.md'),
    Path('docs/DESIGN.md'),
    Path('docs/PRODUCT_SENSE.md'),
    Path('docs/RELIABILITY.md'),
    Path('docs/SECURITY.md'),
    Path('docs/operations/agent_execution_commands.md'),
    Path('docs/operations/subagent_execution_playbook.md'),
]
DOC_INDEX_START = '## 📁 Documentation Files'
DOC_INDEX_END = '## 🚀 Quick Start'


def _check_required_docs() -> list[str]:
    missing = [doc for doc in REQUIRED_DOCS if not (ROOT / doc).exists()]
    if not missing:
        return []
    return [f'Missing required doc: {path.as_posix()}' for path in missing]


def _extract_readme_doc_index_lines(readme_text: str) -> list[str]:
    if DOC_INDEX_START not in readme_text or DOC_INDEX_END not in readme_text:
        return []
    section = readme_text.split(DOC_INDEX_START, maxsplit=1)[1].split(DOC_INDEX_END, maxsplit=1)[0]
    return [line.strip() for line in section.splitlines() if re.match(r'^\d+\.\s+', line.strip())]


def _check_readme_title(readme_text: str) -> list[str]:
    lines = readme_text.splitlines()
    h1_titles = [line.strip() for line in lines if line.startswith('# ')]
    if len(h1_titles) != 1:
        return [f'README.md must contain exactly one H1 title, found {len(h1_titles)}.']
    return []


def _check_readme_doc_index(readme_text: str) -> list[str]:
    errors: list[str] = []
    index_lines = _extract_readme_doc_index_lines(readme_text)
    if not index_lines:
        return ['README.md documentation index section not found or empty.']

    numbers = [int(re.match(r'^(\d+)\.', line).group(1)) for line in index_lines]
    expected = list(range(1, len(numbers) + 1))
    if numbers != expected:
        errors.append(
            'README.md documentation index numbering must be sequential starting at 1 '
            f'(found {numbers}, expected {expected}).'
        )

    return errors


def main() -> int:
    failures: list[str] = []
    failures.extend(_check_required_docs())

    readme_text = README_PATH.read_text(encoding='utf-8')
    failures.extend(_check_readme_title(readme_text))
    failures.extend(_check_readme_doc_index(readme_text))

    if failures:
        print('Documentation consistency check failed:')
        for failure in failures:
            print(f'- {failure}')
        return 1

    print(
        'Documentation consistency check passed '
        f'({len(REQUIRED_DOCS)} required docs + README structure checks).'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
