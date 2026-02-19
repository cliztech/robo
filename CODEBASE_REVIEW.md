# Codebase Review

> Part of the **DGN-DJ by DGNradio** platform. See [`AGENTS.md`](AGENTS.md) for agent pipeline rules.

## Scope

This review focuses on the repository artifacts that are editable in-source (scripts, configs, and operational docs), not on reverse-engineering or modifying bundled binaries.

## High-Level Assessment

- The repository is primarily a **runtime distribution** for a Windows desktop app, with minimal editable code.
- Operational risk is concentrated in launcher/configuration quality and secret-handling hygiene.
- Most of the tree under `make-4.3/` appears to be vendored upstream source and is not tightly integrated with the app runtime.

## Findings

### 1) Launcher portability (Resolved)

- `RoboDJ_Launcher.bat` now derives runtime paths from the launcher directory (`%~dp0`).
- Executable and startup safety script locations are resolved relative to the launcher, so installs are portable across drives and folders.

**Recommendation**

- Keep launcher/runtime files in the expected portable layout:
  - `RoboDJ_Launcher.bat`
  - `RoboDJ Automation.exe`
  - `config\scripts\startup_safety.py`

### 2) DB inspection script has weak resource handling and broad exception usage (Medium)

- `config/inspect_db.py` uses a manual close pattern and catches all exceptions generically.
- It is functional for local diagnostics, but robustness/readability can improve.

**Recommendation**

- Use a context manager (`with sqlite3.connect(...) as conn:`).
- Catch `sqlite3.Error` explicitly.
- Add a small `if __name__ == "__main__":` entrypoint for cleaner reuse.

### 3) Secrets are stored in repo path (Medium operational risk)

- Secret key material exists under `config/secret.key` and `config/secret_v2.key`.
- Even if this repo is private, keeping active secrets in-repo increases accidental disclosure risk.

**Recommendation**

- Rotate and externalize secrets where possible (environment/secret manager).
- Keep only template placeholders in version control when feasible.

### 4) Sparse validation tooling (Low)

- There is no formal test suite, linting, or schema validation for JSON config files.

**Recommendation**

- Add lightweight checks (e.g., JSON parse validation and optional schema checks) in CI or preflight scripts.

## What Looks Good

- Config appears intentionally isolated in `config/`.
- JSON naming conventions are consistent with snake_case.
- Repo includes practical operator docs and a minimal DB inspection utility.

## Suggested Next Steps (Priority Order)

1. Make launcher path portable (`%~dp0`) and validate privilege elevation behavior.
2. Refactor `config/inspect_db.py` for context-managed DB connections and explicit error handling.
3. Introduce a small config validation script (JSON parse + required keys).
4. Review secret lifecycle and rotation policy for files in `config/`.
