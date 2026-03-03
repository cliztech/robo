# Story D2.2: Runbook index for common failures

Status: done

## BMAD Cycle Start
- Command: `bmad-bmm-create-story`
- Scope: Documentation-only runbook index and maintenance metadata.
- Constraints: No code/runtime behavior changes.

## Story
As a support operator,
I want a failure-indexed runbook,
so that I can navigate from symptoms to deterministic remediation quickly.

## Acceptance Criteria
1. Runbook index covers scheduling, persona, autonomy, and release failures.
2. Each runbook includes trigger, diagnosis, and recovery steps.
3. Runbooks have ownership and update cadence metadata.

## Tasks / Subtasks
- [x] Build runbook index entries for key failure classes (AC: 1)
- [x] Standardize runbook entry schema (trigger/diagnosis/recovery) (AC: 2)
- [x] Document ownership + maintenance cadence (AC: 3)

## Dev Agent Record
### Agent Model Used
GPT-5.2-Codex

### Completion Notes List
- Implemented in `docs/support/runbook_index.md` with severity and ownership metadata.

### File List
- docs/support/runbook_index.md
