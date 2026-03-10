#!/usr/bin/env python3
"""Ensure dashboard status backend env requirements are declared per Next.js environment."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

CONTRACT_PATH = Path('config/env_contract.json')
TARGET_VAR = 'DASHBOARD_STATUS_BACKEND_URL'
REQUIRED_CONTEXTS: dict[str, bool] = {
    'nextjs_development': False,
    'nextjs_staging': True,
    'nextjs_production': True,
}


def load_contract(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError:
        print(f"Missing contract file: {path}", file=sys.stderr)
        raise
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON in {path}: {exc}", file=sys.stderr)
        raise


def find_variable(context: dict[str, Any], name: str) -> dict[str, Any] | None:
    for variable in context.get('variables', []):
        if variable.get('name') == name:
            return variable
    return None


def main() -> int:
    try:
        contract = load_contract(CONTRACT_PATH)
    except (FileNotFoundError, json.JSONDecodeError):
        return 1

    contexts = contract.get('contexts', {})
    errors: list[str] = []

    for context_name, expected_required in REQUIRED_CONTEXTS.items():
        context = contexts.get(context_name)
        if context is None:
            errors.append(f"missing context declaration: {context_name}")
            continue

        variable = find_variable(context, TARGET_VAR)
        if variable is None:
            errors.append(f"missing {TARGET_VAR} in context: {context_name}")
            continue

        actual_required = bool(variable.get('required', False))
        if actual_required != expected_required:
            errors.append(
                f"{context_name}.{TARGET_VAR} required={actual_required} expected={expected_required}"
            )

    if errors:
        print('Dashboard status env declaration lint failed:', file=sys.stderr)
        for error in errors:
            print(f' - {error}', file=sys.stderr)
        return 1

    print('Dashboard status env declaration lint passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
