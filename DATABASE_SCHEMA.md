# AetherRadio - Database Schema

## Overview

AetherRadio uses Supabase PostgreSQL with Row Level Security (RLS). All primary records are UUID keyed and scoped by organization/station ownership.

## Core Tables

## 1) `profiles`

Stores app user profile metadata.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References `auth.users.id` |
| display_name | text | Nullable |
| avatar_url | text | Nullable |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

## 2) `stations`

Represents a radio station instance.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK | `profiles.id` |
| slug | text UNIQUE | Public URL identifier |
| name | text | |
| description | text | Nullable |
| stream_url | text | Nullable |
| timezone | text | Default `UTC` |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

## 3) `tracks`

Media library records.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| station_id | uuid FK | `stations.id` |
| title | text | |
| artist | text | |
| album | text | Nullable |
| duration_seconds | integer | |
| bpm | integer | Nullable |
| musical_key | text | Nullable |
| energy | numeric(4,3) | 0.000-1.000 |
| mood_tags | text[] | Nullable |
| storage_path | text | Supabase bucket path |
| artwork_path | text | Nullable |
| created_at | timestamptz | Default `now()` |

## 4) `playlists`

Logical playlists and rotation groups.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| station_id | uuid FK | `stations.id` |
| name | text | |
| strategy | text | e.g., `ai`, `clockwheel`, `manual` |
| is_active | boolean | Default `true` |
| created_at | timestamptz | Default `now()` |

## 5) `playlist_items`

Ordered members of playlists.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| playlist_id | uuid FK | `playlists.id` |
| track_id | uuid FK | `tracks.id` |
| position | integer | Indexed |
| weight | integer | Rotation weight |
| created_at | timestamptz | Default `now()` |

## 6) `play_events`

Historical and live event log.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| station_id | uuid FK | `stations.id` |
| track_id | uuid FK | `tracks.id` |
| started_at | timestamptz | |
| ended_at | timestamptz | Nullable |
| listener_count | integer | Snapshot metric |
| source | text | `automation`, `live_dj`, `manual` |

## 7) `ai_decisions`

Tracks model reasoning for observability.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| station_id | uuid FK | `stations.id` |
| decision_type | text | `next_track`, `playlist_build`, etc. |
| input_payload | jsonb | |
| output_payload | jsonb | |
| confidence | numeric(4,3) | |
| created_at | timestamptz | Default `now()` |

## Indexing Recommendations

- `tracks(station_id, created_at desc)`
- `playlist_items(playlist_id, position)`
- `play_events(station_id, started_at desc)`
- `ai_decisions(station_id, created_at desc)`

## RLS Policy Pattern

- Users can only access rows where `station.owner_id = auth.uid()`.
- Service role bypasses RLS for background ingestion jobs.

## Migration Strategy

1. Create baseline schema in `supabase/migrations/001_initial_schema.sql`.
2. Add incremental migrations for new features.
3. Never rewrite old migrations in shared environments.

Last Updated: February 14, 2026
