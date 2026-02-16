# Product Readiness Plan (Multi-Track)

## 1) Intake Summary
- **Request type**: Architecture + implementation planning.
- **Goal**: Define feature tracks, task variants, and a realistic readiness score to move RoboDJ to product-ready.
- **Constraints respected**:
  - No binary (`.exe`) edits.
  - No direct `.db` modifications.
  - Focus on docs/config/scripts planning.

---

## 2) Current-State Estimate

### Overall readiness (estimate)
- **Current**: **62% product-ready**
- **Remaining**: **38%**

### Category scoring
| Category | Weight | Current | Notes |
|---|---:|---:|---|
| Core functionality | 25% | 78% | Strong base artifacts and scheduler/autonomy components exist. |
| Security & compliance | 20% | 50% | Key management guidance exists, but hardening and UI security controls are incomplete. |
| UX & operator workflows | 20% | 54% | Good directional docs, but progressive agent UX and friction reduction are still emerging. |
| Reliability & observability | 15% | 60% | Validation scripts and telemetry foundations exist; needs SLOs, alerting, runbooks. |
| DevEx & release process | 10% | 66% | Checklists and docs exist; CI gates and tighter release automation needed. |
| Commercial readiness | 10% | 48% | Packaging/support posture unclear; onboarding and support workflows need maturity. |

---

## 3) Multi-Track Feature Plan

## Track A: Security Features (UI + Platform)
### Objective
Raise trust posture and reduce operator/security risks in daily operation.

### A1. UI Security Controls
- **Task A1.1 (Baseline)**: Add role-aware settings visibility (`admin`, `operator`, `viewer`) in the frontend config contract.
- **Task A1.2 (Hardened)**: Add session timeout/idle lock and explicit re-auth for sensitive actions (secrets, autonomy policy, external publish).
- **Task A1.3 (Enterprise)**: Add per-action approval workflows and immutable audit trail export.

### A2. Secrets + Data Protection
- **Task A2.1**: Key rotation workflow CLI + checklist integration (`secret.key`, `secret_v2.key` lifecycle).
- **Task A2.2**: Config-at-rest encryption for high-risk fields in JSON configs.
- **Task A2.3**: Redaction policy enforcement in logs and API responses (denylist contract tests).

### A3. Security Verification
- **Task A3.1**: Add security smoke script (authN/authZ checks, lockout checks).
- **Task A3.2**: Add “pre-release security gate” to checklist docs.

**Exit metric**: Security category from **50% → 80%**.

---

## Track B: UX Features for Agent Progression + Enhancements
### Objective
Make multi-agent workflows transparent, safe, and efficient for non-technical operators.

### B1. Agent Progression UX
- **Task B1.1 (MVP)**: Stage timeline UI (Intake → Plan → Execute → Verify → Handoff) with status badges.
- **Task B1.2 (MVP)**: Human-in-the-loop checkpoints for high-impact decisions.
- **Task B1.3 (Advanced)**: “Explain this decision” panel with compact rationale + source links.

#### B1 MVP scope (B1.1/B1.2)
- Single-view workflow header that always shows: current stage, stage owner (human/system), risk level, and next required action.
- Timeline must expose 5 canonical orchestration stages from `docs/conversation_orchestrator_spec.md` and use matching stage labels.
- Checkpoints trigger only at high-impact moments defined by `docs/operations/subagent_execution_playbook.md` (scope expansion, destructive actions, release gate bypass attempts).
- Checkpoint card must provide Approve / Request changes / Rollback action choices with required rationale text for non-approve actions.
- MVP excludes advanced rationale drill-down (reserved for B1.3).

### B2. Operator Assist UX
- **Task B2.1**: Preset task templates (QA route, change route, proposal route).
- **Task B2.2**: One-click rollback assistant for config-level changes.
- **Task B2.3**: Guided troubleshooting panel for schedules, personas, and autonomy policies.

### B3. UX Quality Metrics
- **Task B3.1**: Track completion time per workflow.
- **Task B3.2**: Track intervention rate and rollback rate.

### B4. Instrumentation spec (UX progression + checkpoints)

| Metric | Event names | Collection points | Ownership |
|---|---|---|---|
| Workflow completion time | `ux_workflow_started`, `ux_stage_entered`, `ux_workflow_completed` | Frontend emits start/stage/complete events with `workflow_id`; backend computes `completed_at - started_at` and p50/p95 aggregates. | Frontend: UI Telemetry; Backend: Observability/Analytics |
| Intervention rate | `ux_checkpoint_presented`, `ux_checkpoint_decision` (`approve`, `request_changes`, `reject`) | Frontend emits when checkpoint is shown and when operator decides; backend computes `non_approve_decisions / checkpoints_presented` by route and stage. | Frontend: UI Telemetry; Backend: Workflow Analytics |
| Rollback rate | `ux_rollback_initiated`, `ux_rollback_completed`, `ux_rollback_failed` | Frontend emits initiation source (checkpoint/manual); backend confirms outcome and computes `rollback_initiated / workflows_completed` plus failure rate. | Frontend: UI Telemetry; Backend: Reliability/Operations |

Collection rules:
- Include required dimensions on all events: `workflow_id`, `route_type` (`QA`, `Change`, `Proposal`), `stage_name`, `risk_level`, `operator_role`, and UTC timestamp.
- Frontend owns event emission correctness and schema version tagging.
- Backend owns metric calculations, durable storage, and weekly scorecard exports.
- Data retention and redaction must follow `contracts/redaction_rules.md`.

### B5. Operator usability acceptance criteria
1. In one view, operator can identify current stage, risk status, and next action within 5 seconds (validated in scripted usability run).
2. Operator can distinguish whether control is human-owned or system-owned at every stage transition with no ambiguity.
3. For checkpoint-required steps, operator can complete a compliant decision (approve/request changes/rollback) in <=2 clicks plus rationale input.
4. Operator can locate rollback state/result from the same workflow surface without opening a secondary diagnostics page.
5. Accessibility baseline: timeline and checkpoint actions are keyboard-operable and announce stage/risk updates to assistive tech.

### B6. UX milestone linkage to orchestration specs

| UX milestone | Orchestration spec linkage |
|---|---|
| B1.1 Stage timeline MVP | Mirrors stage model and transition semantics in `docs/conversation_orchestrator_spec.md`. |
| B1.2 Human checkpoints MVP | Uses escalation/approval trigger definitions from `docs/operations/subagent_execution_playbook.md`. |
| B1.3 Decision explainability | Reuses rationale artifact expectations and evidence handoff patterns from both orchestration specs. |

**Exit metric**: UX category from **54% → 82%**.

---

## Track C: Tech Stack Requirements & Architecture Readiness
### Objective
Define minimum technical bar for product-grade operation across deployment environments.

### C1. Runtime and Deployment Baseline
- **Task C1.1**: Publish supported runtime matrix (Windows launcher + containerized backend dev profile).
- **Task C1.2**: Define minimum dependency versions and compatibility contract.
- **Task C1.3**: Environment profile docs (`dev`, `staging`, `prod`) with config differences.

### C2. Contracts and API Governance
- **Task C2.1**: Expand schema contracts for frontend config/status and validate in CI.
- **Task C2.2**: Versioned API/contract change policy.
- **Task C2.3**: Breaking-change checklist required before release.

### C3. Reliability + Observability Stack
- **Task C3.1**: SLOs for scheduling success, latency, and autonomy action throughput.
- **Task C3.2**: Alert thresholds and escalation policy docs.
- **Task C3.3**: Incident runbook and postmortem template.

**Exit metric**: Reliability + DevEx categories to **80%+**.

---

## Track D: Productization & Go-To-Product Readiness
### Objective
Close the final gap from “featureful system” to “operable product.”

### D1. Release Maturity
- **Task D1.1**: Versioned release checklist with strict gates.
- **Task D1.2**: Upgrade/rollback documentation and compatibility notes.
- **Task D1.3**: Golden-path install validation test for fresh environments.

### D2. Documentation + Support Model
- **Task D2.1**: Operator guide split by persona (Admin, Producer, Reviewer).
- **Task D2.2**: Runbook index for common failures.
- **Task D2.3**: Product support triage workflow and SLA targets.

### D3. Commercial Readiness
- **Task D3.1**: Product packaging definition (base/pro feature gates).
- **Task D3.2**: Telemetry ethics and opt-in policy.

**Exit metric**: Commercial readiness from **48% → 75%+**.

---

## 4) Variation Bundles (Parallel Task Sets)

## Variation 1 — **Security-First (8–10 weeks)**
- Prioritize Track A + C2 + C3.
- Best when preparing for external users or compliance-heavy adoption.
- Expected total readiness: **~78–82%**.

## Variation 2 — **UX/Adoption-First (8–10 weeks)**
- Prioritize Track B + D2 + selected A1 controls.
- Best when scaling operator team and reducing training burden.
- Expected total readiness: **~76–80%**.

## Variation 3 — **Platform/Scale-First (10–12 weeks)**
- Prioritize Track C + D1 + A2.
- Best when reliability and deployment repeatability are immediate bottlenecks.
- Expected total readiness: **~80–84%**.

## Variation 4 — **Balanced Productization (12 weeks)**
- Parallelize core tasks across A/B/C/D with monthly checkpoints.
- Best general path to production quality with controlled risk.
- Expected total readiness: **~85%**.

---

## 5) 12-Week Recommended Roadmap (Balanced)
- **Weeks 1–2**: Baseline security controls, workflow timeline UX, runtime matrix.
- **Weeks 3–4**: Contract governance, redaction enforcement, template workflows.
- **Weeks 5–6**: SLO/alerting docs, rollback assistant, release gate updates.
- **Weeks 7–8**: Approval workflow for sensitive actions, troubleshooting UX.
- **Weeks 9–10**: Incident/runbook completion, role-based operator docs.
- **Weeks 11–12**: Hardening, dry-run release, readiness reassessment.

---

## 6) Product-Ready Definition (Exit Criteria)
Declare “product-ready” when all are true:
1. Security controls for sensitive actions + auditable activity trail are in place.
2. Agent workflow UI clearly surfaces stage, risk, and approvals.
3. Contracts are versioned and enforced by automated checks.
4. Reliability targets (SLOs) are documented, measured, and alert-backed.
5. Release/runbook/support docs are complete for non-author operators.
6. At least one full release cycle passes checklist with no critical regressions.

---

## 7) Immediate Next Actions (Low Risk)
1. Convert this plan into tracked issues grouped by Track A/B/C/D.
2. Add a readiness scorecard file in `config/` or `docs/` for periodic updates.
3. Execute Variation 4 as default unless a stronger business constraint emerges.
