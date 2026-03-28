import { describe, expect, it, beforeEach } from 'vitest';
import { EnvValidationError, loadEnv, resetEnvForTests } from '@/lib/env';

describe('env loader', () => {
  beforeEach(() => {
    resetEnvForTests();
  });

  it('throws structured errors when required Supabase variables are missing', () => {
    expect(() =>
      loadEnv({
        DASHBOARD_STATUS_BACKEND_URL: 'http://127.0.0.1:5000',
      }),
    ).toThrow(EnvValidationError);

    try {
      loadEnv({ DASHBOARD_STATUS_BACKEND_URL: 'http://127.0.0.1:5000' });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const envError = error as EnvValidationError;
      expect(envError.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'ENV_MISSING',
            variable: 'NEXT_PUBLIC_SUPABASE_URL',
            remediation: expect.stringContaining('.env.local'),
          }),
          expect.objectContaining({
            code: 'ENV_MISSING',
            variable: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            remediation: expect.stringContaining('.env.local'),
          }),
        ]),
      );
    }
  });

  it('throws a structured invalid-url error when backend URL override is malformed', () => {
    expect(() =>
      loadEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project-ref.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        DASHBOARD_STATUS_BACKEND_URL: 'not-a-url',
      }),
    ).toThrow(EnvValidationError);

    try {
      loadEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project-ref.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        DASHBOARD_STATUS_BACKEND_URL: 'not-a-url',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const envError = error as EnvValidationError;
      expect(envError.issues).toContainEqual(
        expect.objectContaining({
          code: 'ENV_INVALID',
          variable: 'DASHBOARD_STATUS_BACKEND_URL',
          remediation: expect.stringContaining('INTERNAL_API_BASE_URL'),
        }),
      );
    }
  });

  it('returns validated values and canonicalized URLs for success paths', () => {
    const env = loadEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project-ref.supabase.co/',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      INTERNAL_API_BASE_URL: 'http://backend.internal:5000/',
    });

    expect(env).toEqual({
      supabaseUrl: 'https://project-ref.supabase.co',
      supabaseAnonKey: 'anon-key',
      dashboardStatusBackendUrl: 'http://backend.internal:5000',
    });
  });

  it('uses a validated default backend URL when no override is provided', () => {
    const env = loadEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://project-ref.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });

    expect(env.dashboardStatusBackendUrl).toBe('http://127.0.0.1:5000');
  });
});
