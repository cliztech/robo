# Key Rotation Runbook

For lifecycle requirements (generation, storage, cadence, revocation, incidents), see `docs/SECRET_LIFECYCLE_POLICY.md`.

## Runtime Source Priority
1. Environment variables (preferred):
   - `ROBODJ_SECRET_KEY`
   - `ROBODJ_SECRET_V2_KEY`
2. Local fallback files (development/break-glass only):
   - `config/secret.key`
   - `config/secret_v2.key`

Only templates are versioned:
- `config/secret.key.example`
- `config/secret_v2.key.example`

## Rotation Procedure
1. Stop RoboDJ processes using the active secrets.
2. Generate replacement values out-of-band:
   - `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `python -c "import secrets; print(secrets.token_hex(64))"`
3. Update secret manager/environment variables.
4. Remove stale local fallback files unless explicitly needed.
5. Run integrity validation:
   - `python config/check_runtime_secrets.py --require-env-only`
6. Restart RoboDJ and verify key-dependent workflows.
7. Revoke old keys and invalidate dependent sessions/tokens where applicable.

## Emergency Rotation Trigger Examples
- Suspected key exposure.
- Startup integrity check reports invalid/missing/expired keys.
- Ownership transfer or operator offboarding.
