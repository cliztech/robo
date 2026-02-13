# Key Rotation and Local Runtime File Setup

This repository no longer tracks runtime-generated machine files or live secrets.

## Files now local-only

- `config/secret.key`
- `config/secret_v2.key`
- `config/robodj.lock`
- `config/scheduler.signal`
- `config/.robodj_trial`

Use the `.example` templates in this folder as references.

## Initial setup

1. Copy template files for secrets:
   - `cp config/secret.key.example config/secret.key`
   - `cp config/secret_v2.key.example config/secret_v2.key`
2. Generate fresh values and replace placeholders in both files.
3. Start the application (`RoboDJ_Launcher.bat`) so runtime files are recreated as needed.

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

## Notes

- Do not commit real key material.
- Do not share backups of rotated keys.
- Store production keys in a secure secret manager when possible.
