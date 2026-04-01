#!/usr/bin/env python3
"""Validate skill metadata and MCP manifests for DGN-DJ."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / "skills"
MCP_DIR = ROOT / "infra" / "mcp"

SKILL_REQUIRED = {
    "name": str,
    "version": str,
    "description": str,
    "entrypoint": str,
    "tags": list,
    "owner": str,
}

MCP_REQUIRED = {
    "id": str,
    "name": str,
    "transport": str,
    "package": str,
    "runtime": str,
    "args": list,
    "capabilities": list,
    "purpose": str,
}


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc


def validate_against_schema(payload: Any, schema: dict[str, Any], *, path_prefix: str) -> list[str]:
    errors: list[str] = []

    schema_type = schema.get("type")
    if schema_type == "object":
        if not isinstance(payload, dict):
            errors.append(f"{path_prefix}: expected object")
            return errors

        required = schema.get("required", [])
        for key in required:
            if key not in payload:
                errors.append(f"{path_prefix}: missing required key '{key}'")

        properties = schema.get("properties", {})
        for key, value in payload.items():
            if key in properties:
                errors.extend(
                    validate_against_schema(value, properties[key], path_prefix=f"{path_prefix}.{key}")
                )
            elif schema.get("additionalProperties") is False:
                errors.append(f"{path_prefix}: unexpected key '{key}'")

    elif schema_type == "array":
        if not isinstance(payload, list):
            errors.append(f"{path_prefix}: expected array")
            return errors

        min_items = schema.get("minItems")
        if isinstance(min_items, int) and len(payload) < min_items:
            errors.append(f"{path_prefix}: expected at least {min_items} items")

        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for idx, item in enumerate(payload):
                errors.extend(
                    validate_against_schema(item, item_schema, path_prefix=f"{path_prefix}[{idx}]")
                )

    elif schema_type == "string":
        if not isinstance(payload, str):
            errors.append(f"{path_prefix}: expected string")
        else:
            min_length = schema.get("minLength")
            if isinstance(min_length, int) and len(payload) < min_length:
                errors.append(f"{path_prefix}: expected minimum length {min_length}")

            const_value = schema.get("const")
            if const_value is not None and payload != const_value:
                errors.append(f"{path_prefix}: expected constant value '{const_value}'")

            pattern = schema.get("pattern")
            if isinstance(pattern, str):
                import re

                if not re.match(pattern, payload):
                    errors.append(f"{path_prefix}: does not match pattern '{pattern}'")

    return errors


def validate_skills(errors: list[str]) -> None:
    if not SKILLS_DIR.exists():
        errors.append(f"Missing skills directory: {SKILLS_DIR}")
        return

    seen_names: set[str] = set()
    skill_json_paths = sorted(SKILLS_DIR.glob("*/skill.json"))
    if not skill_json_paths:
        errors.append("No skill.json files discovered under skills/*/")
        return

    for skill_json in skill_json_paths:
        metadata = load_json(skill_json)
        rel_skill = skill_json.relative_to(ROOT)

        for key, expected_type in SKILL_REQUIRED.items():
            if key not in metadata:
                errors.append(f"{rel_skill}: missing required key '{key}'")
                continue
            value = metadata[key]
            if not isinstance(value, expected_type):
                errors.append(
                    f"{rel_skill}: key '{key}' must be {expected_type.__name__}"
                )
                continue
            if expected_type in (str, list) and not value:
                errors.append(f"{rel_skill}: key '{key}' cannot be empty")

        name = metadata.get("name")
        if isinstance(name, str):
            if name in seen_names:
                errors.append(f"Duplicate skill name detected: {name}")
            seen_names.add(name)

        entrypoint = metadata.get("entrypoint")
        if isinstance(entrypoint, str):
            entrypoint_path = skill_json.parent / entrypoint
            if not entrypoint_path.exists():
                rel_entry = entrypoint_path.relative_to(ROOT)
                errors.append(f"{rel_skill}: entrypoint does not exist: {rel_entry}")


def validate_mcp(errors: list[str], *, validate_schema: bool) -> None:
    servers_index = MCP_DIR / "servers.json"
    if not servers_index.exists():
        errors.append(f"Missing MCP server index: {servers_index.relative_to(ROOT)}")
        return

    index = load_json(servers_index)
    if index.get("project") != "dgn-dj":
        errors.append("infra/mcp/servers.json: project must be 'dgn-dj'")

    if validate_schema:
        schema_path = MCP_DIR / "schemas" / "mcp-servers.schema.json"
        schema = load_json(schema_path)
        errors.extend(validate_against_schema(index, schema, path_prefix="infra/mcp/servers.json"))

    servers = index.get("servers")
    if not isinstance(servers, list) or not servers:
        errors.append("infra/mcp/servers.json: servers must be a non-empty list")
        return

    seen_ids: set[str] = set()
    for item in servers:
        if not isinstance(item, dict):
            errors.append("infra/mcp/servers.json: each server entry must be an object")
            continue

        server_id = item.get("id")
        manifest_ref = item.get("manifest")

        if not isinstance(server_id, str):
            errors.append("infra/mcp/servers.json: server id must be a string")
            continue

        if server_id in seen_ids:
            errors.append(f"infra/mcp/servers.json: duplicate server id '{server_id}'")
        seen_ids.add(server_id)

        if not isinstance(manifest_ref, str):
            errors.append(f"infra/mcp/servers.json: manifest missing for '{server_id}'")
            continue

        manifest_path = (MCP_DIR / manifest_ref).resolve()
        if not manifest_path.exists():
            errors.append(
                f"infra/mcp/servers.json: manifest does not exist for '{server_id}': {manifest_ref}"
            )
            continue

        manifest = load_json(manifest_path)
        rel_manifest = manifest_path.relative_to(ROOT)

        for key, expected_type in MCP_REQUIRED.items():
            if key not in manifest:
                errors.append(f"{rel_manifest}: missing required key '{key}'")
                continue
            if not isinstance(manifest[key], expected_type):
                errors.append(
                    f"{rel_manifest}: key '{key}' must be {expected_type.__name__}"
                )

        manifest_id = manifest.get("id")
        if manifest_id != server_id:
            errors.append(
                f"{rel_manifest}: manifest id '{manifest_id}' does not match index id '{server_id}'"
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-only", action="store_true", help="Validate skills metadata only")
    parser.add_argument("--mcp-only", action="store_true", help="Validate MCP manifests only")
    parser.add_argument(
        "--validate-mcp-schema",
        action="store_true",
        help="Validate infra/mcp/servers.json against infra/mcp/schemas/mcp-servers.schema.json",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.skills_only and args.mcp_only:
        print("Cannot combine --skills-only and --mcp-only", file=sys.stderr)
        return 2

    errors: list[str] = []

    try:
        if not args.mcp_only:
            validate_skills(errors)
        if not args.skills_only:
            validate_mcp(errors, validate_schema=args.validate_mcp_schema)
    except ValueError as exc:
        errors.append(str(exc))

    if errors:
        print("Validation failed:", file=sys.stderr)
        for err in errors:
            print(f" - {err}", file=sys.stderr)
        return 1

    print("All skill and MCP validations passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
