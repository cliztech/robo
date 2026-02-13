# MCP Service Manifests for DGN-DJ

This folder contains explicit, versioned MCP server manifests for the services DGN-DJ uses.

## Services

- `time` — deterministic clock and timezone utilities for scheduling logic.
- `filesystem` — controlled access to local project and configuration files.
- `sqlite` — read-only introspection and queries over RoboDJ runtime databases.
- `fetch` — outbound HTTP requests for feed/content integrations.
- `git` — repository-aware tooling for automation maintenance.

The aggregate file `servers.json` is intended to be consumed by tooling and CI validation.
