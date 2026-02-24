# Story D2.1: Operator guide by persona (Admin/Producer/Reviewer)

Status: done

## BMAD Cycle Start
- Command: `bmad-bmm-create-story`
- Scope: Documentation-only implementation for persona-specific operator guides.
- Constraints: No backend/config schema changes; only docs updates.

## Story
As an operator team member,
I want persona-specific guides,
so that Admin, Producer, and Reviewer each have safe, role-aligned procedures.

## Acceptance Criteria
1. Guides include role-specific responsibilities and safe actions.
2. Cross-links to escalation and rollback procedures.
3. Includes minimum onboarding checklist per persona.

## Tasks / Subtasks
- [x] Create persona guide structure and role sections (AC: 1)
  - [x] Document responsibilities, permissions, and safe actions per persona
- [x] Add escalation and rollback references (AC: 2)
  - [x] Link incident escalation and rollback/runbook docs
- [x] Add onboarding checklists per persona (AC: 3)

## Dev Agent Record
### Agent Model Used
GPT-5.2-Codex

### Completion Notes List
- Implemented in `docs/support/operator_persona_guide.md`.
- Validation completed via grep checks for persona and onboarding coverage.

### File List
- docs/support/operator_persona_guide.md
