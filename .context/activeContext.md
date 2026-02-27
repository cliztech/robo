# Active Context

## Current Focus

Executing "Phase 5: AI Integration" (Implement AI track analysis) while stabilizing typed studio state management for deck/mixer transport telemetry and engine control bridging.
Executing "Phase 6: Playlist Generation" hardening and preparing Phase 7 broadcasting handoff after completing Phase 5 track analysis API/service delivery.
Building the next unfinished execution plans from the roadmap queue, starting with P1 Security items (TI-039/TI-040/TI-041).

## Recent Decisions

- Standardized phase naming contracts across planning artifacts: `Delivery Phase N` for delivery context and `Workflow Phase N` for workflow context, plus namespace-required packet/build-plan metadata.
- Unified AI track-analysis routing on canonical `POST /api/v1/ai/track-analysis`, with deprecated `/api/v1/ai/analyze-track` compatibility alias sharing the same envelope + correlation-id behavior.
- Hardened playlist generation infeasibility handling by removing hard-constraint fallback, emitting structured constraint diagnostics, and mapping API responses to HTTP 422 with envelope-level error details.

- Hardened TI-039/TI-040/TI-041 tracked issue packets with explicit implementation scope, dependency checkpoints, runnable validation commands, evidence artifacts, and rollback procedures for sprint execution.
- Added Phase 8 dashboard automated coverage for loading/error/success states, alert acknowledge interaction, threshold boundary rendering, and fallback-metric regression in `tests/ui/dashboard-view.test.tsx`.
- Strengthened DJ console dashboard type boundaries with `dashboard.types.ts`, typed telemetry props, and exhaustive severity/status mapping utilities to remove implicit UI string handling.
- Refactored streaming-gateway FFmpeg lifecycle into a supervisor with jittered backoff restarts, degraded-mode thresholding, health endpoints, heartbeat events, and signal-aware shutdown.
- Refactored `AnalysisService` idempotency fingerprinting to hash canonicalized track metadata + model/prompt versions with observability fields and cache-invalidation test coverage.
- Updated AnalysisService idempotency to SHA-256 fingerprints over normalized track metadata + version dimensions (prompt/model/profile) with cache behavior tests for metadata/version churn.
- Updated AnalysisService idempotency to fingerprint normalized metadata + model/prompt profile versions, with cache invalidation coverage for metadata mutations.
- Roadmap hygiene alignment completed: `TODO.md` TI-001 checkbox now mirrors TI-001 `Status: Closed`, and weekly reconciliation rules were added to operations docs.
- Resolved tracked-issue ID collisions between Track A security tasks and v1.2 scheduler UI tasks by separating scheduler work into TI-039/TI-040/TI-041.
- Added explicit one-to-one Track A/B/C/D coverage indexing in `docs/exec-plans/active/todo-p0-p1-tracked-issues.md`.

- Standardized `DegenTransport` seek behavior to use a telemetry-backed `progressOverride` flow with commit callbacks and deduplicated key rendering.
- Published `docs/ui/dj_console_design_pod.md` as the mission-specific charter for GUI console design with explicit ownership cadence and quality gates.
- Linked design pod charter into `docs/ui/dj_console_gui_todo_backlog.md`, `docs/ui/radio_operator_ui_delivery_plan.md`, and `AGENTS.md` Design Team guidance.
- Added GUI BMAD startup packet runbook at `docs/exec-plans/active/gui-bmad-startup-packet.md` to standardize minimal command flow and acceptance gates for GUI request startup.
- Established canonical product naming decision (`DGN-DJ by DGNradio`) and added CI naming guardrails.

- Established `docs/architecture/canonical_runtime_map.md` as runtime ownership and framework-version source of truth; aligned `README.md`, `AGENTS.md`, and `.context/techStack.md`; added CI drift guard.
- Completed repository-wide branding migration for top-level docs, release/build workflows, and launcher expectations to DGN-DJ Studio.
- Regenerated `docs/exec-plans/active/unfinished-task-build-plan.md` from the latest TODO/workflow state to refresh unfinished-task ordering.
- Normalized workflow references in `docs/exec-plans/active/unfinished-task-build-plan.md` to canonical `docs/massive_workflow_blueprint.md` paths with valid line mappings.
- Published `docs/exec-plans/active/2026-02-25-next-unfinished-phase-build.md` to sequence the next phased work (TI-039 -> TI-040 -> TI-041).
  Executing "Phase 5: AI Integration" through a quick-dev next-phase plan that decomposes AI track analysis into sprintable stories (P5-01..P5-05).

## Recent Decisions

- Standardized phase naming contracts across planning artifacts: `Delivery Phase N` for delivery context and `Workflow Phase N` for workflow context, plus namespace-required packet/build-plan metadata.

- Completed shared canonical track-analysis contract extraction (`backend/ai/contracts/track_analysis.py`) and aligned service/API/tests with temporary legacy adapter removal criteria for Phase 5 story P5-05.
- Added Phase 5 latency verification harness (`tests/perf/ai-analysis-latency.test.ts`) with JSON/Markdown artifacts and cache telemetry assertions for queue integration tests.
- Added caller-facing analysis outcome classification (`success`/`degraded`/`failed`) in analysis service + queue mapping, with updated unit/integration coverage.
- Upgraded `docs/massive_workflow_blueprint.md` Phase 1 with implementation-grade Data Contracts, Workflow Graph Definition, Policy Profiles, and acceptance/verification criteria; cross-linked unfinished Phase 1 tasks to section anchors.
- Normalized `bmad build dev` to the canonical BMAD quick-delivery route and captured build/dev validation evidence in `docs/operations/plans/2026-02-25-bmad-build-dev.md`.
- Published `docs/exec-plans/active/2026-02-25-phase-5-ai-integration-next-phase.md` to operationalize Phase 5 into execution-ready slices with validation gates.
- Implemented Phase 5 AI analysis foundation in `src/lib/ai/analysisService.ts` with normalization, retries, idempotency, and fallback behavior.
- Completed Phase 5 execution slice closure: deterministic prompt-profile resolver, fingerprint cache, degraded timeout fallback status, and latency/profile tests in backend AI service.
- Hardened analysis invocation contract with explicit `success|degraded|failed` health states and typed error classification (`timeout|rate_limit|invalid_payload|unknown`) propagated through queue processing.
- Added prompt profile resolution plumbing for Phase 5 analysis: deterministic config-backed resolver, stable prompt profile version hashing, and analysis service support for per-request resolved prompt profiles.
- Refactored mood normalization policy in `src/lib/ai/analysisService.ts` to use explicit alias mapping with energy-derived fallback for missing/unknown moods.
- Added verification coverage in `tests/unit/ai-analysis-service.test.ts` and `tests/integration/analysis-queue.test.ts`.
- Completed GUI prompt review and published agent-team execution plan at `docs/ui/gui_agent_team_review.md`.
- Updated `AGENTS.md` to mandate the "Visionary Architect" context system (`.context/`) as the primary bootstrap for all agents.
- Adopted `.context/` directory as the single source of truth for high-level project context.
- Consolidated disparate documentation (`README.md`, `TECH_STACK.md`, `AGENTS.md`) into structured context files.
- Standardized `DegenWaveform` deck visuals to single-instance indicator/playhead rendering with deck-token parity coverage tests.
- [x] Re-enabled CodeQL workflow with repo-scoped languages and high/critical severity gate; added RB-023 triage runbook.

- Extended BMAD command normalization guidance to explicitly map `bmad build dev` to `bmad-bmm-quick-dev`.
- Completed targeted branding alignment for `docs/massive_workflow_blueprint.md`: canonicalized title/objective to "DGN-DJ by DGNradio" and labeled `RoboDJ` as a legacy alias.

- Consolidated AI track-analysis API surface on `/api/v1/ai/track-analysis`, removed duplicate router mounting, and aligned auth/tests to canonical API-key policy.

## Recent Decisions

- Standardized phase naming contracts across planning artifacts: `Delivery Phase N` for delivery context and `Workflow Phase N` for workflow context, plus namespace-required packet/build-plan metadata.

- Reconciled unfinished-task generation: closed TODO tracked issues now suppress duplicate roadmap backlog rows using TI-first matching with normalized-title fallback and auditable skip reporting.
- Added runtime-validated analysis schema + deterministic degraded-normalization reason codes in `src/lib/ai/analysisService.ts`.
- Expanded malformed-payload unit test coverage in `tests/unit/ai-analysis-service.test.ts` (missing keys, wrong types, empty strings).

- Hardened `backend/playlist_service.py` artist handling with centralized normalization and normalized repeat/transition scoring.

## Next Atomic Steps

### Phase 5 closure status

- [x] Implement Story P5-01 (Typed Track Analysis Contract: runtime schema validation, deterministic normalization, and reason codes).
- [x] Implement Story P5-02 (Deterministic Prompt Profile Resolver). Evidence: `src/lib/ai/analysisService.ts`, `tests/unit/ai-analysis-service.test.ts`.
- [x] Implement Story P5-03 (Resilient AI Invocation Layer). Evidence: `src/lib/ai/analysisService.ts`, `tests/integration/analysis-queue.test.ts`.
- [x] Implement Story P5-04 (Analysis Fingerprint Cache). Evidence: `src/lib/ai/analysisService.ts`, `tests/unit/ai-analysis-service.test.ts`.
- [x] Implement Story P5-05 (Verification Harness + latency baseline). Evidence: `tests/perf/ai-analysis-latency.test.ts`, `tests/unit/ai-analysis-service.test.ts`, `tests/integration/analysis-queue.test.ts`.
- Reconciliation rule: no open checkbox may conflict with a later completion statement in this file.

### Open tracked issues and follow-on work

- [ ] Keep tracked-issue coverage table in sync with status/ownership updates.
- [x] Add AnalysisService cache controls (LRU cap + TTL) with operational cache metrics and hooks.
- [x] Implement unified DJ studio surface layout for decks/studio route.
- [x] Add deterministic BMAD routing for GUI/music console agent-team phrases (including "agwnt" typo handling).
- [ ] Verify `.context/` structure is complete.
- [x] Reconcile TODO tracked-issue checkbox state with TI status fields (weekly protocol documented).
- [ ] Run first weekly DJ console design review gate using the new pod charter checklist.
- [x] Resume "Phase 5: AI Integration" (Implement AI track analysis).
- [x] Canonical product identity decision + naming consistency pass across root docs and context files.
- [ ] Sweep remaining deep docs/config script branding references (phase 2 rebrand pass).
- [ ] Execute TI-039 packet (approval workflows + immutable audit export contract).
- [ ] Execute TI-040 packet (config-at-rest encryption policy + operator workflow updates).
- [ ] Execute TI-041 packet (security smoke script + expected signatures).
- [x] Regenerate unfinished-task build plan and publish the next phased build artifact for P1 Security.
- [ ] Convert `docs/ui/gui_agent_team_review.md` into implementation stories mapped to GUI-001..GUI-030.
- [x] Resume "Phase 5: AI Integration" (Implemented typed AI service contracts, guarded API routes, and UI wiring for host/persona flows).
- [x] Resume "Phase 5: AI Integration" foundation (Implemented AI track analysis service + queue processor + tests).
- [x] Split mixed tracked-issue files and reassigned security tasks to dedicated TI IDs (TI-039/TI-040/TI-041) with reference updates.

- [ ] Start Phase 7 implementation stories for Icecast streaming and metadata updates.
- Added deterministic track-analysis envelope status mapping (`success|degraded|failed`) in API/service contracts with timeout/circuit/service failure classification and fallback degradation behavior.
- [x] Implemented backend track-analysis fingerprint cache (content + model/prompt versions) with structured cache hit/miss telemetry and tests.

- Added streaming-gateway Icecast listener polling with `stream.listeners` NATS telemetry events, env-driven interval/failure thresholds, and degraded `system.health` alerts on consecutive failures.

- [x] Phase 5 next slice: added deterministic analysis fingerprinting, structured execution status (`success`/`degraded`), and cache hit/miss telemetry in `src/lib/ai/analysisService.ts` with updated tests.

## 2026-02-27 Phase 5 Completion Update
- [x] Completed Phase 5 AI analysis hardening by resolving merge-corrupted analysis service/test artifacts and restoring deterministic behavior.
- [x] Completed Story P5-05 verification harness for AI analysis (unit + integration coverage for normalization, retries/fallback, TTL/LRU cache, and queue outcome mapping).
- [x] Captured latency baseline command path via focused Vitest suites (`tests/unit/ai-analysis-service.test.ts`, `tests/integration/analysis-queue.test.ts`) for repeatable regression checks.
- [ ] Shift active implementation focus to Phase 6 playlist generation hardening and Phase 7 broadcasting handoff prep.

- [x] Replaced merge-corrupted `src/lib/ai/analysisService.ts` with a single canonical implementation (normalized result/record types, single idempotency key strategy, unified LRU+TTL cache map, deterministic analyze flow, and queue outcome mapping).
- [x] Refactored malformed AI analysis unit/integration suites into clean non-overlapping describe trees and public-contract queue assertions.

- [x] Security P1 implementation: added approval-policy enforcement, immutable security audit export/manifest pipeline, config envelope crypto interceptors for schedules/prompt variables, and export CLI (`backend/security/export_audit_cli.py`).
