#!/usr/bin/env node
// Installs the pre-commit hook that runs the guard. Called by `npm install` (postinstall).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MARK = '# installed by course/scripts/install-hooks.mjs';
const HOOK = `#!/bin/sh
${MARK}
# Blocks commits that would publish readable lecture content. See course/CLAUDE.md §9.
PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
if ! command -v node >/dev/null 2>&1; then
  echo "course guard: node not found, so the commit is blocked to be safe." >&2
  exit 1
fi
exec node "$(git rev-parse --show-toplevel)/course/scripts/guard.mjs" --staged
`;

let root, hooksDir;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  hooksDir = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { encoding: 'utf8' }).trim();
} catch {
  console.warn('install-hooks: not inside a git repository; skipped.');
  process.exit(0);
}

const hook = path.resolve(process.cwd(), hooksDir, 'pre-commit');
if (fs.existsSync(hook) && !fs.readFileSync(hook, 'utf8').includes(MARK)) {
  console.error(`install-hooks: ${hook} already exists and is not ours. Add this line to it:\n  node "${root}/course/scripts/guard.mjs" --staged`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(hook), { recursive: true });
fs.writeFileSync(hook, HOOK, { mode: 0o755 });
console.log(`install-hooks: pre-commit guard installed at ${path.relative(root, hook)}`);
