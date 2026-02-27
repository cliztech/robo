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

## Compliance Notes

- Do not store secrets, API keys, or credentials in any artifact.
- Verification artifacts should contain command outputs or summaries sufficient for reproducibility.
- Handoff artifacts should link to verification artifacts when checks were run.
