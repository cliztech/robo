# Phase 1 - Database Architecture (Day 2-3)

## Goal

Implement multi-tenant PostgreSQL schema, RLS, and typed data access for stations, tracks, playlists, and analytics.

## Deliverables

- Initial SQL migration (`001_initial_schema.sql`)
- RLS policies for tenant isolation
- Supabase Storage buckets + policies
- Generated TypeScript DB types
- Seed script for local development

## Tasks

## 1) Create schema migration

Use `DATABASE_SCHEMA.md` as the canonical baseline.

```bash
pnpm supabase migration new initial_schema
# paste SQL into supabase/migrations/<timestamp>_initial_schema.sql
pnpm supabase db reset
```

## 2) Configure storage buckets

Create buckets:
- `track-audio` (private)
- `track-artwork` (private)
- `station-assets` (private/public by policy)

Define access pattern:
- Upload via signed URL or authenticated direct upload.
- Fetch via signed URLs for private audio.

## 3) Add RLS policies

Policy requirements:
- User must be organization member for all station-bound entities.
- Role checks:
  - `owner/admin`: full CRUD
  - `editor`: create/update content, no destructive org actions
  - `viewer`: read-only

## 4) Generate DB types

```bash
pnpm supabase gen types typescript --local > src/types/database.ts
```

## 5) Build data layer

Create query modules:
- `src/lib/db/stations.ts`
- `src/lib/db/tracks.ts`
- `src/lib/db/playlists.ts`
- `src/lib/db/analytics.ts`

Guidelines:
- Typed return values only.
- No raw SQL in UI components.
- Centralize pagination and filter params.

## 6) Seed local data

Create a deterministic seed for:
- 1 organization
- 1 station
- 30 sample tracks
- 2 playlists
- 7 days of fake listener metrics

## Verification

```bash
pnpm supabase db reset
pnpm supabase status
pnpm type-check
```

Manual checks:
- Non-member cannot read another org station.
- Member can CRUD based on role.
- Signed URLs expire and rotate correctly.

## Exit Criteria

- Schema is stable and versioned.
- Tenant isolation confirmed.
- Frontend can query all core entities.

Last Updated: February 14, 2026
