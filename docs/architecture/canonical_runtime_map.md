# Canonical Runtime Map

This document is the canonical declaration of runtime entrypoints, owned subprojects, deployment targets, and reference-only trees.

## Primary application entrypoints

| Entrypoint | Runtime | Command | Deployment target | Owner boundary |
| --- | --- | --- | --- | --- |
| Next.js Studio (root app) | Node.js 20.x + Next.js 15.5.10 | `npm run dev` / `npm run build && npm run start` | Vercel (primary), local dev on Windows/macOS/Linux | Root workspace owner (`/`) |
| Windows desktop launcher | Windows batch + bundled Python runtime | `./DGN-DJ_Launcher.bat` | Windows desktop operators (packaged EXE flow) | Root workspace owner (`/`) |
| Windows desktop compatibility launcher | Windows batch shim | `./RoboDJ_Launcher.bat` | Legacy shortcuts/scripts compatibility layer | Root workspace owner (`/`) |
| Next.js fullstack launcher (Windows) | Windows batch + Node.js 20.x | `./DGNDJ_Fullstack_Launcher.bat [dev|prod] [--port N]` | Local fullstack web runtime on Windows | Root workspace owner (`/`) |
| Legacy desktop+backend fullstack launcher | Windows batch + Python runtime | `./DGN-DJ_Fullstack_Launcher.bat` | Deprecated compatibility path (legacy workflows only) | Root workspace owner (`/`) |
| DJ Console | Node.js 20.x + Vite 5.4.8 | `npm --prefix apps/dj-console run dev` | Browser UI in local/dev artifacts | `apps/dj-console/` owner |
| Radio Agentic stack | Node.js 20.x monorepo (pnpm workspace) | `pnpm --dir radio-agentic install && docker compose -f radio-agentic/docker-compose.yml up --build` | Containerized service topology | `radio-agentic/` owner |
| DGN Airwaves package | Python 3.11-compatible package (`requires-python >=3.10`) | `python -m pip install -e dgn-airwaves` | Python library/runtime extension | `dgn-airwaves/` owner |


## Launcher naming policy (canonical vs compatibility)

- Canonical desktop launcher: `DGN-DJ_Launcher.bat`.
- Canonical Next.js fullstack launcher: `DGNDJ_Fullstack_Launcher.bat`.
- Compatibility shim: `RoboDJ_Launcher.bat` (delegates to canonical desktop launcher).
- Deprecated compatibility launcher: `DGN-DJ_Fullstack_Launcher.bat` (legacy desktop+backend flow only).

## Bundled artifact policy

- `.exe` deliverables (`DGN-DJ Automation.exe`, `RoboDJ Automation.exe`) are intentionally excluded from git history and distributed as external/bundled packaging artifacts.
- Runtime docs and launcher scripts must treat these executables as expected-at-runtime files, not tracked repository assets.

## Owned subprojects

| Tree | Purpose | Primary manifest(s) | Owner boundary |
| --- | --- | --- | --- |
| `/` | Main DGN-DJ web studio + repo orchestration | `package.json` | Root team owns cross-cutting docs, CI, launcher scripts |
| `apps/dj-console/` | Standalone DJ console UI | `apps/dj-console/package.json` | App-scoped UI implementation + tests |
| `radio-agentic/` | Agentic multi-service workspace | `radio-agentic/package.json`, `radio-agentic/**/package.json` | Workspace-scoped services/apps only |
| `dgn-airwaves/` | Python package skeleton for airwaves modules | `dgn-airwaves/pyproject.toml` | Python package boundaries |

## Deprecated / reference-only trees

| Tree | Status | Rule |
| --- | --- | --- |
| `RoboDJ Automation.exe_extracted/` | Reference only | Do not modify; extraction exists for analysis only |
| `make-4.3/` | Third-party source snapshot | Treat as vendored/reference unless explicitly tasked |
| `_bmad-custom-backup-temp/` | Backup archive | Do not use for active implementation changes |

## Canonical framework/runtime versions (CI-validated)

```json
{
  "node": "20.x",
  "python": ">=3.10",
  "next": "15.5.10",
  "react_root": "^18",
  "react_workspace": "^18.3.1",
  "typescript_root": "^5",
  "typescript_dj_console": "^5.6.2",
  "vite": "^5.4.8",
  "express": "^4.21.2",
  "nats": "^2.29.1"
}
```

Version declarations above must stay aligned with package manifests and `dgn-airwaves/pyproject.toml`. CI enforces this via `scripts/validate_runtime_versions.py`.
