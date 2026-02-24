# Story D2.3: Support triage workflow + SLA targets

Status: done

## BMAD Cycle Start
- Command: `bmad-bmm-create-story`
- Scope: Documentation-only triage workflow, severity routing, SLA targets, and communication checkpoints.
- Constraints: No system behavior changes.

## Story
As a support operations lead,
I want a triage workflow with explicit SLAs,
so that incidents are routed and resolved predictably with clear customer communication.

## Acceptance Criteria
1. Triage severity model and routing path documented.
2. SLA targets defined by severity class.
3. Escalation and customer comms templates included.

## Tasks / Subtasks
- [x] Define intake and severity classification workflow (AC: 1)
- [x] Add severity-based SLA table (AC: 2)
- [x] Add escalation/comms templates and checkpoints (AC: 3)

## Dev Agent Record
### Agent Model Used
GPT-5.2-Codex

### Completion Notes List
- Implemented in `docs/support/support_triage_sla.md` and linked from runbook index/persona guide.

### File List
- docs/support/support_triage_sla.md
