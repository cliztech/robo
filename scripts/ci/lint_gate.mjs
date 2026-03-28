import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { minimatch } from 'minimatch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const allowlistPath = path.join(repoRoot, 'config', 'lint-allowlist.json');
const lintTargets = ['src', 'tests', 'next.config.js'];

function isExpired(dateStr) {
  const ts = Date.parse(dateStr);
  if (Number.isNaN(ts)) return true;
  return Date.now() > ts;
}

function normalize(p) {
  return p.split(path.sep).join('/');
}

function matchesPath(issuePath, pathPattern) {
  if (!pathPattern) return true;
  if (pathPattern.includes('*')) {
    return minimatch(issuePath, pathPattern, { dot: true });
  }
  return issuePath === pathPattern;
}

function matchesEntry(issue, entry) {
  if (!matchesPath(issue.filePath, entry.path)) return false;
  if (entry.ruleId && issue.ruleId !== entry.ruleId) return false;
  if (entry.message_includes && !issue.message.includes(entry.message_includes)) return false;
  return true;
}

const allowlistRaw = await readFile(allowlistPath, 'utf8');
const allowlist = JSON.parse(allowlistRaw);

const eslint = new ESLint({ cwd: repoRoot });
const results = await eslint.lintFiles(lintTargets);

const issues = [];
for (const result of results) {
  const relPath = normalize(path.relative(repoRoot, result.filePath));
  for (const msg of result.messages) {
    if (msg.severity !== 2) continue;
    issues.push({
      filePath: relPath,
      ruleId: msg.ruleId ?? 'unknown',
      message: msg.message,
      line: msg.line ?? 0,
      column: msg.column ?? 0
    });
  }
}

let allowlistedErrors = 0;
let expiredMatches = 0;
const violations = [];

for (const issue of issues) {
  const entry = (allowlist.entries ?? []).find((candidate) => matchesEntry(issue, candidate));
  if (!entry) {
    violations.push(issue);
    continue;
  }

  if (!entry.owner || !entry.expires_on) {
    violations.push({ ...issue, message: `${issue.message} (invalid allowlist metadata)` });
    continue;
  }

  if (isExpired(entry.expires_on)) {
    expiredMatches += 1;
    violations.push({ ...issue, message: `${issue.message} (allowlist expired ${entry.expires_on})` });
    continue;
  }

  allowlistedErrors += 1;
}

const maxErrors = allowlist.budget?.max_errors ?? 0;
const remainingBudget = maxErrors - allowlistedErrors;

console.log('Lint budget report');
console.log(`  Total ESLint errors: ${issues.length}`);
console.log(`  Allowlisted errors: ${allowlistedErrors}`);
console.log(`  Error budget (max allowlisted): ${maxErrors}`);
console.log(`  Remaining budget: ${remainingBudget}`);
console.log(`  Expired allowlist matches: ${expiredMatches}`);

if (allowlistedErrors > maxErrors) {
  console.error(`\nLint error budget exceeded: allowlisted ${allowlistedErrors} > budget ${maxErrors}.`);
  process.exitCode = 1;
}

if (violations.length > 0) {
  console.error(`\nUnallowlisted (or invalid/expired allowlisted) lint errors: ${violations.length}`);
  for (const issue of violations.slice(0, 50)) {
    console.error(`- ${issue.filePath}:${issue.line}:${issue.column} [${issue.ruleId}] ${issue.message}`);
  }
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('\nLint gate passed.');
}
