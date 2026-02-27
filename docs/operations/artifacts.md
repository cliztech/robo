# Agent Artifact Convention

This document defines standard artifact locations, filenames, required fields, ownership, and retention policy for agent execution records.

## Directory Layout

All operational artifacts live under `.agent/` at the repository root:

- `.agent/plans/` — planning outputs and step-level execution plans
- `.agent/handoffs/` — end-of-task summaries for the next agent/reviewer
- `.agent/subagent_runs/` — raw structured logs/results from delegated runs
- `.agent/verification/` — validation evidence, check outputs, and compliance confirmations

Security task artifacts additionally live under `artifacts/security/`:

- `artifacts/security/logs/` — command output logs (`ti-040-config-encryption.log`)
- `artifacts/security/reports/` — operator-facing evidence contracts and sign-off docs
- `artifacts/security/hashes/` — deterministic hash captures (`before_hash_sha256`, `after_hash_sha256`)
- `artifacts/security/audit_exports/` — TI-039 immutable export bundles and detached digests

## File Naming Standard

Use this filename format for all artifacts:

`YYYYMMDD-HHMM_<ticket>_<artifact>.md|json`

Examples:

- `20260215-0915_PROJ-182_plan.md`
- `20260215-0921_PROJ-182_handoff.md`
- `20260215-0925_PROJ-182_subagent_run.json`
- `20260215-0932_PROJ-182_verification.md`

### Naming Rules

- `YYYYMMDD-HHMM` uses 24-hour local time, zero-padded.
- `<ticket>` is required and should map to issue/PR/task ID (for ad-hoc work use `NO-TICKET`).
- `<artifact>` is a short snake_case descriptor (`plan`, `handoff`, `subagent_run`, `verification`, or a more specific variant like `verification_jsonlint`).
- Use `.md` for human-readable reports and `.json` for machine-readable structured output.

## Minimum Required Fields

All artifacts must include metadata at the top.

### Markdown (`.md`) artifacts

Include this front matter block:

```yaml
---
artifact_type: plan|handoff|subagent_run|verification
ticket: PROJ-123
created_at: 2026-02-15T09:32:00Z
owner_role: intake|planner|executor|verifier|handoff
related_files:
  - path/to/file
status: draft|final
---
```

### JSON (`.json`) artifacts

Include these top-level keys:

```json
{
  "artifact_type": "subagent_run",
  "ticket": "PROJ-123",
  "created_at": "2026-02-15T09:32:00Z",
  "owner_role": "executor",
  "related_files": ["path/to/file"],
  "status": "final",
  "payload": {}
}
```

## Ownership Matrix

| Artifact type | Primary owner | Purpose |
| --- | --- | --- |
| `plans` | Planner Agent | Track scoped execution plan and constraints |
| `handoffs` | Handoff Agent | Summarize outcomes, validations, and next steps |
| `subagent_runs` | Executor Agent | Capture delegated run data and tool outputs |
| `verification` | Verifier Agent | Record checks, results, and pass/fail evidence |

Management Team can audit all artifacts, but ownership remains with the primary role above.

## TI-040 Encryption Evidence Contract (operator-facing)

For TI-040 high-risk field protection, every config change touching sensitive values must produce:

1. **Validation log** (`artifacts/security/logs/ti-040-config-encryption.log`)
   - Must include output from `python config/validate_config.py --encryption-evidence`.
   - Must include one `ENCRYPTION_EVIDENCE` line per encrypted sensitive value.
2. **Provenance + rotation report** (`artifacts/security/reports/ti-040-high-risk-field-inventory.md`)
   - Required fields per `kid`:
     - `key_registry_ref`
     - `creation_ticket`
     - `rotation_ticket`
     - `approver_principal`
     - `rotation_interval_days` (must be `<=90`)
     - `export_enabled` (must be `false`)
3. **Rollback hash pair** (`artifacts/security/hashes/ti-040-config-before-after.sha256`)
   - Must include TI-039-compatible entries:
     - `before_hash_sha256=<hex>`
     - `after_hash_sha256=<hex>`
   - Hashes are computed over canonicalized JSON envelope payloads (`json.dumps(..., sort_keys=True, separators=(',', ':'))`).

### Failure-handling requirements

- If decryption fails at runtime, operators restore from latest known-good encrypted backup only.
- Evidence report must record `failure_reason`, `restored_backup_ref`, `before_hash_sha256`, `after_hash_sha256`, and `decision_ts_utc`.
- Any TI-040 rollback event that touched protected values must be exportable via TI-039 immutable audit format with an `ACT-CONFIG-EDIT` action and approval chain.

### Redaction and audit compatibility (TI-039 alignment)

- Never log raw `ciphertext_b64`, `nonce_b64`, `tag_b64`, or plaintext secrets in artifacts.
- `kid` may be logged for provenance, but secret material and decrypted payloads are prohibited.
- Audit exports must preserve hash integrity fields (`before_hash_sha256`, `after_hash_sha256`) and approval metadata.

## Retention & Cleanup Policy

- Keep artifacts for **30 days** by default.
- Keep artifacts linked to open incidents/releases until closure, even if older than 30 days.
- Weekly cleanup job (or manual cleanup) removes expired artifacts.
- Cleanup must only delete files matching the naming standard in `.agent/` subdirectories.
- Never delete artifacts referenced by active PRs, incident reports, or compliance audits.

## TI-041 security smoke evidence contract

Security smoke evidence for TI-041 is stored outside `.agent/` for release and incident consumers:

- `artifacts/security/logs/ti-041-security-smoke.log`
- `artifacts/security/reports/ti-041-smoke-matrix-report.md`
- `artifacts/security/hashes/ti-041-smoke-output.sha256`

Required signatures:

- Log contains `SMK-AUTHN-01`, `SMK-AUTHZ-01`, `SMK-LOCKOUT-01`, `SMK-PRIV-01` rows with PASS marker sets.
- Report must check all checklist IDs `CHK-TI041-01..04`.
- Hash file must be a valid sha256 digest of `ti-041-security-smoke.log`.

Escalation routing when signatures fail:

- Release gate block in `PRE_RELEASE_CHECKLIST.md`.
- Security/incident route via `docs/runbooks/index.md` (`RB-020`, `RB-022`) and `docs/reliability_incident_response.md`.

## Compliance Notes

- Do not store secrets, API keys, or credentials in any artifact.
- Verification artifacts should contain command outputs or summaries sufficient for reproducibility.
- Handoff artifacts should link to verification artifacts when checks were run.


## Security Audit Export Artifacts (TI-039)

Exporter module: `backend/security/audit_export.py`

Produced artifacts (immutable batch set):
- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.ndjson`
- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.sha256`
- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.manifest.json` (includes line count + digest metadata)

`/api/v1/autonomy-policy/audit-events/export` returns concrete paths and digest for handoff evidence.
## TI-040 Security Artifacts (Config Encryption)

For TI-040 config-at-rest encryption work, store artifacts in the following canonical paths:

- `artifacts/security/hashes/ti-040-config-before-after.sha256`
  - SHA256 pairs for `config/schedules.json` and `config/prompt_variables.json` before and after value-level encryption edits.
- `artifacts/security/reports/ti-040-high-risk-field-inventory.md`
  - Checklist evidence (`CHK-TI040-01` .. `CHK-TI040-04`), mapped fields, and envelope compliance details.
- `artifacts/security/logs/ti-040-config-encryption.log`
  - Command transcript for encryption/decryption validation runs and failure classifications.

Recommended command bundle to capture in the log:

```bash
python -m json.tool config/schedules.json > /tmp/schedules.validated.json
python -m json.tool config/prompt_variables.json > /tmp/prompt_variables.validated.json
python config/validate_config.py
python -m pytest backend/tests/test_config_crypto.py
sha256sum config/schedules.json config/prompt_variables.json > artifacts/security/hashes/ti-040-config-before-after.sha256
```
## TI-041 Security Smoke Artifacts

Security smoke execution (`pnpm test:security`) must emit and retain:

- `artifacts/security/logs/ti-041-security-smoke.log`
- `artifacts/security/reports/ti-041-smoke-matrix-report.md`
- `artifacts/security/hashes/ti-041-smoke-output.sha256`

### Pass/Fail Signatures in Artifact Evidence

Pass evidence requires all of the following:

- log includes `AUTHN_DENIED_EXPECTED`
- log includes `AUTHZ_DENIED_EXPECTED`
- log includes both `LOCKOUT_TRIGGERED` and `LOCKOUT_WINDOW_ACTIVE`
- log includes `PRIV_ACTION_BLOCKED`
- log does **not** include `PRIV_ACTION_EXECUTED`
- smoke command exits `0`

Fail evidence is any one of:

- missing one or more required markers
- presence of `PRIV_ACTION_EXECUTED`
- non-zero command exit status
- contract check failure before scenario execution
