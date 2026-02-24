from __future__ import annotations

import json
from pathlib import Path

import pytest

import config.spec_check_frontend_contracts as contract_check


ROLE_FILES = [
    "frontend_config_response.schema.json",
    "frontend_status_response.schema.json",
    "listener_feedback_ui_state_response.schema.json",
]


def test_frontend_contract_checks_pass_for_repo_state() -> None:
    violations, schema_count = contract_check.collect_violations()

    assert schema_count >= 3
    assert violations == []


def test_contract_check_fails_when_role_visibility_is_missing(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    contracts_dir = tmp_path / "contracts"
    frontend_dir = contracts_dir / "frontend_responses"
    frontend_dir.mkdir(parents=True)

    denylist = {
        "sensitive_keys": [],
        "sensitive_path_fragments": [],
    }
    (contracts_dir / "redaction_denylist.json").write_text(json.dumps(denylist), encoding="utf-8")

    public_schema = {
        "type": "object",
        "properties": {
            "ui": {
                "type": "object",
                "properties": {
                    "tokens": {
                        "type": "object",
                        "properties": {
                            "primary_color": {"type": "string"},
                            "accent_color": {"type": "string"},
                            "surface_style": {"type": "string"},
                            "density": {"type": "string"},
                            "corner_radius_scale": {"type": "number"},
                        },
                    }
                },
            }
        },
    }
    (contracts_dir / "public_frontend_config.schema.json").write_text(
        json.dumps(public_schema), encoding="utf-8"
    )

    shared = {
        "type": "object",
        "properties": {
            "roles": {
                "type": "object",
                "properties": {"admin": {}, "operator": {}, "viewer": {}},
            }
        },
        "$defs": {"settings_section": {"enum": ["publish_controls", "integration_metadata"]}},
    }
    (contracts_dir / "shared_settings_visibility.schema.json").write_text(json.dumps(shared), encoding="utf-8")

    for name in ROLE_FILES:
        payload = {
            "type": "object",
            "required": ["generated_at"],
            "properties": {
                "generated_at": {"type": "string"},
                "config": {"$ref": "../public_frontend_config.schema.json"},
            },
        }
        (frontend_dir / name).write_text(json.dumps(payload), encoding="utf-8")

    monkeypatch.setattr(contract_check, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(contract_check, "CONTRACTS_DIR", contracts_dir)
    monkeypatch.setattr(contract_check, "FRONTEND_SCHEMAS_DIR", frontend_dir)
    monkeypatch.setattr(contract_check, "DENYLIST_PATH", contracts_dir / "redaction_denylist.json")
    monkeypatch.setattr(
        contract_check,
        "PUBLIC_FRONTEND_SCHEMA_PATH",
        contracts_dir / "public_frontend_config.schema.json",
    )
    monkeypatch.setattr(
        contract_check,
        "SHARED_VISIBILITY_SCHEMA_PATH",
        contracts_dir / "shared_settings_visibility.schema.json",
    )
    monkeypatch.setattr(contract_check, "ROLE_VISIBILITY_SCHEMAS", [frontend_dir / name for name in ROLE_FILES])

    violations, _ = contract_check.collect_violations()

    assert any("missing required settings_visibility field" in violation for violation in violations)
