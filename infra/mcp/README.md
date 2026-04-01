# MCP Service Manifests for DGN-DJ

This directory is the source of truth for MCP server definitions.

## Authoritative Source

- `infra/mcp/servers.json` is authoritative.
- Each entry references a `*.server.json` manifest that defines runtime and capabilities.
- `.mcp.json` at repo root is generated output and should not be edited by hand.
- Optional developer-only overrides can be provided in `.mcp.local.json` and are merged during generation.

## Startup Flow (Exact Commands)

Run from repository root:

```bash
# 1) Validate MCP manifests + schema
python scripts/validate_skills_and_mcp.py --mcp-only --validate-mcp-schema

# 2) Generate runtime MCP config from infra/mcp/servers.json
python scripts/generate_mcp_runtime_config.py

# 3) Verify generated config is in sync (CI parity check)
python scripts/generate_mcp_runtime_config.py --check
```

### Optional local overrides

Create `.mcp.local.json` with partial overrides and rerun generation:

```bash
python scripts/generate_mcp_runtime_config.py
```

Override merge behavior:

- Object keys are deep-merged.
- Arrays are replaced by local values.
- Scalars are overridden by local values.

## CI Drift Policy

CI enforces that `.mcp.json` matches generated output by default:

```bash
python scripts/generate_mcp_runtime_config.py --check
```

To explicitly skip this check in CI for exceptional cases, set:

```bash
MCP_RUNTIME_CONFIG_IGNORE=1
```

When this flag is set, CI passes `--ignore-drift` to the generator check step.
