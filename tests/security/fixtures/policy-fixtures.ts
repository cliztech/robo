import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type EnvVariable = {
  name: string;
  min?: number;
  max?: number;
};

type EnvContract = {
  contexts: Record<string, {
    variables: EnvVariable[];
  }>;
};

const envContractPath = resolve(process.cwd(), 'config/env_contract.json');
const envContract = JSON.parse(readFileSync(envContractPath, 'utf-8')) as EnvContract;

function getEnvVariable(name: string): EnvVariable {
  const variable = Object.values(envContract.contexts)
    .flatMap((context) => context.variables)
    .find((candidate) => candidate.name === name);

  if (!variable) {
    throw new Error(`Missing environment contract variable: ${name}`);
  }

  return variable;
}

function parseBoundedInt(rawValue: string | undefined, fallback: number, bounds: EnvVariable): number {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const min = bounds.min ?? Number.MIN_SAFE_INTEGER;
  const max = bounds.max ?? Number.MAX_SAFE_INTEGER;
  return Math.min(max, Math.max(min, parsed));
}

export const roleMatrixFixture = {
  source: 'docs/exec-plans/active/ti-002-role-aware-settings-visibility-model.md',
  roles: ['admin', 'operator', 'viewer'] as const,
  denyCases: {
    credentialsWriteDeniedForOperator: {
      role: 'operator',
      action: 'write',
      surface: 'credentials',
      expectedMarker: 'AUTHZ_DENIED_EXPECTED',
    },
    schedulerWriteDeniedForViewer: {
      role: 'viewer',
      action: 'write',
      surface: 'scheduler_defaults',
      expectedMarker: 'AUTHZ_DENIED_EXPECTED',
    },
    releaseChannelEditDeniedForOperator: {
      role: 'operator',
      action: 'write',
      surface: 'release_update_channel',
      expectedMarker: 'PRIV_ACTION_BLOCKED',
    },
  },
};

const idleTimeoutContract = getEnvVariable('ROBODJ_IDLE_TIMEOUT_MINUTES');
const reauthGraceContract = getEnvVariable('ROBODJ_REAUTH_GRACE_MINUTES');

export const lockoutPolicyFixture = {
  source: 'config/env_contract.json + docs/exec-plans/active/ti-003-idle-timeout-reauth.md',
  maxFailedAttempts: parseBoundedInt(process.env.ROBODJ_LOCKOUT_MAX_ATTEMPTS, 5, {
    min: 1,
    max: 10,
    name: 'ROBODJ_LOCKOUT_MAX_ATTEMPTS',
  }),
  lockoutWindowMinutes: parseBoundedInt(process.env.ROBODJ_LOCKOUT_WINDOW_MINUTES, 15, {
    min: 1,
    max: 60,
    name: 'ROBODJ_LOCKOUT_WINDOW_MINUTES',
  }),
  idleTimeoutMinutes: parseBoundedInt(
    process.env.ROBODJ_IDLE_TIMEOUT_MINUTES,
    idleTimeoutContract.min ?? 1,
    idleTimeoutContract,
  ),
  reauthGraceMinutes: parseBoundedInt(
    process.env.ROBODJ_REAUTH_GRACE_MINUTES,
    reauthGraceContract.min ?? 0,
    reauthGraceContract,
  ),
};
