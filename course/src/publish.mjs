// npm run publish -- <course>
// Builds the course, encrypts every page with StatiCrypt using the password from .env, and
// writes the encrypted files to ../public/courses/<course>/. The password is passed to
// StatiCrypt through its STATICRYPT_PASSWORD environment variable and is never printed or
// written anywhere else.
//
// Only released lessons are published (release date <= today in Bangkok, see release.mjs). The
// shared password would unlock any page that is online, so an unreleased lesson is not uploaded
// at all, and a page already published for it is removed.
//
//   --out <dir>   write somewhere other than ../public/courses (used for testing)
//   --all         publish every lesson, released or not (testing only)
//   COURSE_TODAY=YYYY-MM-DD   pretend today is another date (testing)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { buildCourse } from './build.mjs';
import { COURSE_DIR } from './page.mjs';
import { copyFonts, fontFaceCss } from './fonts.mjs';
import { LectureError } from './parse.mjs';
import { todayBangkok } from './release.mjs';

const require = createRequire(import.meta.url);
const SALTS_FILE = path.join(COURSE_DIR, 'staticrypt-salts.json');
const MARKER = /"staticryptEncryptedMsgUniqueVariableName":\s*"([0-9a-f]+)"/i;

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function readDotEnv() {
  const file = path.join(COURSE_DIR, '.env');
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

// The salt is not secret. Keeping it fixed per course means "remember me" keeps working
// across republishes and across all pages of the course.
function saltFor(slug) {
  const salts = fs.existsSync(SALTS_FILE) ? JSON.parse(fs.readFileSync(SALTS_FILE, 'utf8')) : {};
  if (!salts[slug]) {
    salts[slug] = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(SALTS_FILE, `${JSON.stringify(salts, null, 2)}\n`);
  }
  return salts[slug];
}

async function main() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outRoot = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : path.resolve(COURSE_DIR, '..', 'public', 'courses');
  const all = args.includes('--all');
  const slug = args.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1))[0];
  if (!slug) fail('Usage: npm run publish -- <course>   (for example: npm run publish -- nlp-basic)');

  const { course, pages, skipped } = await buildCourse(slug, { released: !all });
  const varName = course.password_env ?? `COURSE_PASSWORD_${slug.toUpperCase().replace(/-/g, '_')}`;
  const password = process.env[varName] ?? readDotEnv()[varName];
  if (!password) fail(`No password: set ${varName}=... in course/.env (copy .env.example to .env).`);
  if (/change-me/i.test(password)) fail(`${varName} in course/.env is still the example value. Set a long passphrase.`);
  if (password.length < 12) fail(`${varName} is shorter than 12 characters. Anyone can try passwords offline against the public file, so use a long passphrase.`);

  // plain pages exist only in a private temp folder, deleted at the end
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'course-publish-'));
  try {
    const plainDir = path.join(tmp, 'plain');
    fs.mkdirSync(plainDir);
    for (const p of pages) fs.writeFileSync(path.join(plainDir, p.name), p.html);

    const template = fs
      .readFileSync(path.join(COURSE_DIR, 'templates', 'password.html'), 'utf8')
      .replace('{{FONT_CSS}}', () => fontFaceCss('../_fonts/'))
      .replace('{{TOKENS_CSS}}', () => fs.readFileSync(path.join(COURSE_DIR, 'tokens.css'), 'utf8').replace(/@import\s+url\([^)]*\)[^;]*;\s*/g, ''))
      .replaceAll('{{COURSE_TITLE}}', () => escHtml(course.title ?? slug))
      .replaceAll('{{COURSE_TITLE_TH}}', () => escHtml(course.title_th ?? ''))
      .replaceAll('{{SLUG}}', () => slug.replace(/[^a-z0-9-]/gi, ''));
    const templatePath = path.join(tmp, 'password.html');
    fs.writeFileSync(templatePath, template);

    const encDir = path.join(tmp, 'encrypted');
    const cli = path.join(path.dirname(require.resolve('staticrypt/package.json')), 'cli', 'index.js');
    const result = spawnSync(
      process.execPath,
      [
        cli,
        ...pages.map((p) => path.join(plainDir, p.name)),
        '--directory', encDir,
        '--config', 'false',
        '--salt', saltFor(slug),
        '--short',
        '--remember', String(course.remember_days ?? 30),
        '--template', templatePath,
        '--template-title', course.title ?? slug,
        '--template-instructions', 'หน้านี้สำหรับนิสิตในรายวิชา ใส่รหัสผ่านที่อาจารย์แจ้งในชั้นเรียน',
        '--template-button', 'เข้าสู่บทเรียน',
        '--template-remember', `จดจำรหัสผ่านในเครื่องนี้ ${course.remember_days ?? 30} วัน`,
        '--template-error', 'รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง',
        '--template-placeholder', 'รหัสผ่าน',
        '--template-toggle-show', 'แสดงรหัสผ่าน',
        '--template-toggle-hide', 'ซ่อนรหัสผ่าน',
      ],
      { env: { ...process.env, STATICRYPT_PASSWORD: password }, encoding: 'utf8' },
    );
    if (result.status !== 0) fail(`StatiCrypt failed:\n${(result.stderr || result.stdout || '').replaceAll(password, '••••')}`);

    // check every output before it reaches public/
    const outDir = path.join(outRoot, slug);
    fs.mkdirSync(outDir, { recursive: true });
    for (const p of pages) {
      const enc = fs.readFileSync(path.join(encDir, p.name), 'utf8');
      const m = enc.match(MARKER);
      if (!m) fail(`${p.name}: StatiCrypt output has no encrypted payload; nothing was published.`);
      const rest = enc.replace(m[1], '');
      const probe = p.lecture ? [p.lecture.meta.title, ...p.lecture.sections.map((s) => s.title)] : [];
      const leak = probe.find((t) => t && t.length >= 6 && rest.includes(t));
      if (leak) fail(`${p.name}: "${leak}" is readable outside the encrypted payload; nothing was published.`);
    }
    for (const p of pages) fs.copyFileSync(path.join(encDir, p.name), path.join(outDir, p.name));

    // remove pages of lessons not released yet, and pages whose source was deleted or renamed
    const keep = new Set(pages.map((p) => p.name));
    const notYet = new Set(skipped.map((s) => s.name));
    for (const f of fs.readdirSync(outDir)) {
      if (f.endsWith('.html') && !keep.has(f)) {
        fs.rmSync(path.join(outDir, f));
        console.log(`removed ${path.relative(process.cwd(), path.join(outDir, f))} (${notYet.has(f) ? 'not released yet' : 'no source any more'})`);
      }
    }
    copyFonts(outRoot);
    console.log(`✓ encrypted ${pages.length} page(s) → ${path.relative(process.cwd(), outDir)}/${all ? '   (--all: unreleased lessons included)' : ''}`);
    for (const p of pages) console.log(`  ${p.name}`);
    if (skipped.length) {
      console.log(`not released yet, so not published (today is ${todayBangkok()} in Bangkok):`);
      for (const s of skipped) console.log(`  ${s.name}  opens ${s.release}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

main().catch((err) => {
  if (err instanceof LectureError) fail(err.message);
  console.error(err);
  process.exit(1);
});
