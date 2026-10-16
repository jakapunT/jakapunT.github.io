// Builds unencrypted lecture pages into .preview/ (npm run build). publish.mjs reuses buildCourse
// and encrypts the result.
//
//   node src/build.mjs            all courses
//   node src/build.mjs nlp-basic  one course

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { parseLecture, LectureError } from './parse.mjs';
import { renderLecture, setFile, esc, T, UI } from './render.mjs';
import { initHighlighter } from './highlight.mjs';
import { pageHtml, weekNavHtml, COURSE_DIR } from './page.mjs';
import { renderFocusDeck, focusDeckHtml } from './focus.mjs';
import { copyFonts } from './fonts.mjs';

// COURSE_SOURCES lets tests build from another folder
export const COURSES_DIR = process.env.COURSE_SOURCES ? path.resolve(process.env.COURSE_SOURCES) : path.join(COURSE_DIR, 'courses');
export const PREVIEW_DIR = path.join(COURSE_DIR, '.preview');

export function listCourses() {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(COURSES_DIR, d.name, 'course.yml')))
    .map((d) => d.name);
}

export function loadCourse(slug) {
  const dir = path.join(COURSES_DIR, slug);
  const ymlPath = path.join(dir, 'course.yml');
  if (!fs.existsSync(ymlPath)) throw new Error(`No course "${slug}" (expected ${path.relative(COURSE_DIR, ymlPath)})`);
  const course = { slug, ...loadYaml(fs.readFileSync(ymlPath, 'utf8')) };
  const lectures = fs
    .readdirSync(dir)
    .filter((f) => /^week\d+.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      const rel = path.relative(COURSE_DIR, file);
      const lecture = parseLecture(fs.readFileSync(file, 'utf8'), rel);
      return { slug: f.replace(/\.md$/, ''), file, rel, ...lecture };
    });
  return { dir, course, lectures };
}

// Returns [{ name, html }] for one course. Throws LectureError on authoring mistakes.
export async function buildCourse(slug, { dev = false } = {}) {
  await initHighlighter();
  const { dir, course, lectures } = loadCourse(slug);
  const bySlug = new Map(lectures.map((l) => [l.slug, l]));
  const weekInfo = (s) => {
    if (!s) return null;
    const l = bySlug.get(s);
    const num = Number(String(s).match(/\d+/)?.[0]);
    return l ? { slug: s, exists: true, week: Number(l.meta.week ?? num), title: l.meta.title, title_th: l.meta.title_th } : { slug: s, exists: false, week: num };
  };

  const pages = [];
  for (const lec of lectures) {
    const meta = lec.meta;
    if (meta.week == null) throw new LectureError(lec.rel, 1, 'front matter needs "week:"');
    if (!meta.title) throw new LectureError(lec.rel, 1, 'front matter needs "title:"');
    const weekPad = String(meta.week).padStart(2, '0');
    for (const s of lec.sections) {
      if (!s.id.startsWith(`w${weekPad}-`)) throw new LectureError(lec.rel, s.line, `section ID "${s.id}" should start with w${weekPad}- for week ${meta.week}`);
    }

    const files = {};
    let fileSeq = 0;
    const ctx = {
      env: meta.env ?? course.env ?? 'colab',
      install: meta.install ?? course.install ?? null,
      installShown: false,
      dev,
      cellCount: 0,
      weekPad,
      addFile(f) {
        const id = `f${++fileSeq}`;
        files[id] = f;
        return id;
      },
      readData(rel, line) {
        const p = path.join(dir, rel);
        if (!fs.existsSync(p)) throw new LectureError(lec.rel, line, `file "${rel}" not found in ${path.relative(COURSE_DIR, dir)}/`);
        return fs.readFileSync(p, 'utf8');
      },
      notebookFor(node) {
        if (!node.attrs.notebook) return null;
        const p = path.join(dir, node.attrs.notebook);
        if (!fs.existsSync(p)) throw new LectureError(lec.rel, node.line, `notebook "${node.attrs.notebook}" not found`);
        return fs.readFileSync(p, 'utf8');
      },
    };
    if (!['colab', 'vscode'].includes(ctx.env)) throw new LectureError(lec.rel, 1, `env must be colab or vscode, not "${ctx.env}"`);

    setFile(lec.rel);
    const { sectionsHtml, toc } = renderLecture(lec, ctx);
    const focusDeck = focusDeckHtml(renderFocusDeck(lec, ctx));
    const html = pageHtml({
      course,
      meta,
      weekPad,
      sectionsHtml,
      toc,
      sectionCount: lec.sections.length,
      weekNav: weekNavHtml(weekInfo(meta.prev), weekInfo(meta.next)),
      files,
      dev,
      focusDeck,
      srcFile: lec.rel,
      frontMatter: lec.frontMatter,
    });
    pages.push({ name: `${lec.slug}.html`, html, lecture: lec });
  }
  pages.push({ name: 'index.html', html: courseHomeHtml(course, lectures, dev) });
  return { course, pages };
}

// Minimal course home (milestone 4 gives it the full design).
function courseHomeHtml(course, lectures, dev) {
  const items = lectures
    .map(
      (l) =>
        `<li><a class="week-card" href="${l.slug}.html"><span class="wk">${T(UI.week(l.meta.week))}</span><span class="wk-title"><span lang="en">${esc(l.meta.title)}</span>${
          l.meta.title_th ? `<span class="cell-sub" data-only="th">${esc(l.meta.title_th)}</span>` : ''
        }</span></a></li>`,
    )
    .join('');
  const sectionsHtml = `<section class="card section"><div class="section-body"><div class="section-head"><h2 id="weeks-title">${T(['บทเรียน', 'Lectures'])}</h2></div><ul class="home-list" aria-labelledby="weeks-title">${items}</ul></div></section>`;
  return pageHtml({
    course,
    meta: { week: '', title: course.title, title_th: course.title_th },
    weekPad: '',
    sectionsHtml,
    toc: '',
    sectionCount: lectures.length,
    weekNav: '',
    files: {},
    dev,
  })
    .replace(/<ul class="pills">[\s\S]*?<\/ul>/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(course.title)}</title>`)
    .replace('class="wrap layout"', 'class="wrap layout layout-home"');
}

export function writePages(outDir, slug, pages) {
  const dir = path.join(outDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const p of pages) fs.writeFileSync(path.join(dir, p.name), p.html);
  copyFonts(outDir);
}

async function main() {
  const only = process.argv[2];
  const slugs = only ? [only] : listCourses();
  if (!slugs.length) {
    console.error('No courses found in course/courses/.');
    process.exit(1);
  }
  const t0 = Date.now();
  for (const slug of slugs) {
    const { pages } = await buildCourse(slug, { dev: process.env.COURSE_DEV === '1' });
    writePages(PREVIEW_DIR, slug, pages);
    console.log(`built ${slug}: ${pages.map((p) => p.name).join(', ')}`);
  }
  console.log(`→ ${path.relative(process.cwd(), PREVIEW_DIR) || '.preview'}/ in ${Date.now() - t0} ms`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    if (err instanceof LectureError) console.error(`✗ ${err.message}`);
    else console.error(err);
    process.exit(1);
  });
}
