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

## 2) Verify environment health

Run:

```bash
scripts/bootstrap_dev_environment.sh
```

It validates:
- git repository + remotes
- presence of `docker-compose.yaml`
- Docker Compose availability
- presence of `.github/workflows`
- GitHub CLI install + auth status

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

## 3) Docker workflow (optional)

To start the MCP gateway service already defined in this repository:

```bash
docker compose up -d
```

To stop it:

```bash
docker compose down
```

## 4) GitHub workflow files

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
