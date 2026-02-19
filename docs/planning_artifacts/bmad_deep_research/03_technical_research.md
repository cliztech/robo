# 03 — Technical Research (BMAD)

## Status

**Pass**

## Technical options and trade-offs

### Option A — Launch-gated safety pipeline (recommended)

- Build/maintain a deterministic startup pipeline: diagnostics → config validation → crash-state detection → restore guidance → runtime start.
- Pros:
  - Strong alignment with v1.1 release goals.
  - Clear user-facing trust and predictable failure handling.
  - Directly measurable against readiness scorecard metrics.
- Cons:
  - Requires disciplined startup orchestration and robust error taxonomy.

### Option B — Incremental checks without strict launch gating

- Add checks as independent utilities and surface warnings but avoid strict stop conditions.
- Pros: lower immediate implementation friction.
- Cons: inconsistent protection model; weaker operator confidence; risk of runtime failure leakage.

## Dependencies and risks

- Dependency: stable JSON validation and error-location reporting for config files.
- Dependency: consistent snapshot manifest and restore semantics.
- Risk: weak traceability between roadmap items and verification evidence could block readiness sign-off.
- Risk: inconsistent severity mapping (pass/warn/fail) across startup checks can create operator confusion.

## Recommendation

Adopt **Option A** with explicit severity policy, verification commands per story, and artifact traceability through PRD → architecture → epics.
