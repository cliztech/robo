from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

EXPECTED_ROOT_FILES = {
    'DGN-DJ_Launcher.bat',
    'RoboDJ_Launcher.bat',
    'DGNDJ_Fullstack_Launcher.bat',
    'DGN-DJ_Fullstack_Launcher.bat',
}

CANONICAL_DOC = ROOT / 'docs' / 'launcher_entrypoints.md'
RUNTIME_MAP_DOC = ROOT / 'docs' / 'architecture' / 'canonical_runtime_map.md'
AGENTS_DOC = ROOT / 'AGENTS.md'
README_DOC = ROOT / 'README.md'

REQUIRED_MARKERS = {
    CANONICAL_DOC: [
        'DGN-DJ_Launcher.bat',
        'RoboDJ_Launcher.bat',
        'DGNDJ_Fullstack_Launcher.bat',
        'DGN-DJ_Fullstack_Launcher.bat',
        'Canonical',
        'Shim',
        'Deprecated',
        'intentionally excluded from git',
    ],
    RUNTIME_MAP_DOC: [
        'Launcher naming policy (canonical vs compatibility)',
        'Bundled artifact policy',
        'DGN-DJ_Launcher.bat',
        'RoboDJ_Launcher.bat',
        'DGNDJ_Fullstack_Launcher.bat',
        'DGN-DJ_Fullstack_Launcher.bat',
        'intentionally excluded from git history',
    ],
    AGENTS_DOC: [
        'DGN-DJ_Launcher.bat',
        'RoboDJ_Launcher.bat',
        'DGNDJ_Fullstack_Launcher.bat',
        'DGN-DJ_Fullstack_Launcher.bat',
        'intentionally not tracked in git',
    ],
    README_DOC: [
        'docs/launcher_entrypoints.md',
        'DGNDJ_Fullstack_Launcher.bat',
        'DGN-DJ_Fullstack_Launcher.bat',
        'not tracked in git',
    ],
}


def _check_root_entrypoints() -> list[str]:
    failures: list[str] = []
    tracked = {p.name for p in ROOT.iterdir() if p.is_file()}

    missing = sorted(EXPECTED_ROOT_FILES - tracked)
    extra = sorted(name for name in tracked if name.endswith('_Launcher.bat') and name not in EXPECTED_ROOT_FILES)

    if missing:
        failures.append(f'Missing required root launcher files: {missing}')
    if extra:
        failures.append(f'Unexpected launcher files at repo root (update policy/docs intentionally): {extra}')

    return failures


def _check_document_markers() -> list[str]:
    failures: list[str] = []

    for doc_path, markers in REQUIRED_MARKERS.items():
        if not doc_path.exists():
            failures.append(f'Missing required documentation file: {doc_path.relative_to(ROOT).as_posix()}')
            continue

        text = doc_path.read_text(encoding='utf-8')
        for marker in markers:
            if marker not in text:
                failures.append(
                    f"Missing marker '{marker}' in {doc_path.relative_to(ROOT).as_posix()}"
                )

    return failures


def main() -> int:
    failures: list[str] = []
    failures.extend(_check_root_entrypoints())
    failures.extend(_check_document_markers())

    if failures:
        print('Launcher entrypoint contract check failed:')
        for failure in failures:
            print(f'- {failure}')
        return 1

    print('Launcher entrypoint contract check passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
