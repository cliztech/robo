# Repository Guidelines

## Project Structure & Module Organization
- `RoboDJ Automation.exe` and `RoboDJ_Launcher.bat` are the runnable artifacts for the Windows desktop app.
- `config/` contains runtime state and user configuration:
  - `settings.db`, `user_content.db` (SQLite databases)
  - `schedules.json`, `prompt_variables.json` (JSON config)
  - `prompts/`, `scripts/`, `music_beds/`, `logs/`, `cache/`, `backups/`
- `RoboDJ Automation.exe_extracted/` is a PyInstaller extraction for reference only.
- Docs are PDF/MD files in the root (e.g., `README.pdf`, `QUICK_START_FEATURE_GUIDE.pdf`).

## Build, Test, and Development Commands
This repo is a compiled distribution; there is no build system.
- Run (recommended): `.\RoboDJ_Launcher.bat`  
  Launches with elevated privileges when needed.
- Run directly: `.\RoboDJ Automation.exe`
- Inspect DB schemas (read-only):  
  `cd .\config; python .\inspect_db.py`

## Coding Style & Naming Conventions
- Only lightweight scripts are expected here (e.g., `config/inspect_db.py`).
- Prefer 4-space indentation for Python and keep scripts small and task-focused.
- Config files:
  - JSON keys are lower_snake_case (see `config/prompt_variables.json`).
  - Avoid editing `.db` files directly; use a SQLite client if needed.

## Testing Guidelines
- No automated tests are present in this repository.
- If you add scripts, include a simple usage note and verify behavior manually.

## Commit & Pull Request Guidelines
- Recent history uses a Conventional Commit–style prefix like `chore:` (e.g., `chore: reorganize project structure and clean up repo`).
- Keep commits scoped to configuration or documentation changes; binaries should not be modified here.
- PRs should include:
  - A short summary of changes
  - Any config files touched
  - Screenshots only if UI behavior changes are involved (rare in this repo)

## Security & Configuration Tips
- `config/secret.key` and `config/secret_v2.key` are sensitive; do not share.
- Prefer editing JSON configs and keeping backups in `config/backups/` before risky changes.
