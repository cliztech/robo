# Contributing

> **DGN-DJ by DGNradio** — AI-powered radio automation platform

## Before You Start

1. Read [`AGENTS.md`](AGENTS.md) — defines the multi-agent pipeline, three-tier boundaries, and coding style.
2. Read [`SKILLS.md`](SKILLS.md) — defines reusable skill definitions with triggers and guardrails.
3. Read [`CONFIG_VALIDATION.md`](CONFIG_VALIDATION.md) — how to validate config changes before submitting.

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

## Commit & PR Standards

- Use **Conventional Commits**: `chore:`, `docs:`, `fix:`, `feat:`
- Keep commits scoped to configuration, documentation, or scripts
- PR bodies should include: summary, files touched, validation commands run
- Follow the three-tier boundary system defined in `AGENTS.md`

## Key Documentation

| Document | Purpose |
|----------|---------|
| [`AGENTS.md`](AGENTS.md) | Agent pipeline, boundaries, coding style |
| [`SKILLS.md`](SKILLS.md) | Reusable skill definitions |
| [`PERSONA_OPS.md`](PERSONA_OPS.md) | AI host persona management |
| [`docs/autonomy_modes.md`](docs/autonomy_modes.md) | 5-level autonomy operating modes |
| [`docs/conversation_orchestrator_spec.md`](docs/conversation_orchestrator_spec.md) | Conversation orchestration model |
| [`contracts/redaction_rules.md`](contracts/redaction_rules.md) | Frontend data redaction rules |
| [`CONFIG_VALIDATION.md`](CONFIG_VALIDATION.md) | Config validation procedures |
