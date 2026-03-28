# BMAD Deep Research Runbook

## Purpose

Define the mandatory planning sequence for BMAD work so research, product definition, and delivery readiness are completed in a consistent order with explicit ownership and quality gates.

## Required sequence (no skips, no reordering)

1. Market Research
2. Domain Research
3. Technical Research
4. PRD
5. Architecture
6. Epics/Stories
7. Readiness Check

A step can start only after the previous step is marked **Pass**.

## Canonical planning artifacts path

Store all outputs for this flow under:

- `docs/planning_artifacts/bmad_deep_research/`

Use a numbered file prefix to preserve execution order:

- `01_market_research.md`
- `02_domain_research.md`
- `03_technical_research.md`
- `04_prd.md`
- `05_architecture.md`
- `06_epics_stories.md`
- `07_readiness_check.md`

## Mandatory evidence schema (applies to every research claim)

Every claim in Steps 1-3 (and any inherited claim reused in Steps 4-7) must include an evidence record with all required fields.

| Field | Allowed values / format | Requirement |
| --- | --- | --- |
| `source_type` | `standards` \| `vendor` \| `paper` \| `internal` | Required. Must map to one of the four canonical source categories. |
| `publication_date` | ISO-8601 date (`YYYY-MM-DD`) | Required. If exact day is unknown, use best-known date and mark `date_precision` note in claim context. |
| `confidence` | `low` \| `medium` \| `high` | Required. Confidence is claim-level, not source-level. |
| `relevance_score` | Integer `1-5` | Required. `1` = weakly relevant, `5` = directly decision-critical. |
| `decision_impact` | `informational` \| `directional` \| `blocking` | Required. Declares how strongly the claim affects go/no-go and design selection. |

### Evidence record template

```md
| claim_id | finding | source_ref | source_type | publication_date | confidence | relevance_score | decision_impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MR-01 | <concise claim> | <URL/path/doc section> | standards/vendor/paper/internal | YYYY-MM-DD | high | 5 | directional |
```

## Mandatory source mix and freshness gates

Before a step can be marked **Pass**, the packet must satisfy both gates:

1. **Source mix minimum (all required):**
   - ≥1 standards-body source (`source_type=standards`)
   - ≥1 vendor documentation source (`source_type=vendor`)
   - ≥1 recent research paper (`source_type=paper`)
   - ≥1 internal artifact (repo doc, runbook, telemetry, postmortem, etc.; `source_type=internal`)
2. **Freshness gate for fast-moving AI/tooling topics:**
   - At least 2 cited sources must have `publication_date` within the last 12 months at time of review.
   - If freshness cannot be met, the packet must include an approved exception entry with owner, rationale, and sunset date.

## Decision trace requirement

Each packet (at minimum the readiness artifact) must include a decision-trace table linking research evidence to downstream planning IDs.

| finding_id | summary | evidence_refs | prd_id | architecture_id | epic_or_story_id | decision | owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | <finding summary> | MR-01, DR-03 | PRD-REQ-07 | ARCH-ADR-02 | ST-14 | Adopt | Project Coordinator |

This trace is mandatory for acceptance because it proves continuity from research → requirement → architecture → execution story.

## Research packet QA verification checklist

QA must validate the following before marking packet acceptance:

- [ ] Required BMAD sequence artifacts (`01` through `07`) exist in `docs/planning_artifacts/bmad_deep_research/`.
- [ ] Every research claim includes all mandatory evidence schema fields.
- [ ] Source mix minimum is satisfied (standards + vendor + paper + internal).
- [ ] Freshness gate is satisfied (≥2 sources <12 months old), or an approved exception is recorded.
- [ ] Decision trace table is present and links finding IDs to PRD, architecture, and epic/story IDs.
- [ ] High-impact (`decision_impact=blocking`) claims have explicit mitigation/owner/date if unresolved.
- [ ] Confidence/relevance values are coherent with recommendation strength and fail/pass decision.
- [ ] Final readiness status and QA + Management sign-off are explicitly recorded in `07_readiness_check.md`.

## Stage requirements and gates

| # | Step | Required inputs (docs, metrics, SoT files) | Expected output artifact (planning_artifacts path) | Pass criteria | Fail criteria | Owner role |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Market Research | `FEATURE_HEAVY_ROADMAP_TODO.md`; `TODO_v1_1.md`; current release notes/changelog; baseline product-readiness metrics from `docs/readiness_scorecard.md`; recent trend/context notes in `docs/references/` | `docs/planning_artifacts/bmad_deep_research/01_market_research.md` | At least 3 evidence-backed market insights, each mapped to a product opportunity or risk and tagged by priority. | Fewer than 3 actionable insights, missing evidence, or no tie-back to roadmap priorities. | Research Team — Trend Analyst Agent |
| 2 | Domain Research | Output from Step 1; domain constraints from `ARCHITECTURE.md`; product behavior context from `docs/product-specs/`; reliability/security constraints from `docs/RELIABILITY.md` and `docs/SECURITY.md` | `docs/planning_artifacts/bmad_deep_research/02_domain_research.md` | Domain model, personas/operators, constraints, and assumptions are explicitly documented with open questions tracked. | Missing constraints, untracked assumptions, or unresolved domain ambiguity that blocks requirements writing. | Research Team — Radio Broadcasting Consulting Agent |
| 3 | Technical Research | Output from Step 2; implementation boundaries from `AGENTS.md`; module references in `backend/`; operational runbooks in `docs/operations/`; relevant stack references in `docs/references/` | `docs/planning_artifacts/bmad_deep_research/03_technical_research.md` | Feasible technical options with trade-offs, dependency/risk analysis, and a recommended approach aligned to repository constraints. | No clear recommendation, no trade-off analysis, or recommendations that violate repository boundaries. | DevOps Team — Infrastructure Agent (with SecOps consult) |
| 4 | PRD | Outputs from Steps 1-3; requirements standards in `docs/product-specs/`; quality heuristics from `docs/PRODUCT_SENSE.md`; roadmap priorities from `FEATURE_HEAVY_ROADMAP_TODO.md` | `docs/planning_artifacts/bmad_deep_research/04_prd.md` | Problem statement, goals/non-goals, user scenarios, requirements, acceptance criteria, and success metrics are complete and testable. | Ambiguous requirements, missing acceptance criteria, or no measurable success definition. | Management Team — Project Coordinator Agent |
| 5 | Architecture | PRD output (Step 4); system context from `ARCHITECTURE.md`; design constraints from `docs/DESIGN.md`; reliability/security requirements from `docs/RELIABILITY.md` and `docs/SECURITY.md` | `docs/planning_artifacts/bmad_deep_research/05_architecture.md` | Architecture proposal includes components, data flow, interfaces, failure modes, and explicit mapping back to PRD requirements. | Architecture does not trace to PRD, lacks interface/operational detail, or ignores reliability/security constraints. | DevOps Team — Infrastructure Agent |
| 6 | Epics/Stories | Architecture output (Step 5); PRD requirements (Step 4); execution constraints from `docs/operations/subagent_execution_playbook.md`; planning index context from `docs/PLANS.md` | `docs/planning_artifacts/bmad_deep_research/06_epics_stories.md` | Work breakdown includes prioritized epics/stories with acceptance criteria, dependencies, owner role, and verification command expectations. | Missing dependency mapping, no testable acceptance criteria, or stories too vague for implementation handoff. | Management Team — Sprint Planner Agent |
| 7 | Readiness Check | Outputs from Steps 1-6; workflow quality gates from `AGENTS.md`; execution routing from `docs/operations/execution_index.md`; artifact conventions from `docs/operations/artifacts.md` | `docs/planning_artifacts/bmad_deep_research/07_readiness_check.md` | All prior artifacts present, linked, and passing; unresolved risks have owners and dates; plan is explicitly marked Ready-for-Execution. | Any missing artifact, unresolved blocker without owner/date, or incomplete gate status. | QA Team — Regression Watcher Agent (with Management sign-off) |

## Readiness decision rule

Mark BMAD deep research as **Ready-for-Execution** only when:

- Steps 1-7 all have **Pass** status.
- Every fail condition from prior steps is either resolved or documented as an approved exception with owner and target date.
- `07_readiness_check.md` includes a final checklist and sign-off entries from QA and Management.
