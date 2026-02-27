# Massive Workflow Blueprint: DGN-DJ by DGNradio Hyper-Automation Program

## 1) Objective
Build a full-stack, stage-gated operational workflow that transforms DGN-DJ by DGNradio (legacy alias: RoboDJ) from a standalone automation runtime into a continuously improving "AI radio operations platform" with planning, execution, safety controls, observability, and growth loops.

## 2) Outcome Targets
- Reduce operator intervention for daily programming by 70%.
- Detect and remediate schedule/config/content issues before air-time.
- Introduce measurable quality gates for content, reliability, and compliance.
- Create a repeatable implementation path across quarterly releases.

## 3) Workflow Architecture (Idea Set)

### Idea A: Mission Control Workflow (central orchestration)
A single control workflow coordinates all subsystems with hard gates:
1. Intake
2. Plan
3. Generate
4. Validate
5. Simulate
6. Approve
7. Publish
8. Observe
9. Learn

**Features**
- Workflow run IDs and replay support.
- Rollback checkpoints before each destructive action.
- Human-in-the-loop approval policy by risk tier.

### Idea B: Parallel Lanes with Sync Barriers
Run independent lanes in parallel and synchronize before publish:
- Editorial lane (show arcs, prompts, segment objectives)
- Audio lane (beds, loudness, transitions)
- Compliance lane (redaction/policy checks)
- Delivery lane (scheduler/clockwheel placement)

**Features**
- Lane-specific SLAs and error budgets.
- Barrier checkpoints requiring all lanes green.
- Automatic degraded-mode if a non-critical lane fails.

### Idea C: Event-Driven Operations Mesh
Transform key actions into domain events:
- `schedule_validated`, `prompt_rendered`, `segment_failed`, `fallback_activated`, `publish_completed`

**Features**
- Alert routing to operator channels.
- Replayable event timeline for incident review.
- Rule-based triggers for auto-remediation.

### Idea D: Experimentation Workflow (continuous optimization)
Create structured experiment cycles:
- Hypothesis -> Variant deployment -> Metrics capture -> Decision -> Rollout

**Features**
- Prompt A/B testing with station-specific scorecards.
- Segment performance feedback loops.
- Auto-retire poor-performing variants.

## 4) End-to-End Phase Plan

## Phase 0 — Foundation and Guardrails
- Canonical schema registry for schedules, prompts, autonomy profiles.
- Preflight validation command integrated into launch flow.
- Backup and restore checkpoints for every config mutation.

## Phase 1 — Unified Workflow Orchestrator
- Define workflow graph with stage dependencies.
- Introduce run metadata (`run_id`, `requested_by`, `risk_level`, `status`).
- Add execution policy profiles (`manual`, `assisted`, `autonomous`).

### Data Contracts

Phase 1 requires a normalized run metadata envelope persisted at run creation and updated at each stage transition.

| Field | Type | Required | Constraints / Notes |
| --- | --- | --- | --- |
| `run_id` | string (UUIDv7 preferred) | yes | Globally unique per workflow run; stable idempotency key for retries/replays. |
| `requested_by` | string | yes | Principal that initiated the run (human user ID, service account, or scheduled job ID). |
| `risk_level` | enum | yes | One of `low`, `medium`, `high`; drives approval and auto-execution policy. |
| `status` | enum | yes | One of `queued`, `running`, `waiting_approval`, `succeeded`, `failed`, `rolled_back`, `cancelled`. |
| `created_at` | RFC3339 timestamp | yes | Set once at run creation. |
| `updated_at` | RFC3339 timestamp | yes | Updated on every status transition and metadata mutation. |
| `started_at` | RFC3339 timestamp | conditional | Required when status first becomes `running`. |
| `completed_at` | RFC3339 timestamp | conditional | Required for terminal statuses: `succeeded`, `failed`, `rolled_back`, `cancelled`. |
| `actor` | object | yes | `{ actor_type, actor_id, actor_display }`; actor_type in `human`, `service`, `scheduler`, `system`. |
| `source` | object | yes | `{ trigger_type, trigger_ref, correlation_id }`; trigger_type in `manual`, `scheduled`, `api`, `webhook`, `retry`. |

Contract invariants:
- `created_at <= started_at <= completed_at` when both optional timestamps are present.
- `updated_at` must be monotonic non-decreasing per `run_id`.
- `risk_level=high` cannot transition directly from `queued` to `running` without policy gate evaluation.
- All metadata updates must emit an immutable audit event keyed by `run_id` + `updated_at`.

### Workflow Graph Definition

Stage nodes (canonical):
1. `intake`
2. `plan`
3. `generate`
4. `validate`
5. `simulate`
6. `approve`
7. `publish`
8. `observe`
9. `learn`

Allowed transitions:
- Normal path: `intake -> plan -> generate -> validate -> simulate -> approve -> publish -> observe -> learn`.
- Validation feedback path: `validate -> generate` (bounded correction loop).
- Simulation feedback path: `simulate -> plan` (re-plan on feasibility failure).
- Approval hold path: `approve -> approve` (awaiting operator action).
- Post-publish learning loop: `learn -> plan` (explicitly new child run referencing parent `run_id`).

Retry behavior:
- Per-stage retry budget: default 2 retries (`max_attempts=3`) with exponential backoff (5s, 25s) and jitter.
- Retries are only allowed for transient classes (`timeout`, `upstream_unavailable`, `rate_limited`, `contention`).
- Non-retryable classes (`policy_violation`, `invalid_contract`, `authorization_denied`) transition immediately to terminal failure.
- Each retry increments `attempt_index` and appends structured failure reason to run events.

Terminal failure states:
- `failed_validation`: contract/safety gate failure after retry budget exhausted.
- `failed_policy`: policy or approval denial (including timeout on required manual approval).
- `failed_publish`: publish step failed and rollback failed or unavailable.
- `failed_system`: unrecoverable orchestration/runtime error.

Any terminal failure must produce:
- a final `status=failed`,
- a `failure_class` and `failure_code`,
- an automated remediation hint,
- and rollback attempt evidence (`rollback_attempted`, `rollback_result`).

### Policy Profiles

Execution policy is selected per run and enforced at each gate.

| Profile | Approval Gates | Auto-Execution Limits | Rollback Permissions |
| --- | --- | --- | --- |
| `manual` | Required before `generate`, `publish`, and any retry beyond first attempt. | No unattended stage progression; operator confirms each stage transition. | Operator-only rollback; system may suggest but not execute. |
| `assisted` | Required for `risk_level=high` at `approve` and `publish`; optional for medium risk if prior checks are green. | Auto-progress allowed through `simulate` for low/medium risk with <=1 retry per stage. | System may execute rollback for low/medium risk; high risk requires operator confirmation. |
| `autonomous` | Approval required only for `risk_level=high` publish actions or explicit policy exceptions. | Auto-progress across all stages; retries up to configured budget; degrade to safe fallback on recoverable failures. | System-initiated rollback allowed for all non-destructive actions; destructive rollback requires pre-registered runbook policy. |

Policy override rules:
- `risk_level=high` always upgrades at least to `assisted` approval semantics even if profile is `autonomous`.
- Profile change during a run is allowed only at stage boundaries and must emit override audit events.

### Phase 1 Acceptance Criteria and Verification

Acceptance criteria:
1. Run metadata contract documented with required fields, types, constraints, and invariants.
2. Workflow graph documented with canonical nodes, allowed transitions, retry classes, and terminal failures.
3. Policy profile matrix defines approval gates, auto-execution limits, and rollback permissions for `manual`, `assisted`, and `autonomous`.
4. All Phase 1 open items in `docs/exec-plans/active/unfinished-task-build-plan.md` deep-link to specific anchors in this document.

Verification commands:
- `python -m json.tool config/massive_workflow_program.json`
- `python scripts/roadmap_autopilot.py --help`
- `rg -n "phase-1-unified-workflow-orchestrator|data-contracts|workflow-graph-definition|policy-profiles|phase-1-acceptance-criteria-and-verification" docs/massive_workflow_blueprint.md docs/exec-plans/active/unfinished-task-build-plan.md`

## Phase 2 — Quality and Safety Gates
- Content checks (tone, banned terms, policy conformance).
- Schedule checks (conflicts, inventory starvation, daypart drift).
- Audio checks (loudness targets, clipping risk, ducking verification).

## Phase 3 — Operational Intelligence
- Structured telemetry store for run outcomes.
- KPI dashboard definitions and alert thresholds.
- Auto-generated postmortems for failed runs.

## Phase 4 — Advanced Features and Scale
- Multi-station profiles and profile bundle portability.
- External trigger integrations (webhooks/API).
- Simulation-at-scale for full-day what-if scenarios.

## 5) Feature Backlog (High-Value Candidates)

### Core Workflow Features
- Workflow template catalog (news-heavy, music-heavy, overnight, special event).
- Runbook generator for each template.
- Dependency-aware scheduling of workflow stages.

### Content Intelligence
- Persona memory and continuity tracking.
- Segment-level intent tags and quality scoring.
- Automatic topic balancing across dayparts.

### Reliability Features
- Circuit breakers for flaky integrations.
- Fallback hierarchy (cached script -> generic voice track -> safe silence policy).
- Recovery assistant that proposes one-click remediation actions.

### Productization Features
- Operator mission-control timeline UI.
- Audit reports export (CSV/JSON).
- Release channel controls (stable/beta/canary).

## 6) Governance Model
- Risk classes: low, medium, high.
- High-risk actions require explicit operator approval.
- Immutable audit events for any publish, rollback, or policy override.

## 7) KPI Framework
- Reliability: workflow success rate, MTTR, fallback activation rate.
- Quality: segment score, listener engagement proxy, revision rate.
- Throughput: shows produced/day, mean publish latency.
- Safety: policy violation rate, blocked publish count.

## 8) 90-Day Delivery Sequence
1. Weeks 1-2: schemas + validator hardening + baseline run metadata.
2. Weeks 3-4: orchestrator skeleton and stage execution engine.
3. Weeks 5-6: quality gates and fallback policy.
4. Weeks 7-8: telemetry + dashboards + alerting.
5. Weeks 9-10: experiment loop and optimization playbook.
6. Weeks 11-12: scale hardening, docs, and release readiness checks.

## 9) Implementation Artifacts Added in This Repo
This blueprint is paired with:
- `config/massive_workflow_program.json`: machine-readable roadmap and workstreams.
- `config/scripts/workflow_program_builder.py`: converts roadmap JSON into a milestone report.

These artifacts create a practical "plan + build" pathway: strategy in Markdown, execution data in JSON, and an executable report builder for delivery tracking.
