# Implementation Plan: Config-at-Rest Encryption (Task A2.2)

## Scope
Implement config-at-rest encryption for high-risk JSON fields to satisfy requirement A2.2. This ensures sensitive configuration data is unreadable on disk without the active runtime key.

## Classification of High-Risk Fields
The following fields in JSON configuration files are designated as high-risk and must be encrypted at rest:
1. `config/env_contract.json`: Any default values for fields marked `"secret": true`.
2. `config/editorial_pipeline_config.json`: External API keys, authorization tokens, or webhook secrets used by the pipeline.
3. `config/schedules.json`: Not applicable (primarily operational state, no secrets).
4. `config/prompt_variables.json`: Not applicable.

## Encryption Workflow
- **Algorithm:** AES-GCM (Authenticated Encryption with Associated Data).
- **Key Source:** `ROBODJ_SECRET_KEY` (primary) or `ROBODJ_SECRET_V2_KEY` (fallback/rotation).
- **Format:** Encrypted fields are stored in the JSON as structured strings: `ENC[<version>:<nonce>:<ciphertext>:<tag>]`.
- **Read Path:** The `config/validate_config.py` parser intercepts `ENC[...]` strings. It attempts decryption using the primary key. If it fails, it attempts the secondary key. If both fail, validation fails.
- **Write Path:** The backend config save endpoint detects high-risk fields based on a static schema dictionary and replaces plain text with the `ENC[...]` string before writing to disk.

## Validation Procedure
- [ ] Write a script `python config/scripts/verify_encryption.py` that reads all JSON configs and asserts that no high-risk key contains plain text.
- [ ] Ensure that `startup_safety.py` snapshot backups copy the files exactly as they are on disk (encrypted).
- [ ] Document that manual config edits for encrypted fields require using a CLI tool (e.g., `python scripts/encrypt_value.py "my_secret"`).