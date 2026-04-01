import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type NextCookieStore = Awaited<ReturnType<typeof cookies>>;

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
  set?: (options: { name: string; value: string } & Partial<CookieOptions>) => void;
};

export interface SupabaseCookieAdapter {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}

export function buildSupabaseCookieAdapter(cookieStore: CookieStoreLike): SupabaseCookieAdapter {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set?.({ name, value, ...options });
      } catch {
        // Ignore immutable cookie store in Server Components.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set?.({ name, value: '', ...options });
      } catch {
        // Ignore immutable cookie store in Server Components.
      }
    },
  };
}

export async function createServerClient() {
  const cookieStore: NextCookieStore = await cookies();
import { loadEnv } from '@/lib/env';

const SUPABASE_URL_ENV = 'NEXT_PUBLIC_SUPABASE_URL'
const SUPABASE_ANON_KEY_ENV = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
const SUPABASE_URL_ALIAS_ENV = 'SUPABASE_URL'
const SUPABASE_ANON_KEY_ALIAS_ENV = 'SUPABASE_ANON_KEY'

const loggedSupabaseAliasWarnings = new Set<string>()

type NextCookieStore = Awaited<ReturnType<typeof cookies>>

type SupabaseCookieAdapter = {
  get(name: string): string | undefined
  set(name: string, value: string, options: CookieOptions): void
  remove(name: string, options: CookieOptions): void
}

function resolveSupabaseEnv(canonicalKey: string, deprecatedAliasKey: string): string {
  const canonicalValue = process.env[canonicalKey]
  if (canonicalValue) {
    return canonicalValue
  }

  const aliasValue = process.env[deprecatedAliasKey]
  if (aliasValue) {
    if (!loggedSupabaseAliasWarnings.has(deprecatedAliasKey)) {
      console.warn(
        `[env-deprecation] ${deprecatedAliasKey} is deprecated; set ${canonicalKey} instead. Alias fallback support is temporary.`
      )
      loggedSupabaseAliasWarnings.add(deprecatedAliasKey)
    }

    return aliasValue
  }

  throw new Error(
    `Missing Supabase environment variable: ${canonicalKey}. Deprecated fallback ${deprecatedAliasKey} is also unset.`
  )
}

function createCookieAdapter(cookieStore: NextCookieStore): SupabaseCookieAdapter {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch {
        // Called from a Server Component where response headers are immutable.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: '', ...options })
      } catch {
        // Called from a Server Component where response headers are immutable.
      }
    },
  }
export function createServerClient() {
  const cookieStore = cookies() as any;
  const env = loadEnv();

  return _createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
  const cookieStore = cookies() as any
interface RequestCookieValue {
  value: string
}

interface RequestCookiesCompatible {
  get(name: string): RequestCookieValue | undefined
  set?: (cookie: { name: string; value: string } & Partial<CookieOptions>) => void
}

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    resolveSupabaseEnv(SUPABASE_URL_ENV, SUPABASE_URL_ALIAS_ENV),
    resolveSupabaseEnv(SUPABASE_ANON_KEY_ENV, SUPABASE_ANON_KEY_ALIAS_ENV),
    {
      cookies: createCookieAdapter(cookieStore),
    }
  )
      cookies: buildSupabaseCookieAdapter(cookieStore),
    }
  );
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
            cookieStore.set?.({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if middleware refreshes user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set?.({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if middleware refreshes user sessions.
          }
        },
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
