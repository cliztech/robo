# Phase 2 — Authentication (Day 4)

## Goals

- Add secure sign-up/sign-in and session handling
- Protect dashboard routes and APIs

## Features

- Email/password auth
- OAuth providers (optional)
- Password reset flow
- Auth callback route
- Middleware-based route protection

## Key Implementation Notes

- Use server-side Supabase clients in route handlers and server components.
- Keep session refresh centralized in middleware.
- Add guards for station resources to enforce ownership.

## Validation

```bash
pnpm test -- auth
pnpm test:e2e -- auth.spec.ts
```

## Exit Criteria

- Protected routes redirect when unauthenticated
- Authenticated users can access only their station data

_Last updated: 2026-02-14_
