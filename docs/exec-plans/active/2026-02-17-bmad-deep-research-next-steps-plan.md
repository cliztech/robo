# BMAD Deep Research + Next-Steps Plan

Date: 2026-02-17  
Owner: Management / Planner agent lane  
Requested outcome: Use the integrated BMAD system to run deep research and define a practical execution path.

## 1) Intake classification and BMAD route selection

### Request classification
- **Route:** `Proposal` (research + planning, no implementation requested).
- **Why:** The request asks for deep research and next-step planning, which maps to analysis and planning artifacts.

### Canonical BMAD command sequence
1. `bmad-bmm-domain-research`
2. `bmad-bmm-technical-research`
3. `bmad-bmm-market-research`
4. `bmad-bmm-create-prd`
5. `bmad-bmm-create-architecture`
6. `bmad-bmm-create-epics-and-stories`
7. `bmad-bmm-check-implementation-readiness`
8. `bmad-bmm-sprint-planning`

This order follows the sequence guidance from BMAD phase progression and the route-to-command matrix.

---

## 2) Deep-research objective set (what to learn before implementation)

### A. Product and operator reality (Domain Research)
- Validate real-world operator workflows for:
  - schedule authoring
  - runtime intervention
  - rollback and recovery
  - on-air safety and handoff
- Identify failure modes in high-pressure scenarios (dead-air risk, invalid schedules, failed autonomy transitions).
- Produce domain glossary for shared language across docs/UI/tests.

### B. Feasibility and architecture constraints (Technical Research)
- Confirm hard constraints for packaged Windows runtime + Python backend + config JSON/SQLite boundaries.
- Evaluate architecture options for the highest-risk tracks currently in backlog:
  - security controls and role gating
  - redaction-safe telemetry and auditability
  - reliability/observability instrumentation
- Build decision records: option matrix, tradeoffs, migration risk, rollback options.

### C. Market and readiness positioning (Market Research)
- Benchmark must-have capabilities against cited competitors in AGENTS guidance (security, explainability, operator UX).
- Assess release-readiness expectations for comparable products:
  - enterprise trust signals
  - support model maturity
  - release and upgrade confidence
- Convert findings into **priority deltas** for current A/B/C/D readiness tracks.

---

## 3) Research deliverables and artifact map

### Required artifacts (BMAD output-aligned)
- `_bmad-output/planning-artifacts/research/domain-dgndj-product-readiness-research-2026-02-17.md`
- `_bmad-output/planning-artifacts/research/technical-dgndj-product-readiness-research-2026-02-17.md`
- `_bmad-output/planning-artifacts/research/market-dgndj-product-readiness-research-2026-02-17.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/epics-stories.md`
- `_bmad-output/planning-artifacts/implementation-readiness-report.md`
- `_bmad-output/implementation-artifacts/sprint-plan.md`

### Decision synthesis artifacts (repo planning lane)
- `docs/exec-plans/active/research_traceability_matrix.md` (update):
  - map each key finding -> impacted track/story -> required validation evidence.
- `docs/exec-plans/active/sprint-status.yaml` (update after sprint planning):
  - mark first wave of stories as `in-progress` only after readiness gate passes.

---

## 4) Deep-research execution plan (stage-gated)

## Stage 1 — Scope lock (Day 0)
- Confirm problem framing and success criteria from:
  - `PRODUCT_READINESS_PLAN.md`
  - `docs/exec-plans/active/2026-02-17-product-readiness-tracks-sprint-artifacts.md`
  - `docs/operations/subagent_execution_playbook.md`
- Define explicit out-of-scope items to prevent research sprawl.

**Exit criteria**
- Agreed research question list.
- Agreed ranking model for prioritization (P0/P1/P2/P3 + dependency risk).

## Stage 2 — Multi-lane deep research (Days 1–2)
- Run three lanes in parallel:
  - Domain
  - Technical
  - Market
- For each lane require:
  - source list
  - assumptions list
  - uncertainty log
  - concrete recommendation set

**Exit criteria**
- All lanes deliver findings with explicit confidence level and unresolved questions.

## Stage 3 — Planning conversion (Days 3–4)
- Convert research into product and architecture intent:
  - PRD
  - Architecture
  - Epics/Stories
- Add acceptance criteria and test/verification hooks at story level.

**Exit criteria**
- No story without acceptance criteria.
- No P0/P1 story missing dependency references.

## Stage 4 — Readiness gate + sprint launch (Day 5)
- Run implementation readiness review.
- If passed, execute sprint planning for wave-1 stories.
- If not passed, route through `bmad-bmm-correct-course` before sprinting.

**Exit criteria**
- Readiness report = pass (or pass-with-tracked-risks).
- Sprint plan published with owners, sequence, and validation commands.

---

## 5) Prioritized next steps (actionable now)

### Immediate next actions (next 24 hours)
1. Run `bmad-bmm-domain-research` focused on operator workflow + failure mode mapping.
2. Run `bmad-bmm-technical-research` focused on security/redaction/observability architecture decisions.
3. Update `docs/exec-plans/active/research_traceability_matrix.md` with finding IDs and affected tracks.

### Short-horizon actions (next 2–3 days)
4. Run `bmad-bmm-market-research` to calibrate feature priority and release expectations.
5. Run `bmad-bmm-create-prd` and lock non-negotiable P0 requirements.
6. Run `bmad-bmm-create-architecture` and finalize option choices with rationale.

### Execution kickoff actions (next 4–5 days)
7. Run `bmad-bmm-create-epics-and-stories` and enforce dependency mapping.
8. Run `bmad-bmm-check-implementation-readiness` and resolve blocking gaps.
9. Run `bmad-bmm-sprint-planning`; then update `docs/exec-plans/active/sprint-status.yaml`.

---

## 6) Risk register and mitigations

- **Risk:** Research breadth dilutes decision quality.
  - **Mitigation:** Keep each lane tied to current A/B/C/D track decisions only.
- **Risk:** Security/readiness assumptions remain implicit.
  - **Mitigation:** Convert every critical assumption into a story acceptance criterion or checklist gate.
- **Risk:** Sprint starts before architecture convergence.
  - **Mitigation:** Block sprint launch unless readiness gate passes.
- **Risk:** Documentation drift across artifacts.
  - **Mitigation:** Use traceability matrix as source-of-truth mapping between research and stories.

---

## 7) Verification and quality gates

Before declaring the plan execution-ready:
- Plan completeness = 100% (scope, constraints, rollback posture, verification).
- Subagent evidence completeness = 100% for all research lanes.
- Draft PR maturity checklist fully passed before Ready-for-Review.
- Worktree hygiene checks passed.

Recommended checks during planning cycle:
- `git status --short`
- `git diff --name-only`
- `rg -n "research_traceability_matrix|sprint-status|readiness" docs/exec-plans -S`

