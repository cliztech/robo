#!/usr/bin/env python3
"""Validate required non-secret runtime environment variables by context."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

DEFAULT_CONTRACT_PATH = Path(__file__).resolve().parent / "env_contract.json"
DEFAULT_CONTEXTS = ["desktop_app", "docker_stack", "ci"]


class ValidationError(Exception):
    """Raised when contract loading fails."""


def load_contract(contract_path: Path) -> dict[str, Any]:
    try:
        with contract_path.open("r", encoding="utf-8") as contract_file:
            return json.load(contract_file)
    except FileNotFoundError as exc:
        raise ValidationError(f"Contract file not found: {contract_path}") from exc
    except json.JSONDecodeError as exc:
        raise ValidationError(f"Contract file is invalid JSON: {contract_path} ({exc})") from exc


def is_placeholder(value: str, placeholder_tokens: set[str]) -> bool:
    normalized = value.strip().lower()
    if normalized in placeholder_tokens:
        return True
    if normalized.startswith("<") and normalized.endswith(">"):
        return True
    if normalized.startswith("${") and normalized.endswith("}"):
        return True
    return False


def validate_variable(variable: dict[str, Any], env_value: str, placeholder_tokens: set[str]) -> list[str]:
    errors: list[str] = []
    name = variable["name"]

    if not variable.get("allow_placeholder_values", False) and is_placeholder(env_value, placeholder_tokens):
        errors.append(f"{name} appears to contain a placeholder value")
        return errors

    var_type = variable.get("type")

    if var_type == "enum":
        allowed_values = variable.get("allowed_values", [])
        if env_value not in allowed_values:
            errors.append(f"{name} must be one of {allowed_values}")
    elif var_type == "regex":
        pattern = variable.get("pattern")
        if not pattern:
            errors.append(f"{name} is missing regex pattern in contract")
        elif re.fullmatch(pattern, env_value) is None:
            errors.append(f"{name} failed regex validation")
    elif var_type == "integer":
        try:
            value_int = int(env_value)
        except ValueError:
            errors.append(f"{name} must be an integer")
        else:
            minimum = variable.get("min")
            maximum = variable.get("max")
            if minimum is not None and value_int < minimum:
                errors.append(f"{name} must be >= {minimum}")
            if maximum is not None and value_int > maximum:
                errors.append(f"{name} must be <= {maximum}")
    elif var_type == "path":
        if not env_value.strip():
            errors.append(f"{name} must not be empty")
    elif var_type in {"string", "secret", None}:
        if not env_value.strip():
            errors.append(f"{name} must not be empty")
    else:
        errors.append(f"{name} uses unsupported contract type: {var_type}")

    return errors


def validate_context(contract: dict[str, Any], context_name: str) -> list[str]:
    contexts = contract.get("contexts", {})
    context = contexts.get(context_name)
    if context is None:
        return [f"Unknown context '{context_name}' in contract"]

    errors: list[str] = []
    placeholder_tokens = set(token.lower() for token in contract.get("placeholder_tokens", []))

    for variable in context.get("variables", []):
        if variable.get("secret", False):
            continue

        name = variable.get("name")
        if not name:
            errors.append(f"Context '{context_name}' includes variable without a name")
            continue

        if not variable.get("required", False):
            continue

        raw_value = os.environ.get(name)
        if raw_value is None:
            errors.append(f"{name} is required for context '{context_name}'")
            continue

        errors.extend(validate_variable(variable, raw_value, placeholder_tokens))

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate required non-secret runtime env vars by context without printing secret values."
    )
    parser.add_argument(
        "--contract",
        default=str(DEFAULT_CONTRACT_PATH),
        help="Path to JSON env contract (default: config/env_contract.json)",
    )
    parser.add_argument(
        "--context",
        action="append",
        choices=DEFAULT_CONTEXTS,
        help="Context(s) to validate. Repeat flag for multiple contexts. Defaults to all contexts.",
    )
    args = parser.parse_args()

    contract_path = Path(args.contract)
    try:
        contract = load_contract(contract_path)
    except ValidationError as exc:
        print(f"Environment contract check failed: {exc}", file=sys.stderr)
        return 1

    requested_contexts = args.context or DEFAULT_CONTEXTS

    all_errors: list[str] = []
    for context_name in requested_contexts:
        all_errors.extend(validate_context(contract, context_name))

    if all_errors:
        print("Environment contract check failed:", file=sys.stderr)
        for error in all_errors:
            print(f" - {error}", file=sys.stderr)
        return 1

    print(
        "Environment contract check passed for contexts: "
        + ", ".join(requested_contexts)
        + " (secret values redacted)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
