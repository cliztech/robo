# API & Config Contract Versioning Policy

**Version:** 1.0
**Scope:** JSON config contracts and interface-facing API payloads

## Goals

- Keep contract changes explicit and auditable.
- Prevent accidental breaking changes.
- Provide a reproducible checklist for release gating.

## Version format

Use semantic contract versions: `MAJOR.MINOR.PATCH`.

- `MAJOR`: breaking changes to required fields, types, or semantics.
- `MINOR`: backward-compatible additions (new optional fields).
- `PATCH`: clarifications, typo fixes, non-behavioral schema metadata.

## Change classification

| Change type | Version bump | Requires migration notes | Requires rollback notes |
| --- | --- | --- | --- |
| Remove/rename field | MAJOR | Yes | Yes |
| Change field type | MAJOR | Yes | Yes |
| Add required field | MAJOR | Yes | Yes |
| Add optional field | MINOR | No | Recommended |
| Tighten validation bounds | MINOR (or MAJOR if incompatible) | Yes | Yes |
| Description/example update | PATCH | No | No |

## Breaking-change checklist (required for MAJOR changes)

- [ ] Change rationale documented.
- [ ] Affected files and contracts enumerated.
- [ ] Data migration/compatibility path documented.
- [ ] Rollback steps validated against previous contract version.
- [ ] Operator-facing impact noted in release notes.
- [ ] `PRE_RELEASE_CHECKLIST.md` gates rerun after changes.

## Required PR metadata

Every contract-impacting PR must include:

1. Contract version before/after.
2. Classification (`breaking`, `compatible-additive`, `non-functional`).
3. Validation commands executed.
4. Rollback plan summary.

## Enforcement points

- Reviewers reject contract changes with no version bump rationale.
- Release sign-off blocks MAJOR changes without completed breaking-change checklist.
