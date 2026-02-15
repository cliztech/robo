# Contributing

> **DGN-DJ by DGNradio** — AI-powered radio automation platform

## Before You Start

1. Read [`AGENTS.md`](AGENTS.md) — defines the multi-agent pipeline, three-tier boundaries, and coding style.
2. Read [`SKILLS.md`](SKILLS.md) — defines reusable skill definitions with triggers and guardrails.
3. Read [`CONFIG_VALIDATION.md`](CONFIG_VALIDATION.md) — how to validate config changes before submitting.
4. Read [`docs/development/git_worktree_workflow.md`](docs/development/git_worktree_workflow.md) — standard workflow for parallel branch development with `git worktree`.

## Repository Nature

This repository tracks a **packaged DGN-DJ distribution**, not compilable application source code. The `backend/` directory contains Python modules, but the primary executable is a pre-built PyInstaller bundle.

## CI Scope

The CI workflow intentionally runs **distribution/config validation only**:

- JSON syntax validation for `config/*.json`
- JSON schema validation via `python config/validate_config.py`
- Python syntax checks for maintenance scripts (e.g., `config/inspect_db.py`)
- Presence checks for expected distribution artifacts and config layout
- Frontend contract checks via `python config/spec_check_frontend_contracts.py`

## Do Not Add Generic Build Workflows

Please do **not** add default C/C++, CMake, or MSBuild starter workflows unless this repository starts including the corresponding source/build assets.

If build assets are introduced later, add build workflows in a separate pull request with:

1. Which new source/build files were added.
2. Why the new workflow is now required.
3. How the workflow maps to this repository's structure.

## Release / deployment handoff requirements

To avoid process drift, follow the same release gate in deployment and handoff activities:

- Run `python config/validate_config.py`.
- Do not proceed unless output includes: `Configuration validation passed for schedules.json and prompt_variables.json.`
- For risky configuration changes, archive backup snapshots in `config/backups/` and include them with release/deployment artifacts.
