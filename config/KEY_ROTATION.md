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


## Startup Snapshot Secret Handling
Routine snapshots created by `config/scripts/startup_safety.py` now exclude `config/secret.key` and `config/secret_v2.key` by default to reduce secret duplication and keep env-first handling aligned with `docs/SECRET_LIFECYCLE_POLICY.md`.

Use break-glass opt-in only when an operator explicitly needs secret file capture:
- `python config/scripts/startup_safety.py --create-backup --include-secrets`
- `python config/scripts/startup_safety.py --on-launch --include-secrets`

Snapshot events are written to `config/logs/startup_safety_events.jsonl` and include an `includes_secrets` field so operators can audit whether key material was copied.

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
# Key Rotation and Local Runtime File Setup

This repository no longer tracks runtime-generated machine files or live secrets.

## Files now local-only (production runtime)

- `config/secret.key`
- `config/secret_v2.key`
- `config/robodj.lock`
- `config/scheduler.signal`
- `config/.robodj_trial`

Use the `.example` templates in this folder as references only.

## Template files (safe to keep in repo)

- `config/secret.key.example`
- `config/secret_v2.key.example`

These template/example files are formatting guides and must never contain active or historical production key material.

## Production key storage locations (outside git history)

- `config/secret.key` (local runtime machine file, git-ignored)
- `config/secret_v2.key` (local runtime machine file, git-ignored)
- Preferred: external secret manager/vault + deployment-time injection into local runtime files

## Initial setup for operators

1. Copy template files for secrets:
   - `cp config/secret.key.example config/secret.key`
   - `cp config/secret_v2.key.example config/secret_v2.key`
2. Generate fresh values and replace placeholders in both files.
3. Verify provenance before activation:
   - Confirm key values were generated from an approved method (vault workflow or local cryptographic generation command in this document).
   - Confirm values were never copied from chat logs, tickets, docs, or prior committed files.
4. Start the application (`RoboDJ_Launcher.bat`) so runtime files are recreated as needed.

## Rotation governance TODOs

- [ ] Define and enforce a rotation cadence (for example: every 90 days, or immediately after personnel/host compromise events).
- [ ] Add key provenance checks to operator checklist (source, generation timestamp, approver).
- [ ] Implement migration plan away from in-repo active secret workflows to vault-only provisioning.
- [ ] Publish an incident playbook for key compromise (detect, rotate, invalidate, verify, communicate).

## Rotation procedure (for any previously committed key)

If any key was ever committed to version control, treat it as compromised and rotate immediately:

1. Stop RoboDJ processes using the old keys.
2. Back up current config:
   - `cp config/secret.key config/backups/secret.key.YYYYMMDDHHMMSS.bak`
   - `cp config/secret_v2.key config/backups/secret_v2.key.YYYYMMDDHHMMSS.bak`
3. Generate new keys:
   - `python -c "import secrets, base64; print('secret.key=', base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"`
   - `python -c "import secrets; print('secret_v2.key=', secrets.token_hex(64))"`
4. Write new values into `config/secret.key` and `config/secret_v2.key`.
5. Restart RoboDJ and verify authentication/encryption-dependent features.
6. Invalidate any sessions/tokens derived from old keys (if applicable).
7. Confirm `git status` does not show secret files as tracked changes.

## Key compromise incident playbook (operator quick actions)

If compromise is suspected or confirmed, execute in order:

1. Declare severity and freeze non-essential config changes.
2. Rotate both keys immediately using the procedure above.
3. Invalidate active sessions/tokens derived from old keys.
4. Verify service health and access paths after restart.
5. Document timeline, blast radius, and remediation owners.
6. Schedule a follow-up review to tighten provenance controls.

## Notes

- Do not commit real key material.
- Do not share backups of rotated keys.
- Store production keys in a secure secret manager; use local runtime files only as delivery targets, not as source-of-truth.
