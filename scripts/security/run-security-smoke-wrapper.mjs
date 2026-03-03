#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, runSecuritySmoke } from './security-smoke-runner.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const logPath = path.join(repoRoot, 'artifacts/security/logs/ti-041-security-smoke.log');
const reportPath = path.join(repoRoot, 'artifacts/security/reports/ti-041-smoke-matrix-report.md');
const hashPath = path.join(repoRoot, 'artifacts/security/hashes/ti-041-smoke-output.sha256');

function ensureDirs() {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(hashPath), { recursive: true });
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function run() {
  ensureDirs();
  const args = parseArgs(process.argv.slice(2));

  let result;
  try {
    result = runSecuritySmoke(args);
  } catch (error) {
    const fatalOutput = `[FATAL] ${error.message}\n`;
    fs.writeFileSync(logPath, fatalOutput, 'utf8');
    fs.writeFileSync(hashPath, `${sha256(fatalOutput)}  ti-041-security-smoke.log\n`, 'utf8');
    process.stderr.write(fatalOutput);
    process.exit(1);
  }

  const logOutput = `${result.lines.join('\n')}\n`;
  fs.writeFileSync(logPath, logOutput, 'utf8');

  const report = [
    '# TI-041 Security Smoke Matrix Report',
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Command: pnpm test:security${args.requestedCases.length ? ` -- --case ${args.requestedCases.join(',')}` : ''}`,
    `- Result: ${result.ok ? 'PASS' : 'FAIL'}`,
    '',
    '## Checklist',
    `- [${logOutput.includes('AUTHN_DENIED_EXPECTED') ? 'x' : ' '}] CHK-TI041-01 authN denial scenario validated`,
    `- [${logOutput.includes('AUTHZ_DENIED_EXPECTED') ? 'x' : ' '}] CHK-TI041-02 authZ denial scenario validated`,
    `- [${logOutput.includes('LOCKOUT_TRIGGERED') && logOutput.includes('LOCKOUT_WINDOW_ACTIVE') ? 'x' : ' '}] CHK-TI041-03 lockout threshold/window validated`,
    `- [${logOutput.includes('PRIV_ACTION_BLOCKED') && !logOutput.includes('PRIV_ACTION_EXECUTED') ? 'x' : ' '}] CHK-TI041-04 privileged action blocked without required approval chain`,
    '',
    '## Pass/Fail Signatures',
    '- Pass: exit code 0, all required markers present, no `PRIV_ACTION_EXECUTED` marker.',
    '- Fail: non-zero exit code, missing required markers, or unexpected `PRIV_ACTION_EXECUTED` marker.',
  ].join('\n');

  fs.writeFileSync(reportPath, `${report}\n`, 'utf8');

  const hashOutput = [
    `${sha256(logOutput)}  ti-041-security-smoke.log`,
    `${sha256(report)}  ti-041-smoke-matrix-report.md`,
  ].join('\n');
  fs.writeFileSync(hashPath, `${hashOutput}\n`, 'utf8');

  process.stdout.write(logOutput);
  process.stdout.write(`Artifact report: ${path.relative(repoRoot, reportPath)}\n`);
  process.stdout.write(`Artifact hashes: ${path.relative(repoRoot, hashPath)}\n`);

  process.exit(result.ok ? 0 : 1);
}

run();
