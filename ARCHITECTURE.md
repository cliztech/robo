# Architecture

This document is the top-level architecture entry point for the repository.

## Related docs

- Product specs: `docs/product-specs/`
- Design docs: `docs/design-docs/`
- Execution plans: `docs/exec-plans/`
- Reliability and security: `docs/RELIABILITY.md`, `docs/SECURITY.md`
- Generated schema references: `docs/generated/db-schema.md`

## Agent deliverables coverage

To ensure repository agents produce and maintain the full expected output set, use this mapping when routing work:

- **Product code and tests**: `backend/`, `tests/` (when present)
- **CI configuration and release tooling**: CI/workflow and release files at repo root or `docs/operations/`
- **Internal developer tools**: utility scripts and automation helpers under `config/scripts/` and operational docs
- **Documentation and design history**: `docs/design-docs/`, `docs/product-specs/`, and top-level architecture docs
- **Evaluation harnesses**: validation and benchmark scripts/docs under `docs/` and related tooling locations
- **Review comments and responses**: PR/review artifacts and checklist usage from `AGENTS.md`
- **Scripts that manage the repository itself**: repository maintenance scripts and operational command playbooks
- **Production dashboard definition files**: dashboard and operations definitions tracked in docs/config as applicable
