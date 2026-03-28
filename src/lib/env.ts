const ENV = process.env;

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function requireEnv(name: string): string {
  const value = ENV[name];
  if (!isNonEmpty(value)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv(name: string, fallback: string): string {
  const value = ENV[name];
  return isNonEmpty(value) ? value : fallback;
}

export function getBooleanEnv(name: string, fallback = false): boolean {
  const value = ENV[name];
  if (!isNonEmpty(value)) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSY_VALUES.has(normalized)) return false;
  return fallback;
}

export function resolveAppEnvironment(): 'development' | 'test' | 'production' {
  const raw = getEnv('NODE_ENV', 'development').toLowerCase();
  if (raw === 'production' || raw === 'test') {
    return raw;
  }
  return 'development';
}
