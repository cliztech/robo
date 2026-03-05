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

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: buildSupabaseCookieAdapter(cookieStore),
    }
  );
}
