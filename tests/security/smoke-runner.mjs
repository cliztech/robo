#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const scenarioIds = new Set([
  'authn-invalid-password',
  'authz-role-deny',
  'lockout-threshold',
  'privileged-action-block',
]);

function parseCaseArg(argv) {
  const flagIndex = argv.findIndex((token) => token === '--case');
  if (flagIndex === -1) {
    return null;
  }

  const caseId = argv[flagIndex + 1];
  if (!caseId) {
    throw new Error('Missing scenario ID after --case.');
  }

  if (!scenarioIds.has(caseId)) {
    throw new Error(`Unsupported --case value: ${caseId}`);
  }

  return caseId;
}

try {
  const caseId = parseCaseArg(process.argv.slice(2));
  const vitestArgs = ['exec', 'vitest', 'run', 'tests/security/smoke.test.ts'];

  if (caseId) {
    vitestArgs.push('--testNamePattern', `scenario:${caseId}$`);
  }

  const result = spawnSync('pnpm', vitestArgs, { stdio: 'inherit' });
  process.exit(result.status ?? 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
