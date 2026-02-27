# TI-041 Security Smoke Matrix Report

## Scenario Results
- [x] SMK-AUTHN-01 (authn-invalid-password) :: AUTHN_DENIED_EXPECTED, HTTP_401_OBSERVED
- [x] SMK-AUTHZ-01 (authz-role-deny) :: AUTHZ_DENIED_EXPECTED, HTTP_403_OBSERVED, CONTROL_TI040_ENCRYPTED_CONFIG_DENIED
- [x] SMK-LOCKOUT-01 (lockout-threshold) :: LOCKOUT_TRIGGERED, LOCKOUT_WINDOW_ACTIVE, HTTP_423_OBSERVED
- [x] SMK-PRIV-01 (privileged-action-block) :: PRIV_ACTION_BLOCKED, CONTROL_TI039_APPROVAL_ENFORCED, CONTROL_TI040_ENCRYPTED_CONFIG_DENIED

## Checklist
- [x] CHK-TI041-01 authN denial scenario validated
- [x] CHK-TI041-02 authZ denial scenario validated
- [x] CHK-TI041-03 lockout threshold/window validated
- [x] CHK-TI041-04 privileged action blocked without required approval chain

## Control Coverage
- TI-039 approval enforcement detected: yes
- TI-040 encrypted config controls detected: yes

## Deterministic Signatures
- PASS requires exit code 0 and expected marker token(s) in log lines.
- FAIL is any missing expected token, unknown case, or missing TI-039/TI-040 control markers.

