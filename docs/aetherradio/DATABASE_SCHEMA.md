# AetherRadio — Database Schema

## Goals

- Multi-tenant station isolation
- Track metadata + analysis fields
- Playlist history and scheduling
- Listener/usage analytics

## Core Tables

### `profiles`

- `id uuid primary key` (matches auth user id)
- `email text not null`
- `display_name text`
- `created_at timestamptz default now()`

### `stations`

- `id uuid primary key default gen_random_uuid()`
- `owner_id uuid references profiles(id)`
- `name text not null`
- `slug text unique not null`
- `timezone text not null default 'UTC'`
- `created_at timestamptz default now()`

### `tracks`

- `id uuid primary key default gen_random_uuid()`
- `station_id uuid references stations(id) on delete cascade`
- `title text not null`
- `artist text`
- `album text`
- `duration_seconds integer`
- `storage_path text not null`
- `bpm numeric(6,2)`
- `energy numeric(4,3)`
- `loudness_lufs numeric(6,2)`
- `ai_tags jsonb default '{}'::jsonb`
- `created_at timestamptz default now()`

### `playlists`

- `id uuid primary key default gen_random_uuid()`
- `station_id uuid references stations(id) on delete cascade`
- `name text not null`
- `source text not null` -- manual | ai | schedule
- `created_by uuid references profiles(id)`
- `created_at timestamptz default now()`

### `playlist_items`

- `id uuid primary key default gen_random_uuid()`
- `playlist_id uuid references playlists(id) on delete cascade`
- `track_id uuid references tracks(id) on delete cascade`
- `position integer not null`
- `crossfade_seconds numeric(5,2) default 6`

### `playback_events`

- `id bigserial primary key`
- `station_id uuid references stations(id) on delete cascade`
- `track_id uuid references tracks(id)`
- `started_at timestamptz not null`
- `ended_at timestamptz`
- `listeners_peak integer default 0`
- `source text not null` -- auto | live_dj | fallback

### `ai_decisions`

- `id bigserial primary key`
- `station_id uuid references stations(id) on delete cascade`
- `decision_type text not null`
- `input jsonb not null`
- `output jsonb not null`
- `confidence numeric(4,3)`
- `created_at timestamptz default now()`

## Indexes

- `tracks(station_id, created_at desc)`
- `playback_events(station_id, started_at desc)`
- `playlist_items(playlist_id, position)` unique
- `stations(slug)` unique

## RLS Strategy

- Enable RLS on all station-bound tables
- Policies scoped by `station.owner_id = auth.uid()`
- Service-role key only used in trusted server handlers

## Migration Notes

- Include extension setup (`pgcrypto`, `uuid-ossp` as needed)
- Backfill nullable fields before adding `not null`
- Version every migration with reversible steps where practical
