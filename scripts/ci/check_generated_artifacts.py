from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIRS = [ROOT / "src", ROOT / "backend"]


@dataclass(frozen=True)
class ArtifactRule:
    pattern: str
    reason: str


ARTIFACT_RULES = [
    ArtifactRule("**/*.egg-info", "setuptools egg metadata must not be stored in source trees"),
    ArtifactRule("**/*.dist-info", "wheel metadata must not be stored in source trees"),
    ArtifactRule("**/__pycache__", "compiled bytecode cache must not be committed"),
]


def main() -> int:
    violations: list[tuple[Path, ArtifactRule]] = []

    for source_dir in SOURCE_DIRS:
        if not source_dir.exists():
            continue
        for rule in ARTIFACT_RULES:
            for matched in source_dir.glob(rule.pattern):
                violations.append((matched, rule))

    if violations:
        print("Generated artifact check failed. Remove generated files from source directories:")
        for matched, rule in sorted(violations, key=lambda item: item[0].as_posix()):
            print(f"- {matched.relative_to(ROOT).as_posix()} ({rule.reason})")
        return 1

    checked = ", ".join(path.relative_to(ROOT).as_posix() for path in SOURCE_DIRS)
    print(f"Generated artifact check passed for source directories: {checked}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
