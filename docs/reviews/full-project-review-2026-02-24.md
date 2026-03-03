# Full Project Review — 2026-02-24

## Scope and assumptions

- This is a static + test-driven audit of the repository from the root workspace, with focus on product readiness, engineering quality, and operational maturity.
- I reviewed representative code paths across frontend (`src/`), backend (`backend/`), workflows (`.github/workflows/`), and core docs.
- I did not execute production deployment paths or Windows-only binaries in this Linux container.

## Executive assessment

The project has strong momentum and a lot of useful scaffolding, but it is **not yet production-ready as a fully interactive end-to-end platform**. The frontend test surface is healthy, but backend execution is currently blocked by dependency gaps and at least one hard syntax error in tests. CI coverage is fragmented and partially misconfigured. Documentation is rich but inconsistent in product identity and architecture boundaries.

## What is working well (honest positives)

1. **Frontend UI test suite is present and passing** for the current React/Next app (`26 tests, 5 files`).
2. **Modular console architecture** is cleanly partitioned into views and components (`ConsoleLayout`, `ConsoleWorkspaceView`, view modes).
3. **Backend service composition pattern is solid**: FastAPI app with separated routers for policy, scheduling UI, status, and playlist APIs.
4. **Operational docs are extensive**, and the scheduler/autonomy README clearly defines conflict precedence and API intent.
5. **Security startup guard exists** (`run_secret_integrity_checks`) and blocks boot on integrity failures.

## Critical problems (harsh but accurate)

### P0 — backend is not executable/testable in a clean environment

- No root backend dependency manifest is discoverable (`requirements.txt`, `pyproject.toml`, or equivalent for `backend/`), while backend code imports `fastapi` and `pydantic` directly.
- Running `pytest backend/tests -q` fails during collection with missing `fastapi`/`pydantic` modules.

**Impact:** backend cannot be reproduced reliably by contributors/CI without tribal knowledge.

### P0 — hard syntax failure in backend tests

- `backend/tests/test_autonomy_policy_api.py` contains an unclosed dictionary / malformed control flow block around `invalid_policy` and duplicated `finally`/request calls.

**Impact:** backend test suite cannot even be collected, masking functional regressions.

### P1 — lint workflow for frontend is effectively broken

- `npm run lint` launches deprecated `next lint` and blocks on interactive ESLint setup prompt.
- That means lint is not CI-safe in fresh environments.

**Impact:** style and quality regressions slip through; local dev automation is brittle.

### P1 — CI workflow quality is inconsistent

- `.github/workflows/webpack.yml` has duplicate `run` keys in the same step (`run: npm run build` and another `run: | ...`), which is invalid/ambiguous workflow authoring.
- `codeql.yml` is disabled (`codeql.yml.disabled`), so static security analysis is not active by default.
- Several workflows validate config/docs but do not clearly gate fullstack test/lint for both frontend and backend.

**Impact:** false sense of CI coverage; key failure modes can merge.

### P1 — architecture identity drift / repo sprawl

- Root docs brand as “AetherRadio”, AGENTS/doc stack frames “DGN-DJ”, and repository includes multiple app roots (`src`, `apps/dj-console`, `dgn-dj-next`, `radio-agentic`, etc.).
- This suggests parallel tracks without a canonical “blessed” runtime path.

**Impact:** onboarding cost, duplicated effort, and unclear ownership boundaries.

### P2 — frontend cleanliness issues still visible

- `src/app/page.tsx` imports `React`/`useState` but doesn’t use them.

**Impact:** low severity, but signals missing lint enforcement and code hygiene drift.

## What the project needs for a full interactive production application

## 1) Build and runtime determinism (must-have)

- Add a **single source of truth** for Python backend dependencies at repo root or `backend/` (`pyproject.toml` preferred), with locked versions.
- Add deterministic environment bootstrap (`Makefile` or `justfile`) for:
  - `install-frontend`
  - `install-backend`
  - `test-frontend`
  - `test-backend`
  - `lint-all`
  - `typecheck`
- Ensure backend startup command is executable in one command from clean clone.

## 2) CI hardening (must-have)

- Replace deprecated `next lint` flow with explicit ESLint CLI (`eslint . --max-warnings=0`) and committed config.
- Fix invalid workflow authoring in `webpack.yml` and add a matrix that runs:
  - Node build/test/lint
  - Python unit tests with dependency install
- Re-enable and scope CodeQL (or equivalent SAST) for JS/TS and Python.
- Add PR-required status checks for both stacks.

## 3) Backend correctness and resilience (must-have)

- Fix syntax error in `test_autonomy_policy_api.py` immediately.
- Add collection sanity check in CI (`pytest --collect-only`) before full run.
- Add contract tests for each API router and schema-validation tests for autonomy/scheduler payloads.
- Formalize migration/versioning strategy for config JSON files written by APIs.

## 4) Product architecture consolidation (must-have)

- Declare canonical app entry points:
  - primary frontend
  - primary backend
  - deprecated/experimental folders
- Move non-canonical apps to `experiments/` or archive branches.
- Publish one authoritative architecture doc with deployment topology and ownership map.

## 5) Observability and operational readiness (should-have)

- Standardize structured logging (request IDs, station IDs, mode decisions).
- Add metrics for scheduling conflict detection latency and policy write failures.
- Add health/readiness endpoints integrated with startup checks.
- Add error budget/SLO targets for API availability and scheduler response time.

## 6) Security and compliance posture (should-have)

- Enforce secrets scanning in CI (e.g., gitleaks/trufflehog).
- Turn secret integrity startup checks into CI tests too.
- Add dependency vulnerability scans (`pip-audit`, `npm audit` policy gates).
- Enforce redaction contract tests for frontend/backend responses.

## 7) UX and interaction completeness (should-have)

- Define end-to-end user journeys (upload → schedule → air → monitor → recover).
- Add Playwright E2E tests for primary operator flows.
- Add accessibility checks (keyboard nav, contrast, reduced motion).
- Validate realtime behavior under degraded network / backend restart conditions.

## 8) Release engineering (should-have)

- Add versioned release notes generated from conventional commits.
- Define semantic versioning policy across frontend/backend/config schemas.
- Add rollback playbooks and “known-good” config snapshots.

## Recommended execution order

1. **Unblock backend reproducibility**: dependency manifest + syntax fix + collect-only CI.
2. **Stabilize CI**: lint migration + workflow corrections + mandatory checks.
3. **Consolidate architecture**: canonical runtime declaration and repository pruning.
4. **Add E2E + observability**: prove real interactive flows and incident diagnosability.
5. **Security and release gates**: enforce audit/scans and rollback discipline.

## Bottom line

You have a strong foundation and a lot of valuable assets, but right now this reads like a **high-potential platform in integration phase**, not a finished full-interactive production system. The biggest blockers are reproducibility (Python deps), backend test integrity (syntax error), and CI gate reliability. Once these are fixed, your path to a robust production-grade stack is straightforward.
