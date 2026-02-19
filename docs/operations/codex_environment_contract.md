# Codex Environment Contract

This contract defines how Codex and operators must provide, validate, and protect runtime secrets during local checks and release operations.

## Required secrets

The runtime requires both secrets to be set before release validation:

- `ROBODJ_SECRET_KEY`
- `ROBODJ_SECRET_V2_KEY`

## Optional metadata variables

Use these optional metadata variables to track expiry and trigger proactive rotation alerts:
Use these optional metadata variables to track expiry and trigger proactive rotation alerts. The value should be an ISO 8601 date-time string (e.g., `2023-12-31T23:59:59Z`).

- `ROBODJ_SECRET_KEY_EXPIRES_AT`
- `ROBODJ_SECRET_V2_KEY_EXPIRES_AT`

## Source priority

Secret loading follows this priority order:

1. Environment variable value (`ROBODJ_SECRET_KEY`, `ROBODJ_SECRET_V2_KEY`)
2. Local fallback files (`config/secret.key`, `config/secret_v2.key`)

For release checks, run with `--require-env-only` to enforce environment-sourced values.

## Validation command

Run this command from repository root:

```bash
python config/check_runtime_secrets.py --require-env-only
```

Expected success output:

```text
Secret integrity check passed (key material redacted).
```

## Never commit / redaction rules

- Never commit live key material, including `.env` files that contain runtime secret values.
- Never paste secret values into markdown docs, issue comments, PR descriptions, or commit messages.
- Redact secrets from logs and CLI captures before sharing.
- Do not include visible secret values in screenshots or screen recordings.
- Treat `config/secret.key` and `config/secret_v2.key` as local-only break-glass files and keep them out of shared artifacts.
