# Phase 2 - Authentication (Day 4)

## Goal

Implement secure sign-up/sign-in flows with protected routes and role-aware access.

## Scope

- Supabase Auth integration
- Session management in App Router
- Route protection via middleware
- Basic profile onboarding

## Implementation Steps

1. Add auth callback route.
2. Create login/signup/forgot-password pages.
3. Add middleware redirect logic for protected dashboard routes.
4. Create profile row on first login.
5. Add logout action and session refresh behavior.

## Security Notes

- Never expose service role key on client.
- Validate redirect URLs.
- Use HTTP-only cookies for session tokens where applicable.

## Validation

- User can sign up, verify email, and sign in.
- Unauthorized users are redirected from dashboard routes.
- Authorized users can only access owned station resources.

Last Updated: February 14, 2026
