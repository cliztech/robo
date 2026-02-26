# TI-003 Implementation Plan — Idle timeout + re-auth requirements

## Scope
Define the policy and thresholds for operator idle timeouts and sensitive action re-authentication.

## Config Additions
Added to `config/env_contract.json` under `desktop_app` and `docker_stack` contexts:
- `ROBODJ_IDLE_TIMEOUT_MINUTES`: Idle timeout threshold in minutes for operator sessions (1-1440).
- `ROBODJ_REAUTH_GRACE_MINUTES`: Grace period before requiring re-authentication for sensitive actions (0-60).

## Re-auth Policy
Sensitive actions requiring re-authentication include:
1. Viewing/editing credentials & API secrets.
2. Modifying autonomy policies (increasing autonomy level).
3. Modifying prompt templates affecting AI output.
4. Changing release/update channels.

## Enforcement
- Frontend tracks user activity. After `ROBODJ_IDLE_TIMEOUT_MINUTES` of inactivity, the user session is locked.
- To unlock the session, re-authentication is required.
- Accessing a sensitive action surface will prompt for re-authentication if the session has not authenticated within the `ROBODJ_REAUTH_GRACE_MINUTES` grace period.

## Validation Checklist
- [x] Ensure `ROBODJ_IDLE_TIMEOUT_MINUTES` is defined in env contract.
- [x] Ensure `ROBODJ_REAUTH_GRACE_MINUTES` is defined in env contract.
- [ ] Test frontend session lock after idle timeout.
- [ ] Test re-auth prompt on accessing credentials.
- [ ] Verify validation runs against the configured policy thresholds.