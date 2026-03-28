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

type CookieStore = ReturnType<typeof cookies>

export async function createServerClient() {
  const cookieStore: Awaited<CookieStore> = await cookies()
const loggedSupabaseAliasWarnings = new Set<string>();

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
      );
      loggedSupabaseAliasWarnings.add(deprecatedAliasKey);
    }
    return aliasValue
  }

  throw new Error(
    `Missing Supabase environment variable: ${canonicalKey}. Deprecated fallback ${deprecatedAliasKey} is also unset.`
  )
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
  const cookieStore: RequestCookiesCompatible = await cookies()

  return _createServerClient(
    resolveSupabaseEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'),
    resolveSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'),
    {
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
