// The page shell around a rendered lecture: header, banner, table of contents, prev/next.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, icon, T, UI, formatDate } from './render.mjs';
import { fontFaceCss, preloadLinks } from './fonts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const COURSE_DIR = path.resolve(HERE, '..');
const read = (p) => fs.readFileSync(path.join(COURSE_DIR, p), 'utf8');

// tokens.css pulls fonts from Google with @import; the build self-hosts them instead (fonts.mjs)
const tokensCss = () => read('tokens.css').replace(/@import\s+url\([^)]*\)[^;]*;\s*/g, '');

// Applied before first paint so the page never flashes the wrong language.
const LANG_INIT = `(function(){var l='th';try{var s=localStorage.getItem('course-lang');if(s==='en'||s==='th')l=s}catch(e){}var r=document.documentElement;r.setAttribute('data-lang',l);r.lang=l})();`;

const jsonForScript = (obj) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Course pages live at /courses/<course>/ on jakapunt.github.io, so the main site is two levels up.
const SITE = '../../';

export function pageHtml({ course, meta, lessonPad, sectionsHtml, toc, sectionCount, lessonNav, files, dev, focusDeck = '', srcFile = null, frontMatter = null, scheduled = null }) {
  // dev preview only: where the in-page editor saves to
  const editable = dev && srcFile;
  const isHome = !meta.lesson;
  const fontsUrl = '../_fonts/';
  const lesson = Number(meta.lesson);
  const title = `L${lessonPad} · ${meta.title} · ${course.title}`;
  const totalLessons = course.lessons ?? (course.schedule ?? []).filter((e) => e.lesson != null).length;

  const pills = [`<li class="pill pill-accent">${T(UI.lessonOf(lesson, totalLessons || null))}</li>`, `<li class="pill">${T(UI.sections(sectionCount))}</li>`];
  const date = formatDate(scheduled?.date);
  if (date) pills.push(`<li class="pill">${T(date)}</li>`);
  if (meta.lab) {
    const lab = typeof meta.lab === 'string' ? { name: meta.lab } : meta.lab;
    pills.push(
      lab.url
        ? `<li><a class="pill" href="${esc(lab.url)}" target="_blank" rel="noopener"><span lang="en">Lab: ${esc(lab.name)}</span>${icon('external', 12)}</a></li>`
        : `<li class="pill"><span lang="en">Lab: ${esc(lab.name)}</span></li>`,
    );
  }
  if (meta.reading) pills.push(`<li class="pill">${icon('book', 13)}${T([`${UI.reading[0]}:`, `${UI.reading[1]}:`])}<span lang="en">${esc(meta.reading)}</span></li>`);

  const leadTh = meta.lead_th ?? meta.lead_en;
  const leadEn = meta.lead_en ?? meta.lead_th;

  return `<!doctype html>
<html lang="th" data-lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<script>${LANG_INIT}</script>
${preloadLinks(fontsUrl)}
<style>
${fontFaceCss(fontsUrl)}
${tokensCss()}
${read('templates/page.css')}
${focusDeck ? read('templates/focus.css') : ''}
${editable ? read('templates/dev-edit.css') : ''}
</style>
</head>
<body>
<a class="skip" href="#main">${T(['ข้ามไปที่เนื้อหา', 'Skip to content'])}</a>
<header class="topbar">
<div class="wrap topbar-inner">
<nav class="crumbs" aria-label="เส้นทาง / Breadcrumb">
<a class="crumb crumb-site" href="${SITE}" lang="en">${esc(course.teacher ?? 'Home')}</a><span class="crumb-sep" aria-hidden="true">›</span>
<a class="crumb" href="${SITE}?materials">${T(UI.classMaterials)}</a><span class="crumb-sep" aria-hidden="true">›</span>
<a class="crumb crumb-course" href="index.html" lang="en"${isHome ? ' aria-current="page"' : ''}>${esc(course.title)}</a>
</nav>
<div class="top-actions">
<div class="lang-switch" role="group" aria-label="ภาษา / Language">
<button type="button" data-set-lang="th" aria-pressed="true">ไทย</button><button type="button" data-set-lang="en" lang="en" aria-pressed="false">EN</button>
</div>
${focusDeck ? `<button type="button" class="btn btn-dark btn-focus" data-fx="open" aria-keyshortcuts="F" title="Focus (F)">${icon('focus', 15)}<span lang="en">Focus</span></button>` : ''}
</div>
</div>
</header>
<div class="banner"${editable && frontMatter ? ` data-src="${frontMatter.line}-${frontMatter.end}"` : ''}>
<div class="wrap banner-inner">
<ul class="pills">${pills.join('')}</ul>
<h1 lang="en">${esc(meta.title)}</h1>
${meta.title_th ? `<p class="banner-sub" data-only="th">${esc(meta.title_th)}</p>` : ''}
<p class="banner-lead"><span data-only="th">${esc(leadTh ?? '')}</span><span data-only="en" lang="en">${esc(leadEn ?? '')}</span></p>
${isHome || !focusDeck ? '' : `<div class="banner-actions"><button type="button" class="btn btn-light" data-print-slides aria-describedby="pdf-hint">${icon('pdf', 16)}${T(['ดาวน์โหลด PDF (สไลด์)', 'Download PDF (slides)'])}</button><span class="banner-hint" id="pdf-hint">${T(['เปิดหน้าต่างพิมพ์ แล้วเลือก "บันทึกเป็น PDF"', 'Opens the print window; choose "Save as PDF"'])}</span></div>`}
</div>
</div>
<div class="wrap layout">
${toc}
<main id="main" tabindex="-1"${editable ? ` data-src-file="${esc(srcFile)}"` : ''}>
${sectionsHtml}
${lessonNav}
</main>
</div>
<div id="live" class="sr-only" aria-live="polite"></div>
${focusDeck}
<script type="application/json" id="course-files">${jsonForScript(files)}</script>
<script>
${read('templates/page.js')}
${read('templates/widgets.js')}
${focusDeck ? read('templates/focus.js') : ''}
</script>
${editable ? `<script>${read('templates/dev-edit.js')}</script>` : dev ? `<script>new EventSource('/__reload').onmessage=function(e){if(e.data==='reload')location.reload()}</script>` : ''}
</body>
</html>
`;
}

export function lessonNavHtml(prev, next) {
  const card = (w, dir) => {
    if (!w) return '';
    const wk = dir === 'prev' ? `← ${T(UI.lesson(w.lesson))}` : `${T(UI.lesson(w.lesson))} →`;
    return `<a class="week-card ${dir}" href="${esc(w.slug)}.html"><span class="wk">${wk}</span><span class="wk-title">${
      w.title_th ? `<span data-only="th">${esc(w.title_th)}</span><span data-only="en" lang="en">${esc(w.title)}</span>` : `<span lang="en">${esc(w.title)}</span>`
    }</span></a>`;
  };
  const inner = card(prev, 'prev') + card(next, 'next');
  return inner ? `<nav class="week-nav" aria-label="บทเรียนอื่น / Other lessons">${inner}</nav>` : '';
}
