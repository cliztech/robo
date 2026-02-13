# Frontend Redaction Rules

This document defines how runtime configuration data is transformed before becoming frontend payloads.

## Contract Separation
- `internal_config.schema.json` is the desktop/runtime contract and may contain secret-bearing fields and internal key paths.
- `public_frontend_config.schema.json` is the only config contract allowed in browser-facing APIs.
- Files in `contracts/frontend_responses/` define frontend response envelopes and must remain secret-free.

## Trust & Exposure Policy
1. Treat all runtime config as private by default.
2. Promote fields to frontend payloads only when explicitly listed in `public_frontend_config.schema.json`.
3. Never pass through raw integration, security, storage, or path-bearing fields.

## Denylist (Keys/Paths)
Denylist source of truth: `redaction_denylist.json`.

### Sensitive keys
- `api_key`
- `openai_api_key`
- `openrouter_api_key`
- `weatherapi_key`
- `elevenlabs_api_key`
- `token`
- `secret`
- `secret_key`
- `secret_key_path`
- `secret_v2_key_path`
- `password`
- `signing_key`
- `private_key`

### Sensitive path fragments
- `config/secret.key`
- `config/secret_v2.key`
- `settings.db`
- `user_content.db`
- `config/backups`
- `config/cache`
- `C:/`
- `\\`

## Enforcement
- Run `python config/spec_check_frontend_contracts.py` to verify denylisted keys/path fragments are absent from all frontend response schemas.
- Contract checks must pass before shipping any schema updates.
