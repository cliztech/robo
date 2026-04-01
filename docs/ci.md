# CI/CD Pipeline Guide

## 🚀 Overview

The DGN-DJ Studio project uses a multi-stage GitHub Actions pipeline to ensure code quality, backend stability, and frontend performance.

The pipeline is located at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## 🏗️ Pipeline Stages

1. **Backend**: Python Lint (Ruff) + Tests (Pytest)
2. **Frontend Build**: Next.js compilation + dependency caching
3. **Parallel Testing**: Frontend Vitest suite split into 4 parallel shards for < 5 min execution
4. **Burn-in Loop**: Flaky test detection (runs 3 iterations on every Pull Request)
5. **Config Validation**: JSON schema checks + documentation consistency
6. **Security Audit**: Dependency vulnerability scan + secret leak detection

## 🔍 Sharding & Parallelism

Tests are sharded across 4 parallel jobs to maintain developer productivity as the test suite grows.

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
```

## 🔥 Burn-in Loops (Flaky Test Detection)

On every Pull Request, the CI executes a "burn-in" stage where the test suite is run multiple times. If a test passes once but fails another time (flakiness), the pipeline will fail.

> [!IMPORTANT]
> A single failure in the burn-in loop requires investigation before merging.

## 📦 Artifacts

If a test fails, the CI uploads debugging artifacts:

- **Coverage reports** (HTML)
- **Failure snapshots** (where applicable)
- **Security scan reports**

To access these, go to the **Actions** tab in GitHub and select the failed run.

## 🛠️ Maintenance

To add a new shard, simply update the `shard` matrix in `ci.yml`.
To adjust burn-in iterations, update the `for i in {1..N}` loop in the `burn-in` job.
