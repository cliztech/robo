#!/usr/bin/env python3
"""Validate canonical runtime/framework versions against repository manifests."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_MAP = ROOT / "docs/architecture/canonical_runtime_map.md"


class ValidationError(RuntimeError):
    pass


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


def expect_equal(actual: str | None, expected: str, label: str, errors: list[str]) -> None:
    if actual != expected:
        errors.append(f"{label}: expected '{expected}', got '{actual}'")


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
    py_requires = load_python_requires(ROOT / "dgn-airwaves/pyproject.toml")

    expect_equal(root_pkg.get("engines", {}).get("node"), canonical["node"], "package.json engines.node", errors)
    expect_equal(root_pkg.get("dependencies", {}).get("next"), canonical["next"], "package.json dependencies.next", errors)
    expect_equal(root_pkg.get("dependencies", {}).get("react"), canonical["react_root"], "package.json dependencies.react", errors)
    expect_equal(root_pkg.get("devDependencies", {}).get("typescript"), canonical["typescript_root"], "package.json devDependencies.typescript", errors)

    expect_equal(dj_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "apps/dj-console dependencies.react", errors)
    expect_equal(dj_pkg.get("devDependencies", {}).get("typescript"), canonical["typescript_dj_console"], "apps/dj-console devDependencies.typescript", errors)
    expect_equal(dj_pkg.get("devDependencies", {}).get("vite"), canonical["vite"], "apps/dj-console devDependencies.vite", errors)

    expect_equal(raw_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "radio-agentic/apps/console-web dependencies.react", errors)
    expect_equal(remote_pkg.get("dependencies", {}).get("react"), canonical["react_workspace"], "radio-agentic/apps/remote-web dependencies.react", errors)

    expect_equal(library_pkg.get("dependencies", {}).get("express"), canonical["express"], "radio-agentic/services/library dependencies.express", errors)
    expect_equal(requests_pkg.get("dependencies", {}).get("express"), canonical["express"], "radio-agentic/services/requests dependencies.express", errors)

    expect_equal(audio_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/audio-engine dependencies.nats", errors)
    expect_equal(library_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/library dependencies.nats", errors)
    expect_equal(requests_pkg.get("dependencies", {}).get("nats"), canonical["nats"], "radio-agentic/services/requests dependencies.nats", errors)

    expect_equal(py_requires, canonical["python"], "dgn-airwaves/pyproject.toml requires-python", errors)

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    print("Runtime/version declarations are aligned with canonical manifests.")


if __name__ == "__main__":
    main()
