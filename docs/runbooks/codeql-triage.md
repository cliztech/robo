# RB-023 CodeQL High/Critical Triage Runbook

## Purpose

Define the operational response when CodeQL finds **high** or **critical** security alerts. The CI severity gate blocks merge until triage is completed.

## Trigger Conditions

- CodeQL workflow fails on `Severity gate (high/critical)`.
- Repository has open CodeQL alerts with `security_severity_level` of `high` or `critical` on the current commit.

## Triage Flow

1. **Identify blocking alerts**
   - Open the failed CodeQL workflow run in GitHub Actions.
   - Review the `Severity gate` logs for rule IDs and file paths.
   - Cross-check in **Security → Code scanning alerts** filtered by:
     - Tool: `CodeQL`
     - State: `Open`
     - Severity: `High`, `Critical`

2. **Classify each alert**
   - **True positive:** Real vulnerability with reachable path.
   - **False positive:** Rule mismatch for this code path.
   - **Accepted risk:** Known risk with explicit mitigation and approval.

3. **Resolve with one of three paths**
   - **Fix now (preferred):** Patch code/config and keep alert open until re-scan closes it.
   - **Dismiss false positive:** Dismiss in GitHub with reason and evidence.
   - **Dismiss accepted risk:** Require SecOps sign-off and remediation plan.

4. **Re-run verification**
   - Re-run the CodeQL workflow for the branch/commit.
   - Confirm `Severity gate (high/critical)` passes.

5. **Document outcome**
   - In the PR, include:
     - Alert IDs
     - Classification decision
     - Fix or dismissal rationale
     - Follow-up issue link (if deferred)

## Escalation

- **Critical alert in production path:** Page SecOps + DevOps immediately; treat as release blocker.
- **Repeated false positives for same rule:** Open a security tooling issue to evaluate query tuning/suppression policy.

## Ownership

- Primary owner: SecOps (Vulnerability Scanner Agent)
- Execution owner: Feature team that introduced/owns affected code
- Release authority: Release Manager Agent
