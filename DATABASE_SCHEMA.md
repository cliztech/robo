# AetherRadio - Database Schema

## Overview

AetherRadio uses **Supabase PostgreSQL** with Row Level Security (RLS) enabled on all tenant-scoped tables.

- **Tenant model**: One `organization` can own multiple `stations`.
- **Auth model**: Supabase Auth `auth.users` maps to `profiles`.
- **Storage model**: Audio files and artwork are in Supabase Storage and referenced by DB metadata.

## Extensions

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "pg_cron";
```

## Core Tables

## 1) profiles

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 2) organizations

```sql
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'free',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 3) organization_members

```sql
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);
```

## 4) stations

```sql
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  stream_url text,
  timezone text default 'UTC',
  is_live boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 5) tracks

```sql
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  title text not null,
  artist text,
  album text,
  genre text,
  duration_seconds integer not null,
  bpm numeric(6,2),
  musical_key text,
  energy_level numeric(3,2),
  mood text,
  audio_path text not null,
  artwork_path text,
  loudness_lufs numeric(6,2),
  sample_rate integer,
  bit_rate integer,
  status text default 'ready' check (status in ('processing','ready','failed','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 6) playlists

```sql
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  type text not null default 'manual' check (type in ('manual','ai_generated','scheduled')),
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 7) playlist_items

```sql
create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  sort_order integer not null,
  transition_type text default 'cut' check (transition_type in ('cut','fade','beatmatch')),
  crossfade_seconds numeric(4,1) default 4.0,
  created_at timestamptz default now(),
  unique (playlist_id, sort_order)
);
```

## 8) schedule_rules

```sql
create table if not exists public.schedule_rules (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  timezone text not null default 'UTC',
  start_time time not null,
  end_time time not null,
  days_of_week int[] not null,
  source_playlist_id uuid references public.playlists(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 9) play_history

```sql
create table if not exists public.play_history (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  track_id uuid not null references public.tracks(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  transition_from_track_id uuid references public.tracks(id),
  listener_count integer default 0,
  skipped boolean default false,
  created_at timestamptz default now()
);
```

## 10) ai_decisions

```sql
create table if not exists public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  decision_type text not null check (decision_type in ('track_select','ordering','genre_balance','energy_curve')),
  input_payload jsonb not null,
  output_payload jsonb not null,
  confidence numeric(4,3),
  model text,
  latency_ms integer,
  created_at timestamptz default now()
);
```

## 11) listener_metrics

```sql
create table if not exists public.listener_metrics (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  bucket_start timestamptz not null,
  bucket_granularity text not null check (bucket_granularity in ('minute','hour','day')),
  unique_listeners integer default 0,
  avg_listen_seconds integer default 0,
  peak_concurrency integer default 0,
  created_at timestamptz default now(),
  unique (station_id, bucket_start, bucket_granularity)
);
```

## Indexes

```sql
create index if not exists idx_tracks_station_id on public.tracks(station_id);
create index if not exists idx_tracks_status on public.tracks(status);
create index if not exists idx_play_history_station_started on public.play_history(station_id, started_at desc);
create index if not exists idx_ai_decisions_station_created on public.ai_decisions(station_id, created_at desc);
create index if not exists idx_listener_metrics_station_bucket on public.listener_metrics(station_id, bucket_start desc);
create index if not exists idx_schedule_rules_station_active on public.schedule_rules(station_id, is_active);
```

## RLS Policies (Pattern)

Enable RLS on all tenant tables and authorize via `organization_members`.

```sql
alter table public.stations enable row level security;

create policy "members can read stations"
on public.stations for select
using (
  exists (
    select 1
    from public.organization_members m
    where m.organization_id = stations.organization_id
      and m.user_id = auth.uid()
  )
);
```

Replicate the same membership check for `tracks`, `playlists`, `playlist_items`, `schedule_rules`, `play_history`, `ai_decisions`, and `listener_metrics`.

## Migration Strategy

1. Create baseline migration: `001_initial_schema.sql`.
2. Add follow-up migrations for schema changes (`002_add_x.sql`, etc.).
3. Never edit applied migrations in shared environments.
4. Use idempotent statements (`if not exists`) for safer local iteration.

Last Updated: February 14, 2026
