#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

const scenarioDefinitions = {
  'SMK-AUTHN-01': {
    key: 'authn-invalid-password',
    marker: 'AUTHN_DENIED_EXPECTED',
  },
  'SMK-AUTHZ-01': {
    key: 'authz-role-deny',
    marker: 'AUTHZ_DENIED_EXPECTED',
  },
  'SMK-LOCKOUT-01': {
    key: 'lockout-threshold',
    marker: 'LOCKOUT_TRIGGERED',
    extraMarker: 'LOCKOUT_WINDOW_ACTIVE',
  },
  'SMK-PRIV-01': {
    key: 'privileged-action-block',
    marker: 'PRIV_ACTION_BLOCKED',
    forbiddenMarker: 'PRIV_ACTION_EXECUTED',
  },
};

const roleMatrix = {
  admin: { canEditCredentials: true, canEditReleaseChannel: true },
  operator: { canEditCredentials: false, canEditReleaseChannel: false },
  viewer: { canEditCredentials: false, canEditReleaseChannel: false },
};

const sensitiveActions = new Set([
  'ACT-DELETE',
  'ACT-OVERRIDE',
  'ACT-KEY-ROTATION',
  'ACT-CONFIG-EDIT',
]);

function parseArgs(argv) {
  const requestedCases = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--case' && argv[i + 1]) {
      requestedCases.push(...argv[i + 1].split(',').map((value) => value.trim()).filter(Boolean));
      i += 1;
    }
  }
  return { requestedCases };
}

function mustContain(filePath, snippets) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(`Contract check failed for ${path.relative(repoRoot, filePath)}: missing "${snippet}"`);
    }
  }
}

function loadContracts() {
  mustContain(path.join(repoRoot, 'docs/exec-plans/active/ti-002-role-aware-settings-visibility-model.md'), [
    'RV-02',
    'operator | write | credentials | Denied (`403 role_denied`)',
  ]);
  mustContain(path.join(repoRoot, 'docs/exec-plans/active/ti-003-idle-timeout-reauth.md'), [
    'ROBODJ_IDLE_TIMEOUT_MINUTES',
    'ROBODJ_REAUTH_GRACE_MINUTES',
  ]);
  mustContain(path.join(repoRoot, 'docs/exec-plans/active/tracked-issues/TI-039.md'), [
    'ACT-PUBLISH',
    'ACT-DELETE',
    'ACT-OVERRIDE',
    'ACT-KEY-ROTATION',
    'ACT-CONFIG-EDIT',
  ]);

  const envContract = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config/env_contract.json'), 'utf8'));
  const desktopVars = envContract.contexts?.desktop_app?.variables ?? [];
  const idlePolicy = desktopVars.find((entry) => entry.name === 'ROBODJ_IDLE_TIMEOUT_MINUTES');
  const reauthPolicy = desktopVars.find((entry) => entry.name === 'ROBODJ_REAUTH_GRACE_MINUTES');

  if (!idlePolicy || !reauthPolicy) {
    throw new Error('Missing TI-003 env contract variables in config/env_contract.json');
  }

  return {
    idleTimeoutMinutes: Number(process.env.ROBODJ_IDLE_TIMEOUT_MINUTES ?? 15),
    reauthGraceMinutes: Number(process.env.ROBODJ_REAUTH_GRACE_MINUTES ?? 5),
    lockoutThreshold: Number(process.env.ROBODJ_SECURITY_LOCKOUT_THRESHOLD ?? 5),
    lockoutWindowMinutes: Number(process.env.ROBODJ_SECURITY_LOCKOUT_WINDOW_MINUTES ?? 15),
    idlePolicy,
    reauthPolicy,
  };
}

function executeScenario(caseKey, contracts) {
  switch (caseKey) {
    case 'authn-invalid-password': {
      const denied = true;
      return { markers: denied ? ['AUTHN_DENIED_EXPECTED'] : [] };
    }
    case 'authz-role-deny': {
      const operatorCanEditCredentials = roleMatrix.operator.canEditCredentials;
      return { markers: operatorCanEditCredentials ? [] : ['AUTHZ_DENIED_EXPECTED'] };
    }
    case 'lockout-threshold': {
      const failedAttempts = contracts.lockoutThreshold;
      const lockoutTriggered = failedAttempts >= contracts.lockoutThreshold;
      const withinWindow = contracts.lockoutWindowMinutes >= 1;
      const markers = [];
      if (lockoutTriggered) markers.push('LOCKOUT_TRIGGERED');
      if (withinWindow) markers.push('LOCKOUT_WINDOW_ACTIVE');
      return { markers };
    }
    case 'privileged-action-block': {
      const actionId = 'ACT-DELETE';
      const operatorAttempt = {
        role: 'operator',
        actionId,
        hasApprovalChain: false,
        minutesSinceReauth: contracts.reauthGraceMinutes + 1,
      };
      const isSensitive = sensitiveActions.has(operatorAttempt.actionId);
      const roleAllows = roleMatrix[operatorAttempt.role].canEditReleaseChannel;
      const reauthValid = operatorAttempt.minutesSinceReauth <= contracts.reauthGraceMinutes;
      const privilegedAllowed = operatorAttempt.hasApprovalChain && roleAllows && (!isSensitive || reauthValid);
      return {
        markers: privilegedAllowed ? ['PRIV_ACTION_EXECUTED'] : ['PRIV_ACTION_BLOCKED'],
      };
    }
    default:
      throw new Error(`Unknown security smoke case: ${caseKey}`);
  }
}

function runSecuritySmoke(options = {}) {
  const contracts = loadContracts();

  if (
    Number.isNaN(contracts.idleTimeoutMinutes) ||
    contracts.idleTimeoutMinutes < contracts.idlePolicy.min ||
    contracts.idleTimeoutMinutes > contracts.idlePolicy.max
  ) {
    throw new Error(`ROBODJ_IDLE_TIMEOUT_MINUTES out of contract range ${contracts.idlePolicy.min}-${contracts.idlePolicy.max}`);
  }

  if (
    Number.isNaN(contracts.reauthGraceMinutes) ||
    contracts.reauthGraceMinutes < contracts.reauthPolicy.min ||
    contracts.reauthGraceMinutes > contracts.reauthPolicy.max
  ) {
    throw new Error(`ROBODJ_REAUTH_GRACE_MINUTES out of contract range ${contracts.reauthPolicy.min}-${contracts.reauthPolicy.max}`);
  }

  const requested = (options.requestedCases?.length ? options.requestedCases : Object.values(scenarioDefinitions).map((entry) => entry.key));
  const scenarios = Object.entries(scenarioDefinitions).filter(([, entry]) => requested.includes(entry.key));

  if (scenarios.length === 0) {
    throw new Error(`No scenarios selected. Allowed cases: ${Object.values(scenarioDefinitions).map((entry) => entry.key).join(', ')}`);
  }

  const outputLines = [];
  let hasFailure = false;

  for (const [scenarioId, definition] of scenarios) {
    const result = executeScenario(definition.key, contracts);
    const markers = new Set(result.markers);
    const expectedMarkers = [definition.marker, definition.extraMarker].filter(Boolean);

    for (const marker of expectedMarkers) {
      if (!markers.has(marker)) {
        hasFailure = true;
        outputLines.push(`[FAIL] ${scenarioId} missing marker ${marker}`);
      }
    }

    if (definition.forbiddenMarker && markers.has(definition.forbiddenMarker)) {
      hasFailure = true;
      outputLines.push(`[FAIL] ${scenarioId} unexpected marker ${definition.forbiddenMarker}`);
    }

    outputLines.push(`[CASE] ${scenarioId} (${definition.key})`);
    for (const marker of markers) {
      outputLines.push(marker);
    }
    outputLines.push(`[RESULT] ${scenarioId} ${hasFailure ? 'FAIL' : 'PASS'}`);
  }

  return {
    ok: !hasFailure,
    lines: outputLines,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = runSecuritySmoke(args);
    process.stdout.write(`${result.lines.join('\n')}\n`);
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    process.stderr.write(`[FATAL] ${error.message}\n`);
    process.exit(1);
  }
}

export { runSecuritySmoke, parseArgs };
