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

Use a startup instruction/profile per tool, for example:

1. In each tool's global or project prompt, add:
   - "Always load `_bmad/_config/bmad-help.csv` and route tasks using BMAD workflow commands."
   - "Use BMAD workflows before free-form execution when an applicable workflow exists."
2. Optionally define aliases/snippets that begin sessions with BMAD context loading.
3. Keep this repository-local BMAD install as the source of truth for workflow definitions.

## Practical expectation

- **Installed now:** BMAD assets are present and ready.
- **Still required:** per-client configuration (Codex/Gemini/Jules) so BMAD is applied by default every session/generation.
