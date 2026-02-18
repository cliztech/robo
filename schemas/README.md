# Frontend Data Contracts

This directory contains machine-validated contracts for core frontend entities:

- `track`
- `broadcast_queue_item`
- `schedule`
- `prompt_variable_config`
- `now_playing`

## Source of truth

All contracts are defined once in:

- `schemas/source/contracts_source.json`

Generated artifacts:

- JSON Schema files: `schemas/json/*.schema.json`
- TypeScript types: `schemas/types/entities.ts`

Regenerate after editing the source file:

```bash
python3 schemas/generate_contracts.py
```

## Schema versioning and compatibility policy

Every entity includes a required `schema_version` field.

Versioning follows semantic versioning and applies per-entity contract:

- **Patch (`x.y.Z`)**: Clarifications only (descriptions, examples, non-functional metadata). No shape changes.
- **Minor (`x.Y.z`)**: Backward-compatible additions (new optional fields, enum additions only where frontend treats unknown values safely).
- **Major (`X.y.z`)**: Breaking changes (renamed/removed fields, type changes, stricter required fields, incompatible enum narrowing).

Frontend compatibility requirements:

1. Frontends **must reject payloads** whose `schema_version` major version is unsupported.
2. Frontends **should ignore unknown optional fields** when the major version is supported.
3. Frontends **must validate** API payloads against the matching JSON Schema before use in critical UI flows.
4. Backend deployments must publish schema updates with release notes whenever `schema_version` changes.
