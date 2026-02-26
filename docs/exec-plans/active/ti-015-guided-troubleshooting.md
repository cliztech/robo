# TI-015 Implementation Plan — Guided Troubleshooting Panel

## Scope
Design the UX and logic for a guided troubleshooting panel that assists operators in diagnosing and remediating common failures related to schedules, personas, and autonomy policies. This fulfills MVP requirement B2.3.

## Core Structure
The troubleshooting panel acts as an interactive wizard built into the operator dashboard. It guides users through symptom identification, diagnosis, and remediation based on the canonical `docs/support/runbook_index.md`.

### 1. Issue Categorization (The Entry Point)
The panel presents three primary domains of failure:
- **Schedules & Timeline:** Issues with missing/duplicated blocks, timeline conflicts, or dead air.
- **Persona & Content:** Issues with tone mismatch, character drift, or inconsistent host output.
- **Autonomy & Workflow:** Unexpected autonomous actions, missing checkpoints, or blocked agents.

### 2. Diagnostic Flows

#### A. Schedule & Timeline Flow
- **Symptom Prompt:** "What scheduling issue are you experiencing?" (e.g., Timeline conflict, Missing audio block, Playback halted).
- **Diagnosis Step:** The panel surfaces recent edits to `config/schedules.json` and the current state of the timeline UI. It prompts the user to check for overlapping segments.
- **Remediation Options:**
  - Link to the conflict resolution UI (from `TI-008`).
  - Provide a button to trigger the One-Click Rollback Assistant (from `TI-014`).
  - Link to `docs/support/support_triage_sla.md#triage-workflow`.

#### B. Persona & Content Flow
- **Symptom Prompt:** "What content issue are you experiencing?" (e.g., Host sounds robotic, Out of character, Repetitive phrasing).
- **Diagnosis Step:** The panel displays the current persona configuration and recent AI decision logs (from Phase 5/`ai_decisions`). It highlights any recent changes to `prompt_variables.json`.
- **Remediation Options:**
  - Quick action: "Revert to baseline persona profile".
  - Quick action: "Increase humor/decrease assertion" (sliders that modify the persona style vector).
  - Link to `docs/conversation_orchestrator_spec.md`.

#### C. Autonomy & Workflow Flow
- **Symptom Prompt:** "What autonomy issue are you experiencing?" (e.g., Agent took action without asking, Workflow is stuck, Approvals ignored).
- **Diagnosis Step:** The panel displays the current autonomy level (e.g., `manual_assist`, `lights_out_overnight`) and the recent audit trail of checkpoints (from `TI-011`).
- **Remediation Options:**
  - Quick action: "Downgrade Autonomy Level" (immediately enforces stricter HITL checkpoints).
  - Quick action: "Pause All Agents".
  - Link to `docs/autonomy_modes.md`.

## UX Requirements
- **Context Aware:** The panel should ideally auto-suggest the relevant flow if it detects an active alarm or recent error log.
- **Actionable Links:** Remediation steps must be clickable buttons that execute the fix or deep-link to the exact configuration screen, rather than just static text.
- **Self-Service Validation:** The flow must end by asking the operator, "Did this resolve the issue?", logging the success/failure rate for future runbook improvements.

## Validation Path (QA Walkthrough)
1. Simulate a timeline conflict and verify the operator can navigate the Schedule flow to find the conflict resolution tool.
2. Simulate a persona drift report and verify the operator can navigate the Persona flow to revert to baseline.
3. Simulate an unexpected agent action and verify the operator can navigate the Autonomy flow to downgrade the autonomy level.