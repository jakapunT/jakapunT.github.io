#!/usr/bin/env node
// npm run outputs -- <course> <lesson>   e.g.  npm run outputs -- nlp-basic lesson10
// Runs the lesson's Python cells with course/.venv (the pandas version students get in Colab)
// and writes the real results into its ```output blocks. See scripts/outputs.py.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COURSE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [course, lesson] = process.argv.slice(2);
if (!course || !lesson) {
  console.error('Usage: npm run outputs -- <course> <lesson>   (e.g. nlp-basic lesson10)');
  process.exit(1);
}
const dir = path.join(COURSE_DIR, 'courses', course);
const file = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.endsWith('.md') && (f === lesson || f.startsWith(`${lesson}-`) || f === `${lesson}.md`)) : null;
if (!file) {
  console.error(`No lesson "${lesson}" in courses/${course}/`);
  process.exit(1);
}
const python = path.join(COURSE_DIR, '.venv', 'bin', 'python');
if (!fs.existsSync(python)) {
  console.error('course/.venv is missing. Create it once with:\n  python3 -m venv .venv && .venv/bin/pip install "pandas==2.2.3" "numpy==2.1.3"');
  process.exit(1);
}
const r = spawnSync(python, [path.join(COURSE_DIR, 'scripts', 'outputs.py'), path.join(dir, file)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
