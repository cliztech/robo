# RoboDJ Secret Lifecycle Policy

## Purpose
This policy defines how RoboDJ runtime secrets are generated, stored, rotated, revoked, and handled during incidents.

## In-Scope Secrets
- `secret.key` equivalent runtime value (`ROBODJ_SECRET_KEY`)
- `secret_v2.key` equivalent runtime value (`ROBODJ_SECRET_V2_KEY`)

For Codex/operator environment requirements (required vars, optional expiry metadata, source priority, validation command, and redaction handling), see the [Codex Environment Contract](operations/codex_environment_contract.md).

Examples/templates are versioned as:
- `config/secret.key.example`
- `config/secret_v2.key.example`

Live secret material must not be committed.

## 1) Generation
- Generate secrets using a cryptographically secure random generator.
- Approved commands:
  - `python -c "import secrets; print(secrets.token_urlsafe(32))"` for `ROBODJ_SECRET_KEY`
  - `python -c "import secrets; print(secrets.token_hex(64))"` for `ROBODJ_SECRET_V2_KEY`
- Generate per-environment values independently (dev/staging/prod must not share keys).

## 2) Storage and Distribution
- **Preferred:** environment variables provided by a secret manager or deployment platform.
  - `ROBODJ_SECRET_KEY`
  - `ROBODJ_SECRET_V2_KEY`
- **Fallback (local only):** `config/secret.key`, `config/secret_v2.key` for break-glass development/operations.
- Never store live values in markdown docs, screenshots, tickets, or versioned config files.
- Version control may include templates only (`*.example`).

## 3) Rotation Cadence and Ownership
| Secret | Owner | Cadence | Triggered rotation |
|---|---|---|---|
| `ROBODJ_SECRET_KEY` | Security Operations (primary), Release Manager (backup) | Every 90 days | Any exposure suspicion, staff offboarding, key format check failure |
| `ROBODJ_SECRET_V2_KEY` | Security Operations (primary), Release Manager (backup) | Every 30 days | Any exposure suspicion, startup/pre-release integrity check failure |

Validation after each rotation:
1. Run `python config/check_runtime_secrets.py --require-env-only`.
2. Start services and confirm startup integrity checks pass.
3. Verify authentication/encryption-dependent functions still operate.
4. Record rotation timestamp, owner, and validation results in operations log.

## 4) Revocation
- Revoke immediately if compromise is suspected or integrity checks fail.
- Steps:
  1. Disable workloads using affected secrets.
  2. Issue replacement secrets via secret manager.
  3. Remove/disable old secret versions.
  4. Restart services with new values.
  5. Invalidate sessions/tokens derived from compromised keys.

## 5) Incident Response
1. **Detect:** startup/pre-release alert, secret leak report, or anomalous auth behavior.
2. **Contain:** isolate affected runtime and stop key-using processes.
3. **Rotate/Revoke:** execute emergency rotation and revoke previous versions.
4. **Recover:** redeploy with updated environment secrets and verify checks.
5. **Post-incident:** document timeline, blast radius, and corrective actions.

## 6) Startup Integrity Checks and Operator Alerts
RoboDJ startup must fail closed when secret checks fail.

Checks required at startup:
- Missing key from both environment and local fallback file.
- Placeholder/template value detected.
- Invalid key format.
- Optional expiry marker exceeded (`ROBODJ_SECRET_KEY_EXPIRES_AT`, `ROBODJ_SECRET_V2_KEY_EXPIRES_AT`).

Alerting behavior:
- Emit operator-visible `ALERT:` lines to startup logs/stdout.
- Abort service startup until remediated.

## 7) Pre-Release Secret Gate
Before release/deployment, run:
- `python config/check_runtime_secrets.py --require-env-only`

This check verifies required keys are present and valid in runtime environment without printing secret material.
