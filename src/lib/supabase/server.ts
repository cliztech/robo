import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

let hasLoggedSupabaseAliasWarning = false

function resolveSupabaseEnv(canonicalKey: string, deprecatedAliasKey: string): string {
  const canonicalValue = process.env[canonicalKey]
  if (canonicalValue) {
    return canonicalValue
  }

  const aliasValue = process.env[deprecatedAliasKey]
  if (aliasValue) {
    if (!hasLoggedSupabaseAliasWarning) {
      console.warn(
        `[env-deprecation] ${deprecatedAliasKey} is deprecated; set ${canonicalKey} instead. Alias fallback support is temporary.`
      )
      hasLoggedSupabaseAliasWarning = true
    }
    return aliasValue
  }

  throw new Error(
    `Missing Supabase environment variable: ${canonicalKey}. Deprecated fallback ${deprecatedAliasKey} is also unset.`
  )
}

export function createServerClient() {
  const cookieStore = cookies() as any

  return _createServerClient(
    resolveSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'),
    resolveSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
