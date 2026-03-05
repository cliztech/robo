from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCAN_ROOTS = [
    ROOT / "src",
    ROOT / "backend",
    ROOT / "apps",
    ROOT / "dgn-airwaves" / "src",
    ROOT / "dgn-robo-rippa" / "src",
]
IGNORED_PARTS = {"node_modules", ".git", ".venv", "venv"}

ARTIFACT_PATTERNS = [
    "*.egg-info",
    ".eggs",
    "pip-wheel-metadata",
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    "build",
    "dist",
    ".next",
    "coverage",
    "*.tsbuildinfo",
]


def main() -> int:
    matches: set[Path] = set()

    for scan_root in SCAN_ROOTS:
        if not scan_root.exists():
            continue
        for pattern in ARTIFACT_PATTERNS:
            for candidate in scan_root.rglob(pattern):
                if any(part in IGNORED_PARTS for part in candidate.parts):
                    continue
                matches.add(candidate)

    if matches:
        print("Generated artifact preflight check failed.")
        print("Remove generated artifacts from source/application roots:")
        for path in sorted(matches):
            print(f"- {path.relative_to(ROOT).as_posix()}")
        return 1

    print("Generated artifact preflight check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
