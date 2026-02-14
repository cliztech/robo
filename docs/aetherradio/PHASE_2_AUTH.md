# Phase 2 — Authentication (Day 4)

## Objectives

- Add secure user authentication flows
- Protect dashboard and station routes
- Ensure station ownership checks are enforced server-side

## Features

- Email/password signup and login
- Password reset flow
- Session-aware middleware guards
- Auth callback handling for OAuth providers (optional)

## Implementation Checklist

1. Configure Supabase Auth providers.
2. Add auth pages: login, signup, forgot-password.
3. Implement middleware redirect rules.
4. Attach user profile creation on first login.
5. Guard API routes with session validation.

## Validation

```bash
pnpm test tests/e2e/auth.spec.ts
pnpm lint
pnpm type-check
```

## Exit Criteria

- Unauthorized users cannot access dashboard routes
- Authenticated users retain sessions across navigation
- Password reset flow functions end-to-end
