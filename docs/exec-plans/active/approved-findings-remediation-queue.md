# Approved Findings Remediation Queue

Prioritization order follows severity: **Critical → Major → Minor**.

## Critical

- [ ] **A1.1 — Role-aware settings visibility (Critical/P0)**
  - **Owner/team:** Design Team (UI/UX Agent) + DevOps Team (CI/CD Pipeline Agent)
  - **Smallest safe patch scope (single module/doc set):**
    - `contracts/frontend_responses/frontend_config_response.schema.json`
    - `contracts/frontend_responses/frontend_status_response.schema.json`
    - `contracts/frontend_responses/listener_feedback_ui_state_response.schema.json`
  - **Validation command(s) after change:**
    - `python config/spec_check_frontend_contracts.py`
    - `rg -n "A1.1|role-aware settings visibility" docs/track_a_security_sprint_checklist.md docs/readiness_scorecard.md -S`
  - **Rollback note:** Revert only the three frontend response schema files above if contract validation fails or privileged fields leak into non-admin visibility.
  - **Planned conventional commit prefix:** `fix:`

- [ ] **A2.3 — Redaction denylist enforcement (Critical/P0)**
  - **Owner/team:** SecOps Team (Compliance Agent)
  - **Smallest safe patch scope (single module/doc set):**
    - `contracts/redaction_denylist.json`
    - `contracts/redaction_rules.md`
    - `PRE_RELEASE_CHECKLIST.md` (redaction gate subsection only)
  - **Validation command(s) after change:**
    - `python config/spec_check_frontend_contracts.py`
    - `rg -n "denylist|redaction|A2.3" contracts/redaction_rules.md contracts/redaction_denylist.json PRE_RELEASE_CHECKLIST.md docs/track_a_security_sprint_checklist.md -S`
  - **Rollback note:** Revert denylist/rules/checklist changes if denylisted keys are missing from either contract rules or release-gate evidence requirements.
  - **Planned conventional commit prefix:** `fix:`

- [ ] **A3.2 — Pre-release security gate (Critical/P0)**
  - **Owner/team:** DevOps Team (Release Manager Agent)
  - **Smallest safe patch scope (single module/doc set):**
    - `PRE_RELEASE_CHECKLIST.md` (`Track A pre-release security gate (A3.2)` section)
    - `docs/readiness_scorecard.md` (critical unresolved items status rows only)
  - **Validation command(s) after change:**
    - `rg -n "Track A pre-release security gate \(A3.2\)|PASS|FAIL|sign-off" PRE_RELEASE_CHECKLIST.md -S`
    - `rg -n "A3.2|Critical unresolved security items" docs/readiness_scorecard.md -S`
  - **Rollback note:** Revert gate/status edits if PASS/FAIL checks are not measurable or sign-off ownership is undefined.
  - **Planned conventional commit prefix:** `docs:`

## Major

- [ ] **Implementation readiness finding — UX acceptance criteria not formalized (Major)**
  - **Owner/team:** Design Team (UI/UX Agent) + QA Team (Test Generator Agent)
  - **Smallest safe patch scope (single module/doc set):**
    - `docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/03-epics-and-stories.md` (UI-facing story acceptance criteria only)
  - **Validation command(s) after change:**
    - `rg -n "acceptance criteria|UX|operator" docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/03-epics-and-stories.md -S`
    - `rg -n "Major|UX-specific acceptance criteria" docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/04-implementation-readiness-report.md -S`
  - **Rollback note:** Revert only modified story acceptance criteria blocks if criteria are not testable or cannot be mapped to a QA check.
  - **Planned conventional commit prefix:** `docs:`

## Minor

- [ ] **Implementation readiness finding — SLO thresholds need concretization (Minor)**
  - **Owner/team:** QA Team (Performance Profiler Agent) + DevOps Team (Infrastructure Agent)
  - **Smallest safe patch scope (single module/doc set):**
    - `docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/03-epics-and-stories.md` (SLO threshold fields only)
  - **Validation command(s) after change:**
    - `rg -n "SLO|p95|threshold|scheduler|orchestration" docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/03-epics-and-stories.md -S`
    - `rg -n "Minor|SLO thresholds" docs/exec-plans/active/bmad-2026-02-17-implementation-readiness-pack/04-implementation-readiness-report.md -S`
  - **Rollback note:** Revert only newly added numeric thresholds if they cannot be measured with current telemetry sources.
  - **Planned conventional commit prefix:** `docs:`
