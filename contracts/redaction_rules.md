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

## Frontend Status Diagnostics (User-Facing)
For `frontend_status_response` diagnostics fields, only publish non-sensitive operational context. Messages and codes are for end users and must never expose credentials, local paths, hostnames, stack traces, or vendor/internal error payloads.

### Allowed diagnostics fields
- `status_reason_code` (enum): stable reason key for UI state rendering.
- `status_message` (short safe text): plain-language status note, max 160 characters.
- `fallback_mode_active` (boolean): indicates backup content behavior is currently active.
- `next_recovery_check_at` (date-time): next scheduled backend retry/check.
- `last_successful_generation_at` (date-time): last known successful generation timestamp.

### UI rendering guidance by `status_reason_code`
- `none`
  - Meaning: no active incident reason.
  - UI: show normal healthy/degraded/offline chrome from `service_status`; omit warning banners unless another field indicates an issue.
- `startup_recovery`
  - Meaning: service is warming up and restoring pipelines.
  - UI: show “Starting up” state with spinner/progress affordance; if present, show `next_recovery_check_at` as “next check”.
- `generation_backlog`
  - Meaning: queue pressure is delaying fresh generation.
  - UI: show backlog warning with `queue_depth`; reassure playback continuity and include `last_successful_generation_at` when available.
- `upstream_timeout`
  - Meaning: upstream dependency requests are timing out.
  - UI: show temporary upstream issue banner; if `fallback_mode_active=true`, communicate that fallback content is serving.
- `network_unavailable`
  - Meaning: runtime cannot reach required network resources.
  - UI: show offline/degraded networking status and recovery polling time (`next_recovery_check_at`) when provided.
- `maintenance_mode`
  - Meaning: planned service maintenance is in progress.
  - UI: show maintenance banner (not error styling), expected temporary impact, and next check time if available.
- `manual_pause`
  - Meaning: operator intentionally paused generation.
  - UI: show paused state with non-alarming styling and guidance that generation resumes when unpaused.

Use `status_message` only as supplemental text to these reason-code-driven templates.
