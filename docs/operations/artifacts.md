# Agent Artifact Convention

This document defines standard artifact locations, filenames, required fields, ownership, and retention policy for agent execution records.

## Directory Layout

All operational artifacts live under `.agent/` at the repository root:

- `.agent/plans/` — planning outputs and step-level execution plans
- `.agent/handoffs/` — end-of-task summaries for the next agent/reviewer
- `.agent/subagent_runs/` — raw structured logs/results from delegated runs
- `.agent/verification/` — validation evidence, check outputs, and compliance confirmations

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


## Security Audit Export Bundles (TI-039)

High-risk action evidence must include immutable audit export bundles under:

- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.ndjson`
- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.sha256`
- `artifacts/security/audit_exports/<yyyy-mm-dd>/<batch_id>.linecount`

### Bundle contract (required)

- `.ndjson` contains one audit event per line using TI-039 schema fields (`event_id`, `action_id`, `actor_principal`, `target_ref`, `before_hash_sha256`, `after_hash_sha256`, `approval_chain`, `decision`, `event_ts_utc`, `export_batch_id`).
- `.sha256` stores detached SHA-256 digest(s) for the corresponding `.ndjson` export.
- `.linecount` stores exact event-line count and `batch_id` to detect truncation.
- All three files are mandatory evidence for high-risk action packets and verification reports.

### Retention requirements

- Keep TI-039 export bundles for **365 days hot** in repository-adjacent artifact storage.
- Maintain **365 days cold** archive pointer metadata in `artifacts/security/reports/ti-039-immutable-audit-export.md`.
- Never prune `.sha256` or `.linecount` while the paired `.ndjson` is retained.

### Verification report checklist template (required IDs)

`artifacts/security/reports/ti-039-immutable-audit-export.md` must include:

```md
## TI-039 Verification Checklist

- [ ] CHK-TI039-01 action catalog complete
- [ ] CHK-TI039-02 approver-role mapping verified
- [ ] CHK-TI039-03 immutable export schema fields complete
- [ ] CHK-TI039-04 digest + retention metadata attached

## Dependency Evidence

- [ ] DEP-TI039-01 TI-002 role model check recorded
- [ ] DEP-TI039-02 TI-003 re-auth linkage recorded for ACT-DELETE/ACT-OVERRIDE
- [ ] DEP-TI039-03 audit schema sign-off recorded
```
