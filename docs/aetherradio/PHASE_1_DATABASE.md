# Phase 1 — Database Architecture (Day 2–3)

## Objectives

- Implement baseline relational schema
- Enforce tenant isolation via RLS
- Create query helpers for station, track, playlist data

## Implementation Steps

1. Create initial migration for core tables.
2. Add FK relationships and deletion strategy.
3. Add performance indexes for hot paths.
4. Enable and test RLS policies.
5. Generate typed DB definitions for TypeScript.

## Validation

```bash
pnpm supabase db push
pnpm supabase gen types typescript --local > src/types/database.ts
pnpm test tests/integration/database.test.ts
```

## Risks

- Overly strict RLS policies can block legitimate server flows.
- Missing indexes can degrade playback/analytics query latency.

## Exit Criteria

- Migrations apply cleanly
- CRUD operations succeed under policy constraints
- Type definitions are up to date
