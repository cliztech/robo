# Dependency Compatibility Contract

This contract defines minimum dependency floors, upgrade policy, and support windows for DGN-DJ by DGNradio.

## Dependency floors (hard minimums)

| Dependency | Minimum | Target | Reason |
| --- | --- | --- | --- |
| CPython | 3.11.0 | 3.11.x | Runtime baseline for backend/config tooling and validation scripts. |
| Node.js | 20.0.0 (LTS) | 20.x LTS | Frontend/test toolchain consistency and long-term patch support. |
| npm | 10.0.0 | bundled with Node 20 LTS | Lockfile/install behavior compatibility. |
| Docker Engine | 24.0.0 | latest stable 24/25 | Compose/runtime compatibility in local CI-like flows. |
| Docker Compose | 2.20.0 | latest stable 2.x | Required features used by current compose files. |

## Compatibility guarantees

1. **Minor-version compatibility:** patch and minor upgrades within supported major versions are expected to be non-breaking.
2. **Major-version upgrades:** require explicit validation updates and release-note acknowledgment before adoption.
3. **Backport scope:** security patches can be backported to active supported major versions only.

## Upgrade policy

- Validate runtime and dependency changes in a dedicated change set before release sign-off.
- Run all mandatory pre-release checks from `PRE_RELEASE_CHECKLIST.md` after any version bump.
- Update these artifacts atomically when floors change:
  - `docs/product-specs/runtime-matrix.md`
  - `docs/product-specs/dependency-compatibility-contract.md`
  - `docs/product-specs/environment-profiles.md`

## Support window

- **Primary support:** current dependency floor major versions listed above.
- **Grace period:** one prior major version may be used only for emergency rollback testing, not forward development.
- **End-of-support trigger:** upstream EOL or unresolved critical security exposure.

## Release gate linkage

Release readiness requires confirming current runtime/tooling versions meet this contract before final sign-off.
