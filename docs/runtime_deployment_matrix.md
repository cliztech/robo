# Runtime & Deployment Matrix

**Version:** 2.0  
**Applies to:** `dev`, `staging`, `prod`

## Compose model (base + overlays)

- **Base:** `docker-compose.base.yml` defines common services (`backend`, `frontend`, `db`, `redis`) and shared runtime constraints.
- **Dev overlay:** `docker-compose.dev.yml` enables hot reload, local bind mounts, and development image/build settings.
- **Staging overlay:** `docker-compose.staging.yml` binds staging env files.
- **Release security overlay (staging+prod):** `docker-compose.release.yml` applies immutable-image runtime posture with stricter container hardening defaults.
- **Prod overlay:** `docker-compose.prod.yml` binds production env files and resource limits.

## Operator command matrix

| Profile | Compose files | Profiles flag | Start command | Validate command |
| --- | --- | --- | --- | --- |
| `dev` | `docker-compose.base.yml` + `docker-compose.dev.yml` | `--profile dev` | `docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile dev up -d` | `docker compose -f docker-compose.base.yml -f docker-compose.dev.yml --profile dev config` |
| `staging` | `docker-compose.base.yml` + `docker-compose.staging.yml` + `docker-compose.release.yml` | `--profile staging` | `docker compose -f docker-compose.base.yml -f docker-compose.staging.yml -f docker-compose.release.yml --profile staging up -d` | `docker compose -f docker-compose.base.yml -f docker-compose.staging.yml -f docker-compose.release.yml --profile staging config` |
| `prod` | `docker-compose.base.yml` + `docker-compose.release.yml` + `docker-compose.prod.yml` | `--profile prod` | `docker compose -f docker-compose.base.yml -f docker-compose.release.yml -f docker-compose.prod.yml --profile prod up -d` | `docker compose -f docker-compose.base.yml -f docker-compose.release.yml -f docker-compose.prod.yml --profile prod config` |

## Env contract alignment (`config/env_contract.json`)

### Standardized `env_file` layout

- Shared: `deploy/env/docker.common.env`
- Dev: `deploy/env/docker.dev.env`
- Staging: `deploy/env/docker.staging.env`
- Prod: `deploy/env/docker.prod.env`

### Required variables per profile

| Variable | Contract context | Dev | Staging | Prod |
| --- | --- | --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | `docker_stack` required | ✅ | ✅ | ✅ |
| `ROBODJ_ENV` | `docker_stack` required | `development` | `staging` | `production` |
| `ROBODJ_LOG_LEVEL` | `docker_stack` required | ✅ | ✅ | ✅ |
| `ROBODJ_HTTP_PORT` | `docker_stack` required | ✅ | ✅ | ✅ |
| `ROBODJ_SECRET_KEY` | `docker_stack` required | ✅ | ✅ | ✅ |
| `ROBODJ_SECRET_V2_KEY` | `docker_stack` required | ✅ | ✅ | ✅ |
| `ROBODJ_IDLE_TIMEOUT_MINUTES` | `docker_stack` optional | optional | optional | optional |
| `ROBODJ_REAUTH_GRACE_MINUTES` | `docker_stack` optional | optional | optional | optional |

## Compatibility notes

- `docker-compose.yaml` remains as a temporary compatibility shim for tooling that still expects the legacy filename.
- Legacy standalone files `docker-compose.safe.yaml` and `docker-compose.docker-control.yaml` were removed after migration to the profile-overlay model.
- Prefer explicit layered commands from the matrix above for all operator and CI workflows.
