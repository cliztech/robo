# Development Environment Setup

## Configure git remotes

From repo root:

```bash
scripts/setup_git_remotes.sh <github_owner> <repo_name> [upstream_owner]
```

## Canonical preflight sequence (run before implementation)

Run the following in order from repo root:

```bash
scripts/bootstrap_dev_environment.sh --with-preflight
scripts/codex_env_doctor.sh
make env-check-desktop
make env-check-docker
make env-check-ci
```

This sequence is canonical for local work and mirrors CI contract validation expectations.

## Context mapping for `check_runtime_env.py`

- local desktop → `desktop_app`
- docker compose → `docker_stack`
- GitHub Actions → `ci`

Manual command equivalents:

```bash
python config/check_runtime_env.py --context desktop_app
python config/check_runtime_env.py --context docker_stack
python config/check_runtime_env.py --context ci
```

Contract source of truth: `config/env_contract.json`.

## 9) Supabase environment variable canonical names

Use Next.js canonical keys for shared client/server usage:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Migration notes:

- Legacy aliases `SUPABASE_URL` and `SUPABASE_ANON_KEY` are deprecated.
- Server runtime currently supports a temporary fallback to deprecated aliases with a warning log.
- Set canonical keys in `.env` / `.env.local` now and remove alias keys during the deprecation window.
### CI validation commands

`ci.yml` now enforces runtime contract gates with explicit CI-safe non-secret env values and protected-ref secret validation:

```bash
CI=true \
GITHUB_ACTIONS=true \
GITHUB_REF_NAME=main \
GITHUB_SHA=0123456789abcdef0123456789abcdef01234567 \
ROBODJ_ENV=staging \
python config/check_runtime_env.py --context ci
```

Contract source of truth:
- `config/env_contract.json` (machine-readable variable requirements by context)

### CI parity check: contract vs `.env.example` vs compose

Use `python scripts/ci/validate_env_contract.py` to enforce parity between:
- required variables declared in `config/env_contract.json`
- keys documented in `.env.example`
- `${VAR}` references in all tracked `docker-compose*.yml` files

The script writes a machine-readable artifact at `.artifacts/ci/env-contract-report.json` and prints a concise summary line.

Remediation guide when CI fails:
- `missing_required`: add the missing key to `.env.example` (or mark it non-required in `config/env_contract.json` if requirement changed).
- `stale_env_example`: remove deprecated keys from `.env.example` or add them to the contract/compose usage if still valid.
- `undocumented_compose`: document the compose variable in `.env.example` and/or `config/env_contract.json`.

### Codex pre-task secret check (recommended)

Before starting implementation tasks in Codex, run:

# Protected refs/environments only
# This command requires ROBODJ_PROTECTED_ENV=true and all required secrets
# to be set as environment variables for a successful dry-run.
ROBODJ_PROTECTED_ENV=true \
ROBODJ_SECRET_KEY=<your-key> \
ROBODJ_SECRET_V2_KEY=<your-v2-key> \
python config/check_runtime_secrets.py --require-env-only
```

These commands are fail-fast gates in workflow logs and block CI when contract checks fail.

## Notes

- `scripts/bootstrap_dev_environment.sh --with-preflight` validates config schema, runtime secret checks, and env contract checks for `desktop_app` and `docker_stack`.
- `scripts/codex_env_doctor.sh` includes a `desktop_app` env contract check for Codex/local operator diagnostics.
- CI workflows run `python config/check_runtime_env.py --context ci` with `ROBODJ_ENV` set explicitly.
- Keep secret files (`config/secret.key`, `config/secret_v2.key`) out of logs/screenshots and never commit secret values.
