export const RUNTIME_CONTEXT_ENV = 'ROBODJ_RUNTIME_CONTEXT';

export const ALLOWED_RUNTIME_CONTEXTS = ['desktop_app', 'docker_stack', 'ci'] as const;
export type RuntimeContext = (typeof ALLOWED_RUNTIME_CONTEXTS)[number];

const REQUIRED_ENV_BY_CONTEXT: Record<RuntimeContext, readonly string[]> = {
  desktop_app: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  docker_stack: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'INTERNAL_API_BASE_URL'],
  ci: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'DASHBOARD_STATUS_BACKEND_URL'],
};

export interface RuntimeEnvDiagnostics {
  ok: boolean;
  runtime_context?: string;
  invalid_context: boolean;
  missing_keys: string[];
}

function isRuntimeContext(value: string): value is RuntimeContext {
  return (ALLOWED_RUNTIME_CONTEXTS as readonly string[]).includes(value);
}

export function validateServerRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnvDiagnostics {
  const context = env[RUNTIME_CONTEXT_ENV];
  if (!context || !isRuntimeContext(context)) {
    return {
      ok: false,
      runtime_context: context,
      invalid_context: true,
      missing_keys: [RUNTIME_CONTEXT_ENV],
    };
  }

  const missingKeys = REQUIRED_ENV_BY_CONTEXT[context].filter((key) => !env[key]);

  return {
    ok: missingKeys.length === 0,
    runtime_context: context,
    invalid_context: false,
    missing_keys: missingKeys,
  };
}

export function logRuntimeEnvValidationSummary(diagnostics: RuntimeEnvDiagnostics): void {
  console.info('runtime_env_validation_summary=%s', JSON.stringify(diagnostics));
}
