# Phase 2 - Authentication (Day 4)

## Goal

Ship secure authentication and organization-aware authorization across dashboard and API routes.

## Deliverables

- Supabase Auth integrated in Next.js App Router
- Auth pages (login, signup, forgot password)
- Protected dashboard routes via middleware
- Session-aware server components
- Invite/member management scaffolding

## Auth Flow

1. User signs up or logs in.
2. Supabase issues session cookies.
3. Middleware blocks unauthenticated dashboard routes.
4. Server components resolve active organization membership.
5. APIs enforce membership and role checks.

## Implementation Steps

## 1) Supabase clients

Create:
- `src/lib/supabase/client.ts` (browser client)
- `src/lib/supabase/server.ts` (server client with cookies)

## 2) Auth route pages

Implement in `src/app/(auth)/`:
- `login/page.tsx`
- `signup/page.tsx`
- `forgot-password/page.tsx`

Requirements:
- React Hook Form + Zod validation.
- Helpful error and loading states.
- Redirect to `/dashboard` on success.

## 3) OAuth callback route

Implement `src/app/api/auth/callback/route.ts`:
- Exchange auth code for session.
- Redirect safely to allowed paths only.

## 4) Middleware protection

In `src/middleware.ts`:
- Protect `/(dashboard)` and station-scoped pages.
- Allow unauthenticated access to landing + auth routes.
- Redirect unauthenticated users to `/login`.

## 5) Authorization helper

Create reusable helper:
- `assertStationAccess(stationId, minimumRole)`

Used by all write APIs.

## 6) Profile bootstrap trigger

On first sign-in, create `profiles` row and default organization (optional onboarding toggle).

## Security Checklist

- CSRF-safe auth callback handling.
- No service role key in client bundle.
- Strict redirect whitelist.
- Rate limit sign-in attempts.
- Audit log auth-related events.

## Verification

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm test:e2e --grep auth
```

Manual checks:
- Signup, login, logout flows.
- Password reset email flow.
- Dashboard access denied when logged out.

## Exit Criteria

- All protected routes require session.
- APIs reject users without membership.
- Auth E2E tests pass.

Last Updated: February 14, 2026
