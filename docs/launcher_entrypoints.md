# Launcher and Executable Entrypoint Scaffold

This document defines the canonical startup surface for DGN-DJ so operators and contributors can reason about how the app boots in desktop and fullstack modes.

## Entrypoint Map

| Entrypoint | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `DGN-DJ_Launcher.bat` | Windows launcher | Canonical desktop launcher for packaged executable | Runs startup safety gate before elevating executable launch |
| `RoboDJ_Launcher.bat` | Windows launcher shim | Backward-compatible alias for legacy launcher name | Delegates to `DGN-DJ_Launcher.bat` |
| `DGN-DJ_Fullstack_Launcher.bat` | Windows launcher | Desktop + backend startup flow | Starts FastAPI backend and elevated executable |
| `DGNDJ_Fullstack_Launcher.bat` | Windows launcher | Next.js fullstack startup flow for web stack | Supports `dev`/`prod` modes and `--port` |

## Logical Startup Layers

1. **Compatibility Layer**
   - `RoboDJ_Launcher.bat` keeps old shortcuts/scripts working while routing to branded launcher.
2. **Safety Layer**
   - Startup safety checks in `config/scripts/startup_safety.py` run before desktop executable launch.
3. **Runtime Layer**
   - Desktop runtime launches `DGN-DJ Automation.exe` (fallback to `RoboDJ Automation.exe` where needed).
   - Fullstack runtime launches either FastAPI + desktop executable or Next.js web stack.

## Directory Scaffold Expectations

All launcher scripts are expected to remain at repository root and rely on relative path resolution via `%~dp0`:

```text
repo-root/
├── DGN-DJ_Launcher.bat
├── RoboDJ_Launcher.bat
├── DGN-DJ_Fullstack_Launcher.bat
├── DGNDJ_Fullstack_Launcher.bat
├── DGN-DJ Automation.exe (or RoboDJ Automation.exe)
└── config/
    └── scripts/
        └── startup_safety.py
```

## Maintenance Rules

- Keep launchers single-purpose and avoid dead/unreachable code paths.
- Validate required runtime dependencies early (Python/Node/npm/uvicorn).
- Preserve explicit, operator-facing error messages with expected file paths.
- Any rename/move of launcher or executable paths must update this map and `AGENTS.md` command references.
