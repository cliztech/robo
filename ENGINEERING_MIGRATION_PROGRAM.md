# RoboDJ Engineering Migration Program (with Compatibility Milestones)

## 0) Program Goals and Non-Negotiables
- Preserve current on-air behavior while moving from desktop-binary operation to service-oriented architecture.
- Treat existing RoboDJ runtime as the **system of record** until explicit cutover criteria are met.
- Maintain **legacy RadioDJ interoperability adapters** through at least one full release cycle after cutover.
- Use progressive delivery with reversible milestones (feature flags, dual-write, shadow mode).

---

## 1) Phase 0 — Baseline Discovery and Operational Assumptions Extraction

### Objective
Create a precise baseline of current behavior from `config/*.json` and DB schema artifacts so later phases can be validated against measurable parity targets.

### Inputs (current repo snapshot)
- `config/schedules.json` is currently an empty array (`[]`), implying no active schedule entries in this snapshot.
- `config/prompt_variables.json` indicates:
  - `custom_variables_override_builtin: true`
  - `missing_variable_behavior: "empty_string"`
  - artist/title parenthesis filtering disabled
  - `time_variable_configs` empty
  - `version: "1.0"`
- SQLite schema inspection utility exists (`config/inspect_db.py`) but `.db` files are absent in this repository snapshot; schema must be extracted from runtime environments where DBs exist.

### Deliverables
1. **Operational Assumptions Register** (versioned markdown + JSON export), including:
   - schedule semantics (timing granularity, precedence, conflict resolution)
   - variable resolution order and fallback behavior
   - content freshness and anti-repetition assumptions
   - file/path conventions and lock/signal semantics
2. **Schema Baseline Package**:
   - full DDL dump of `settings.db` and `user_content.db`
   - table-by-table ownership map (read/write path and component owner)
   - cardinality and data quality profile (null rates, key uniqueness)
3. **Golden Scenario Catalog** (minimum 20 scenarios):
   - normal host link, promo insertion, weather mention, missing variable, API timeout fallback, duplicate suppression

### Compatibility Milestones (Phase 0)
- **M0.1**: 100% of JSON keys documented with type/default/source-of-truth.
- **M0.2**: 100% of DB tables and columns captured from production-like instance.
- **M0.3**: Golden scenarios approved by operations + programming stakeholders.

---

## 2) Phase 1 — Backend Orchestration Service (Parity Mode)

### Objective
Implement a backend orchestration service that mirrors current RoboDJ behavior exactly (no product-level behavior change).

### Scope
- Build a stateless API/service layer for:
  - schedule evaluation
  - prompt/variable resolution
  - provider orchestration (LLM/TTS)
  - artifact generation metadata and job lifecycle
- Keep desktop binary operational while new backend runs in:
  - **shadow mode** (observe only)
  - **compare mode** (generate parallel outputs)
  - **parity mode** (authoritative only for opted-in stations)

### Parity Requirements
- Identical variable substitution behavior (`missing_variable_behavior=empty_string` etc.)
- Same scheduling outcomes for equivalent inputs
- Equivalent output manifest structure for downstream consumers
- Error semantics preserved (retry thresholds, fallback routing)

### Compatibility Milestones (Phase 1)
- **M1.1**: Shadow mode for 2 weeks with no P1 incidents.
- **M1.2**: ≥ 99% decision parity on Golden Scenario Catalog.
- **M1.3**: Manual A/B listening confirms no editorial regressions in sampled outputs.
- **M1.4**: Feature flag can instantly route station back to legacy desktop path.

---

## 3) Phase 2 — Containerized Rendering and Streaming Stack (FFmpeg + Liquidsoap)

### Objective
Move audio rendering and streaming from host-coupled processing to containerized services while preserving output quality and timing guarantees.

### Scope
- Introduce containerized services:
  - `render-service` (FFmpeg-based assembly, ducking, normalization)
  - `stream-service` (Liquidsoap pipelines for live/program streams)
  - shared object storage for rendered assets
- Define immutable job contracts (input manifest -> deterministic output bundle)
- Add real-time and batch observability (latency, dropouts, clipping, loudness)

### Compatibility Milestones (Phase 2)
- **M2.1**: Render output parity within tolerance:
  - LUFS delta <= 1.0
  - peak delta <= 1 dBTP
  - start-time offset <= 100 ms
- **M2.2**: 7-day soak with zero unplanned stream interruptions.
- **M2.3**: Legacy artifact format adapter passes existing RadioDJ ingest checks.
- **M2.4**: Capacity test supports 3x expected peak jobs/hour.

---

## 4) Phase 3 — Web Dashboard (Schedules, Persona, Prompts)

### Objective
Provide web-native control plane for operations while keeping legacy editing pathways available during transition.

### Scope
- Dashboard modules:
  - schedule editor + preview simulator
  - persona and voice profile management
  - prompt templates and variable catalogs
  - audit trail and approval workflows
- Permission model:
  - operator, programmer, admin roles
- Change management:
  - draft/publish model with rollback snapshots

### Compatibility Milestones (Phase 3)
- **M3.1**: Dashboard round-trips all legacy configuration without data loss.
- **M3.2**: Legacy desktop edits and web edits can coexist via conflict policy (last-write-with-audit or explicit lock).
- **M3.3**: 90% of routine ops tasks completed in dashboard by pilot users.
- **M3.4**: Mean time to recover from bad config change < 5 minutes via snapshot restore.

---

## 5) Phase 4 — Advanced Autonomous Features

### Objective
Enable higher-order autonomy (multi-agent coordination, interactions, memory) without compromising reliability or compliance.

### Scope
- Multi-agent orchestration:
  - host agent, research agent, safety editor, continuity producer
- Interaction modes:
  - listener prompts, contextual responses, live inserts
- Memory systems:
  - short-term show memory + long-term station memory (guardrailed)
- Governance:
  - policy enforcement, banned terms, confidence thresholds, human override

### Compatibility Milestones (Phase 4)
- **M4.1**: Advanced features default OFF; can run in observe-only mode.
- **M4.2**: Safety layer blocks disallowed outputs at >= 99.9% in test corpus.
- **M4.3**: On-air incident rate remains at or below pre-autonomy baseline for 30 days.
- **M4.4**: Per-feature kill switch + fallback to Phase 3 deterministic flow.

---

## 6) Legacy RadioDJ Interoperability Adapters (Cross-Phase)

### Adapter Set
1. **Metadata Adapter**: maps new manifest/event model to legacy RadioDJ expected fields.
2. **File Placement Adapter**: preserves legacy folder and naming semantics for ingest.
3. **Trigger Adapter**: translates VT markers / schedule triggers into service events.
4. **DB Bridge Adapter**: optional read/write compatibility layer for legacy MySQL/SQLite workflows.
5. **Observability Adapter**: unified logs correlating legacy job IDs with new orchestration IDs.

### Support Policy
- Adapters are maintained throughout Phases 1–4.
- Deprecation requires:
  - 1 full quarter of adapter-usage telemetry showing < 5% dependence
  - published migration notice and runbook

---

## 7) Data Migration Strategy

### Principles
- No big-bang migration.
- Use **incremental backfill + dual-write + verification**.
- Preserve lineage for every migrated entity.

### Plan
1. **Schema Mapping**: map legacy tables/JSON structures to new canonical models.
2. **Backfill**: idempotent ETL jobs with checkpoints and replay support.
3. **Dual-Write Window**: write to both legacy and new stores for selected entities.
4. **Reconciliation**: automated row/entity-level comparisons with exception queue.
5. **Freeze + Delta Cut**: short freeze window, apply final delta, verify checksums.
6. **Post-Cut Validation**: functional, editorial, and operational acceptance checks.

### Data Quality Gates
- Referential integrity violations: 0 for critical entities.
- Reconciliation mismatch rate: < 0.1% non-critical, 0% critical.
- Roll-forward and rollback scripts tested in staging with production-like data.

---

## 8) Cutover Criteria and Rollback Plan

### Cutover Entry Criteria (must all pass)
- Phase milestone criteria satisfied through current phase.
- Golden Scenario Catalog >= 99% parity.
- 14-day stability window with no unresolved P1/P2 regressions.
- On-call runbooks complete and rehearsal executed.
- Executive + operations sign-off recorded.

### Cutover Execution
1. Announce maintenance/cutover window.
2. Enable service as primary via feature flag.
3. Monitor SLO dashboards (latency, failed jobs, stream health, editorial incidents).
4. Hold hypercare period (24–72h).

### Rollback Triggers
- SLO breach sustained > 15 minutes.
- Editorial safety incident classified Sev-1.
- Data consistency breach on critical entities.

### Rollback Procedure (target <= 10 minutes)
1. Flip global feature flag to legacy path.
2. Pause dual-write to prevent divergence.
3. Restore last known-good config snapshot.
4. Reconcile generated artifacts/events during incident window.
5. Publish incident report and corrective action before reattempt.

---

## 9) Program Governance and Cadence
- Weekly architecture review (risks, parity score, defects).
- Bi-weekly stakeholder checkpoint (programming, ops, engineering).
- Release readiness checklist at every milestone.
- KPI dashboard:
  - parity score
  - render latency p95
  - stream uptime
  - incident count/severity
  - adapter dependency trend

## 10) Suggested 6-Month Timeline (Adjustable)
- Month 1: Phase 0 complete (baseline + schemas + scenarios)
- Months 2–3: Phase 1 parity mode in pilot
- Month 4: Phase 2 container render/stream rollout
- Month 5: Phase 3 dashboard pilot + adoption ramp
- Month 6: Phase 4 advanced features in observe-only, then guarded activation
