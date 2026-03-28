import { describe, expect, it } from 'vitest';

import { validateServerRuntimeEnv } from '@/lib/runtime/envContract';

describe('validateServerRuntimeEnv', () => {
  it('passes for ci context with required vars present', () => {
    const diagnostics = validateServerRuntimeEnv({
      ROBODJ_RUNTIME_CONTEXT: 'ci',
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      DASHBOARD_STATUS_BACKEND_URL: 'http://dashboard.internal',
    });

    expect(diagnostics).toEqual({
      ok: true,
      runtime_context: 'ci',
      invalid_context: false,
      missing_keys: [],
    });
  });

  it('fails with missing keys for docker_stack context', () => {
    const diagnostics = validateServerRuntimeEnv({
      ROBODJ_RUNTIME_CONTEXT: 'docker_stack',
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    });

    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.runtime_context).toBe('docker_stack');
    expect(diagnostics.missing_keys).toEqual(['INTERNAL_API_BASE_URL']);
  });

  it('fails for invalid runtime context', () => {
    const diagnostics = validateServerRuntimeEnv({
      ROBODJ_RUNTIME_CONTEXT: 'invalid-context',
    });

    expect(diagnostics.ok).toBe(false);
    expect(diagnostics.invalid_context).toBe(true);
    expect(diagnostics.missing_keys).toEqual(['ROBODJ_RUNTIME_CONTEXT']);
  });
});
