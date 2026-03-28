import { describe, expect, it } from 'vitest';
import { getBooleanEnv, getEnv, requireEnv, resolveAppEnvironment } from '@/lib/env';

describe('env utilities', () => {
  it('requireEnv throws on missing key', () => {
    const previous = process.env.TEST_REQUIRED_ENV;
    delete process.env.TEST_REQUIRED_ENV;

    expect(() => requireEnv('TEST_REQUIRED_ENV')).toThrow('Missing required environment variable: TEST_REQUIRED_ENV');

    process.env.TEST_REQUIRED_ENV = previous;
  });

  it('getEnv uses fallback for empty values', () => {
    const previous = process.env.TEST_FALLBACK_ENV;
    process.env.TEST_FALLBACK_ENV = '   ';

    expect(getEnv('TEST_FALLBACK_ENV', 'fallback-value')).toBe('fallback-value');

    process.env.TEST_FALLBACK_ENV = previous;
  });

  it('getBooleanEnv parses common true/false values', () => {
    const previous = process.env.TEST_BOOLEAN_ENV;

    process.env.TEST_BOOLEAN_ENV = 'yes';
    expect(getBooleanEnv('TEST_BOOLEAN_ENV', false)).toBe(true);

    process.env.TEST_BOOLEAN_ENV = '0';
    expect(getBooleanEnv('TEST_BOOLEAN_ENV', true)).toBe(false);

    process.env.TEST_BOOLEAN_ENV = 'unexpected';
    expect(getBooleanEnv('TEST_BOOLEAN_ENV', true)).toBe(true);

    process.env.TEST_BOOLEAN_ENV = previous;
  });

  it('resolveAppEnvironment normalizes invalid values to development', () => {
    const previous = process.env.NODE_ENV;

    process.env.NODE_ENV = 'production';
    expect(resolveAppEnvironment()).toBe('production');

    process.env.NODE_ENV = 'staging';
    expect(resolveAppEnvironment()).toBe('development');

    process.env.NODE_ENV = previous;
  });
});
