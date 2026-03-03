# Key Rotation Workflow & Operator Checklist

This document details the standard operating procedure for rotating the primary (`secret.key`) and secondary (`secret_v2.key`) runtime secrets for the RoboDJ application.

## 1. Prerequisites

- Operator must have `admin` access to the host machine or container orchestration environment.
- The `ROBODJ_ENV` must be clearly identified (e.g., `production` vs `staging`).
- Scheduled broadcasts during the rotation window (approx. 5 minutes) should be paused or monitored for minor interruptions.

## 2. Pre-Rotation Checklist

- [ ] Announce the rotation window to relevant stakeholders (if production).
- [ ] Ensure `python config/scripts/startup_safety.py --snapshot` has been run to create a pre-rotation backup of configuration files.
- [ ] Verify access to the environment variable definitions (e.g. `config/env_contract.json` or `.env`).
- [ ] Confirm no high-impact sub-agents are actively making changes.

## 3. Execution (CLI Workflow)

The key rotation is performed by shifting the primary key to the secondary slot and generating a new primary key.

1. **Stop Runtime Services:**
   ```bash
   # If running via Windows Desktop app:
   Stop-Process -Name "RoboDJ Automation" -Force
   
   # If running via Docker:
   docker compose -f docker-compose.yaml down
   ```

2. **Rotate Keys (using Python utility):**
   *(Note: Ensure you are in the project root directory)*
   ```bash
   python scripts/rotate_keys.py --env production
   ```
   *This script (when implemented or manually executed) will:*
   - Read `ROBODJ_SECRET_KEY` and save it to `ROBODJ_SECRET_V2_KEY`.
   - Generate a new cryptographically secure token.
   - Update `.env` or the secret store with the new `ROBODJ_SECRET_KEY`.

3. **Restart Runtime Services:**
   ```bash
   # If running via Windows Desktop app:
   .\RoboDJ_Launcher.bat
   
   # If running via Docker:
   docker compose -f docker-compose.yaml up -d
   ```

## 4. Post-Rotation Verification

- [ ] Check startup logs (`config/logs/startup_safety_events.jsonl`) for "Key presence/integrity check: PASS".
- [ ] Authenticate to the web dashboard (if applicable) and verify sessions are valid.
- [ ] Trigger a manual config save from the UI and verify no decryption errors occur for previously encrypted fields (they should decrypt via `V2` and encrypt via `V1`).

## 5. Rollback and Failure Handling

If the system fails to boot or decryption errors occur after rotation:
1. **Stop services.**
2. **Restore Secrets:** Revert `.env` or the secret store to the values captured before step 3.2.
3. **Restore Config:** If config corruption is suspected, use `python config/scripts/startup_safety.py --guided-restore` to restore the pre-rotation snapshot.
4. **Restart services** and verify recovery.
5. **Log incident** in the postmortem template.