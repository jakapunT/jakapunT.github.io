#!/usr/bin/env node
// The guard (CLAUDE.md §9). Blocks a commit that would put readable lecture content in the
// public repo. Uses only Node built-ins so the git hook works even without node_modules.
//
//   node course/scripts/guard.mjs --staged   pre-commit: check the staged files
//   node course/scripts/guard.mjs --all      npm run check: staged + tracked + public/courses on disk

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv.includes('--all') ? 'all' : 'staged';

function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: opts.encoding ?? 'utf8', maxBuffer: 1 << 28, ...opts });
}

const root = git(['rev-parse', '--show-toplevel']).trim();
const problems = [];
const warnings = [];

// Paths that must never be committed.
const PRIVATE = [
  { test: (p) => p.startsWith('course/courses/'), why: 'lecture source (course/courses/ is private)' },
  { test: (p) => /^course\/\.env(\..+)?$/.test(p) && p !== 'course/.env.example', why: 'password file' },
  { test: (p) => p.startsWith('course/.preview/'), why: 'unencrypted preview build' },
  { test: (p) => p.startsWith('course/reference/'), why: 'design reference holding plain lecture text' },
];

// Only these file types may live under public/courses/. Everything else (CSV, notebooks, .py,
// Markdown, images, PDFs ...) would be readable by anyone, so it is blocked.
const PUBLIC_ALLOWED = new Set(['.html', '.css', '.js', '.woff2', '.woff']);

const PAYLOAD_RE = /"staticryptEncryptedMsgUniqueVariableName":\s*"([0-9a-f]+)"/i;

// Distinctive text from the lecture sources, used to prove an "encrypted" file really is.
function contentStrings() {
  const dir = path.join(root, 'course', 'courses');
  if (!fs.existsSync(dir)) {
    warnings.push('course/courses/ not found here, so the content-string check was skipped.');
    return [];
  }
  const out = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith('.md')) collect(fs.readFileSync(f, 'utf8'), out);
    }
  };
  walk(dir);
  return [...out];
}

function collect(md, out) {
  let inFrontMatter = false;
  for (const [i, raw] of md.split('\n').entries()) {
    let line = raw.trim();
    if (i === 0 && line === '---') { inFrontMatter = true; continue; }
    if (inFrontMatter) {
      if (line === '---') { inFrontMatter = false; continue; }
      const m = line.match(/^(title|title_th|lead_th|lead_en)\s*:\s*(.+)$/);
      if (m) line = m[2].replace(/^["']|["']$/g, ''); else continue;
    }
    if (!line || line.startsWith(':::') || line.startsWith('```') || line.startsWith('|---')) continue;
    // attribute values such as th="..." are content too
    for (const m of line.matchAll(/\b(?:th|en|note_th|note_en|prompt_th|prompt_en)="([^"]+)"/g)) add(m[1], out);
    line = line
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/^(#+|[-*]|\d+\.|:|th:|en:|[a-z_]+:)\s+/, '');
    add(line, out);
  }
}

function add(text, out) {
  // split on inline markup so each piece appears verbatim in rendered HTML
  for (const seg of text.split(/\*\*|`|\[|\]\(|\)|\||→/)) {
    const s = seg.trim();
    if ([...s].length >= 12) out.add(s);
  }
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let strings;
function checkEncryptedHtml(p, html, where) {
  const m = html.match(PAYLOAD_RE);
  if (!m || m[1].length < 64) {
    problems.push(`${p} (${where}): not a StatiCrypt-encrypted file (no encrypted payload found)`);
    return;
  }
  const rest = html.replace(m[1], '');
  strings ??= contentStrings();
  const leaked = strings.filter((s) => rest.includes(s) || rest.includes(escapeHtml(s)));
  if (leaked.length) {
    problems.push(`${p} (${where}): lecture text is readable outside the encrypted payload, e.g. "${leaked[0]}"`);
  }
}

function checkPath(p, readContent, where) {
  for (const rule of PRIVATE) {
    if (rule.test(p)) problems.push(`${p} (${where}): ${rule.why}`);
  }
  if (p.startsWith('public/courses/')) {
    const ext = path.extname(p).toLowerCase();
    if (!PUBLIC_ALLOWED.has(ext)) {
      problems.push(`${p} (${where}): ${ext || 'this file type'} is not allowed in public/courses/ (data and images must be inlined into the encrypted page)`);
    } else if (ext === '.html') {
      const html = readContent();
      if (html != null) checkEncryptedHtml(p, html, where);
    }
  }
}

// 1. staged files (what the next commit would contain)
const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']).split('\0').filter(Boolean);
for (const p of staged) {
  checkPath(p, () => git(['show', `:${p}`]), 'staged');
}

if (mode === 'all') {
  // 2. files already tracked (a leak that slipped in before the guard existed)
  const tracked = git(['ls-files', '-z']).split('\0').filter(Boolean);
  for (const p of tracked) {
    if (staged.includes(p)) continue;
    if (PRIVATE.some((r) => r.test(p)) || p.startsWith('public/courses/')) {
      checkPath(p, () => fs.readFileSync(path.join(root, p), 'utf8'), 'tracked');
    }
  }
  // 3. what publish has written to disk, before it is staged
  const pub = path.join(root, 'public', 'courses');
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue;
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else {
        const p = path.relative(root, f).split(path.sep).join('/');
        if (!staged.includes(p)) checkPath(p, () => fs.readFileSync(f, 'utf8'), 'on disk');
      }
    }
  };
  walk(pub);
  // 4. the ignore rules themselves
  const ignore = fs.existsSync(path.join(root, '.gitignore')) ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8') : '';
  for (const line of ['course/courses/', 'course/.env', 'course/.preview/', 'course/reference/']) {
    if (!ignore.split('\n').map((l) => l.trim()).includes(line)) problems.push(`.gitignore: missing "${line}"`);
  }
  // 5. the hook is installed
  const hooksDir = git(['rev-parse', '--git-path', 'hooks']).trim();
  const hook = path.resolve(process.cwd(), hooksDir, 'pre-commit');
  if (!fs.existsSync(hook) || !fs.readFileSync(hook, 'utf8').includes('course/scripts/guard.mjs')) {
    problems.push('pre-commit hook is not installed (run npm install in course/)');
  }
}

for (const w of warnings) console.warn(`guard: warning: ${w}`);
if (problems.length) {
  console.error('\n✗ Course guard blocked this. Nothing readable may reach the public repo.\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nUnstage with: git restore --staged <path>   (run "npm run publish -- <course>" to encrypt pages)\n');
  process.exit(1);
}
console.log(`✓ Course guard passed (${mode === 'all' ? 'staged, tracked and public/courses/' : `${staged.length} staged file(s)`}).`);
