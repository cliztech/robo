# Deep Code Review — 2026-02-23

## Scope and Method

- Route selected: **QA / Brutal Review & Feedback** (read-heavy, defect-focused) based on repository guidance.
- Reviewed core runtime paths: backend API bootstrapping, autonomy policy service, scheduler UI service, auth, and build/test tooling.
- Performed static review plus lightweight executable checks (`pytest -q`, targeted syntax compile).

## Executive Summary

The project has good directional architecture (typed Pydantic models, explicit conflict categories, and service boundaries), but currently fails baseline runtime reliability due to **merge-corruption defects in critical backend modules** and **environment/tooling drift** that prevents tests from running in this environment.

Overall status: **Not release-ready** for backend service startup without remediation of P0/P1 issues below.

## Findings (Prioritized)

### P0 — Backend cannot reliably start due to syntax/merge corruption in `autonomy_service.py`

- `AutonomyPolicyService.get_policy()` has duplicated and malformed argument blocks in `emit_scheduler_event(...)`, including repeated keyword arguments and mismatched braces in the same call path. This aligns with actual test collection failure (`SyntaxError`) during import.
- `AutonomyPolicyService.update_policy()` also contains interleaved duplicate backup code and broken call structure, indicating an unresolved merge splice rather than intentional logic.

**Evidence:** `backend/scheduling/autonomy_service.py` lines 61–80, 129–142, and 158–170 show duplicated/invalid call structure and broken block continuity.

**Risk:** Complete backend API startup failure for autonomy endpoints; zero functional reliability for affected imports.

**Recommendation:**
1. Reconstruct both methods from a known-good commit (or rewrite cleanly).
2. Add a required `python -m py_compile backend/scheduling/autonomy_service.py` gate in CI.
3. Add regression test covering startup bootstrap and backup creation flows.

---

### P1 — Auth module is internally inconsistent and likely broken at import-time

- `backend/security/auth.py` uses `@functools.lru_cache` without importing `functools`.
- The file appears to contain two stitched implementations (duplicate imports/API key header definitions mid-file), suggesting accidental concatenation.
- Mixed status-code semantics (`401` for general API key path vs `403` in scheduler path) and duplicated header objects reduce clarity and make behavior harder to reason about.

**Evidence:** `backend/security/auth.py` lines 10, 51–56.

**Risk:** Import/runtime errors and inconsistent authentication semantics across endpoints.

**Recommendation:**
1. Normalize into one coherent module with one header definition.
2. Standardize auth failure semantics and error body format across both verifiers.
3. Add direct unit tests for missing key, bad key, and fallback behavior.

---

### P1 — API initialization flow duplicates service construction and may weaken recovery intent

- In `get_policy_service()`, `_service_instance` is assigned `service` and then immediately reassigned to a **new** `AutonomyPolicyService()`.
- This drops any state/recovery work done on the first instance and creates unclear startup behavior.
- The module also includes a duplicate `import logging` line.

**Evidence:** `backend/scheduling/api.py` lines 8 and 57–59.

**Risk:** Non-deterministic startup/recovery semantics and reduced observability confidence.

**Recommendation:** Keep a single initialized service instance and remove duplicate import noise.

---

### P2 — Build/quality gates are incomplete relative to current backend risk profile

- `Makefile` has duplicated `.PHONY` declarations.
- `qa` target compiles only `config/inspect_db.py` and does not syntax-check backend modules where critical failures currently exist.

**Evidence:** `Makefile` lines 1–2 and 37–40.

**Risk:** Broken backend code can pass `make qa` undetected.

**Recommendation:** expand QA gate to include backend syntax compile and targeted smoke tests.

---

### P3 — Documentation drift creates onboarding confusion

- `CLAUDE.md` says `package.json` is missing from root, but the repository includes `package.json`.

**Evidence:** `CLAUDE.md` line 40 and repository root contents.

**Risk:** Contributor confusion and incorrect assumptions about frontend operability.

**Recommendation:** refresh docs to reflect actual repository state.

## Positive Notes

- Scheduler domain modeling is well-structured: explicit conflict taxonomy and deterministic sorting in conflict detection aid reproducibility.
- `SchedulerUiService` follows a clear read/validate/write flow and returns rich state objects suitable for UI integration.

## Validation Commands Run

- `pytest -q` → failed during collection due to missing dependencies and a hard syntax error in backend service module.
- `python -m py_compile backend/scheduling/autonomy_service.py` → confirms syntax failure in reviewed module.
