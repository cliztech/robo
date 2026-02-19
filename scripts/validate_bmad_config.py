#!/usr/bin/env python3
"""Validate required BMAD configuration files and structure."""

from __future__ import annotations

from pathlib import Path
import re

REPO_ROOT = Path(__file__).resolve().parents[1]
CORE_CONFIG = REPO_ROOT / "_bmad/core/config.yaml"
BMM_CONFIG = REPO_ROOT / "_bmad/bmm/config.yaml"
MANIFEST = REPO_ROOT / "_bmad/_config/manifest.yaml"

REQUIRED_KEYS = [
    "user_name",
    "communication_language",
    "document_output_language",
    "output_folder",
]


def parse_simple_yaml_kv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        if not key or key.startswith("-"):
            continue
        values[key] = value.strip()
    return values


def validate_file_exists(path: Path, errors: list[str]) -> None:
    if not path.exists():
        errors.append(f"Missing required file: {path.relative_to(REPO_ROOT)}")


def validate_bmm_config(errors: list[str]) -> None:
    core_values = parse_simple_yaml_kv(CORE_CONFIG)
    bmm_values = parse_simple_yaml_kv(BMM_CONFIG)

    for key in REQUIRED_KEYS:
        if key not in bmm_values or not bmm_values[key]:
            errors.append(f"_bmad/bmm/config.yaml missing required key: {key}")
            continue
        if bmm_values[key] != core_values.get(key):
            errors.append(
                f"_bmad/bmm/config.yaml key '{key}' must match _bmad/core/config.yaml"
            )


def count_top_level_key(content: str, key: str) -> int:
    target = f"{key}:"
    return sum(1 for line in content.splitlines() if line.startswith(target))


def validate_manifest(errors: list[str]) -> None:
    content = MANIFEST.read_text(encoding="utf-8")

    for key in ("installation", "modules"):
        count = count_top_level_key(content, key)
        if count != 1:
            errors.append(
                f"_bmad/_config/manifest.yaml must contain exactly one top-level '{key}' section (found {count})"
            )

    module_names = re.findall(r"(?m)^\s*-\s*name:\s*([^\s#]+)\s*$", content)
    if len(module_names) != len(set(module_names)):
        errors.append("_bmad/_config/manifest.yaml has duplicate module names")

    missing_modules = {"core", "bmm"} - set(module_names)
    if missing_modules:
        errors.append(
            "_bmad/_config/manifest.yaml missing module entries: "
            + ", ".join(sorted(missing_modules))
        )


def main() -> int:
    errors: list[str] = []

    for required in (CORE_CONFIG, BMM_CONFIG, MANIFEST):
        validate_file_exists(required, errors)

    if errors:
        for err in errors:
            print(f"ERROR: {err}")
        return 1

    validate_bmm_config(errors)
    validate_manifest(errors)

    if errors:
        for err in errors:
            print(f"ERROR: {err}")
        return 1

    print("BMAD config validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
