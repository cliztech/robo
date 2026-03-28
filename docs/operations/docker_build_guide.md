# Docker Build Guide - DGN-DJ by DGNradio

This guide explains how to build the various components of the DGN-DJ project using Docker.

## Project Architecture
The project follows a modular, multi-service architecture. There is no single root `Dockerfile`. Instead, builds are managed via:
1.  **Docker Compose Profiles**: Layered configurations for different environments (dev, staging, prod).
2.  **Service-Specific Dockerfiles**: Located within each service subdirectory.

## Common Build Scenarios

### 1. Backend (FastAPI)
The main backend service uses a Dockerfile located in `infra/docker/dev.Dockerfile`.

**Correct Build Command:**
```bash
docker build -f infra/docker/dev.Dockerfile .
```
> [!IMPORTANT]
> This command must be executed from the repository root to ensure the build context includes all necessary files.

### 2. Radio-Agentic Microservices
The `radio-agentic` stack consists of several Node.js services, each with its own `Dockerfile`.

**Build All Services:**
```bash
cd radio-agentic && docker compose build
```

**Build a Specific Service (e.g., audio-engine):**
```bash
docker build -t dgn-dj/audio-engine:latest radio-agentic/services/audio-engine
```

### 3. Frontend (Next.js)
The frontend is typically run in a container that mounts the root directory and runs `npm run dev`.

**Build/Run Command:**
```bash
# Handled via the main dev profile
make dev
```

## Recommended Development Workflow

The `Makefile` in the root directory is the canonical entry point for local development.

**Start Development Environment:**
```bash
make dev
```
This command uses `docker compose` with the correct profiles and overlays:
- `docker-compose.base.yml`
- `docker-compose.dev.yml`

## Troubleshooting

### "Dockerfile not found"
If you see this error, ensure you are providing the `-f` flag with the correct path to a Dockerfile, or using `docker compose build` if a service is defined in a compose file.

### "No such file or directory" during build
Ensure you are running the `docker build` command from the root of the repository, as many Dockerfiles expect the root context to copy across shared libraries or configurations.
