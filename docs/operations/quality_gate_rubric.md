# Workflow Quality Gate Rubric (Canonical)

This document is the canonical source for workflow quality-gate scoring, required fields, pass criteria, and evidence contracts.

Use this rubric with:
- `AGENTS.md` (policy intent + enforcement requirement)
- `docs/operations/subagent_execution_playbook.md` (packet dispatch/reconciliation behavior)
- `docs/operations/execution_index.md` (planning runbook routing and weekly execution coordination)

## Gate scoring model

All gates are binary pass/fail by required key coverage.

- **Score formula:** `score = (required_keys_with_valid_evidence / total_required_keys) * 100`
- **Pass threshold:** `100%` for all hard gates
- **Any missing key:** immediate gate fail
- **Any invalid evidence link or missing command log:** immediate gate fail

## Hard gate definitions

### 1) Plan completeness

Required checklist keys:
- `scope_definition`
- `constraints_and_boundaries`
- `rollback_strategy`
- `verification_plan`

Pass criteria:
- Every key is present in plan artifact.
- Each key has at least one concrete evidence link.
- Verification plan includes runnable commands (not prose-only statements).

### 2) Subagent evidence completeness

Required checklist keys:
- `packet_contract_complete`
- `acceptance_criteria_testable`
- `evidence_links_attached`
- `verification_command_logs_attached`

Pass criteria:
- Every required evidence-schema field is present.
- Every `evidence_links` target resolves to an existing artifact path.
- Every verification command includes `cmd`, `exit_code`, and `output_ref`.

### 3) Draft PR maturity checklist

Required checklist keys:
- `change_summary_present`
- `files_touched_listed`
- `validation_commands_logged`
- `followups_tracked`

Pass criteria:
- PR body includes all four keys explicitly.
- Validation command log entries are linked to artifact or PR comment output.
- Open follow-ups include owner and target date.

### 4) Worktree hygiene

Required checklist keys:
- `no_stale_branches`
- `no_detached_worktree_merges`

Pass criteria:
- Hygiene evidence is recorded in verification artifact.
- Any stale branch finding is either resolved or explicitly deferred with owner/date before merge recommendation.

## Minimum evidence schema (required)

| Field name | Required | Example |
| --- | --- | --- |
| `packet_id` | Yes | `PKT-20260304-quality-gates` |
| `owner_role` | Yes | `planner.agent` |
| `checklist_keys` | Yes | `["scope_definition","rollback_strategy"]` |
| `evidence_links` | Yes | `[".agent/verification/20260304-0912_PROJ-401_verification.md"]` |
| `verification_commands` | Yes | `[{"cmd":"python -m pytest","exit_code":0,"output_ref":".agent/verification/20260304-0912_PROJ-401_verification.md#pytest"}]` |
| `result` | Yes | `pass` |
| `result_reason` | Yes | `all required keys satisfied` |

## Verification command log contract

Each verification command entry must include:
- `cmd` (exact command string)
- `exit_code` (integer)
- `output_ref` (path or anchored location to output)

Optional but recommended:
- `duration_ms`
- `executed_at_utc`

## Failure semantics

If any gate fails:
1. Mark status as `failed`.
2. Record missing/invalid keys.
3. Block progression to next workflow stage.
4. Attach remediation action with owner + due date.
