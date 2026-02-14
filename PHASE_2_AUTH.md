# Phase 2: Authentication & Session Management

**Timeline**: Day 4-5  
**Goal**: Implement secure authentication, protected routing, and first-login profile provisioning

## Prerequisites

Before starting, verify:

- [ ] Phase 0 and Phase 1 are complete
- [ ] Supabase project credentials are configured in `.env.local`
- [ ] `profiles` and `stations` tables exist with RLS enabled
- [ ] App runs locally with `pnpm dev`

## Step 1: Confirm Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Implement Supabase Client Helpers

Create client helper: `src/lib/supabase/client.ts`

```ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export function createClient() {
  return createClientComponentClient<Database>()
}
```

Create server helper: `src/lib/supabase/server.ts`

```ts
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}
```

## Step 3: Build Auth Callback Route

Create `src/app/auth/callback/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
```

## Step 4: Create Login and Signup Pages

Create:

- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`

Minimum requirements:

- Email/password sign up
- Email/password sign in
- Optional Google/GitHub OAuth buttons
- Loading state and error handling
- Links between login and signup

## Step 5: Add Session Gate Utility

Create `src/lib/auth/require-user.ts`:

```ts
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}
```

Use this in server pages/actions that require auth.

## Step 6: Protect Routes with Middleware

Create `src/middleware.ts`:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/stations', '/library', '/billing']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (!isProtected) {
    return NextResponse.next()
  }

  // Keep this aligned with your auth helper/session cookie configuration.
  const hasAuthCookie =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-access-token.0') ||
    request.cookies.has('supabase-auth-token')

  if (!hasAuthCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/stations/:path*', '/library/:path*', '/billing/:path*'],
}
```

## Step 7: Add First-Login Profile Bootstrap

Create `src/lib/auth/ensure-profile.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'

export async function ensureProfile(userId: string, email?: string | null) {
  const supabase = createServerClient()

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return

  const fallbackName = email?.split('@')[0] ?? 'New User'
  const { error: insertError } = await supabase.from('profiles').insert({
    id: userId,
    display_name: fallbackName,
  })

  if (insertError) throw insertError
}
```

Call this once after successful sign-in/callback.

## Step 8: Add Logout Endpoint/Action

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
```

## Step 9: Configure Auth Providers in Supabase

Go to **Authentication → Providers**:

- Enable **Email**
- Enable **Google** (optional)
- Enable **GitHub** (optional)

Set redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://your-domain.com/auth/callback`

## Step 10: Verify Authentication Flow

Run:

```bash
pnpm dev
pnpm type-check
pnpm lint
```

Manual verification checklist:

- [ ] New user can sign up
- [ ] Existing user can sign in
- [ ] Callback route exchanges session code
- [ ] Protected pages redirect unauthenticated users
- [ ] Logout clears auth state
- [ ] Profile row is created on first login

## Troubleshooting

### Issue: OAuth error `redirect_uri_mismatch`

**Fix:** Ensure provider redirect URL exactly matches `/auth/callback` for local and production domains.

### Issue: Infinite redirects on protected pages

**Fix:** Verify protected matcher excludes public routes and that expected auth cookies are present.

### Issue: `getUser()` returns null after login

**Fix:** Confirm callback exchange runs, cookies are persisted, and auth helper packages are version-compatible.

## Exit Criteria

Before moving to Phase 3:

- [ ] Auth providers configured
- [ ] Login/signup/callback work end-to-end
- [ ] Protected routes enforce authentication
- [ ] First-login profile bootstrap implemented

## Next Step

Proceed to **PHASE_3_AUDIO_ENGINE.md**.
