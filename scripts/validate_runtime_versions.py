#!/usr/bin/env python3
"""Validate canonical runtime/framework versions against repository manifests."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_MAP = ROOT / "docs/architecture/canonical_runtime_map.md"


class ValidationError(RuntimeError):
    pass


@dataclass(frozen=True, order=True)
class Semver:
    major: int
    minor: int
    patch: int


@dataclass(frozen=True)
class SemverInterval:
    lower: Semver | None = None
    lower_inclusive: bool = True
    upper: Semver | None = None
    upper_inclusive: bool = False


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_canonical_versions() -> dict[str, str]:
    text = CANONICAL_MAP.read_text(encoding="utf-8")
    marker = "## Canonical framework/runtime versions (CI-validated)"
    if marker not in text:
        raise ValidationError(f"Missing section: {marker}")

    section = text.split(marker, 1)[1]
    match = re.search(r"```json\n(.*?)\n```", section, flags=re.DOTALL)
    if not match:
        raise ValidationError("Missing canonical JSON block in runtime map")

    return json.loads(match.group(1))


def load_python_requires(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(r'^requires-python\s*=\s*"([^"]+)"', text, flags=re.MULTILINE)
    if not match:
        raise ValidationError(f"requires-python not found in {path}")
    return match.group(1)


def parse_semver(value: str) -> Semver | None:
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)", value.strip())
    if not match:
        return None
    return Semver(int(match.group(1)), int(match.group(2)), int(match.group(3)))


def parse_semver_interval(spec: str) -> SemverInterval | None:
    normalized = spec.strip()

    if normalized.startswith("^"):
        base = parse_semver(normalized[1:])
        if base is None:
            return None
        if base.major > 0:
            upper = Semver(base.major + 1, 0, 0)
        elif base.minor > 0:
            upper = Semver(0, base.minor + 1, 0)
        else:
            upper = Semver(0, 0, base.patch + 1)
        return SemverInterval(lower=base, lower_inclusive=True, upper=upper, upper_inclusive=False)

    if normalized.startswith("~"):
        base = parse_semver(normalized[1:])
        if base is None:
            return None
        upper = Semver(base.major, base.minor + 1, 0)
        return SemverInterval(lower=base, lower_inclusive=True, upper=upper, upper_inclusive=False)

    exact = parse_semver(normalized)
    if exact is not None:
        return SemverInterval(lower=exact, lower_inclusive=True, upper=exact, upper_inclusive=True)

    bounds = SemverInterval()
    comparators = normalized.split()
    if not comparators:
        return None

    for comparator in comparators:
        match = re.fullmatch(r"(>=|>|<=|<)(\d+\.\d+\.\d+)", comparator)
        if not match:
            return None

        operator, version_text = match.groups()
        version = parse_semver(version_text)
        if version is None:
            return None

        if operator in {">=", ">"}:
            inclusive = operator == ">="
            if bounds.lower is None or version > bounds.lower or (
                version == bounds.lower and inclusive and not bounds.lower_inclusive
            ):
                bounds = SemverInterval(
                    lower=version,
                    lower_inclusive=inclusive,
                    upper=bounds.upper,
                    upper_inclusive=bounds.upper_inclusive,
                )
        else:
            inclusive = operator == "<="
            if bounds.upper is None or version < bounds.upper or (
                version == bounds.upper and inclusive and not bounds.upper_inclusive
            ):
                bounds = SemverInterval(
                    lower=bounds.lower,
                    lower_inclusive=bounds.lower_inclusive,
                    upper=version,
                    upper_inclusive=inclusive,
                )

    return bounds


def _lower_bound_before(actual: SemverInterval, expected: SemverInterval) -> bool:
    if expected.lower is None or actual.lower is None:
        return False
    if actual.lower < expected.lower:
        return True
    if actual.lower > expected.lower:
        return False
    return actual.lower_inclusive and not expected.lower_inclusive


def _upper_bound_after(actual: SemverInterval, expected: SemverInterval) -> bool:
    if expected.upper is None or actual.upper is None:
        return False
    if actual.upper > expected.upper:
        return True
    if actual.upper < expected.upper:
        return False
    return actual.upper_inclusive and not expected.upper_inclusive


def semver_range_compatible(actual: str, expected: str) -> bool:
    actual_interval = parse_semver_interval(actual)
    expected_interval = parse_semver_interval(expected)

    if actual_interval is None or expected_interval is None:
        return actual == expected

    if _lower_bound_before(actual_interval, expected_interval):
        return False
    if _upper_bound_after(actual_interval, expected_interval):
        return False
    return True


def expect_version(actual: str | None, expected: str, label: str, errors: list[str]) -> None:
    if actual is None:
        errors.append(f"{label}: expected '{expected}', got 'None'")
        return

    if parse_semver_interval(expected) is None and actual != expected:
        errors.append(f"{label}: expected '{expected}', got '{actual}'")
        return

    if not semver_range_compatible(actual, expected):
        errors.append(f"{label}: expected semver-compatible with '{expected}', got '{actual}'")


def main() -> None:
    canonical = load_canonical_versions()
    errors: list[str] = []

    root_pkg = load_json(ROOT / "package.json")
    dj_pkg = load_json(ROOT / "apps/dj-console/package.json")
    raw_pkg = load_json(ROOT / "radio-agentic/apps/console-web/package.json")
    remote_pkg = load_json(ROOT / "radio-agentic/apps/remote-web/package.json")
    library_pkg = load_json(ROOT / "radio-agentic/services/library/package.json")
    requests_pkg = load_json(ROOT / "radio-agentic/services/requests/package.json")
    audio_pkg = load_json(ROOT / "radio-agentic/services/audio-engine/package.json")
    service_packages = sorted((ROOT / "radio-agentic/services").glob("*/package.json"))
    py_requires = load_python_requires(ROOT / "dgn-airwaves/pyproject.toml")

    expect_version(root_pkg.get("engines", {}).get("node"), canonical["node"], "package.json engines.node", errors)
    expect_version(root_pkg.get("dependencies", {}).get("next"), canonical["next"], "package.json dependencies.next", errors)
    expect_version(root_pkg.get("dependencies", {}).get("react"), canonical["react_root"], "package.json dependencies.react", errors)
    expect_version(root_pkg.get("devDependencies", {}).get("typescript"), canonical["typescript_root"], "package.json devDependencies.typescript", errors)

    expect_version(dj_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "apps/dj-console dependencies.react", errors)
    expect_version(dj_pkg.get("devDependencies", {}).get("typescript"), canonical["typescript_dj_console"], "apps/dj-console devDependencies.typescript", errors)
    expect_version(dj_pkg.get("devDependencies", {}).get("vite"), canonical["vite"], "apps/dj-console devDependencies.vite", errors)

    expect_version(raw_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "radio-agentic/apps/console-web dependencies.react", errors)
    expect_version(remote_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "radio-agentic/apps/remote-web dependencies.react", errors)

    expect_version(library_pkg.get("dependencies", {}).get("express"), canonical["express"], "radio-agentic/services/library dependencies.express", errors)
    expect_version(requests_pkg.get("dependencies", {}).get("express"), canonical["express"], "radio-agentic/services/requests dependencies.express", errors)

    expect_version(audio_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/audio-engine dependencies.nats", errors)
    expect_version(library_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/library dependencies.nats", errors)
    expect_version(requests_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/requests dependencies.nats", errors)

    for service_manifest in service_packages:
        service_pkg = load_json(service_manifest)
        service_name = service_manifest.relative_to(ROOT).as_posix()
        dependencies = service_pkg.get("dependencies", {})
        if "nats" in dependencies:
            expect_version(dependencies.get("nats"), canonical["nats"], f"{service_name} dependencies.nats", errors)
        if "express" in dependencies:
            expect_version(dependencies.get("express"), canonical["express"], f"{service_name} dependencies.express", errors)

    expect_version(py_requires, canonical["python"], "dgn-airwaves/pyproject.toml requires-python", errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    print("Runtime/version declarations are aligned with canonical manifests.")


if __name__ == "__main__":
    main()
