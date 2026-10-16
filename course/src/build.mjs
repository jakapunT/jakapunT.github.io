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
import { renderLecture, setFile, esc, T, UI, formatDate } from './render.mjs';
import { initHighlighter } from './highlight.mjs';
import { pageHtml, lessonNavHtml, COURSE_DIR } from './page.mjs';
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
    .filter((f) => /^lesson\d+.*\.md$/.test(f))
    .sort()
    .map((f) => {
      const file = path.join(dir, f);
      const rel = path.relative(COURSE_DIR, file);
      const lecture = parseLecture(fs.readFileSync(file, 'utf8'), rel);
      return { slug: f.replace(/\.md$/, ''), file, rel, ...lecture };
    })
    .sort((a, b) => Number(a.meta.lesson) - Number(b.meta.lesson));
  const seen = new Map();
  for (const l of lectures) {
    if (l.meta.lesson == null || !Number.isInteger(Number(l.meta.lesson))) throw new LectureError(l.rel, 1, 'front matter needs "lesson:" (its running number in the course, e.g. lesson: 10)');
    if (seen.has(Number(l.meta.lesson))) throw new LectureError(l.rel, 1, `lesson ${l.meta.lesson} is also used by ${seen.get(Number(l.meta.lesson))}`);
    seen.set(Number(l.meta.lesson), l.rel);
  }
  return { dir, course, lectures };
}

// Returns [{ name, html }] for one course. Throws LectureError on authoring mistakes.
export async function buildCourse(slug, { dev = false } = {}) {
  await initHighlighter();
  const { dir, course, lectures } = loadCourse(slug);
  // prev / next follow the lesson numbers, not the calendar
  const navInfo = (l) => (l ? { slug: l.slug, lesson: Number(l.meta.lesson), title: l.meta.title, title_th: l.meta.title_th } : null);

  const pages = [];
  for (const lec of lectures) {
    const meta = lec.meta;
    const index = lectures.indexOf(lec);
    if (!meta.title) throw new LectureError(lec.rel, 1, 'front matter needs "title:"');
    const lessonPad = String(meta.lesson).padStart(2, '0');
    for (const s of lec.sections) {
      if (!s.id.startsWith(`l${lessonPad}-`)) throw new LectureError(lec.rel, s.line, `section ID "${s.id}" should start with l${lessonPad}- for lesson ${meta.lesson}`);
    }

    const files = {};
    let fileSeq = 0;
    const ctx = {
      env: meta.env ?? course.env ?? 'colab',
      install: meta.install ?? course.install ?? null,
      installShown: false,
      dev,
      cellCount: 0,
      figureCount: 0,
      sourceDir: dir,
      lessonPad,
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
      lessonPad,
      sectionsHtml,
      toc,
      sectionCount: lec.sections.length,
      lessonNav: lessonNavHtml(navInfo(lectures[index - 1]), navInfo(lectures[index + 1])),
      scheduled: scheduleFor(course, meta.lesson),
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

// This year's date for a lesson, from course.yml schedule (lesson pages never hard-code it).
export function scheduleFor(course, lesson) {
  return (course.schedule ?? []).find((e) => Number(e.lesson) === Number(lesson)) ?? null;
}

// Course home: this year's schedule from course.yml, linking the lessons that exist.
function courseHomeHtml(course, lectures, dev) {
  const byLesson = new Map(lectures.map((l) => [Number(l.meta.lesson), l]));
  const entries = course.schedule?.length ? course.schedule : lectures.map((l) => ({ lesson: l.meta.lesson }));
  const items = entries
    .map((e) => {
      const date = formatDate(e.date);
      const when = [date ? T(date) : '', e.week ? T(UI.week(e.week)) : ''].filter(Boolean).join('<span aria-hidden="true"> · </span>');
      if (e.lesson == null) {
        return `<li class="sched-row is-event"><span class="sched-when">${when}</span><span class="sched-title">${T([e.note_th ?? e.note ?? '', e.note ?? e.note_th ?? ''])}</span></li>`;
      }
      const l = byLesson.get(Number(e.lesson));
      const title = l?.meta.title ?? e.title ?? '';
      const titleTh = l?.meta.title_th ?? e.title_th;
      const name = `<span class="sched-n">${T(UI.lesson(e.lesson))}</span><span class="sched-name"><span lang="en">${esc(title)}</span>${titleTh ? `<span class="cell-sub" data-only="th">${esc(titleTh)}</span>` : ''}</span>`;
      return l
        ? `<li class="sched-row is-open"><span class="sched-when">${when}</span><a class="sched-title" href="${l.slug}.html">${name}</a></li>`
        : `<li class="sched-row"><span class="sched-when">${when}</span><span class="sched-title">${name}<span class="sched-soon">${T(UI.notYet)}</span></span></li>`;
    })
    .join('');
  const sectionsHtml = `<section class="card section"><div class="section-body"><div class="section-head"><h2 id="sched-title">${T(['ตารางเรียน', 'Schedule'])}</h2></div><ul class="sched" aria-labelledby="sched-title">${items}</ul></div></section>`;
  return pageHtml({
    course,
    meta: { lesson: '', title: course.title, title_th: course.title_th },
    lessonPad: '',
    sectionsHtml,
    toc: '',
    sectionCount: lectures.length,
    lessonNav: '',
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
