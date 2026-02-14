# Phase 0 — Environment Setup (Day 1)

## Goals

- Bootstrap local dev environment
- Ensure quality tooling and Supabase connectivity

## Tasks

1. Install Node.js 20 LTS + pnpm 8+
2. Clone repository and run `pnpm install`
3. Copy env template and configure keys
4. Start local Supabase or connect to cloud project
5. Run baseline checks

## Command Checklist

```bash
pnpm install
cp .env.example .env.local
pnpm supabase start
pnpm supabase db push
pnpm lint && pnpm type-check
pnpm dev
```

## Exit Criteria

- App loads at `http://localhost:3000`
- Supabase connection and auth client initialize without runtime errors
- Lint/type-check pass

_Last updated: 2026-02-14_
