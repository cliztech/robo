#!/usr/bin/env python3
"""Generate .mcp.json from infra/mcp/servers.json with optional local overrides."""

from __future__ import annotations

import argparse
import json
import os
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MCP_INDEX = ROOT / "infra" / "mcp" / "servers.json"
OUTPUT = ROOT / ".mcp.json"
LOCAL_OVERRIDES = ROOT / ".mcp.local.json"


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc


def deep_merge(base: Any, override: Any) -> Any:
    if isinstance(base, dict) and isinstance(override, dict):
        merged: dict[str, Any] = {k: deepcopy(v) for k, v in base.items()}
        for key, value in override.items():
            merged[key] = deep_merge(merged[key], value) if key in merged else deepcopy(value)
        return merged

    if isinstance(base, list) and isinstance(override, list):
        return deepcopy(override)

    return deepcopy(override)


def generate_runtime_config(index: dict[str, Any]) -> dict[str, Any]:
    servers = index.get("servers")
    if not isinstance(servers, list) or not servers:
        raise ValueError("infra/mcp/servers.json must define a non-empty 'servers' list")

    runtime_servers: dict[str, Any] = {}
    for server in servers:
        if not isinstance(server, dict):
            raise ValueError("infra/mcp/servers.json includes a non-object server entry")

        server_id = server.get("id")
        manifest_ref = server.get("manifest")
        if not isinstance(server_id, str) or not server_id:
            raise ValueError("infra/mcp/servers.json server entry missing valid 'id'")
        if not isinstance(manifest_ref, str) or not manifest_ref:
            raise ValueError(f"infra/mcp/servers.json server '{server_id}' missing 'manifest'")

        manifest_path = (MCP_INDEX.parent / manifest_ref).resolve()
        if not manifest_path.exists():
            raise ValueError(
                f"infra/mcp/servers.json server '{server_id}' points to missing manifest: {manifest_ref}"
            )

        manifest = load_json(manifest_path)
        runtime = manifest.get("runtime")
        args = manifest.get("args")
        if not isinstance(runtime, str) or not runtime:
            raise ValueError(f"{manifest_path.relative_to(ROOT)} must define non-empty 'runtime'")
        if not isinstance(args, list):
            raise ValueError(f"{manifest_path.relative_to(ROOT)} must define array 'args'")

        runtime_entry: dict[str, Any] = {
            "command": runtime,
            "args": args,
        }

        env = manifest.get("env")
        if env is not None:
            if not isinstance(env, dict):
                raise ValueError(f"{manifest_path.relative_to(ROOT)} has non-object 'env'")
            runtime_entry["env"] = env

        runtime_servers[server_id] = runtime_entry

    return {"mcpServers": runtime_servers}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if .mcp.json is not up to date")
    parser.add_argument(
        "--ignore-drift",
        action="store_true",
        help="Skip drift check in --check mode (used for explicit CI ignores)",
    )
    args = parser.parse_args()

    try:
        index = load_json(MCP_INDEX)
        generated = generate_runtime_config(index)

        if LOCAL_OVERRIDES.exists():
            local_data = load_json(LOCAL_OVERRIDES)
            generated = deep_merge(generated, local_data)

        rendered = json.dumps(generated, indent=2, ensure_ascii=False) + "\n"

        if args.check:
            if args.ignore_drift:
                print("Skipping .mcp.json drift check (--ignore-drift).")
                return 0

            if not OUTPUT.exists():
                print(".mcp.json is missing. Run: python scripts/generate_mcp_runtime_config.py", file=sys.stderr)
                return 1

            current = OUTPUT.read_text(encoding="utf-8")
            if current != rendered:
                print(".mcp.json is out of date. Run: python scripts/generate_mcp_runtime_config.py", file=sys.stderr)
                return 1

            print(".mcp.json is up to date.")
            return 0

        OUTPUT.write_text(rendered, encoding="utf-8")
        print(f"Generated {OUTPUT.relative_to(ROOT)} from {MCP_INDEX.relative_to(ROOT)}")
        if LOCAL_OVERRIDES.exists():
            print(f"Applied local overrides from {LOCAL_OVERRIDES.relative_to(ROOT)}")
        return 0
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
