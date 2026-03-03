#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function collectCssFiles(targetPath) {
  const abs = path.resolve(ROOT, targetPath);
  const stat = statSync(abs);

  if (stat.isFile()) {
    return [abs];
  }

  const files = [];
  const queue = [abs];
  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(next);
        continue;
      }
      if (entry.isFile() && next.endsWith('.css')) {
        files.push(next);
      }
    }
  }

  return files.sort();
}

function toLine(content, index) {
  return content.slice(0, index).split('\n').length;
}

const targets = process.argv.slice(2);
const inputTargets = targets.length > 0 ? targets : ['src/styles/tokens.css'];
const cssFiles = inputTargets.flatMap(collectCssFiles);

const definitions = new Set();
const filesData = [];
const definitionPattern = /--([a-z0-9-]+)\s*:/gi;
const referencePattern = /var\(\s*--([a-z0-9-]+)\b/gi;

for (const file of cssFiles) {
  const content = readFileSync(file, 'utf8');
  filesData.push({ file, content });

  let match;
  while ((match = definitionPattern.exec(content)) !== null) {
    definitions.add(match[1]);
  }
}

const unresolved = [];
for (const { file, content } of filesData) {
  let match;
  while ((match = referencePattern.exec(content)) !== null) {
    const token = match[1];
    if (!definitions.has(token)) {
      unresolved.push({
        file: path.relative(ROOT, file),
        line: toLine(content, match.index),
        token,
      });
    }
  }
}

if (unresolved.length > 0) {
  console.error('Unresolved CSS token references detected:');
  for (const issue of unresolved) {
    console.error(`- ${issue.file}:${issue.line} -> --${issue.token}`);
  }
  process.exit(1);
}

console.log(`Token reference check passed for ${cssFiles.length} CSS file(s).`);
