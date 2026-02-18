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
