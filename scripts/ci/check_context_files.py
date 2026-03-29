from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTEXT_DIR = ROOT / '.context'
REQUIRED_FILES = (
    'productContext.md',
    'activeContext.md',
    'systemPatterns.md',
    'techStack.md',
    'progress.md',
)


def main() -> int:
    missing = [name for name in REQUIRED_FILES if not (CONTEXT_DIR / name).is_file()]

    if missing:
        print('Context bootstrap check failed.')
        print('Missing required files:')
        for name in missing:
            print(f'- .context/{name}')
        return 1

    print(f'Context bootstrap check passed ({len(REQUIRED_FILES)} files present).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
