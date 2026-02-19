# Sprint Artifacts: Product Readiness Tracks A/B/C/D

Date: 2026-02-17  
Source: `PRODUCT_READINESS_PLAN.md` Tracks A/B/C/D

## Priority Legend
- **P0**: Release-blocking / security-critical / foundation dependency.
- **P1**: High-value feature required for product-ready exit criteria.
- **P2**: Important enhancement; can trail P0/P1 without blocking release candidate.
- **P3**: Nice-to-have optimization or post-GA hardening.

## Dependency Map (Cross-Track)
- **A1.1** -> blocks **B1.2** (role-aware checkpoint permissions).
- **A2.3** -> blocks **B4** and **B3** telemetry publication (redaction-safe event pipeline).
- **A3.2** -> blocks **D1.1** release gate finalization.
- **C2.1** -> blocks **A1.1**, **B1.1**, and **B4** (shared frontend/backend contracts).
- **C2.2** -> blocks **D1.2** compatibility notes and upgrade policy.
- **C3.2/C3.3** -> block **D2.2** runbook index completeness.
- **D1.1** -> gate for closing Tracks A/B/C readiness work in release workflow.

---

## Track A - Security Features (UI + Platform)

### Epic A1: Role-Based Security Controls
**Priority:** P0  
**Dependencies:** C2.1

#### Story A1.1: Role-aware settings visibility (`admin`, `operator`, `viewer`)
- **Priority:** P0
- **Acceptance criteria:**
  - Settings contract exposes role matrix for each sensitive section.
  - Viewer role cannot access secret/autonomy/publish settings in UI.
  - Unauthorized role navigation attempts return deterministic deny state.
- **Validation commands/evidence:**
  - `python config/spec_check_frontend_contracts.py`
  - `npm run test -- --runInBand`
  - Evidence: contract diff + failing/then-passing role visibility test output.

#### Story A1.2: Session timeout/idle lock + re-auth for sensitive actions
- **Priority:** P0
- **Dependencies:** A1.1
- **Acceptance criteria:**
  - Idle timeout locks session by configured threshold.
  - Secret/autonomy/external-publish changes require re-auth token.
  - Audit log contains lock and re-auth events.
- **Validation commands/evidence:**
  - `python config/check_runtime_secrets.py`
  - `npm run test -- --runInBand`
  - Evidence: timeout config proof + test output for re-auth enforcement.

#### Story A1.3: Approval workflow + immutable audit trail export
- **Priority:** P1
- **Dependencies:** A1.2, C2.2
- **Acceptance criteria:**
  - Sensitive actions require explicit approve/reject workflow.
  - Rejected actions store rationale and actor identity.
  - Audit export is append-only and checksum-verifiable.
- **Validation commands/evidence:**
  - `python -m json.tool config/prompt_variables.json`
  - `python config/check_runtime_secrets.py`
  - Evidence: approval flow trace + sample signed audit export artifact.

### Epic A2: Secrets Lifecycle and Data Protection
**Priority:** P0  
**Dependencies:** A3.2, C2.1

#### Story A2.1: Key rotation workflow CLI + checklist integration
- **Priority:** P0
- **Acceptance criteria:**
  - Rotation runbook documents `secret.key` -> `secret_v2.key` lifecycle steps.
  - Rotation validation confirms old key deactivation and new key activation.
  - Release checklist references rotation verification gate.
- **Validation commands/evidence:**
  - `python config/check_runtime_secrets.py`
  - `python -m json.tool config/schedules.json`
  - Evidence: sanitized rotation checklist record + command output.

#### Story A2.2: Config-at-rest encryption for high-risk JSON fields
- **Priority:** P1
- **Dependencies:** A2.1
- **Acceptance criteria:**
  - High-risk config fields are encrypted at rest with documented key source.
  - Decryption path is role-restricted and auditable.
  - Backups preserve encrypted form (no plaintext regression).
- **Validation commands/evidence:**
  - `python config/validate_config.py`
  - `python -m json.tool config/prompt_variables.json`
  - Evidence: before/after sample value (redacted) + validation log.

#### Story A2.3: Redaction denylist enforcement in logs/API
- **Priority:** P0
- **Dependencies:** C2.1
- **Acceptance criteria:**
  - Denylist fields from `contracts/redaction_rules.md` never appear in structured logs.
  - API responses redact protected fields consistently.
  - Contract tests fail on unredacted payloads.
- **Validation commands/evidence:**
  - `python config/spec_check_frontend_contracts.py`
  - `pytest backend/tests -k "redaction or scheduler_ui_api"`
  - Evidence: redaction contract test report + sanitized API fixture.

### Epic A3: Security Verification and Release Gate Hardening
**Priority:** P0  
**Dependencies:** None

#### Story A3.1: Security smoke script (authN/authZ + lockout)
- **Priority:** P0
- **Acceptance criteria:**
  - Smoke script verifies valid/invalid login and lockout behavior.
  - Script can run in CI and local pre-release checks.
  - Output explicitly marks pass/fail per scenario.
- **Validation commands/evidence:**
  - `python config/check_runtime_secrets.py`
  - `pytest backend/tests -k "auth or autonomy_policy"`
  - Evidence: smoke script run log attached to sprint evidence bundle.

#### Story A3.2: Pre-release security gate in checklist docs
- **Priority:** P0
- **Dependencies:** A3.1
- **Acceptance criteria:**
  - Release checklist includes mandatory security gate section.
  - Gate requires passing A3.1 output artifact reference.
  - Gate failure blocks release readiness transition.
- **Validation commands/evidence:**
  - `rg -n "security gate|pre-release" PRE_RELEASE_CHECKLIST.md docs -S`
  - Evidence: checklist diff + sample blocked release note.

---

## Track B - UX Features for Agent Progression + Enhancements

### Epic B1: Agent Progression UX MVP + Explainability
**Priority:** P1  
**Dependencies:** A1.1, C2.1

#### Story B1.1: Stage timeline UI (Intake -> Plan -> Execute -> Verify -> Handoff)
- **Priority:** P1
- **Acceptance criteria:**
  - Timeline shows five canonical stages with owner, risk, and next action.
  - Stage labels align with `docs/conversation_orchestrator_spec.md`.
  - Keyboard navigation and screen-reader announcements are present.
- **Validation commands/evidence:**
  - `npm run test -- --runInBand`
  - `npm run lint`
  - Evidence: test snapshots and accessibility assertion output.

#### Story B1.2: Human-in-the-loop checkpoints for high-impact decisions
- **Priority:** P1
- **Dependencies:** B1.1, A1.1
- **Acceptance criteria:**
  - Checkpoints trigger only on playbook-defined high-impact events.
  - Actions available: Approve / Request changes / Rollback.
  - Non-approve choices require rationale text before submit.
- **Validation commands/evidence:**
  - `npm run test -- --runInBand`
  - `python -m json.tool docs/operations/subagent_execution_playbook.md` 
  - Evidence: checkpoint trigger matrix + UI interaction test logs.

#### Story B1.3: Explain-this-decision panel with rationale + source links
- **Priority:** P2
- **Dependencies:** B1.2
- **Acceptance criteria:**
  - Panel displays concise rationale and linked source artifacts.
  - Links resolve to evidence artifacts without permission leakage.
  - Panel is collapsible and does not block main flow.
- **Validation commands/evidence:**
  - `npm run test -- --runInBand`
  - `rg -n "Explain this decision|rationale" docs -S`
  - Evidence: UX walkthrough recording + passing interaction test.

### Epic B2: Operator Assist UX
**Priority:** P1  
**Dependencies:** B1.2

#### Story B2.1: Preset task templates (QA/Change/Proposal routes)
- **Priority:** P1
- **Acceptance criteria:**
  - Template selector presents QA/Change/Proposal with route-specific defaults.
  - Selection pre-populates scope, validation expectations, and risk level.
  - Operator can review/edit before execution.
- **Validation commands/evidence:**
  - `npm run test -- --runInBand`
  - Evidence: route template mapping table + passing template tests.

#### Story B2.2: One-click rollback assistant for config-level changes
- **Priority:** P1
- **Dependencies:** D1.2
- **Acceptance criteria:**
  - Rollback action reverts last config mutation from backup.
  - Confirmation view shows rollback target and result.
  - Rollback events emit telemetry with outcome status.
- **Validation commands/evidence:**
  - `python config/validate_config.py`
  - `npm run test -- --runInBand`
  - Evidence: rollback dry-run log + UI test proving restore action.

#### Story B2.3: Guided troubleshooting panel (schedules/personas/autonomy)
- **Priority:** P2
- **Dependencies:** C3.3
- **Acceptance criteria:**
  - Panel provides route-specific diagnostics and next actions.
  - Linked runbook entries open from panel context.
  - Recommendations include severity classification.
- **Validation commands/evidence:**
  - `python -m json.tool config/schedules.json`
  - `npm run test -- --runInBand`
  - Evidence: troubleshooting decision tree + scripted operator run.

### Epic B3: UX Metrics and Instrumentation
**Priority:** P1  
**Dependencies:** B4, A2.3

#### Story B3.1: Workflow completion time metric
- **Priority:** P1
- **Acceptance criteria:**
  - Events `ux_workflow_started|ux_stage_entered|ux_workflow_completed` emitted with required dimensions.
  - Backend computes completion duration and publishes p50/p95.
  - Weekly scorecard export includes completion-time trend.
- **Validation commands/evidence:**
  - `pytest backend/tests -k "status or scheduler_ui_service"`
  - Evidence: telemetry schema sample + metric aggregation output.

#### Story B3.2: Intervention and rollback rate metrics
- **Priority:** P1
- **Dependencies:** B3.1
- **Acceptance criteria:**
  - Checkpoint and rollback event streams produce intervention/rollback rates.
  - Failure rate computation for rollback is present.
  - Dashboard exposes route and stage segmentation.
- **Validation commands/evidence:**
  - `pytest backend/tests -k "scheduler_ui_api or autonomy_policy"`
  - Evidence: metrics calculation proof + dashboard export screenshot/text dump.

---

## Track C - Tech Stack Requirements & Architecture Readiness

### Epic C1: Runtime and Deployment Baseline
**Priority:** P0  
**Dependencies:** None

#### Story C1.1: Supported runtime matrix publication
- **Priority:** P0
- **Acceptance criteria:**
  - Runtime matrix documents Windows launcher + container backend profile.
  - Matrix includes supported versions and unsupported scenarios.
  - Matrix linked from architecture and onboarding docs.
- **Validation commands/evidence:**
  - `rg -n "runtime matrix|Windows|container" docs ARCHITECTURE.md -S`
  - Evidence: matrix table link checks.

#### Story C1.2: Minimum dependency versions + compatibility contract
- **Priority:** P0
- **Dependencies:** C1.1
- **Acceptance criteria:**
  - Dependency floors documented for Python/Node/runtime tooling.
  - Compatibility contract defines upgrade policy and support window.
  - Contract referenced by release checklist.
- **Validation commands/evidence:**
  - `python --version`
  - `node --version`
  - Evidence: compatibility contract doc + version capture log.

#### Story C1.3: Environment profile docs (`dev`,`staging`,`prod`)
- **Priority:** P1
- **Dependencies:** C1.2
- **Acceptance criteria:**
  - Profile docs enumerate config differences and safety controls.
  - Sensitive settings and secrets handling called out per environment.
  - Promotion path (`dev` -> `staging` -> `prod`) documented.
- **Validation commands/evidence:**
  - `python config/validate_config.py`
  - Evidence: environment profile table + validation output.

### Epic C2: Contracts and API Governance
**Priority:** P0  
**Dependencies:** C1.2

#### Story C2.1: Expanded schema contracts + CI validation
- **Priority:** P0
- **Acceptance criteria:**
  - Frontend config/status contracts versioned and schema-checked.
  - CI (or equivalent local gate) fails on schema drift.
  - Contract change log captures breaking/non-breaking updates.
- **Validation commands/evidence:**
  - `python config/spec_check_frontend_contracts.py`
  - `npm run test -- --runInBand`
  - Evidence: schema validation report + CI gate reference.

#### Story C2.2: Versioned API/contract change policy
- **Priority:** P0
- **Dependencies:** C2.1
- **Acceptance criteria:**
  - Versioning strategy (major/minor/patch) documented.
  - Deprecation timeline and communication requirements defined.
  - Applies to backend API and frontend contracts.
- **Validation commands/evidence:**
  - `rg -n "version|deprecation|breaking" docs API_ROUTES.md -S`
  - Evidence: policy doc and traceability links.

#### Story C2.3: Breaking-change checklist gate
- **Priority:** P1
- **Dependencies:** C2.2, D1.1
- **Acceptance criteria:**
  - Release workflow includes mandatory breaking-change review section.
  - Section requires migration notes and rollback note link.
  - Gate fails when required artifacts are missing.
- **Validation commands/evidence:**
  - `rg -n "breaking-change|rollback|migration" PRE_RELEASE_CHECKLIST.md docs -S`
  - Evidence: checklist artifact with pass/fail examples.

### Epic C3: Reliability + Observability Stack
**Priority:** P0  
**Dependencies:** C1.3

#### Story C3.1: SLOs for scheduling, latency, autonomy throughput
- **Priority:** P0
- **Acceptance criteria:**
  - SLO targets and error budgets documented.
  - Measurement source and aggregation cadence defined.
  - SLO ownership and escalation paths identified.
- **Validation commands/evidence:**
  - `rg -n "SLO|error budget|latency|throughput" docs RELIABILITY.md -S`
  - Evidence: SLO table + owner assignments.

#### Story C3.2: Alert thresholds + escalation policy
- **Priority:** P0
- **Dependencies:** C3.1
- **Acceptance criteria:**
  - Alert severities map to responder and SLA.
  - Escalation policy includes on-call fallback path.
  - Alerts linked to SLO breach conditions.
- **Validation commands/evidence:**
  - `rg -n "alert|escalation|severity" docs RELIABILITY.md docs/operations -S`
  - Evidence: alert matrix + escalation runbook link.

#### Story C3.3: Incident runbook + postmortem template
- **Priority:** P1
- **Dependencies:** C3.2
- **Acceptance criteria:**
  - Runbook includes detection, containment, recovery, and comms steps.
  - Postmortem template includes root-cause and prevention sections.
  - Runbook index exposes incident categories.
- **Validation commands/evidence:**
  - `rg -n "postmortem|incident runbook|containment" docs -S`
  - Evidence: runbook index and template file links.

---

## Track D - Productization & Go-To-Product Readiness

### Epic D1: Release Maturity
**Priority:** P0  
**Dependencies:** A3.2, C2.2

#### Story D1.1: Versioned release checklist with strict gates
- **Priority:** P0
- **Acceptance criteria:**
  - Checklist version is explicit and changelogged.
  - Mandatory gates: security, contract, regression, rollback readiness.
  - Failing any mandatory gate blocks release sign-off.
- **Validation commands/evidence:**
  - `rg -n "gate|checklist version|mandatory" PRE_RELEASE_CHECKLIST.md -S`
  - Evidence: checklist version diff + blocked gate example.

#### Story D1.2: Upgrade/rollback docs + compatibility notes
- **Priority:** P0
- **Dependencies:** D1.1, C2.2
- **Acceptance criteria:**
  - Upgrade paths include prerequisites and backward-compatibility notes.
  - Rollback instructions are deterministic and tested.
  - Compatibility matrix references C1 runtime matrix.
- **Validation commands/evidence:**
  - `rg -n "upgrade|rollback|compatibility" docs -S`
  - Evidence: dry-run upgrade/rollback transcript.

#### Story D1.3: Golden-path fresh install validation test
- **Priority:** P1
- **Dependencies:** D1.2
- **Acceptance criteria:**
  - Fresh environment install succeeds end-to-end.
  - Script validates first-run critical workflows.
  - Failures are classified with remediation guidance.
- **Validation commands/evidence:**
  - `bash scripts/bootstrap_dev_environment.sh`
  - `python config/validate_config.py`
  - Evidence: install test log and remediation notes.

### Epic D2: Documentation + Support Model
**Priority:** P1  
**Dependencies:** C3.3

#### Story D2.1: Operator guide by persona (Admin/Producer/Reviewer)
- **Priority:** P1
- **Acceptance criteria:**
  - Guides include role-specific responsibilities and safe actions.
  - Cross-links to escalation and rollback procedures.
  - Includes minimum onboarding checklist per persona.
- **Validation commands/evidence:**
  - `rg -n "Admin|Producer|Reviewer|onboarding" docs -S`
  - Evidence: persona guide index + coverage matrix.

#### Story D2.2: Runbook index for common failures
- **Priority:** P1
- **Dependencies:** C3.3
- **Acceptance criteria:**
  - Runbook index covers scheduling, persona, autonomy, and release failures.
  - Each runbook includes trigger, diagnosis, and recovery steps.
  - Runbooks have ownership and update cadence metadata.
- **Validation commands/evidence:**
  - `rg -n "runbook|failure|recovery" docs -S`
  - Evidence: runbook index completeness checklist.

#### Story D2.3: Support triage workflow + SLA targets
- **Priority:** P2
- **Dependencies:** D2.1, D2.2
- **Acceptance criteria:**
  - Triage severity model and routing path documented.
  - SLA targets defined by severity class.
  - Escalation and customer comms templates included.
- **Validation commands/evidence:**
  - `rg -n "SLA|triage|severity|escalation" docs -S`
  - Evidence: triage flow diagram + SLA table.

### Epic D3: Commercial Readiness
**Priority:** P2  
**Dependencies:** D1.1

#### Story D3.1: Product packaging definition (base/pro gates)
- **Priority:** P2
- **Acceptance criteria:**
  - Feature gate matrix documents base vs pro boundaries.
  - Packaging model aligns with support and upgrade policy.
  - Commercial docs map gate decisions to customer outcomes.
- **Validation commands/evidence:**
  - `rg -n "base|pro|feature gate|packaging" docs -S`
  - Evidence: packaging matrix artifact and review notes.

#### Story D3.2: Telemetry ethics + opt-in policy
- **Priority:** P1
- **Dependencies:** B4, A2.3
- **Acceptance criteria:**
  - Telemetry policy explicitly defines opt-in/out behavior.
  - Data minimization and retention policy are documented.
  - UI disclosure text maps to backend collection behavior.
- **Validation commands/evidence:**
  - `rg -n "telemetry|opt-in|retention|redaction" docs contracts -S`
  - Evidence: policy document + disclosure-to-event mapping table.

---

## Review Gate Checklist (Mandatory in every story handoff)
- [ ] **Plan completeness = 100%** (scope, constraints, rollback, verification defined).
- [ ] **Subagent evidence completeness = 100%** (all required artifact fields present).
- [ ] **Draft PR maturity checklist passed** before Ready-for-Review.
- [ ] **Worktree hygiene passed** (no stale branches, no detached worktree merges).
- [ ] Validation commands and outputs are attached/linked.
- [ ] Follow-up actions tracked with owner and due date.

## Sprint Cadence and Visibility
- **Planning cadence:** Weekly planning refresh with dependency rebalance.
- **Status cadence:** Twice-weekly sprint status review using `sprint-status.yaml`.
- **Reporting artifact:** `docs/exec-plans/active/sprint-status.yaml`.
