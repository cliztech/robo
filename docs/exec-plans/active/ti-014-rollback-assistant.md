# TI-014 Implementation Plan — One-Click Rollback Assistant

## Scope
Define the requirements and workflow for a one-click rollback assistant that allows operators to safely revert config-level changes. This builds upon the existing `config/scripts/startup_safety.py` backend logic to provide a robust UX.

## Core Features
1. **One-Click Action:** Provide a single command or UI button to restore the last known good configuration (`--restore-last-known-good`).
2. **Preconditions & Safety Checks:**
   - Before rollback: Create a "pre-restore checkpoint" snapshot of the current (broken) state.
   - During rollback: Validate the chosen snapshot against the current launch config schema.
   - Failure handling: If the restored snapshot is invalid or incompatible, automatically revert to the pre-restore checkpoint.
3. **Operator Feedback:** Clear logging and UI status indicating success or the reason for rollback failure.

## Runbook Integration
The operator runbook for rollback verification and failure handling includes:

**Verification Steps:**
- Initiate the one-click rollback.
- Monitor `config/logs/startup_safety_events.jsonl` for a `restore_last_known_good` event with `"status": "success"`.
- Verify the runtime starts without configuration validation errors.

**Failure Handling:**
- **Scenario:** The rollback fails because the selected snapshot is incompatible.
  - **Action:** The system will automatically revert to the pre-restore checkpoint. The operator should review the schema validation errors outputted to the console/UI.
- **Scenario:** No snapshots are available.
  - **Action:** The operator must manually correct the configuration files (e.g., `schedules.json`) based on the validation errors provided at startup.
- **Scenario:** Both the target snapshot and pre-restore checkpoint are corrupted.
  - **Action:** Stop the service, escalate to a runtime engineer, and manually restore `config/` files from a secondary off-system backup.

## Future UI Implementation
For the web or desktop UI, the one-click rollback assistant should:
- Display the timestamp of the "Last Known Good Configuration".
- Provide a clear "Rollback Config" button.
- Show a progress indicator during the restore and validation phases.
- Surface any validation errors if the rollback is automatically reverted.