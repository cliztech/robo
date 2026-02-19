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
