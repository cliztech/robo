# Implementation Plan: Per-Action Approval Workflows & Immutable Audit Trail (Task A1.3)

## Scope
Define the policy and execution paths for Enterprise-grade security controls: per-action approvals for high-risk operations and an immutable audit trail export, meeting requirement A1.3.

## 1. Per-Action Approval Workflows
### Definition
Certain actions require a "four-eyes" principle, where the initiator cannot unilaterally execute the action without approval from a secondary authorized role.

### High-Risk Operations
- **Secret Rotation:** Generating or replacing `secret.key` or `secret_v2.key`.
- **Autonomy Policy Escalation:** Changing autonomy from Level 2 to Level 3 or 4.
- **Data Destruction:** Dropping user content databases or flushing historical event logs.
- **Contract/Schema Migration:** Approving a breaking schema change rollout.

### Workflow Policy
- **Initiator:** `operator` or `admin`.
- **Approver:** Must be a distinct user with `admin` role.
- **Mechanism:** 
  1. Initiator requests the action, generating a pending request token.
  2. The system sends an approval notification to admins.
  3. An admin reviews the requested action, the diff/impact, and provides an Approve/Reject decision with rationale.
  4. Once approved, the initiator (or the system automatically) completes the execution.

## 2. Immutable Audit Trail
### Definition
A cryptographic and access-controlled guarantee that audit logs cannot be tampered with or deleted by compromised `admin` or system accounts.

### Data Logged
- All authentication attempts (success/fail).
- All role-based access checks (allows/denies) for config edits.
- Checkpoint decisions and per-action approvals.
- Autonomy mode transitions.
- Environment contract changes.

### Storage & Export Strategy
- **Primary Storage:** `config/logs/audit_events.jsonl`. Appended only. File permissions restricted at the OS/Container level to prevent modification by the RoboDJ process after write.
- **Immutability Guarantee:** Log entries will include a cryptographic hash chain (each entry hashes the previous entry's signature) to detect tampering.
- **Export/Retention:** 
  - Logs are rotated weekly and uploaded to a write-once-read-many (WORM) compliant storage bucket (e.g., AWS S3 with Object Lock or equivalent on-premise storage).
  - Minimum retention period: 1 year (configurable based on compliance needs).

## Validation Checklist
- [ ] Test the four-eyes approval API flow (Initiate -> Pending -> Approve -> Execute).
- [ ] Verify that a user cannot approve their own high-risk request.
- [ ] Verify the hash chain integrity of the `audit_events.jsonl` file.
- [ ] Verify export script successfully uploads to WORM storage.