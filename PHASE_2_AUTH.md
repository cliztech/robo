# Phase 2: Authentication System Implementation

**Timeline**: Day 4-5  
**Goal**: Implement secure authentication flows with Supabase Auth and protected routes

## Prerequisites

- [ ] Phase 0 setup completed
- [ ] Phase 1 database setup completed
- [ ] Supabase project configured
- [ ] Auth providers enabled in Supabase dashboard
- [ ] Environment variables set in `.env.local`

## Step 1: Install Auth Dependencies

```bash
pnpm add @supabase/auth-helpers-nextjs @supabase/supabase-js
```

## Step 2: Create Supabase Auth Clients

Create `src/lib/supabase/client.ts`:

```ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export function createClient() {
  return createClientComponentClient<Database>()
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}
```

## Step 3: Add Auth Middleware

Create `src/middleware.ts`:

```ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/station', '/upload', '/settings']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isProtectedPath = PROTECTED_PATHS.some((path) => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/'))

  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/station/:path*', '/upload/:path*', '/settings/:path*', '/login'],
}
```

## Step 4: Create Auth Actions

Create `src/app/(auth)/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const supabase = createServerClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

## Step 5: Build Auth Pages

Create routes:

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`

Include:

- Email/password forms with validation
- Clear error and success states
- Links between auth pages
- Redirect handling after login

## Step 6: Add OAuth Providers

In login page, add OAuth buttons:

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
})
```

Create callback route: `src/app/auth/callback/route.ts`.

## Step 7: Implement Session-aware Layout

Create protected layout: `src/app/(protected)/layout.tsx`.

Requirements:

- Fetch current user via server client
- Redirect unauthenticated users to `/login`
- Provide user context to child components

## Step 8: Create User Profile Bootstrap

On first successful login, insert/update `profiles` row:

- `id` = `auth.users.id`
- `email`
- `display_name` (default from email prefix)
- `created_at` and `updated_at`

## Step 9: Add Route Guards for APIs

For protected API routes:

- Read session using server client
- Return `401` for missing session
- Return `403` for ownership violations

## Step 10: Verification

Run:

```bash
pnpm dev
pnpm type-check
pnpm lint
```

Manual checks:

- [ ] Register works and sends confirmation email
- [ ] Login works with valid credentials
- [ ] Invalid login shows helpful error
- [ ] Protected routes redirect unauthenticated users
- [ ] Sign out clears session and redirects
- [ ] OAuth login succeeds (if configured)

## Troubleshooting

### Issue: `Auth session missing`

**Solution:** Ensure middleware matcher includes all protected routes and callback route behavior is correct.

### Issue: OAuth redirect mismatch

**Solution:** Add exact callback URL in provider settings and Supabase Auth URL configuration.

### Issue: User can access protected page after logout

**Solution:** Clear cookies/session and avoid stale client-side caches.

## Next Steps

Proceed to `PHASE_3_AUDIO_ENGINE.md` for FFmpeg processing and audio pipeline implementation.

**Estimated Time:** 4-6 hours  
**Last Updated:** February 14, 2026
