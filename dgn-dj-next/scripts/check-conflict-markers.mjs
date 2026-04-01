import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const SOURCE_ROOT = fileURLToPath(new URL('../src', import.meta.url));
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md']);
const CONFLICT_REGEX = /^(<<<<<<<|=======|>>>>>>>)/m;

function collectFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

const matchedFiles = collectFiles(SOURCE_ROOT).filter((filePath) => {
  const content = readFileSync(filePath, 'utf8');
  return CONFLICT_REGEX.test(content);
});

if (matchedFiles.length > 0) {
  console.error('❌ Merge conflict markers found in dgn-dj-next/src:');
  for (const filePath of matchedFiles) {
    console.error(` - ${filePath}`);
  }
  process.exit(1);
}

console.log('✅ No merge conflict markers found in dgn-dj-next/src');
