# Supported Runtime Matrix

This matrix defines the supported execution environments for DGN-DJ by DGNradio across launcher, backend services, and operator tooling.

## Support policy

- **Supported**: fully validated and eligible for release support.
- **Conditional**: works for development/testing, not production support.
- **Unsupported**: explicitly out of scope for release readiness.

## Runtime matrix

| Surface | Runtime / OS | Supported versions | Status | Notes |
| --- | --- | --- | --- | --- |
| Windows desktop launcher (`DGN-DJ_Launcher.bat`) | Windows 10/11 x64 | 22H2+ | Supported | Primary operator environment for packaged executable workflow. |
| Packaged desktop app (`RoboDJ Automation.exe`) | Windows 10/11 x64 | 22H2+ | Supported | Distributed binary; do not modify in-repo executable artifact. |
| Python backend scripts (`backend/`, `config/`) | CPython | 3.11.x | Supported | Baseline for validation utilities and automation scripts. |
| Web tooling / UI tests | Node.js | 20 LTS | Supported | Required for frontend test/lint pipelines where applicable. |
| Containerized services (`docker-compose.yaml`) | Docker Engine + Compose V2 | Engine 24+, Compose 2.20+ | Conditional | Supported for local and CI validation; production support remains Windows-first. |
| Linux host without Windows launcher | Ubuntu/Debian/macOS | any | Unsupported | May be used for docs/CI authoring only; not a supported operator runtime. |
| Python pre-3.11 | CPython | <=3.10 | Unsupported | Missing compatibility guarantees and test coverage. |
| Node pre-20 | Node.js | <=18 | Unsupported | Not validated against current toolchain assumptions. |

## Unsupported scenarios

- Running release operations directly from arbitrary Linux/macOS operator workstations.
- Treating container workflow as a production replacement for the Windows launcher path.
- Using unpinned legacy Python/Node runtimes outside listed support window.

## Cross-links

- Architecture entry point: `ARCHITECTURE.md`
- New user onboarding: `docs/product-specs/new-user-onboarding.md`
- Dependency compatibility contract: `docs/product-specs/dependency-compatibility-contract.md`
- Environment profiles: `docs/product-specs/environment-profiles.md`
