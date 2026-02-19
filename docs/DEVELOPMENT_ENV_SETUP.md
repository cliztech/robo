# Development Environment Setup

This repository is a packaged distribution, but the steps below make collaboration smooth across local environment, Docker, and GitHub.

## 1) Configure git remotes

From the repo root:

```bash
scripts/setup_git_remotes.sh <github_owner> <repo_name> [upstream_owner]
```

Examples:

```bash
# Personal repo only
scripts/setup_git_remotes.sh my-user robo

# Fork + upstream model
scripts/setup_git_remotes.sh my-user robo original-org
```

This script:
- configures `origin` using SSH (`git@github.com:owner/repo.git`)
- configures `origin-https` as an HTTPS fallback
- optionally configures `upstream`
- fetches all remotes

## 2) Choose bootstrap mode before task execution

Use `scripts/bootstrap_codex_environment.sh` to validate tooling, execution assumptions, and secrets.

### Automatic mode (default)

Use this when running in Codex-managed environments (for example, hosted agent sessions where `CODEX_CI` and `CODEX_HOME` are typically present).

```bash
scripts/bootstrap_codex_environment.sh
# or
scripts/bootstrap_codex_environment.sh automatic
```

Automatic mode is best for:
- task execution in Codex
- CI-like runs
- pull request preflight checks

### Manual mode

Use this when running from a local shell where Codex-managed environment markers may not exist.

```bash
scripts/bootstrap_codex_environment.sh manual
```

Manual mode is best for:
- local debugging and dry-runs
- validating local fallback secret files before committing changes

## 3) Secret placement strategy (Codex settings vs local fallback)

### Configure these in Codex environment settings (primary)

Set these environment variables in the Codex environment configuration so they are injected securely at runtime:
- `ROBODJ_SECRET_KEY`
- `ROBODJ_SECRET_V2_KEY`
- `ICECAST_PASS`
- `ICECAST_SOURCE_PASSWORD`
- `ICECAST_ADMIN_PASSWORD`
- `ICECAST_RELAY_PASSWORD`

### Local fallback files (manual mode only)

For local-only manual development, keep fallback values in untracked local files such as:
- `.env.local`
- `radio-agentic/.env.local`

Do **not** commit fallback secret files.

## 4) What the Codex bootstrap script validates

`scripts/bootstrap_codex_environment.sh` checks:
- required CLI/tooling availability (`git`, `python3`, `rg`)
- optional tooling signals (`docker`, `gh`, `node`, `npm`)
- expected environment mode assumptions (Automatic vs Manual)
- presence (not content disclosure) of required secret env vars
- warning signals when likely placeholder values are still configured (for example `hackme`, `changeme`, `placeholder`, `example`)

## 5) Minimal secure defaults before starting work

- Always run with real secrets injected via environment variables.
- Treat placeholder values (`hackme`, `changeme`, `example`) as invalid for real task execution.
- Keep secret files untracked and avoid echoing secret values into logs.
- Use the repo bootstrap checks before editing code or config.

## 6) Validation commands to run before task execution

Run from repository root:

```bash
# Codex/CI-preferred bootstrap check
scripts/bootstrap_codex_environment.sh automatic

# Local/manual bootstrap check
scripts/bootstrap_codex_environment.sh manual

# Existing baseline repo health check
scripts/bootstrap_dev_environment.sh

# Optional: validate JSON configuration syntax quickly
python -m json.tool config/schedules.json >/dev/null
python -m json.tool config/prompt_variables.json >/dev/null
```

Optional preflight mode:

```bash
scripts/bootstrap_dev_environment.sh --with-preflight
```

It validates:
- git repository + remotes
- presence of `docker-compose.yaml`
- Docker Compose availability
- presence of `.github/workflows`
- GitHub CLI install + auth status
## 7) Docker workflow (optional)
Then validate required non-secret runtime variables by context:

```bash
# Desktop launcher / local runtime context
ROBODJ_ENV=development \
ROBODJ_STATION_ID=dgn_local \
ROBODJ_LOG_LEVEL=INFO \
ROBODJ_DATA_DIR=./config/cache \
python config/check_runtime_env.py --context desktop_app

# Docker stack context
COMPOSE_PROJECT_NAME=robodj \
ROBODJ_ENV=development \
ROBODJ_LOG_LEVEL=INFO \
ROBODJ_HTTP_PORT=8080 \
python config/check_runtime_env.py --context docker_stack

# CI context (example values for local dry-run)
CI=true \
GITHUB_ACTIONS=true \
GITHUB_REF_NAME=main \
GITHUB_SHA=0123456789abcdef0123456789abcdef01234567 \
ROBODJ_ENV=staging \
python config/check_runtime_env.py --context ci
```

Contract source of truth:
- `config/env_contract.json` (machine-readable variable requirements by context)

### Codex pre-task secret check (recommended)

Before starting implementation tasks in Codex, run:

```bash
scripts/codex_env_doctor.sh
```

This read-only quality gate checks:
- repository context and required files
- `ROBODJ_SECRET_KEY` and `ROBODJ_SECRET_V2_KEY` presence in environment (without printing values)
- `python config/check_runtime_secrets.py --require-env-only`

If any check fails, the script prints remediation steps and exits non-zero.

With `--with-preflight`, it also runs:
- `python config/validate_config.py`
- `python config/check_runtime_secrets.py --require-env-only`

The script prints pass/fail summaries for preflight checks and avoids printing secret key material.

## 3) Docker workflow (optional)

To start the MCP gateway service already defined in this repository:

```bash
docker compose up -d
```

To stop it:

```bash
docker compose down
```

## 8) GitHub workflow files

CI workflow files live in `.github/workflows/` and are executed automatically when pushed to GitHub.

Current workflows in this repo include:
- `ci-validate.yml`
- `config-validation.yml`
- `skills-validate.yml`
- `build-windows.yml`
- `distribution-validation.yml`
- `release.yml`
- `codex-ralph-loop.yml` (configurable loop that repeatedly runs build and validation checks)

## Notes

- Keep sensitive files (such as `config/secret.key` and `config/secret_v2.key`) out of shared logs and screenshots.
- This setup is non-destructive; it does not modify app binaries or SQLite databases.

## Troubleshooting preflight secret checks

If `--with-preflight` reports a runtime secret env failure, set both required environment variables before running the bootstrap script:

- `ROBODJ_SECRET_KEY`
- `ROBODJ_SECRET_V2_KEY`

Example (Linux/macOS shell):

```bash
export ROBODJ_SECRET_KEY="<your-key>"
export ROBODJ_SECRET_V2_KEY="<your-v2-key>"
scripts/bootstrap_dev_environment.sh --with-preflight
```

The validation command intentionally redacts key material, so failures indicate missing/invalid secret sources rather than printing actual keys.
- For environment-variable requirements and platform variable expectations, see [CODEX Environment Contract](CODEX_ENVIRONMENT_CONTRACT.md).
