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

### Rotation evidence requirements by profile

Record rotation evidence in the ticket/change record before closing the change.

| Profile | Required timestamp evidence | Required owner evidence | Required validation evidence |
| --- | --- | --- | --- |
| `dev` | Local timezone timestamp for rotation + cleanup completion | Name/handle of operator who rotated the keys | Command output from `python config/check_runtime_secrets.py --require-env-only` (or break-glass exception note when explicitly approved). |
| `staging` | UTC timestamp for rotation start/end and approval time | Rotation owner (Release Manager Agent) + approving manager | Full command output from `python config/check_runtime_secrets.py --require-env-only` attached to release evidence. |
| `prod` | UTC timestamp for rotate, deploy, and post-rotate verification checkpoints | Rotation owner (Release Manager Agent), Secrets Auditor reviewer, and incident/production approver | Full command output from `python config/check_runtime_secrets.py --require-env-only`, plus confirmation that no fallback files were used outside an approved break-glass incident. |

### Fallback-file boundary (all profiles)

- `config/secret.key` and `config/secret_v2.key` are fallback delivery targets only.
- Normal release workflows must use env-only secret injection and pass `--require-env-only` checks.
- Fallback files are permitted only for explicit local development or approved break-glass incidents with expiry/cleanup evidence.

## Emergency Rotation Trigger Examples
- Suspected key exposure.
- Startup integrity check reports invalid/missing/expired keys.
- Ownership transfer or operator offboarding.
# Key Rotation and Local Runtime File Setup

This repository no longer tracks runtime-generated machine files or live secrets.

## Files now local-only (explicit local dev/break-glass runtime)

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

## Authoritative key storage locations (outside git history)

- Primary: external secret manager/vault + deployment-time env injection (required for normal staging/prod flows)
- `config/secret.key` and `config/secret_v2.key` may exist only as temporary local delivery targets for explicit local dev/break-glass scenarios

## Initial setup for local dev/break-glass operators

1. Copy template files for secrets:
   - `cp config/secret.key.example config/secret.key`
   - `cp config/secret_v2.key.example config/secret_v2.key`
2. Generate fresh values and replace placeholders in both files.
3. Verify provenance before activation:
   - Confirm key values were generated from an approved method (vault workflow or local cryptographic generation command in this document).
   - Confirm values were never copied from chat logs, tickets, docs, or prior committed files.
4. Start the application (`RoboDJ_Launcher.bat`) for approved local dev/break-glass runs only, then remove fallback files after use.

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
