# Codex Environment Variables for DGN-DJ

This document defines which environment variables are required, optional, expected, or forbidden when running Codex sessions against this repository.

## 1) Variable classes

### Required (secure runs)

These **must** be present as environment-injected secret values for secure Codex execution:

- `ROBODJ_SECRET_KEY`
- `ROBODJ_SECRET_V2_KEY`

If either value is missing, startup/pre-release checks fail when `--require-env-only` is used. Keep these values in secret storage only (not plain variables). See `config/check_runtime_secrets.py`.

### Optional metadata

These are optional but recommended for rotation visibility and alerting:

- `ROBODJ_SECRET_KEY_EXPIRES_AT`
- `ROBODJ_SECRET_V2_KEY_EXPIRES_AT`

Expected format: ISO-8601 timestamp with timezone, for example:

- `2026-12-31T23:59:59Z`
- `2026-12-31T23:59:59+00:00`

### Expected platform variables (Codex-managed)

Codex/runtime may provide platform-level variables. These are expected and are **not** project-owned secrets:

- `CODEX_CI`
- Proxy/environment routing vars when applicable:
  - `HTTP_PROXY`
  - `HTTPS_PROXY`
  - `NO_PROXY`
  - `ALL_PROXY` (if present in your Codex environment)

Treat these as runtime plumbing. Do not repurpose them for project secrets.

### Project variables you control

Project-owned variables are namespaced with `ROBODJ_` and managed by the team:

- Required secrets: `ROBODJ_SECRET_KEY`, `ROBODJ_SECRET_V2_KEY`
- Optional metadata: `ROBODJ_SECRET_KEY_EXPIRES_AT`, `ROBODJ_SECRET_V2_KEY_EXPIRES_AT`

## 2) Forbidden patterns and handling rules

### Forbidden in Codex sessions

- Do **not** store secret material in plaintext files for session use (`config/secret.key`, `config/secret_v2.key`) when running with env-only policy.
- Do **not** add secret values to non-secret variable fields.
- Do **not** print secret values to terminal output, logs, markdown docs, PR text, or artifacts.
- Do **not** include plaintext secret files in screenshots, screen recordings, or shared debug captures.

### Explicit screenshot/log/artifact rule

**No plaintext secret files in screenshots, logs, or artifacts.**

Before sharing output, verify that:

1. No secret file contents are open in terminal/editor captures.
2. No `ROBODJ_SECRET_*` values are echoed or copied into logs.
3. No build/test artifact contains key material.

## 3) Codex Environment UI setup

Use the Codex Environment UI with this split:

### Secrets (sensitive)

Store in **Secrets**:

- `ROBODJ_SECRET_KEY`
- `ROBODJ_SECRET_V2_KEY`

### Variables (non-sensitive metadata/runtime)

Store in **Variables**:

- `ROBODJ_SECRET_KEY_EXPIRES_AT`
- `ROBODJ_SECRET_V2_KEY_EXPIRES_AT`
- Any platform-level non-secret runtime knobs as needed

### Naming convention

- Project-owned values use `ROBODJ_` uppercase snake case.
- Keep names exact (no aliases) so automation checks can read them directly.
- Reserve generic names (`HTTP_PROXY`, `HTTPS_PROXY`, etc.) for platform/network configuration only.

## 4) Startup checklist (env-only secret posture)

Run this checklist at the beginning of each Codex session that may touch runtime/security-sensitive paths.

1. Confirm `ROBODJ_SECRET_KEY` and `ROBODJ_SECRET_V2_KEY` are configured in Codex **Secrets**.
2. Confirm optional expiry metadata is present in Codex **Variables** (if your team tracks expiry in-env).
3. Verify no local plaintext secret fallback files are needed for the session path.
4. Run:

   ```bash
   python config/check_runtime_secrets.py --require-env-only
   ```

5. Continue only if output reports:

   - `Secret integrity check passed (key material redacted).`

6. If the check fails, stop and rotate/provision secrets before further execution.

## 5) Quick reference matrix

| Variable | Required | Sensitivity | Codex UI location | Owner |
| --- | --- | --- | --- | --- |
| `ROBODJ_SECRET_KEY` | Yes | Secret | Secrets | Project/SecOps |
| `ROBODJ_SECRET_V2_KEY` | Yes | Secret | Secrets | Project/SecOps |
| `ROBODJ_SECRET_KEY_EXPIRES_AT` | Optional | Non-secret metadata | Variables | Project/SecOps |
| `ROBODJ_SECRET_V2_KEY_EXPIRES_AT` | Optional | Non-secret metadata | Variables | Project/SecOps |
| `CODEX_CI` | Platform-provided | Non-secret runtime flag | Platform-managed | Codex platform |
| `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` / `ALL_PROXY` | Environment-dependent | Non-secret runtime networking | Platform-managed (or org runtime) | Codex platform / infra |
