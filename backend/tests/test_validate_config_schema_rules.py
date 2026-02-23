from __future__ import annotations

import importlib.util
import json
import sys
import types
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
VALIDATOR_PATH = REPO_ROOT / "config" / "validate_config.py"


class _DummyValidationError(Exception):
    pass


class _DummyScheduleEnvelope:
    @classmethod
    def model_validate(cls, payload: dict[str, object]) -> object:
        return payload


class _DummySchedulerUiService:
    def _build_timeline_blocks(self, schedules: object) -> list[object]:
        return []


sys.modules.setdefault("pydantic", types.SimpleNamespace(ValidationError=_DummyValidationError))
sys.modules.setdefault(
    "backend.scheduling.schedule_conflict_detection",
    types.SimpleNamespace(detect_schedule_conflicts=lambda schedules, timeline: []),
)
sys.modules.setdefault(
    "backend.scheduling.scheduler_models",
    types.SimpleNamespace(ScheduleEnvelope=_DummyScheduleEnvelope),
)
sys.modules.setdefault(
    "backend.scheduling.scheduler_ui_service",
    types.SimpleNamespace(SchedulerUiService=_DummySchedulerUiService),
)

spec = importlib.util.spec_from_file_location("validate_config", VALIDATOR_PATH)
validate_config = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(validate_config)


def test_schedules_schema_const_violation_reports_error() -> None:
    schema = {
        "type": "object",
        "required": ["schema_version", "schedules"],
        "properties": {
            "schema_version": {"type": "integer", "const": 2},
            "schedules": {"type": "array"},
        },
    }
    instance = {"schema_version": 1, "schedules": []}
    errors: list[str] = []

    validate_config._validate(instance, schema, "$", errors)

    assert "$.schema_version: value 1 must equal constant 2" in errors


def test_schedules_schema_min_length_violation_reports_error() -> None:
    schema = {
        "type": "object",
        "required": ["schedules"],
        "properties": {
            "schedules": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["id", "name", "enabled"],
                    "properties": {
                        "id": {"type": "string", "minLength": 1},
                        "name": {"type": "string", "minLength": 1},
                        "enabled": {"type": "boolean"},
                    },
                },
            }
        },
    }
    instance = {"schedules": [{"id": "", "name": "", "enabled": True}]}
    errors: list[str] = []

    validate_config._validate(instance, schema, "$", errors)

    assert "$.schedules[0].id: string length 0 is below minLength 1" in errors
    assert "$.schedules[0].name: string length 0 is below minLength 1" in errors


def test_unknown_schema_keyword_reports_clear_error() -> None:
    schema = {"type": "string", "unknownRule": True}
    errors: list[str] = []

    validate_config._validate("value", schema, "$", errors)

    assert "$: unsupported schema keyword 'unknownRule'" in errors


def test_repository_schema_keywords_are_supported() -> None:
    schema_dir = REPO_ROOT / "config" / "schemas"
    for schema_path in sorted(schema_dir.glob("*.json")):
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        errors: list[str] = []
        validate_config._validate({}, schema, "$", errors)
        unsupported = [e for e in errors if "unsupported schema keyword" in e]
        assert unsupported == [], f"{schema_path.name}: {unsupported}"
