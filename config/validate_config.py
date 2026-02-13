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
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

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

SCHEDULE_UI_STATES = {"draft", "active", "paused", "archived"}
SCHEDULE_SPEC_MODES = {"one_off", "rrule", "cron"}
CONTENT_REF_TYPES = {"prompt", "script", "playlist", "music_bed"}
TEMPLATE_OVERRIDE_KEYS = {
    "timezone",
    "ui_state",
    "priority",
    "start_window",
    "end_window",
    "content_refs",
    "schedule_spec",
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
    {
        "name": "autonomy_policy",
        "config": CONFIG_DIR / "autonomy_policy.json",
        "schema": SCHEMA_DIR / "autonomy_policy.schema.json",
    },
    {
        "name": "autonomy_profiles",
        "config": CONFIG_DIR / "autonomy_profiles.json",
        "schema": SCHEMA_DIR / "autonomy_profiles.schema.json",
    },
    {
        "name": "persona_ops",
        "config": CONFIG_DIR / "persona_ops.json",
        "schema": SCHEMA_DIR / "persona_ops.schema.json",
    },
    {
        "name": "interactivity_channels",
        "config": CONFIG_DIR / "interactivity_channels.json",
        "schema": SCHEMA_DIR / "interactivity_channels.schema.json",
    },
    {
        "name": "editorial_pipeline_config",
        "config": CONFIG_DIR / "editorial_pipeline_config.json",
        "schema": SCHEMA_DIR / "editorial_pipeline_config.schema.json",
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


def _parse_datetime(value: str, path: str, errors: list[str]) -> datetime | None:
    if not isinstance(value, str):
        errors.append(f"{path}: expected ISO-8601 datetime string")
        return None
    candidate = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        errors.append(f"{path}: invalid datetime {value!r}; expected ISO-8601 with timezone")
        return None
    if parsed.tzinfo is None:
        errors.append(f"{path}: datetime {value!r} must include timezone offset or Z")
        return None
    return parsed


def _validate_timezone(value: Any, path: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value:
        errors.append(f"{path}: timezone is required and must be a non-empty string")
        return
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError:
        errors.append(f"{path}: unknown IANA timezone {value!r}")


def _validate_window(window: Any, path: str, errors: list[str]) -> datetime | None:
    if not isinstance(window, dict):
        errors.append(f"{path}: expected object with keys 'type' and 'value'")
        return None
    if window.get("type") != "datetime":
        errors.append(f"{path}.type: expected 'datetime'")
    if "value" not in window:
        errors.append(f"{path}: missing required property 'value'")
        return None
    return _parse_datetime(window["value"], f"{path}.value", errors)


def _validate_schedule_spec(spec: Any, path: str, errors: list[str]) -> None:
    if not isinstance(spec, dict):
        errors.append(f"{path}: expected object")
        return
    mode = spec.get("mode")
    if mode not in SCHEDULE_SPEC_MODES:
        errors.append(f"{path}.mode: expected one of {sorted(SCHEDULE_SPEC_MODES)}")
        return

    keys = set(spec.keys())
    allowed = {"mode", "run_at", "rrule", "cron"}
    extra = sorted(keys - allowed)
    if extra:
        errors.append(f"{path}: unsupported keys {extra}; allowed keys are {sorted(allowed)}")

    if mode == "one_off":
        if "run_at" not in spec:
            errors.append(f"{path}: mode 'one_off' requires 'run_at'")
        else:
            _parse_datetime(spec["run_at"], f"{path}.run_at", errors)
        forbidden = [k for k in ("rrule", "cron") if k in spec]
        if forbidden:
            errors.append(f"{path}: mode 'one_off' cannot include {forbidden}")

    if mode == "rrule":
        rrule = spec.get("rrule")
        if not isinstance(rrule, str) or "FREQ=" not in rrule:
            errors.append(f"{path}.rrule: expected RFC5545-like string containing 'FREQ='")
        forbidden = [k for k in ("run_at", "cron") if k in spec]
        if forbidden:
            errors.append(f"{path}: mode 'rrule' cannot include {forbidden}")

    if mode == "cron":
        cron = spec.get("cron")
        if not isinstance(cron, str) or re.fullmatch(r"\S+\s+\S+\s+\S+\s+\S+\s+\S+", cron) is None:
            errors.append(f"{path}.cron: expected five-field cron expression")
        forbidden = [k for k in ("run_at", "rrule") if k in spec]
        if forbidden:
            errors.append(f"{path}: mode 'cron' cannot include {forbidden}")


def _validate_content_refs(content_refs: Any, path: str, errors: list[str]) -> None:
    if not isinstance(content_refs, list) or not content_refs:
        errors.append(f"{path}: expected a non-empty array")
        return

    for idx, ref in enumerate(content_refs):
        item_path = f"{path}[{idx}]"
        if not isinstance(ref, dict):
            errors.append(f"{item_path}: expected object")
            continue
        ref_type = ref.get("type")
        if ref_type not in CONTENT_REF_TYPES:
            errors.append(f"{item_path}.type: expected one of {sorted(CONTENT_REF_TYPES)}")
        ref_id = ref.get("ref_id")
        if not isinstance(ref_id, str) or not ref_id.strip():
            errors.append(f"{item_path}.ref_id: required non-empty string")
        weight = ref.get("weight")
        if weight is not None and (not isinstance(weight, int) or weight < 1 or weight > 100):
            errors.append(f"{item_path}.weight: expected integer in range 1..100 when provided")


def _validate_template(template_ref: Any, path: str, errors: list[str]) -> None:
    if not isinstance(template_ref, dict):
        errors.append(f"{path}: expected object with keys 'id' and 'version'")
        return
    template_id = template_ref.get("id")
    if not isinstance(template_id, str) or not template_id.strip():
        errors.append(f"{path}.id: required non-empty string")
    version = template_ref.get("version")
    if not isinstance(version, int) or version < 1:
        errors.append(f"{path}.version: required integer >= 1")


def _effective_window(schedule: dict[str, Any]) -> tuple[datetime | None, datetime | None]:
    start = schedule.get("start_window")
    end = schedule.get("end_window")
    if not isinstance(start, dict) or not isinstance(end, dict):
        return (None, None)
    try:
        start_dt = datetime.fromisoformat(str(start.get("value", "")).replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(str(end.get("value", "")).replace("Z", "+00:00"))
        if start_dt.tzinfo and end_dt.tzinfo:
            return (start_dt, end_dt)
    except ValueError:
        return (None, None)
    return (None, None)


def _validate_schedule_entry(schedule: Any, index: int, errors: list[str]) -> None:
    path = f"$.schedules[{index}]"
    if not isinstance(schedule, dict):
        errors.append(f"{path}: expected object")
        return

    required_common = ("id", "name", "enabled")
    for field in required_common:
        if field not in schedule:
            errors.append(f"{path}: missing required property '{field}'")

    if not isinstance(schedule.get("id"), str) or not str(schedule.get("id", "")).strip():
        errors.append(f"{path}.id: required non-empty string")

    if not isinstance(schedule.get("name"), str) or not str(schedule.get("name", "")).strip():
        errors.append(f"{path}.name: required non-empty string")

    if not isinstance(schedule.get("enabled"), bool):
        errors.append(f"{path}.enabled: required boolean")

    has_template = "template_ref" in schedule
    has_overrides = "overrides" in schedule

    if has_template:
        _validate_template(schedule.get("template_ref"), f"{path}.template_ref", errors)

    if has_overrides:
        if not has_template:
            errors.append(f"{path}.overrides: cannot be used without 'template_ref'")
        overrides = schedule.get("overrides")
        if not isinstance(overrides, dict):
            errors.append(f"{path}.overrides: expected object")
        else:
            unknown_keys = sorted(set(overrides.keys()) - TEMPLATE_OVERRIDE_KEYS)
            if unknown_keys:
                errors.append(
                    f"{path}.overrides: unsupported keys {unknown_keys}; allowed keys are {sorted(TEMPLATE_OVERRIDE_KEYS)}"
                )
            for key in sorted(set(overrides.keys()) & TEMPLATE_OVERRIDE_KEYS):
                if key in schedule:
                    errors.append(
                        f"{path}: ambiguous configuration; '{key}' appears both at top-level and in overrides"
                    )

    def get_field(field: str) -> Any:
        if field in schedule:
            return schedule[field]
        if has_overrides and isinstance(schedule.get("overrides"), dict):
            return schedule["overrides"].get(field)
        return None

    strict_fields = ["timezone", "ui_state", "priority", "start_window", "end_window", "content_refs", "schedule_spec"]
    if not has_template:
        for field in strict_fields:
            if field not in schedule:
                errors.append(f"{path}: missing required property '{field}'")

    timezone = get_field("timezone")
    if timezone is not None:
        _validate_timezone(timezone, f"{path}.timezone", errors)

    ui_state = get_field("ui_state")
    if ui_state is not None and ui_state not in SCHEDULE_UI_STATES:
        errors.append(f"{path}.ui_state: expected one of {sorted(SCHEDULE_UI_STATES)}")

    priority = get_field("priority")
    if priority is not None and (not isinstance(priority, int) or priority < 0 or priority > 100):
        errors.append(f"{path}.priority: expected integer in range 0..100")

    start_dt = None
    end_dt = None
    start_window = get_field("start_window")
    if start_window is not None:
        start_dt = _validate_window(start_window, f"{path}.start_window", errors)
    end_window = get_field("end_window")
    if end_window is not None:
        end_dt = _validate_window(end_window, f"{path}.end_window", errors)
    if start_dt and end_dt and start_dt > end_dt:
        errors.append(f"{path}: start_window.value must be <= end_window.value")

    content_refs = get_field("content_refs")
    if content_refs is not None:
        _validate_content_refs(content_refs, f"{path}.content_refs", errors)

    schedule_spec = get_field("schedule_spec")
    if schedule_spec is not None:
        _validate_schedule_spec(schedule_spec, f"{path}.schedule_spec", errors)


def _validate_schedule_conflicts(schedules: list[dict[str, Any]], errors: list[str]) -> None:
    seen_ids: dict[str, int] = {}
    seen_names: dict[str, int] = {}
    for idx, schedule in enumerate(schedules):
        schedule_id = schedule.get("id")
        if isinstance(schedule_id, str):
            if schedule_id in seen_ids:
                errors.append(
                    f"$.schedules[{idx}].id: duplicate id {schedule_id!r}; already used at $.schedules[{seen_ids[schedule_id]}]"
                )
            else:
                seen_ids[schedule_id] = idx

        schedule_name = schedule.get("name")
        if isinstance(schedule_name, str):
            key = schedule_name.strip().lower()
            if key in seen_names:
                errors.append(
                    f"$.schedules[{idx}].name: duplicate name {schedule_name!r}; already used at $.schedules[{seen_names[key]}]"
                )
            else:
                seen_names[key] = idx

    for i, left in enumerate(schedules):
        if not isinstance(left, dict) or left.get("template_ref") is not None:
            continue
        if left.get("enabled") is not True or left.get("ui_state") != "active":
            continue
        for j in range(i + 1, len(schedules)):
            right = schedules[j]
            if not isinstance(right, dict) or right.get("template_ref") is not None:
                continue
            if right.get("enabled") is not True or right.get("ui_state") != "active":
                continue
            if left.get("priority") != right.get("priority"):
                continue
            if left.get("timezone") != right.get("timezone"):
                continue
            if left.get("schedule_spec") != right.get("schedule_spec"):
                continue
            left_start, left_end = _effective_window(left)
            right_start, right_end = _effective_window(right)
            if not all((left_start, left_end, right_start, right_end)):
                continue
            if left_start <= right_end and right_start <= left_end:
                errors.append(
                    "$.schedules[{}] and $.schedules[{}]: ambiguous conflict; active schedules share timezone, priority, trigger and overlapping windows".format(
                        i, j
                    )
                )


def validate_schedules(config: Any) -> list[str]:
    errors: list[str] = []

    if not isinstance(config, dict):
        return ["[schedules] $: expected object root with keys 'schema_version' and 'schedules'"]

    if config.get("schema_version") != 2:
        errors.append("[schedules] $.schema_version: expected integer value 2")

    schedules = config.get("schedules")
    if not isinstance(schedules, list):
        errors.append("[schedules] $.schedules: expected array")
        return errors

    for index, schedule in enumerate(schedules):
        _validate_schedule_entry(schedule, index, errors)

    _validate_schedule_conflicts([s for s in schedules if isinstance(s, dict)], errors)

    return [f"[schedules] {err}" for err in errors]


def validate_target(name: str, config_path: Path, schema_path: Path) -> list[str]:
    config = _load_json(config_path)
    if name == "schedules":
        return validate_schedules(config)

    schema = _load_json(schema_path)
    try:
        config = _load_json(config_path)
        schema = _load_json(schema_path)
    except ValidationError as exc:
        return [f"[{name}] {exc}"]

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
    parser.parse_args()

    all_errors: list[str] = []
    for target in TARGETS:
        try:
            all_errors.extend(
                validate_target(target["name"], target["config"], target["schema"])
            )
        except ValidationError as exc:
            all_errors.append(f"[{target['name']}] {exc}")

    if all_errors:
        print("Configuration validation failed:\n", file=sys.stderr)
        for err in all_errors:
            print(f" - {err}", file=sys.stderr)
        print(
            "\nFix the fields above, then rerun: python config/validate_config.py",
            file=sys.stderr,
        )
        return 1

    validated_names = ", ".join(f"{target['name']}.json" for target in TARGETS)
    print(f"Configuration validation passed for: {validated_names}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
