# Launcher and Executable Entrypoints

This document is the canonical source of truth for launcher naming and entrypoint roles in this repository. Runtime ownership and deployment boundaries stay in `docs/architecture/canonical_runtime_map.md`.

## Entrypoint Map

| Entrypoint | Status | Type | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `DGN-DJ_Launcher.bat` | **Canonical** | Windows launcher | Desktop launcher for packaged executable runtime | Runs startup safety gate before elevated executable launch |
| `RoboDJ_Launcher.bat` | **Shim (compatibility)** | Windows launcher shim | Backward-compatible alias for legacy launcher filename | Delegates to `DGN-DJ_Launcher.bat`; do not add new references |
| `DGNDJ_Fullstack_Launcher.bat` | **Canonical** | Windows launcher | Next.js fullstack startup flow for local web runtime | Supports `dev`/`prod` modes and `--port` |
| `DGN-DJ_Fullstack_Launcher.bat` | **Deprecated (compatibility)** | Windows launcher | Legacy desktop + FastAPI bootstrap flow | Retained to avoid breaking legacy operator scripts; no new automation should target it |

## Executable Artifact Policy

- `DGN-DJ Automation.exe` and `RoboDJ Automation.exe` are **external/bundled artifacts**, not tracked in git and intentionally excluded from git.
- Launchers intentionally validate expected executable paths at runtime to fail fast with operator-readable errors.
- Any packaging pipeline that emits `.exe` files must publish them outside repository history.

## Logical Startup Layers

1. **Compatibility Layer**
   - `RoboDJ_Launcher.bat` keeps legacy shortcuts/scripts working while routing to the branded launcher.
   - `DGN-DJ_Fullstack_Launcher.bat` remains available only as a legacy compatibility entrypoint.
2. **Safety Layer**
   - Startup safety checks in `config/scripts/startup_safety.py` run before desktop executable launch.
3. **Runtime Layer**
   - Desktop runtime launcher expects a packaged executable (`DGN-DJ Automation.exe`) to be present beside launcher scripts.
   - Canonical fullstack launcher is `DGNDJ_Fullstack_Launcher.bat` (Next.js web runtime).
   - Legacy fullstack launcher (`DGN-DJ_Fullstack_Launcher.bat`) remains only for compatibility with older desktop+backend workflows.

## Directory Scaffold Expectations

All launcher scripts are expected to remain at repository root and rely on relative path resolution via `%~dp0`:

```text
repo-root/
├── DGN-DJ_Launcher.bat
├── RoboDJ_Launcher.bat
├── DGN-DJ_Fullstack_Launcher.bat
├── DGNDJ_Fullstack_Launcher.bat
├── DGN-DJ Automation.exe (external/bundled; intentionally untracked)
└── config/
    └── scripts/
        └── startup_safety.py
```

## Maintenance Rules

- Keep launchers single-purpose and avoid dead/unreachable code paths.
- Validate required runtime dependencies early (Python/Node/npm/uvicorn).
- Preserve explicit, operator-facing error messages with expected file paths.
- Any rename/move of launcher or executable paths must update this map, `docs/architecture/canonical_runtime_map.md`, and `AGENTS.md` command references.
