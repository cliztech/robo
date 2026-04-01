# TI-040 High-Risk Field Inventory (Actual Runtime State)

- Generated at: 2026-03-04T20:31:38.829180+00:00
- Scope: `config/prompt_variables.json`, `config/schedules.json`, and adjacent runtime config files loaded by backend.
- Method: field-level scan against backend TI-040 loader keys + key-file presence checks.

## Backend loader references

| Loader path | Runtime file(s) | Notes |
| --- | --- | --- |
| `backend/ai_service.py` (`load_config_json` / `dump_config_json`) | `config/prompt_variables.json` | Prompt profile config read/write path is encryption-envelope aware. |
| `backend/scheduling/scheduler_ui_service.py` (`load_config_json` / `dump_config_json`) | `config/schedules.json` | Scheduler state read/write path is encryption-envelope aware. |
| `backend/security/config_crypto.py` (`load_key_material`) + `backend/security/auth.py` (`_get_secret_key`) | `config/secret.key`, `config/secret_v2.key` | Key material can be file-backed when env vars are absent. |

## Sensitive-value inventory (actual values in repo state)

| File | Field ref | Value state | Owner |
| --- | --- | --- | --- |
| `config/prompt_variables.json` | `config/prompt_variables.json:openai_api_key` | Field not present in current payload. | AI Config Owner |
| `config/prompt_variables.json` | `config/prompt_variables.json:tts_api_key` | Field not present in current payload. | AI Config Owner |
| `config/schedules.json` | `config/schedules.json:webhook_auth_token` | Field not present in current payload. | Scheduling Config Owner |
| `config/schedules.json` | `config/schedules.json:stream_fallback_password` | Field not present in current payload. | Scheduling Config Owner |
| `config/schedules.json` | `config/schedules.json:remote_ingest_secret` | Field not present in current payload. | Scheduling Config Owner |
| `config/secret.key` | `file_content` | File missing in current runtime. | Security Engineer |
| `config/secret_v2.key` | `file_content` | File missing in current runtime. | Security Engineer |

## TI-040 checklist

- [x] `CHK-TI040-01` high-risk inventory reviewed.
- [x] `CHK-TI040-02` envelope schema validated (`enc_v`, `alg`, `kid`, `nonce_b64`, `ciphertext_b64`, `tag_b64`, `aad`).
- [x] `CHK-TI040-03` key provenance evidence attached.
- [x] `CHK-TI040-04` encrypted-at-rest verification complete for active read/write code paths.
