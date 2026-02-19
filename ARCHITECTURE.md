# Architecture

This document is the top-level architecture entry point for the repository.

## Documentation map

```text
AGENTS.md
ARCHITECTURE.md
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   └── ...
├── exec-plans/
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
├── product-specs/
│   ├── index.md
│   ├── new-user-onboarding.md
│   └── ...
├── references/
│   ├── design-system-reference-llms.txt
│   ├── nixpacks-llms.txt
│   ├── uv-llms.txt
│   └── ...
├── DESIGN.md
├── FRONTEND.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md
├── RELIABILITY.md
└── SECURITY.md
```

## Agent output contract

All agents should produce and maintain the following deliverables:
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

All agents operating in this repository are expected to produce and maintain artifacts across the full delivery lifecycle:
## Agent deliverable baseline

All agent execution in this repository must produce artifacts that can be reviewed, operated, and audited. The baseline deliverables are:
n## Agent deliverables coverage

To ensure repository agents produce and maintain the full expected output set, use this mapping when routing work:

- **Product code and tests**: `backend/`, `tests/` (when present)
- **CI configuration and release tooling**: CI/workflow and release files at repo root or `docs/operations/`
- **Internal developer tools**: utility scripts and automation helpers under `config/scripts/` and operational docs
- **Documentation and design history**: `docs/design-docs/`, `docs/product-specs/`, and top-level architecture docs
- **Evaluation harnesses**: validation and benchmark scripts/docs under `docs/` and related tooling locations
- **Review comments and responses**: PR/review artifacts and checklist usage from `AGENTS.md`
- **Scripts that manage the repository itself**: repository maintenance scripts and operational command playbooks
- **Production dashboard definition files**: dashboard and operations definitions tracked in docs/config as applicable
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

For operating constraints and ownership rules, refer to `AGENTS.md`.
For operational rules and ownership expectations, see `AGENTS.md`.
5See `AGENTS.md` for the full stage-gated workflow, boundaries, and quality gates.
Reference: `AGENTS.md` → **Agent Output Requirements**.
