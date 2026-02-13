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

## Explicit UI-Safe Allowlist Addendum
The following `ui.tokens` fields are explicitly allowed for frontend exposure because they are visual primitives and non-sensitive:

- `ui.tokens.primary_color`
- `ui.tokens.accent_color`
- `ui.tokens.surface_style`
- `ui.tokens.density` (`comfortable` or `compact`)
- `ui.tokens.corner_radius_scale`
- `ui.tokens.font_stack` (named stack key only, not raw font files, URLs, or local file paths)

Fallback behavior for omitted UI-safe fields:
- If `ui.tokens` is absent, frontend clients should use schema defaults.
- If individual `ui.tokens.*` keys are absent, frontend clients should apply each field's documented default.
- Unknown `ui.tokens` keys are disallowed by schema (`additionalProperties: false`).

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
