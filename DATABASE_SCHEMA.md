# AetherRadio — Database Schema

## Core Entities

## 1) `users`

- `id` UUID PK
- `email` text unique
- `display_name` text
- `created_at` timestamptz

## 2) `stations`

- `id` UUID PK
- `owner_id` UUID FK -> users.id
- `slug` text unique
- `name` text
- `description` text
- `is_live` boolean default false
- `created_at` timestamptz

## 3) `tracks`

- `id` UUID PK
- `station_id` UUID FK -> stations.id
- `storage_path` text
- `title`, `artist`, `album` text
- `duration_seconds` integer
- `bpm` integer nullable
- `energy` numeric(4,3) nullable
- `genre` text nullable
- `created_at` timestamptz

## 4) `playlists`

- `id` UUID PK
- `station_id` UUID FK -> stations.id
- `name` text
- `strategy` text (manual | ai_balanced | ai_energy_arc)
- `created_at` timestamptz

## 5) `playlist_items`

- `id` UUID PK
- `playlist_id` UUID FK -> playlists.id
- `track_id` UUID FK -> tracks.id
- `position` integer
- `crossfade_seconds` integer default 6

## 6) `broadcast_sessions`

- `id` UUID PK
- `station_id` UUID FK -> stations.id
- `started_at` timestamptz
- `ended_at` timestamptz nullable
- `encoder_profile` text

## 7) `track_plays`

- `id` UUID PK
- `session_id` UUID FK -> broadcast_sessions.id
- `track_id` UUID FK -> tracks.id
- `played_at` timestamptz
- `listener_peak` integer

## 8) `ai_decisions`

- `id` UUID PK
- `station_id` UUID FK -> stations.id
- `decision_type` text
- `input_payload` jsonb
- `output_payload` jsonb
- `confidence` numeric(4,3)
- `created_at` timestamptz

## RLS Guidance

- Users can only access rows where `owner_id = auth.uid()` or station membership exists.
- Service role bypasses RLS for server-side background jobs.

## Index Recommendations

- `tracks(station_id, created_at desc)`
- `playlist_items(playlist_id, position)`
- `track_plays(session_id, played_at)`
- `ai_decisions(station_id, created_at desc)`

_Last updated: 2026-02-14_
