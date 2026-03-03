# Environment Profiles

This document defines standard environment profiles used for development, validation, and operator release workflows.

## Profile matrix

| Profile | Purpose | Required runtime | Data/config posture | Validation baseline |
| --- | --- | --- | --- | --- |
| `operator-windows` | Primary launch and release workflow via batch launcher and packaged app. | Windows 10/11 x64, CPython 3.11.x | Uses real config files with backup-before-edit controls. | `python config/validate_config.py` + `python config/check_runtime_secrets.py --require-env-only` |
| `dev-local` | Feature development and targeted verification on source tree. | CPython 3.11.x, Node 20 LTS | Uses editable local config with safe test fixtures. | repo-specific lint/test + JSON validation when configs touched |
| `ci-container` | Deterministic CI-like execution of validation/test workloads. | Docker Engine 24+, Compose 2.20+, Node 20, Python 3.11 | Ephemeral containers; no persistent secret material in image layers. | full automated test/validation pipeline |
| `docs-only` | Planning/spec updates without runtime execution changes. | Any environment with markdown tooling | No config mutation required. | markdown lint/consistency checks (if configured) |

## Profile selection rules

1. Use `operator-windows` for any release-candidate or launcher-path verification.
2. Use `dev-local` for iterative implementation tasks before promotion.
3. Use `ci-container` for reproducibility and merge-gate validation.
4. Restrict `docs-only` to documentation/planning changes only.

## Risk notes

- Cross-profile drift is a release risk; keep runtime floors aligned with the compatibility contract.
- Do not promote artifacts from unsupported runtimes into release candidates.

## Related specs

- `docs/product-specs/runtime-matrix.md`
- `docs/product-specs/dependency-compatibility-contract.md`
- `PRE_RELEASE_CHECKLIST.md`
