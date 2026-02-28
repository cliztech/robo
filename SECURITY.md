# Security Notes for Docker MCP Gateway

## Operational Risk Summary

The `mcp-gateway` service can be run safely with a narrow local-only exposure when it only uses built-in servers like `time`.

If you enable a Docker daemon socket mount (`/var/run/docker.sock`), the container effectively gains root-equivalent control over the Docker host. A compromise in the container or any MCP tool path can be used to:

- start privileged containers,
- mount host filesystems,
- read secrets from other containers or images,
- execute arbitrary commands on the host via Docker APIs.

## Recommended Deployment Context

- **Recommended**: trusted, single-user development machine.
- **Not recommended**: shared hosts, multi-tenant servers, or production environments with mixed trust levels.

## Safer-by-default Compose Posture

The included `docker-compose.yaml` is hardened for local development by default:

- binds published port to `127.0.0.1` only,
- uses `read_only` root filesystem,
- drops all Linux capabilities,
- enables `no-new-privileges`,
- does **not** mount the Docker socket.

Only enable Docker socket access when it is strictly required for a specific MCP server workflow, and treat the host as fully trusted in that configuration.

## Runtime Secret Source Policy

RoboDJ runtime key material (`ROBODJ_SECRET_KEY`, `ROBODJ_SECRET_V2_KEY`) follows a single canonical source order:

1. **Environment-provided secret values** (required for protected/release environments)
2. **File fallback for local/dev only**, and only when explicitly enabled with `ROBODJ_ALLOW_FILE_SECRET_FALLBACK=true`

Protected environments must set `ROBODJ_PROTECTED_ENV=true` and must not rely on key files in `config/`.

Validation command:

- `python config/check_runtime_secrets.py --require-env-only`

That command fails if:

- required environment secrets are missing, or
- real key material is detected in `config/secret.key` / `config/secret_v2.key`.

## CodeQL Policy and Severity Gate

CodeQL is enabled via `.github/workflows/codeql.yml` and scans only repository languages currently in use:

- `actions`
- `javascript-typescript`
- `python`

Merge-blocking policy:

- CI blocks on any **open high/critical** CodeQL alert for the current ref.
- Scheduled scans run without merge gating to keep weekly signal without interrupting maintenance jobs.

Triage workflow:

- Follow `docs/runbooks/codeql-triage.md` (RB-023) when the severity gate fails.
- Only dismiss alerts with explicit rationale and traceable ownership.

## CI Security Severity Gate Policy

Repository CI (`.github/workflows/ci.yml`) enforces branch-aware security gating while preserving full report artifacts.

- **Release-enforced refs:** pushes to `main`, pushes to `release/*`, and pull requests targeting `main` or `release/*`.
- **Feature/non-release refs:** findings are warning-only to preserve developer velocity, but reports are still generated and uploaded.

Blocking policy on release-enforced refs:

- `npm audit`: block on any **high** or **critical** vulnerability.
- Python SAST (`bandit`): block on any **HIGH** severity issue.
- `pip-audit`: block on **high/critical** findings when severity exists; if severity metadata is absent, unscored findings are treated as blocking.

Observability guarantees:

- Security reports are always emitted to workflow artifacts (`pip-audit.json`, `python-sast-bandit.json`, `npm-audit.json`), including failure paths.
- Gate evaluation runs with `if: always()` so final policy decisions are visible even when scans return non-zero statuses.
