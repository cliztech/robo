const DEFAULT_DASHBOARD_STATUS_BACKEND_URL = 'http://127.0.0.1:5000';

type EnvCode = 'ENV_MISSING' | 'ENV_INVALID';

type EnvIssue = {
  code: EnvCode;
  variable: string;
  reason: string;
  remediation: string;
};

export class EnvValidationError extends Error {
  readonly issues: EnvIssue[];

  constructor(issues: EnvIssue[]) {
    super(
      `Environment validation failed for ${issues.map((issue) => issue.variable).join(', ')}.`,
    );
    this.name = 'EnvValidationError';
    this.issues = issues;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      issues: this.issues,
    };
  }
}

export type AppEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  dashboardStatusBackendUrl: string;
};

function parseRequiredString(
  input: string | undefined,
  variable: string,
  remediation: string,
): string | EnvIssue {
  if (!input || input.trim().length === 0) {
    return {
      code: 'ENV_MISSING',
      variable,
      reason: 'Value is not set or empty.',
      remediation,
    };
  }

  return input.trim();
}

function parseUrl(
  input: string,
  variable: string,
  remediation: string,
): string | EnvIssue {
  try {
    const parsed = new URL(input);
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return {
      code: 'ENV_INVALID',
      variable,
      reason: `Value must be a valid absolute URL, received: ${input}`,
      remediation,
    };
  }
}

let cachedEnv: AppEnv | null = null;

export function resetEnvForTests(): void {
  cachedEnv = null;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const isDefaultEnv = env === process.env;
  if (isDefaultEnv && cachedEnv) {
    return cachedEnv;
  }

  const issues: EnvIssue[] = [];

  const supabaseUrlRaw = parseRequiredString(
    env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL',
    'Set NEXT_PUBLIC_SUPABASE_URL in your environment (e.g. .env.local) to your Supabase project URL.',
  );

  const supabaseAnonKey = parseRequiredString(
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'Set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (e.g. .env.local) to your Supabase anon key.',
  );

  const backendOverride = env.DASHBOARD_STATUS_BACKEND_URL ?? env.INTERNAL_API_BASE_URL;
  const backendVariable = env.DASHBOARD_STATUS_BACKEND_URL
    ? 'DASHBOARD_STATUS_BACKEND_URL'
    : env.INTERNAL_API_BASE_URL
      ? 'INTERNAL_API_BASE_URL'
      : 'DEFAULT_DASHBOARD_STATUS_BACKEND_URL';
  const backendUrlRaw = (backendOverride ?? DEFAULT_DASHBOARD_STATUS_BACKEND_URL).trim();

  const supabaseUrl =
    typeof supabaseUrlRaw === 'string'
      ? parseUrl(
          supabaseUrlRaw,
          'NEXT_PUBLIC_SUPABASE_URL',
          'Use a full URL including protocol, e.g. https://<project-ref>.supabase.co.',
        )
      : supabaseUrlRaw;

  const dashboardStatusBackendUrl = parseUrl(
    backendUrlRaw,
    backendVariable,
    'Set DASHBOARD_STATUS_BACKEND_URL (or INTERNAL_API_BASE_URL) to a valid absolute URL, e.g. http://127.0.0.1:5000.',
  );

  for (const candidate of [supabaseUrl, supabaseAnonKey, dashboardStatusBackendUrl]) {
    if (typeof candidate !== 'string') {
      issues.push(candidate);
    }
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  const validatedEnv = {
    supabaseUrl,
    supabaseAnonKey,
    dashboardStatusBackendUrl,
  };

  if (isDefaultEnv) {
    cachedEnv = validatedEnv;
  }

  return validatedEnv;
}
