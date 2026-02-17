# Resource Matrix

## Purpose

Define phase ownership, governance, and handoff gates for the `<initiative>` execution plan.

## Phase Ownership Matrix

| Phase | Team + Agent Scope | Accountable Owner | Required Artifacts | Entry Criteria | Exit Criteria | Blocking Dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| Phase 1 — UX Foundation | **Design Team** (UI/UX Agent + Accessibility Auditor) | Design Team Lead (UI/UX Agent) | Visual system tokens, interaction specifications, accessibility preset matrix (high contrast, large text, reduced motion, simplified density) | Initiative goals approved by Management; baseline UX constraints documented; current-state audit completed | Design sign-off completed; accessibility preset coverage documented; implementation-ready specs handed to DevOps | Product scope freeze for phase; existing design-system reference availability; unresolved UX policy questions |
| Phase 2 — Build & Integration | **DevOps Team** (CI/CD Pipeline Agent + Infrastructure Agent) | DevOps Technical Owner (CI/CD Pipeline Agent) | Component implementation plan, integration pipeline definition, build/test/deploy workflow updates, environment contract notes | Phase 1 artifacts approved; dependency map published by Management; infra constraints validated | Components implemented to spec; integration pipeline green; deployment path validated for target environments | Pending architectural decisions (e.g., waveform rendering architecture); unavailable infrastructure environments; unresolved interface contracts |
| Phase 3 — Quality Hardening | **QA Team** (Test Generator + Regression Watcher + Performance Profiler) | QA Lead (Regression Watcher Agent) | Automated test suite updates, regression matrix, performance budgets + benchmark report | Phase 2 implementation merged to test branch; test fixtures available; observability hooks enabled | Critical tests passing; regression matrix signed off; performance budgets met or approved with exceptions | Missing deterministic test data; unstable staging environment; unresolved performance instrumentation gaps |
| Phase 4 — Review & Readiness | **Brutal Review Team** (Code Critic + Doc Reviewer + UX Auditor) | Brutal Review Team Lead (Code Critic Agent) | Quality scoring report, gate checklist results, required remediation list | QA evidence complete; traceable artifacts for all previous phases; release candidate assembled | Review gates passed; quality score meets threshold; open issues triaged with owners and deadlines | Incomplete evidence from prior phases; unresolved high-severity defects; missing documentation links |
| Phase 5 — Sequencing & Release Control | **Management Team** (Project Coordinator + Sprint Planner + Dependency Tracker) | Project Coordinator Agent | Sequencing plan, dependency graph updates, release gate checklist, risk register | Phase 4 gate outputs accepted; dependency state current; release window confirmed | Release gates enforced; dependency blockers resolved/accepted; execution plan moved to completed archive with outcomes | Cross-team staffing conflicts; unresolved critical dependencies; release gate policy exceptions not approved |

## Staffing Fallback Plan for Blockers

### Trigger Conditions

Activate fallback staffing when any phase has a blocker older than one sprint day or a dependency marked critical.

### Fallback Assignments

1. **Architecture-blocked implementation** (example: waveform rendering architecture pending)
   - Temporary owner: Management Team Dependency Tracker Agent.
   - Supporting agents: Design UI/UX Agent (spec clarification), DevOps Infrastructure Agent (technical feasibility), QA Performance Profiler (budget constraints).
   - Timebox: 1 working day to produce an architecture decision brief and unblock path.

2. **Pipeline instability blocker**
   - Temporary owner: DevOps CI/CD Pipeline Agent.
   - Supporting agents: QA Regression Watcher (failure triage), Brutal Review Code Critic (risk-based scope reduction).
   - Timebox: same-day stabilization plan with rollback option.

3. **Quality gate contention blocker**
   - Temporary owner: Brutal Review Team Lead.
   - Supporting agents: QA Lead and Project Coordinator Agent.
   - Timebox: 4-hour adjudication window for severity classification and ship/no-ship recommendation.

### Escalation Path

- Step 1: Accountable owner logs blocker, impact, and ETA in execution plan notes.
- Step 2: Management Project Coordinator reassigns temporary owner using the fallback assignments above.
- Step 3: If unresolved after timebox, escalate to Management for release-scope adjustment and explicit risk acceptance.

### Minimum Artifacts During Fallback

- Blocker incident note (owner, timestamp, impacted phase).
- Decision brief with options, recommendation, and risk trade-offs.
- Updated dependency map and revised phase exit criteria if scope changes.
