from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
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


def main() -> int:
    missing = [doc for doc in REQUIRED_DOCS if not (ROOT / doc).exists()]
    if missing:
        print('Documentation consistency check failed. Missing required docs:')
        for path in missing:
            print(f'- {path.as_posix()}')
        return 1

    print(f'Documentation consistency check passed ({len(REQUIRED_DOCS)} required docs present).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
