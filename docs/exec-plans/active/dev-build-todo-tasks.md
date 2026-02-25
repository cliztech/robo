# Dev Build TODO Tasks (BMAD Quick Dev)

## Assumptions
- This task list operationalizes the current sprint hardening scope already approved in `_bmad-output/implementation-artifacts/sprint-plan.md`.
- Build readiness means lint/test/build pass with no scope expansion.
- Work should remain inside approved stories E6-S2..E6-S6 and E7-S1..E7-S6.

## Execution Queue

### 1) Build baseline + guardrails
- [x] Run `npm run lint` and capture baseline warnings/errors.
- [x] Run `npm run build` and capture build-time warnings/errors.
- [x] Confirm no unapproved scope items are in-flight (`git diff --name-only`, backlog cross-check).

### 2) Story implementation order (dependency-aware)
- [ ] E6-S2: Predictive queue risk cards.
- [ ] E6-S3: Prompt variable diff + approval workflow.
- [ ] E6-S4: Decision trace panel.
- [ ] E6-S5: Alert center remediation copy.
- [ ] E6-S6: Timeline conflict detection hints.
- [ ] E7-S1: Global keyboard map.
- [ ] E7-S2: Reduced-motion alternatives.
- [ ] E7-S3: Contrast audit pass.
- [ ] E7-S4: Focus management consistency.
- [ ] E7-S5: Performance budgets.
- [ ] E7-S6: Regression snapshot matrix.

### 3) Per-story Definition of Done
- [ ] Acceptance criteria implemented for the story.
- [ ] Required story-level validation commands pass.
- [ ] Rollback strategy documented in PR notes.
- [ ] Any changed JSON files validated with `python -m json.tool`.

### 4) Build verification gate (must pass before PR)
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `git status --short` is clean except intentional changes.

### 5) Handoff outputs
- [ ] Update sprint status artifact with completed story IDs.
- [ ] Publish validation command outputs in PR body.
- [ ] Record deferred or split requests under change-control notes.

## Out of Scope
- New stories outside E6/E7.
- Architecture redesign not required by listed acceptance criteria.
- Dependency/platform migrations.
