#!/usr/bin/env python3
"""Validate env contract parity across contract, .env.example, and docker compose refs."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

ENV_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
COMPOSE_VAR_RE = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)[^}]*\}")


def load_contract(path: Path) -> tuple[set[str], set[str], set[str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    contexts = payload.get("contexts", {})

    all_vars: set[str] = set()
    required_vars: set[str] = set()
    required_by_context: set[str] = set()

    for context_name, context in contexts.items():
        vars_payload = context.get("variables", []) if isinstance(context, dict) else []
        for item in vars_payload:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            if not ENV_KEY_RE.match(name):
                continue
            all_vars.add(name)
            if item.get("required") is True:
                required_vars.add(name)
                required_by_context.add(f"{context_name}:{name}")

    return all_vars, required_vars, required_by_context


def parse_env_example(path: Path) -> set[str]:
    keys: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key = line.split("=", 1)[0].strip()
        if ENV_KEY_RE.match(key):
            keys.add(key)
    return keys


def compose_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "*docker-compose*.yml"],
        check=True,
        capture_output=True,
        text=True,
    )
    files = [Path(line.strip()) for line in result.stdout.splitlines() if line.strip()]
    return sorted(files)


def parse_compose_refs(paths: Iterable[Path]) -> set[str]:
    vars_found: set[str] = set()
    for path in paths:
        text = path.read_text(encoding="utf-8")
        vars_found.update(COMPOSE_VAR_RE.findall(text))
    return vars_found


def build_report(
    contract_path: Path,
    env_example_path: Path,
    compose_paths: list[Path],
) -> dict:
    contract_all, contract_required, required_by_context = load_contract(contract_path)
    env_example_vars = parse_env_example(env_example_path)
    compose_vars = parse_compose_refs(compose_paths)

    missing_required = sorted(contract_required - env_example_vars)
    stale_env_example = sorted(env_example_vars - contract_all - compose_vars)
    undocumented_compose = sorted(compose_vars - contract_all - env_example_vars)

    status = "pass"
    if missing_required or stale_env_example or undocumented_compose:
        status = "fail"

    return {
        "status": status,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "contract_path": str(contract_path),
            "env_example_path": str(env_example_path),
            "compose_files": [str(p) for p in compose_paths],
        },
        "counts": {
            "contract_vars": len(contract_all),
            "contract_required_vars": len(contract_required),
            "required_by_context_entries": len(required_by_context),
            "env_example_vars": len(env_example_vars),
            "compose_referenced_vars": len(compose_vars),
            "missing_required": len(missing_required),
            "stale_env_example": len(stale_env_example),
            "undocumented_compose": len(undocumented_compose),
        },
        "issues": {
            "missing_required": missing_required,
            "stale_env_example": stale_env_example,
            "undocumented_compose": undocumented_compose,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--contract", default="config/env_contract.json")
    parser.add_argument("--env-example", default=".env.example")
    parser.add_argument("--report", default=".artifacts/ci/env-contract-report.json")
    args = parser.parse_args()

    report = build_report(
        contract_path=Path(args.contract),
        env_example_path=Path(args.env_example),
        compose_paths=compose_files(),
    )

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    counts = report["counts"]
    print(
        "env-contract: "
        f"required_missing={counts['missing_required']} "
        f"stale={counts['stale_env_example']} "
        f"undocumented={counts['undocumented_compose']} "
        f"report={report_path}"
    )

    if report["status"] != "pass":
        print("env-contract validation failed. See JSON report for details.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
