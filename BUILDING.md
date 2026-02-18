# Building and QA with Docker Compose

This repository is distributed as a compiled Windows app, but you can still use Docker Compose for repeatable local orchestration of build-like packaging and static QA checks.

## Services

- `builder`: toolchain container that runs repository build scripts (`make build`).
- `qa`: static-check container (`make qa`).
- `runtime` (optional): smoke-check container profile for runtime artifact presence.
- `mcp-gateway`: existing MCP gateway service for local integrations.

## One-time setup

```bash
docker compose build builder qa
```

(Optional smoke image):

```bash
docker compose --profile smoke build runtime
```

## Common commands

Run build target:

```bash
docker compose run --rm builder make build
```

Run QA checks:

```bash
docker compose run --rm qa make qa
```

Run smoke check target in builder:

```bash
docker compose run --rm builder make smoke
```

Run optional runtime smoke service:

```bash
docker compose --profile smoke run --rm runtime
```

## Cache and source mounts

`docker-compose.yaml` mounts the project source and dedicated caches:

- Source bind mount: `./:/workspace`
- Builder caches:
  - `builder_pip_cache:/root/.cache/pip`
  - `builder_apt_cache:/var/cache/apt`
- QA caches:
  - `qa_pip_cache:/root/.cache/pip`
  - `qa_apt_cache:/var/cache/apt`

These volumes speed up repeat builds/checks across machines and fresh environments.
