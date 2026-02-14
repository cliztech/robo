# Phase 1 - Database Architecture (Day 2-3)

## Goal

Implement core schema, RLS, and data access patterns for stations, tracks, and playback.

## Deliverables

- Initial SQL migration
- Seed script for local development
- Query helpers and typed model bindings

## Tasks

1. Create base tables: `profiles`, `stations`, `tracks`, `playlists`, `playlist_items`, `play_events`, `ai_decisions`.
2. Add foreign keys and cascade behavior where appropriate.
3. Add indexes for high-frequency queries.
4. Enable and test RLS policies.
5. Add generated TypeScript types.

## Validation Queries

```sql
select count(*) from stations;
select count(*) from tracks;
explain analyze select * from play_events where station_id = '00000000-0000-0000-0000-000000000000' order by started_at desc limit 20;
```

## Exit Criteria

- Migration succeeds on a clean database.
- RLS blocks unauthorized reads/writes.
- Top dashboard queries are indexed and performant.

Last Updated: February 14, 2026
