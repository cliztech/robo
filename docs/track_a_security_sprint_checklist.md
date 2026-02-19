# Track A Security Sprint Checklist (Sprint 2026-W08 to 2026-W10)

Source: `PRODUCT_READINESS_PLAN.md` Track A (Security Features).

## Sprint priority order (locked)

1. **A1.1** — Role-aware settings visibility (admin/operator/viewer)
2. **A2.3** — Redaction policy enforcement in logs and API responses
3. **A3.2** — Pre-release security gate in release checklist docs
4. A1.2 — Session timeout / idle lock + re-auth for sensitive actions
5. A2.1 — Key rotation workflow CLI + checklist integration
6. A3.1 — Security smoke script (authN/authZ + lockout checks)
7. A2.2 — Config-at-rest encryption for high-risk JSON fields
8. A1.3 — Per-action approvals + immutable audit export

## Sprint-scoped issue checklist

- [ ] **A1.1 (P0)** Add role-aware settings visibility to frontend config response contracts.
- [ ] **A2.3 (P0)** Enforce denylist redaction in schema contracts and release validation commands.
- [ ] **A3.2 (P0)** Add explicit pre-release security gate criteria and sign-off fields.
- [ ] **A1.2 (P1)** Define timeout/re-auth contract fields and include policy checks.
- [ ] **A2.1 (P1)** Add key-rotation checklist references and verification commands.
- [ ] **A3.1 (P1)** Define smoke test command contract and expected pass/fail output.
- [ ] **A2.2 (P2)** Define encrypted-at-rest field inventory and validation gate.
- [ ] **A1.3 (P2)** Define approval/audit export schema requirements and release gate.

## Security task mapping (files/contracts + acceptance criteria)

| Task | Priority | Concrete files/contracts | Owner | Due date (UTC) | Pass criteria | Fail criteria |
| --- | --- | --- | --- | --- | --- | --- |
| A1.1 | P0 | `contracts/frontend_responses/frontend_config_response.schema.json`; `contracts/frontend_responses/frontend_status_response.schema.json`; `contracts/frontend_responses/listener_feedback_ui_state_response.schema.json` | Design Team (UI/UX Agent) + DevOps Team (CI/CD Pipeline Agent) | 2026-02-24 | All frontend response contracts include explicit role-safe visibility controls and preserve `additionalProperties: false`; no sensitive role-escalation fields exposed in public schemas. | Any frontend response contract omits role-aware visibility constraints or exposes privileged settings fields. |
| A2.3 | P0 | `contracts/redaction_rules.md`; `contracts/redaction_denylist.json`; `contracts/frontend_responses/*.schema.json`; `PRE_RELEASE_CHECKLIST.md` | SecOps Team (Compliance Agent) | 2026-02-26 | Denylist keys/path fragments are documented and enforced; `python config/spec_check_frontend_contracts.py` passes; release checklist includes a mandatory redaction contract gate. | Denylisted terms appear in frontend response schemas, or release checklist lacks a redaction gate command/sign-off. |
| A3.2 | P0 | `PRE_RELEASE_CHECKLIST.md`; `docs/readiness_scorecard.md` | Release Manager Agent | 2026-02-27 | A dedicated "Pre-release security gate" section exists with explicit PASS/FAIL checks for redaction, secret hygiene, and sign-off ownership. | Security gate is missing, optional, or lacks measurable PASS/FAIL criteria. |
| A1.2 | P1 | `contracts/frontend_responses/frontend_config_response.schema.json`; `contracts/frontend_responses/frontend_status_response.schema.json`; `PRE_RELEASE_CHECKLIST.md` | Design Team (Accessibility Auditor Agent) | 2026-03-05 | Session timeout/idle lock + sensitive-action re-auth controls are represented in contracts and validated in release checks. | No contract fields for lock/reauth policy, or checklist cannot verify enforcement. |
| A2.1 | P1 | `PRE_RELEASE_CHECKLIST.md`; `contracts/redaction_rules.md` (cross-reference for key handling) | SecOps Team (Secrets Auditor Agent) | 2026-03-06 | Key-rotation workflow steps and verification commands are documented with clear signer accountability. | Rotation workflow is undocumented, unverifiable, or missing accountable sign-off. |
| A3.1 | P1 | `PRE_RELEASE_CHECKLIST.md` (security smoke command references) | QA Team (Test Generator Agent) | 2026-03-07 | Security smoke command(s) and expected output are documented and reproducible in release validation. | Smoke command is absent or outputs cannot be used as deterministic pass/fail evidence. |
| A2.2 | P2 | `contracts/redaction_rules.md`; `PRE_RELEASE_CHECKLIST.md` | DevOps Team (Infrastructure Agent) + SecOps Team (Compliance Agent) | 2026-03-12 | High-risk config fields are inventoried and encryption-at-rest verification is required before release. | High-risk fields remain unclassified or no release gate verifies encrypted-at-rest handling. |
| A1.3 | P2 | `contracts/frontend_responses/frontend_status_response.schema.json`; `PRE_RELEASE_CHECKLIST.md` | Management Team (Project Coordinator Agent) + SecOps Team (Compliance Agent) | 2026-03-14 | Approval workflow and immutable audit export requirements are documented and tied to release sign-off gates. | Approval/audit requirements are undefined, optional, or not tied to a release gate. |

## Weekly execution cadence

- **Weekly update owner:** Management Team (Project Coordinator Agent)
- **Update day:** Friday (UTC)
- **Mandatory update fields:** task status, blocker flag, confidence, score impact (+/-)
- **Roll-up target:** raise Security & compliance score from **50% → 80%** without counting blocked P0 items as complete.
