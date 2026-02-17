# Architecture

This document is the top-level architecture entry point for the repository.

## Agent delivery contract

Agents are expected to continuously produce and maintain the following artifact types:

- Product code and tests
- CI configuration and release tooling
- Internal developer tools
- Documentation and design history
- Evaluation harnesses
- Review comments and responses
- Scripts that manage the repository itself
- Production dashboard definition files

Use this quick map when placing artifacts:

- Product and runtime assets: `backend/`, `config/`, root launchers/binaries
- Documentation and design history: `docs/design-docs/`, `docs/product-specs/`, `docs/exec-plans/`
- Generated technical references and evaluation artifacts: `docs/generated/`, `docs/references/`
- Planning, quality, reliability, and security controls: `docs/PLANS.md`, `docs/QUALITY_SCORE.md`, `docs/RELIABILITY.md`, `docs/SECURITY.md`

## Related docs

- Product specs: `docs/product-specs/`
- Design docs: `docs/design-docs/`
- Execution plans: `docs/exec-plans/`
- Reliability and security: `docs/RELIABILITY.md`, `docs/SECURITY.md`
- Generated schema references: `docs/generated/db-schema.md`

## Agent deliverables

Agents operating in this repository are expected to produce and maintain the following artifact categories:
All repository agents are expected to produce and maintain the following artifact classes:
All agents should produce or maintain one or more of the following artifact types:
Agents working in this repository are expected to produce and maintain the
following artifact categories:
All implementation and planning agents should produce repository artifacts that support
delivery, operations, and traceability. Outputs should include:

- Product code and tests
- CI configuration and release tooling
- Internal developer tools
- Documentation and design history
- Evaluation harnesses
- Review comments and responses
- Scripts that manage the repository itself
- Production dashboard definition files

For operational rules and ownership expectations, see `AGENTS.md`.
5See `AGENTS.md` for the full stage-gated workflow, boundaries, and quality gates.
Reference: `AGENTS.md` → **Agent Output Requirements**.
