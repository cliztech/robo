import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()
const cookiesMock = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}))

describe('src/lib/supabase/server', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_ANON_KEY

    createServerClientMock.mockReturnValue({ client: 'mock' })
  })

  it('throws deterministic error when canonical env vars and aliases are missing', async () => {
    const { createServerClient } = await import('../../src/lib/supabase/server')
    cookiesMock.mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
    })

    await expect(createServerClient()).rejects.toThrow(
      'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL. Deprecated fallback SUPABASE_URL is also unset.'
    )
  })

  it('falls back to deprecated aliases when canonical env vars are missing', async () => {
    process.env.SUPABASE_URL = 'https://alias.supabase.test'
    process.env.SUPABASE_ANON_KEY = 'alias-anon-key'

    const { createServerClient } = await import('../../src/lib/supabase/server')
    cookiesMock.mockResolvedValue({
      get: vi.fn(),
      set: vi.fn(),
    })

    await createServerClient()

    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://alias.supabase.test',
      'alias-anon-key',
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    )
  })

  it('cookie adapter get/set/remove paths do not throw when store set throws', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://canonical.supabase.test'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'canonical-anon-key'

    const failingCookieStore = {
      get: vi.fn(() => ({ value: 'cookie-value' })),
      set: vi.fn(() => {
        throw new Error('immutable cookies in server component')
      }),
    }

    cookiesMock.mockResolvedValue(failingCookieStore)

    const { createServerClient } = await import('../../src/lib/supabase/server')
    await createServerClient()

    const cookieAdapter = createServerClientMock.mock.calls[0][2].cookies

    expect(() => cookieAdapter.get('sb-access-token')).not.toThrow()
    expect(() => cookieAdapter.set('sb-access-token', 'new-token', { path: '/' })).not.toThrow()
    expect(() => cookieAdapter.remove('sb-refresh-token', { path: '/' })).not.toThrow()
    expect(cookieAdapter.get('sb-access-token')).toBe('cookie-value')
  })
})
