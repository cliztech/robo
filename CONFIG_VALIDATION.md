# Configuration Validation

> Part of the **DGN-DJ by DGNradio** platform. See [`AGENTS.md`](AGENTS.md) for agent pipeline rules.

Use the validator before any deployment or handoff to catch malformed configuration changes early.

> **Hard gate:** Deployment/handoff must not proceed unless the validator command has been run and the required success line is present in output.

## What it validates

- `config/schedules.json` against `config/schemas/schedules.schema.json`
- `config/prompt_variables.json` against `config/schemas/prompt_variables.schema.json`
- `config/autonomy_policy.json` against `config/schemas/autonomy_policy.schema.json`
- `config/autonomy_profiles.json` against `config/schemas/autonomy_profiles.schema.json`
- `config/persona_ops.json` against `config/schemas/persona_ops.schema.json`
- `config/interactivity_channels.json` against `config/schemas/interactivity_channels.schema.json`
- `config/editorial_pipeline_config.json` against `config/schemas/editorial_pipeline_config.schema.json`
- TI-040 sensitive key envelope compliance for these value keys (where present):
  - `openai_api_key`
  - `tts_api_key`
  - `webhook_auth_token`
  - `stream_fallback_password`
  - `remote_ingest_secret`

The validator reports actionable errors with JSON paths in `[$.json.path]` style (for example `$.variable_settings.missing_variable_behavior`) and expected types/enums.

## Run locally

```bash
python config/validate_config.py
```

## Required success output

The run is only considered passing for release/deployment/handoff when output includes:

```text
Configuration validation passed for:
```

## Encryption-at-rest validation (TI-040)

Run these checks after any edit that touches high-risk fields:

```bash
python -m json.tool config/schedules.json > /tmp/schedules.validated.json
python -m json.tool config/prompt_variables.json > /tmp/prompt_variables.validated.json
python config/validate_config.py --encryption-evidence > artifacts/security/logs/ti-040-config-encryption.log
```

Expected validator behavior for sensitive values:

- Rejects plaintext values for TI-040 fields.
- Requires envelope keys: `enc_v`, `alg`, `kid`, `nonce_b64`, `ciphertext_b64`, `tag_b64`, `aad`.
- Requires `enc_v=v1`, `alg=AES-256-GCM`, and `kid` format `kms://dgn-dj/config/<key-id>`.
- Emits deterministic `ENCRYPTION_EVIDENCE ... envelope_sha256=<hash>` lines for each encrypted sensitive value.

### Deterministic rollback if decryption fails

1. Restore the latest known-good backup values only (no schema edits) from `config/backups/`.
2. Re-run `python -m json.tool` on both config files.
3. Re-run `python config/validate_config.py --encryption-evidence`.
4. Record rollback evidence with TI-039-compatible hashes:
   - `before_hash_sha256`: hash of failing envelope payload
   - `after_hash_sha256`: hash of restored envelope payload
5. Persist the rollback report and hashes under `artifacts/security/reports/` and `artifacts/security/hashes/`.

## Example failure output

```text
Configuration validation failed:
 - [prompt_variables] $.custom_variables.openai_api_key: sensitive field 'openai_api_key' must be encryption envelope object, got string
```

## Release gating

- **CI:** `.github/workflows/config-validation.yml` runs this check automatically on pull requests and pushes to `main`.
- **Manual pre-release / deployment / handoff:** do not proceed until `python config/validate_config.py` has been executed and output includes `Configuration validation passed for:`.
- **Risky config changes:** archive backup snapshots in `config/backups/` and include them as release/deployment artifacts for traceability and rollback readiness.

## TI-040 encrypted config validation (command-level)

Use this sequence when TI-040 protected fields are touched (`openai_api_key`, `tts_api_key`, `webhook_auth_token`, `stream_fallback_password`, `remote_ingest_secret`).

```bash
python -m json.tool config/schedules.json > /tmp/schedules.validated.json
python -m json.tool config/prompt_variables.json > /tmp/prompt_variables.validated.json
python config/validate_config.py
python -m pytest backend/tests/test_config_crypto.py
```

Expected evidence outputs:
- `artifacts/security/hashes/ti-040-config-before-after.sha256`
- `artifacts/security/reports/ti-040-high-risk-field-inventory.md`
- `artifacts/security/logs/ti-040-config-encryption.log`

Minimum evidence content:
- before/after SHA256 hashes for both config files
- KID used for encryption plus allowed previous KID(s) in transition window
- explicit pass/fail for envelope fields (`enc_v`, `alg`, `kid`, `nonce`, `ciphertext`, `tag`)
