# Phase 1 — Database Architecture (Day 2–3)

## Goals

- Implement core schema + RLS
- Seed minimal reference/test data

## Implementation Steps

1. Create initial migration for users, stations, tracks, playlists, analytics tables.
2. Add foreign keys and cascade rules where appropriate.
3. Add RLS policies for ownership-based isolation.
4. Add indexes for read-heavy paths.
5. Add SQL seed script for one sample station + tracks.

## Validation

```bash
pnpm supabase db reset
pnpm supabase db lint
pnpm test -- database
```

## Deliverables

- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`
- Database policy documentation in `/docs/architecture`

_Last updated: 2026-02-14_
