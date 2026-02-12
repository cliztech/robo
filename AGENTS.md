# Repository Guidelines

## Scope
These instructions apply to the entire repository unless a deeper `AGENTS.md` overrides them.

## Project Structure & Module Organization
- `RoboDJ Automation.exe` and `RoboDJ_Launcher.bat` are the runnable artifacts for the Windows desktop app.
- `config/` contains runtime state and user configuration:
  - `settings.db`, `user_content.db` (SQLite databases)
  - `schedules.json`, `prompt_variables.json` (JSON config)
  - `prompts/`, `scripts/`, `music_beds/`, `logs/`, `cache/`, `backups/`
- `RoboDJ Automation.exe_extracted/` is a PyInstaller extraction for reference only.
- Docs are PDF/MD files in the root (e.g., `README.pdf`, `QUICK_START_FEATURE_GUIDE.pdf`).

## Multi-Agent Pipeline
Use this stage-gated flow for all requests:

1. **Intake Agent**
   - Classify request type: QA review, docs/config change, implementation, or architecture proposal.
   - Resolve scope by reading nearest `AGENTS.md` files.
   - Select relevant skill entries from `SKILLS.md`.
2. **Planner Agent**
   - Build a minimal plan with constraints and expected artifacts.
   - Ensure each plan step is allowed in-scope.
3. **Executor Agent**
   - Perform only scoped changes.
   - Do not modify binaries (`.exe`) or SQLite DB files.
4. **Verifier Agent**
   - Run only checks allowed by the active task constraints.
   - Confirm formatting requirements and security constraints.
5. **Handoff Agent**
   - Summarize outcomes, touched files, validation done, and follow-ups.

### Stage Gates
- Intake completes when scope + constraints + applicable skills are identified.
- Plan completes when every step maps to allowed operations.
- Execute completes when all changes remain in scope.
- Verify completes when requested checks/output requirements are satisfied.
- Handoff completes when user request is explicitly answered.

## Build, Test, and Development Commands
This repo is a compiled distribution; there is no build system.
- Run (recommended): `./RoboDJ_Launcher.bat`
- Run directly: `./RoboDJ Automation.exe`
- Inspect DB schemas (read-only):
  - `cd ./config && python ./inspect_db.py`

## Coding Style & Naming Conventions
- Only lightweight scripts are expected here (e.g., `config/inspect_db.py`).
- Prefer 4-space indentation for Python and keep scripts small and task-focused.
- JSON keys use `lower_snake_case`.
- Prefer concise markdown sections and task-focused headings.

## Route Selection
- **QA Route**: read-only inspection, no file edits.
- **Change Route**: apply scoped edits, keep commits small, avoid binaries.
- **Proposal Route**: design/spec output without implementation unless user asks.

## Commit & Pull Request Guidelines
- Use Conventional Commit style (e.g., `chore: ...`, `docs: ...`).
- Keep commits scoped to configuration/documentation/scripts.
- PRs should include:
  - a short summary of changes
  - any config files touched
  - screenshots only for UI behavior changes

## Security & Configuration Tips
- `config/secret.key` and `config/secret_v2.key` are sensitive; do not share.
- Do not edit `.db` files directly.
- Prefer JSON edits and keep backups in `config/backups/` before risky changes.
