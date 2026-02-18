# BMAD Deep Research Orchestration Plan (Next Steps)

## Request routing

- Request type: **Change/Proposal (planning-only)**.
- BMAD route selected: `bmad-bmm-market-research` → `bmad-bmm-domain-research` → `bmad-bmm-technical-research` → `bmad-bmm-create-prd` → `bmad-bmm-create-architecture` → `bmad-bmm-create-epics-and-stories` → `bmad-bmm-check-implementation-readiness`.
- Sequence source of truth: `docs/operations/bmad_deep_research_runbook.md`.

## Current maturity snapshot

- Planning baseline exists with roadmap and readiness scoring, but deep-research artifacts were not yet centralized in `docs/planning_artifacts/bmad_deep_research/`.
- Reliability/safety track is actively defined for v1.1 and maps to startup diagnostics, config validation, crash recovery, and backup workflows.
- Current weighted readiness baseline is **62% (2026.02)**, indicating clear need for prioritized execution and risk burn-down.

## Stage-gated execution plan

1. **Market research** (complete now): capture market opportunity/risk and competitive pressure for reliability-first radio automation.
2. **Domain research** (complete now): map operator personas, safety constraints, and operational failure conditions.
3. **Technical research** (complete now): evaluate implementation paths and trade-offs under repo boundaries.
4. **PRD draft** (next): convert research outputs into testable requirements and success metrics.
5. **Architecture draft** (next): map component/data/control flows to PRD requirements.
6. **Epics/stories** (next): produce implementation-ready backlog with acceptance criteria and dependencies.
7. **Readiness check** (next): explicit pass/fail plus owner/date for unresolved risks.

## Next 5 execution actions

1. Finalize PRD success metrics and guardrails in `04_prd.md` with direct traceability to the research artifacts.
2. Produce architecture decision records in `05_architecture.md` for launch gating, restore, and validation control points.
3. Break out prioritized epics for v1.1 and v1.2 readiness tracks in `06_epics_stories.md`.
4. Run readiness checklist and close open risks in `07_readiness_check.md`.
5. Route first implementation slice to sprint planning once readiness status is explicitly `Ready-for-Execution`.
