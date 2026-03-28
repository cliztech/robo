import { buildSupabaseCookieAdapter } from '@/lib/supabase/server';

describe('buildSupabaseCookieAdapter', () => {
  it('returns undefined for missing cookies', () => {
    const adapter = buildSupabaseCookieAdapter({
      get: () => undefined,
      set: () => undefined,
    });

    expect(adapter.get('missing')).toBeUndefined();
  });

  it('swallows immutable cookie store write errors', () => {
    const adapter = buildSupabaseCookieAdapter({
      get: () => ({ value: 'value' }),
      set: () => {
        throw new Error('immutable');
      },
    });

    expect(() => adapter.set('session', 'abc', { path: '/' })).not.toThrow();
    expect(() => adapter.remove('session', { path: '/' })).not.toThrow();
  });
});
