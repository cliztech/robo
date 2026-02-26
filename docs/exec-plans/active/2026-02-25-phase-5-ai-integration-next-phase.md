# 2026-02-25 — Phase 5 AI Integration Next-Phase Quick-Dev Plan

## Route + Intent
- **Command trigger:** `bmad-bmm-quick-dev next phase`
- **Route:** Change (quick-dev, scoped implementation prep)
- **Goal:** Convert Phase 5 from broad status into immediately executable stories with concrete validation commands.

## Critique (Why the obvious approach is wrong)
- "Just start coding AI features" is high-risk here because Phase 5 crosses model prompts, runtime latency, safety, and persistence boundaries.
- Without thin vertical slices, we risk shipping partial behavior that cannot be regression-tested or rolled back safely.

## Architecture Fit
- Honors `.context/systemPatterns.md`: typed interfaces, single-responsibility modules, and test-first gates.
- Keeps Python backend and JSON config boundaries intact (no DB schema or binary edits).
- Uses incremental slices that can run independently and be validated via deterministic checks.

## Edge Cases to Front-Load
1. Missing or malformed track metadata (genre, BPM, mood tags).
2. LLM timeout, rate limit, or empty-response scenarios.
3. Non-deterministic output shape breaking downstream playlist logic.
4. Prompt-variable drift between runtime and stored config state.
5. Token/cost spikes from repeated re-analysis of unchanged tracks.

## 10% Twist (Innovation)
Introduce an **analysis fingerprint cache key** (`track_hash + model_version + prompt_profile_version`) so Phase 5 can skip redundant AI calls while preserving reproducibility.

## Phase 5 Next-Phase Scope (Sprintable)

### Story P5-01 — Typed Track Analysis Contract
- Define a strict analysis schema (mood, energy, tempo_bucket, confidence, rationale).
- Add validation and fallback defaults for missing LLM fields.
- **Done when:** invalid AI payloads are rejected + normalized safely.

### Story P5-02 — Deterministic Prompt Profile Resolver
- Resolve prompt profile from `config/prompt_variables.json` with explicit defaults.
- Log profile version used for every analysis request.
- **Done when:** two identical requests resolve same prompt payload.

### Story P5-03 — Resilient AI Invocation Layer
- Add timeout budget, retry policy (bounded), and failure classification.
- Map failures to structured status (`success`, `degraded`, `failed`) for callers.
- **Done when:** callers can branch behavior without parsing exception strings.

### Story P5-04 — Analysis Fingerprint Cache
- Compute fingerprint and short-circuit repeat analysis.
- Emit cache hit/miss telemetry counters.
- **Done when:** repeated analysis for unchanged input returns cached payload.

### Story P5-05 — Verification Harness
- Add focused tests for schema validation, retry/fallback logic, and cache behavior.
- Capture baseline performance metric (analysis latency p50/p95).
- **Done when:** tests pass and latency report is generated.

## Validation Commands (Execution Gate)
1. `python -m pytest backend/tests -k "analysis or ai"`
2. `python -m pytest backend/tests -k "cache or fingerprint"`
3. `python -m json.tool config/prompt_variables.json`
4. `git diff --name-only`

## Exit Criteria
- All P5 stories decomposed into implementation tasks.
- Validation commands runnable in CI/local with no manual interpretation.
- `.context/activeContext.md` and `.context/progress.md` updated to reflect this phase handoff.
