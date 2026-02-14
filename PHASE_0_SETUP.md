# Phase 0 - Environment Setup (Day 1)

## Goal

Boot a working local dev environment with app runtime, database, and quality checks.

## Checklist

1. Install dependencies.
2. Configure environment variables.
3. Start local Supabase.
4. Apply migrations.
5. Run app and smoke tests.

## Steps

```bash
pnpm install
cp .env.example .env.local
pnpm supabase start
pnpm supabase db reset
pnpm dev
```

## Required `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Validation

```bash
pnpm lint
pnpm type-check
pnpm test
```

## Exit Criteria

- App loads on `http://localhost:3000`
- Auth flow can render pages
- Database connection succeeds from API route

Last Updated: February 14, 2026
