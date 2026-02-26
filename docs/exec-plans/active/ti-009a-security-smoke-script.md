# Implementation Plan: Security Smoke Script (Task A3.1)

## Scope
Develop a security smoke test script to validate authentication (authN), authorization (authZ), and lockout mechanics before releases. This addresses requirement A3.1.

## Requirements
1. **Target Endpoints:** 
   - The script will target the core backend configuration APIs and authentication endpoints.
2. **AuthN / Session Testing:**
   - Attempt login with invalid credentials to verify lockout thresholds (e.g., 5 failed attempts locks the account for 15 minutes).
   - Test session expiration: Validate that a token older than the configured `ROBODJ_IDLE_TIMEOUT_MINUTES` is rejected with `401 Unauthorized`.
3. **AuthZ / Role Testing:**
   - Based on the access matrix defined in `TI-002`.
   - **Scenario 1 (Viewer):** Attempt a `POST /config/schedules` request using a Viewer token. Assert response is `403 Forbidden`.
   - **Scenario 2 (Operator):** Attempt to rotate `secret.key` using an Operator token. Assert response is `403 Forbidden`.
   - **Scenario 3 (Admin):** Attempt an administrative action to ensure legitimate access succeeds.
4. **Re-Auth Testing:**
   - Attempt a high-risk operation with a valid session that exceeds the `ROBODJ_REAUTH_GRACE_MINUTES`. Assert response requires re-authentication (e.g., `403` with a specific `requires_reauth` payload).

## Script Execution
- **Location:** `tests/scripts/security_smoke_test.py`
- **Execution Context:** Run via CI/CD pipelines against a transient staging environment or run manually by a release engineer.
- **Pass/Fail Criteria:** All assertions must pass. Any deviation from the expected status codes marks the entire smoke test as Failed, blocking the release.
- **Evidence:** The script should output a structured JSON or TAP report summarizing the results, which will be attached to the Release Readiness Review.