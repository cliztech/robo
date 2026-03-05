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

## Notes

- `scripts/bootstrap_dev_environment.sh --with-preflight` validates config schema, runtime secret checks, and env contract checks for `desktop_app` and `docker_stack`.
- `scripts/codex_env_doctor.sh` includes a `desktop_app` env contract check for Codex/local operator diagnostics.
- CI workflows run `python config/check_runtime_env.py --context ci` with `ROBODJ_ENV` set explicitly.
- Keep secret files (`config/secret.key`, `config/secret_v2.key`) out of logs/screenshots and never commit secret values.
