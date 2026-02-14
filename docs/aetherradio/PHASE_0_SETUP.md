# Phase 0 — Environment Setup (Day 1)

## Objectives

- Bootstrap a clean Next.js 14 + TypeScript project
- Configure linting, formatting, and test tooling
- Prepare local Supabase and environment variables

## Tasks

1. Initialize app and install dependencies.
2. Configure Tailwind and Shadcn/UI baseline.
3. Add Supabase client/server helpers.
4. Add CI checks: lint, typecheck, unit tests.
5. Validate local run + baseline tests.

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm type-check
pnpm test
pnpm supabase start
```

## `.env.local` Checklist

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Exit Criteria

- App loads locally
- CI passes locally (lint/typecheck/test)
- Supabase local stack healthy
