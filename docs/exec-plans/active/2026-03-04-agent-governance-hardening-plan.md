# Agent Governance Setup Rating + Hardening Plan (2026-03-04)

## Assumptions
- Scope is limited to files that govern or instruct agent behavior (root governance, operations runbooks, skills, and context memory).
- Assessment reflects practical execution reliability, not document completeness alone.
- Ratings use a production-readiness lens: determinism, conflict-free routing, and maintainability.

## Current Rating

### Overall Score: **7.8 / 10**

The setup is strong and unusually comprehensive, but execution reliability is currently constrained by policy overlap, contradictory obligations between routes, and maintainability burden from duplicate authority surfaces.

### Category Breakdown
- **Coverage:** 9.2/10 — Governance addresses routing, safety boundaries, team structure, and execution artifacts.
- **Determinism:** 7.1/10 — Route behavior can diverge because overlapping docs define similar authority.
- **Operational Clarity:** 7.4/10 — Most flows are clear, but command/priority duplication introduces ambiguity.
- **Maintainability:** 6.9/10 — High update burden across multiple policy surfaces increases drift risk.
- **Enforceability:** 8.3/10 — Many strong gates exist, but some are not tied to a measurable rubric.

## Deficiencies (Realistic + Fair)

1. **Authority overlap across governance docs**
   - Similar rules are repeated across `AGENTS.md`, route templates, and operations playbooks.
   - Impact: different agents can legitimately pick different “authoritative” phrasing and diverge.

2. **QA route vs. context update contradiction**
   - Bootstrap language implies mandatory `.context` updates on completion, while QA route requires read-only behavior.
   - Impact: policy conflict for audit/review-only tasks.

3. **Command duplication and legacy alias ambiguity**
   - Launcher/run commands include overlapping legacy and canonical names without a strict “one canonical command” rule.
   - Impact: execution inconsistency and avoidable support overhead.

4. **Skills guidance partially misaligned with repo runtime expectations**
   - Some skill-level patterns are less strict than the current repository constraints.
   - Impact: increased chance of non-compliant output formatting and route behavior.

5. **Hard-gate wording lacks a single measurable scoring spec**
   - 100% completeness targets are good intent but need machine-verifiable field-level criteria.
   - Impact: subjective interpretation at PR/review time.

## Fix + Enhancement Plan

## Phase 1 — Determinism Baseline (high priority)
1. Create a canonical governance map defining source-of-truth by domain (routing, boundaries, gates, artifacts).
2. Add explicit conflict-resolution precedence in one place and reference it from all secondary docs.
3. Normalize command tables to one canonical command per action; move aliases into compatibility notes.

**Success metric:** No policy domain has more than one normative source file.

## Phase 2 — Policy Consistency (high priority)
1. Make context update requirements route-aware (QA = recommendation-only; Change/Proposal = update required when state changes).
2. Align skill output patterns with canonical issue/task-stub format and route constraints.
3. Add a route compliance checklist to reduce interpretation variance.

**Success metric:** QA tasks can be executed without any policy contradiction.

## Phase 3 — Measurable Quality Gates (medium priority)
1. Define a single rubric doc for “plan completeness”, “evidence completeness”, and “PR maturity”.
2. Convert broad “100% complete” wording into required fields with pass/fail definitions.
3. Link all gate references back to the rubric rather than duplicating semantics.

**Success metric:** Every gate in review can be checked by a finite field list.

## Phase 4 — Drift Prevention (medium priority)
1. Add instruction-doc drift checklist to contribution workflow.
2. Add periodic governance hygiene entry to execution cadence tracking.
3. Include instruction schema version metadata for change visibility.

**Success metric:** Governance PRs include explicit drift checks and source-of-truth validation.

## Recommended Immediate Next Actions (this week)
1. Land governance map + precedence rules.
2. Patch route-aware context update policy.
3. Normalize skill issue-emitter formatting and examples.
4. Introduce rubric skeleton for measurable gates.

## Target Outcome
Raise governance reliability from **7.8 → 9.0+** by reducing ambiguity rather than adding more policy text.
