# TI-041 Security Smoke Matrix Report

- Generated: 2026-02-27T07:45:12.753Z
- Command: pnpm test:security
- Result: PASS

## Checklist
- [x] CHK-TI041-01 authN denial scenario validated
- [x] CHK-TI041-02 authZ denial scenario validated
- [x] CHK-TI041-03 lockout threshold/window validated
- [x] CHK-TI041-04 privileged action blocked without required approval chain

## Pass/Fail Signatures
- Pass: exit code 0, all required markers present, no `PRIV_ACTION_EXECUTED` marker.
- Fail: non-zero exit code, missing required markers, or unexpected `PRIV_ACTION_EXECUTED` marker.
