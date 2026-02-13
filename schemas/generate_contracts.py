#!/usr/bin/env python3
"""Generate JSON Schemas and TypeScript types from a shared contract source file."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
SOURCE_PATH = ROOT / "source" / "contracts_source.json"
SCHEMA_DIR = ROOT / "json"
TYPES_PATH = ROOT / "types" / "entities.ts"

TYPE_MAP = {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "null": "null",
    "object": "Record<string, unknown>",
    "array": "unknown[]",
}


def to_pascal_case(value: str) -> str:
    return "".join(part.capitalize() for part in value.split("_"))


def ensure_source_is_valid(source: dict[str, Any]) -> None:
    entities = source.get("entities")
    if not isinstance(entities, dict) or not entities:
        raise ValueError("source.entities must be a non-empty object")

    for name, entity in entities.items():
        if "properties" not in entity or "required" not in entity:
            raise ValueError(f"entity '{name}' must define properties and required")


def convert_property_to_ts(prop: dict[str, Any]) -> str:
    if "$ref" in prop:
        return to_pascal_case(prop["$ref"])

    prop_type = prop.get("type")
    if isinstance(prop_type, list):
        mapped = []
        for item in prop_type:
            mapped.append(TYPE_MAP.get(item, "unknown"))
        return " | ".join(mapped)

    if prop_type == "array":
        items = prop.get("items", {})
        if "$ref" in items:
            return f"{to_pascal_case(items['$ref'])}[]"
        return f"{convert_property_to_ts(items)}[]"

    if prop_type == "object" and "properties" in prop:
        inner_required = set(prop.get("required", []))
        lines = ["{"]
        for key, child in prop["properties"].items():
            optional = "" if key in inner_required else "?"
            child_ts = convert_property_to_ts(child)
            if "\n" in child_ts:
                child_lines = child_ts.split("\n")
                child_ts = "\n".join([child_lines[0]] + ["  " + line for line in child_lines[1:]])
            lines.append(f"  {key}{optional}: {child_ts};")
        lines.append("}")
        return "\n".join(lines)

    if "enum" in prop:
        return " | ".join(json.dumps(item) for item in prop["enum"])

    if "const" in prop:
        return json.dumps(prop["const"])

    return TYPE_MAP.get(prop_type, "unknown")


def write_json_schemas(source: dict[str, Any]) -> None:
    entities = source["entities"]

    for name, entity in entities.items():
        output = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": f"https://robodj/contracts/{name}.schema.json",
            "title": to_pascal_case(name),
            "description": entity["description"],
            "type": "object",
            "additionalProperties": False,
            "properties": {},
            "required": entity["required"],
        }

        for prop_name, prop in entity["properties"].items():
            converted = dict(prop)
            if "$ref" in converted:
                converted["$ref"] = f"./{converted['$ref']}.schema.json"
            elif converted.get("type") == "array":
                items = converted.get("items", {})
                if isinstance(items, dict) and "$ref" in items:
                    converted["items"] = {"$ref": f"./{items['$ref']}.schema.json"}
            output["properties"][prop_name] = converted

        (SCHEMA_DIR / f"{name}.schema.json").write_text(
            json.dumps(output, indent=2) + "\n", encoding="utf-8"
        )


def write_typescript_types(source: dict[str, Any]) -> None:
    entities = source["entities"]

    parts = [
        "// GENERATED FILE - DO NOT EDIT DIRECTLY.",
        "// Source of truth: schemas/source/contracts_source.json",
        "",
    ]

    for name, entity in entities.items():
        interface_name = to_pascal_case(name)
        required_fields = set(entity["required"])
        parts.append(f"export interface {interface_name} {{")
        for prop_name, prop in entity["properties"].items():
            optional = "" if prop_name in required_fields else "?"
            parts.append(f"  {prop_name}{optional}: {convert_property_to_ts(prop)};")
        parts.append("}")
        parts.append("")

    TYPES_PATH.write_text("\n".join(parts).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    source = json.loads(SOURCE_PATH.read_text(encoding="utf-8"))
    ensure_source_is_valid(source)
    write_json_schemas(source)
    write_typescript_types(source)
    print("Generated JSON schemas and TypeScript types.")


if __name__ == "__main__":
    main()
