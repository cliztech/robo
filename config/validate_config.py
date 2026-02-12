#!/usr/bin/env python3
"""Validate RoboDJ JSON config files against local JSON schemas.

Usage:
    python config/validate_config.py
    python config/validate_config.py --strict
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = REPO_ROOT / "config"
SCHEMA_DIR = CONFIG_DIR / "schemas"

TYPE_NAMES = {
    "object": "object",
    "array": "array",
    "string": "string",
    "number": "number",
    "integer": "integer",
    "boolean": "boolean",
    "null": "null",
}

TARGETS = [
    {
        "name": "schedules",
        "config": CONFIG_DIR / "schedules.json",
        "schema": SCHEMA_DIR / "schedules.schema.json",
    },
    {
        "name": "prompt_variables",
        "config": CONFIG_DIR / "prompt_variables.json",
        "schema": SCHEMA_DIR / "prompt_variables.schema.json",
    },
]


class ValidationError(Exception):
    """Raised when validation cannot be completed."""


def _json_type(value: Any) -> str:
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    if value is None:
        return "null"
    return type(value).__name__


def _path_join(base: str, key: str | int) -> str:
    if isinstance(key, int):
        return f"{base}[{key}]"
    if base == "$":
        return f"$.{key}"
    return f"{base}.{key}"


def _type_matches(value: Any, expected_type: str) -> bool:
    actual = _json_type(value)
    if expected_type == "number":
        return actual in {"integer", "number"}
    return actual == expected_type


def _validate(instance: Any, schema: dict[str, Any], path: str, errors: list[str]) -> None:
    if "anyOf" in schema:
        any_of_schemas: list[dict[str, Any]] = schema["anyOf"]
        branch_errors: list[list[str]] = []
        for branch in any_of_schemas:
            candidate_errors: list[str] = []
            _validate(instance, branch, path, candidate_errors)
            if not candidate_errors:
                break
            branch_errors.append(candidate_errors)
        else:
            expected = [branch.get("type", "unknown") for branch in any_of_schemas]
            errors.append(
                f"{path}: value has type '{_json_type(instance)}', expected one of {expected}"
            )
            for err in branch_errors[0][:1]:
                errors.append(f"  hint: {err}")
        return

    expected_type = schema.get("type")
    if expected_type:
        if isinstance(expected_type, list):
            if not any(_type_matches(instance, t) for t in expected_type):
                errors.append(
                    f"{path}: value has type '{_json_type(instance)}', expected one of {expected_type}"
                )
                return
        else:
            if not _type_matches(instance, expected_type):
                errors.append(
                    f"{path}: value has type '{_json_type(instance)}', expected {TYPE_NAMES.get(expected_type, expected_type)}"
                )
                return

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(
            f"{path}: value {instance!r} is invalid, expected one of {schema['enum']}"
        )

    pattern = schema.get("pattern")
    if pattern and isinstance(instance, str) and re.search(pattern, instance) is None:
        errors.append(
            f"{path}: value {instance!r} does not match expected pattern /{pattern}/"
        )

    minimum = schema.get("minimum")
    if minimum is not None and isinstance(instance, (int, float)) and instance < minimum:
        errors.append(f"{path}: value {instance} is below minimum {minimum}")

    maximum = schema.get("maximum")
    if maximum is not None and isinstance(instance, (int, float)) and instance > maximum:
        errors.append(f"{path}: value {instance} is above maximum {maximum}")

    if isinstance(instance, dict):
        required = schema.get("required", [])
        for key in required:
            if key not in instance:
                errors.append(f"{path}: missing required property '{key}'")

        properties = schema.get("properties", {})
        additional = schema.get("additionalProperties", True)

        for key, value in instance.items():
            if key in properties:
                _validate(value, properties[key], _path_join(path, key), errors)
                continue

            if isinstance(additional, dict):
                _validate(value, additional, _path_join(path, key), errors)
                continue

            if additional is False:
                allowed = sorted(properties.keys())
                errors.append(
                    f"{_path_join(path, key)}: unexpected property; allowed keys are {allowed}"
                )

    if isinstance(instance, list):
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, value in enumerate(instance):
                _validate(value, item_schema, _path_join(path, index), errors)


def _load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValidationError(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValidationError(
            f"Invalid JSON in {path}: line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc


def validate_target(name: str, config_path: Path, schema_path: Path) -> list[str]:
    config = _load_json(config_path)
    schema = _load_json(schema_path)
    errors: list[str] = []
    _validate(config, schema, "$", errors)

    unique_errors: list[str] = []
    seen: set[str] = set()
    for error in errors:
        if error not in seen:
            seen.add(error)
            unique_errors.append(error)

    if unique_errors:
        return [f"[{name}] {error}" for error in unique_errors]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate RoboDJ JSON config files")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat unknown files/targets as errors (reserved for future use).",
    )
    _ = parser.parse_args()

    all_errors: list[str] = []
    for target in TARGETS:
        all_errors.extend(validate_target(target["name"], target["config"], target["schema"]))

    if all_errors:
        print("Configuration validation failed:\n", file=sys.stderr)
        for err in all_errors:
            print(f" - {err}", file=sys.stderr)
        print(
            "\nFix the fields above, then rerun: python config/validate_config.py",
            file=sys.stderr,
        )
        return 1

    print("Configuration validation passed for schedules.json and prompt_variables.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
