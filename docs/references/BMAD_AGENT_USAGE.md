# BMAD Usage in This Repository (Codex, Gemini, Jules)

## Short answer

No — the current BMAD install in this repo is **not automatically used for every generation** by Codex, Gemini, or Jules.

The install added BMAD workflows and agent/task definitions under `_bmad/`, but each agent runtime still needs explicit instructions to load and follow those files.

## What is currently installed

- BMAD manifests and workflow definitions live in `_bmad/`.
- Installed modules are `core` and `bmm` (v6.0.0-Beta.8).
- The BMAD help catalog includes command-style entries such as `bmad-help`, `bmad-brainstorming`, and other BMAD workflow commands.

## Why it is not automatic across all tools

Different agent clients (Codex CLI, Gemini tools, Jules, etc.) have different prompt-loading behavior:

- Some read repository instructions like `AGENTS.md` automatically.
- Some only follow explicitly provided system/developer prompts.
- Some require manual invocation of command patterns.

So the `_bmad/` directory alone does not force per-generation BMAD behavior in every client.

## How to make BMAD run consistently

Use an explicit startup instruction/profile per tool.

### Suggested default instruction block

Use the canonical startup snippet in [`docs/operations/agent_execution_commands.md`](../operations/agent_execution_commands.md#canonical-bmad-startup-policy-codexgeminijules) for all client bootstrap prompts.

### Per-client setup checklist

1. **Codex**: add the instruction block to your repo/project bootstrap prompt.
2. **Gemini**: add the same block to workspace instructions or your reusable session template.
3. **Jules**: add the same block to project context defaults or startup macro.
4. Optionally create a shortcut command (for example, `start-bmad`) that injects the instruction block at the beginning of every session.

Without this per-client setup, BMAD remains installed but optional.

## Practical expectation

- **Installed now:** BMAD assets are present and ready.
- **Still required:** per-client configuration (Codex/Gemini/Jules) so BMAD is applied by default every session/generation.

## BMM workflow runtime config source

For workflow execution under `_bmad/bmm/workflows/**`, runtime configuration is sourced from:

- `_bmad/bmm/config.yaml`

This file is the canonical BMM config and provides keys consumed by workflow variables such as `main_config`/`config_source` (`project_name`, `output_folder`, `planning_artifacts`, `implementation_artifacts`, `communication_language`, and related fields).

## BMAD manifest maintenance

After any BMAD module install or update, regenerate `_bmad/_config/manifest.yaml` so it remains a single valid YAML document with one `installation` block and one `modules` list.

Recommended quick procedure:

1. Rebuild or clean up the manifest to keep one entry per installed module.
2. Validate YAML syntax and confirm there are no duplicate top-level keys.
3. Verify installed modules (`core`, `bmm`) still appear with consistent metadata fields (`name`, `version`, `installDate`, `lastUpdated`, `source`, `npmPackage`, `repoUrl`).
