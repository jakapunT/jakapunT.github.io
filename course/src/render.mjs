// Renders a parsed lecture (see parse.mjs) into the page-view HTML body.

import MarkdownIt from 'markdown-it';
import { LectureError, splitTrailingAttrs } from './parse.mjs';
import { highlightLines } from './highlight.mjs';
import { renderTransform } from './transform.mjs';

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, i, opts, env, self) => self.renderToken(tokens, i, opts));
md.renderer.rules.link_open = (tokens, i, opts, env, self) => {
  const href = tokens[i].attrGet('href') ?? '';
  if (/^https?:/.test(href)) {
    tokens[i].attrSet('target', '_blank');
    tokens[i].attrSet('rel', 'noopener');
  }
  return defaultLinkOpen(tokens, i, opts, env, self);
};

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const inline = (s) => md.renderInline(String(s ?? ''));
const block = (s) => md.render(String(s ?? ''));

// ---------------------------------------------------------------- UI text (Thai, English)

export const UI = {
  inLesson: ['ในบทเรียนนี้', 'In this lesson'],
  concept: ['แนวคิด', 'Concept'],
  example: ['ตัวอย่าง', 'Example'],
  code: ['โค้ด', 'Code'],
  exercise: ['แบบฝึกหัด', 'Exercise'],
  warning: ['ระวัง', 'Watch out'],
  weekOf: (w, n) => [`สัปดาห์ที่ ${w}${n ? ` จาก ${n}` : ''}`, `Week ${w}${n ? ` of ${n}` : ''}`],
  sections: (n) => [`${n} หัวข้อ`, `${n} sections`],
  showAnswer: ['ดูเฉลย', 'Show answer'],
  hideAnswer: ['ซ่อนเฉลย', 'Hide answer'],
  copy: ['คัดลอก', 'Copy'],
  week: (w) => [`สัปดาห์ที่ ${w}`, `Week ${w}`],
  notYet: ['ยังไม่เปิด', 'Not available yet'],
  mode: {
    pairs: ['ทำเป็นคู่', 'In pairs'],
    solo: ['ทำคนเดียว', 'On your own'],
    group: ['ทำเป็นกลุ่ม', 'In groups'],
    class: ['ทั้งชั้น', 'Whole class'],
  },
  installOnce: ['ติดตั้งใน Terminal ครั้งเดียว', 'Install once in the Terminal'],
  reading: ['อ่านเพิ่ม', 'Reading'],
};

// Both languages, one shown at a time by the ไทย/EN switch.
export const T = ([th, en], { thHtml = false, enHtml = false } = {}) =>
  `<span data-only="th">${thHtml ? th : esc(th)}</span><span data-only="en" lang="en">${enHtml ? en : esc(en)}</span>`;

// ---------------------------------------------------------------- icons (stroke, currentColor)

const ICON_PATHS = {
  concept: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.5M12 11v5"/>',
  example: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3Z"/>',
  code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
  warning: '<path d="M12 3l10 18H2L12 3Z"/><path d="M12 10v4M12 17v.5"/>',
  exercise: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  ok: '<path d="M5 12l5 5 9-10"/>',
  bad: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect height="12" rx="2" width="12" x="9" y="9"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
};
export const icon = (name, size = 14) =>
  `<svg aria-hidden="true" focusable="false" class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;

const tag = (kind) => `<span class="tag tag-${kind}">${icon(kind, 13)}${T(UI[kind])}</span>`;

// ---------------------------------------------------------------- page body

export function renderLecture(lecture, ctx) {
  const { meta, sections } = lecture;
  const sectionsHtml = sections.map((s, i) => renderSection(s, i, ctx)).join('\n');
  return { sectionsHtml, toc: renderToc(sections) };
}

function navLabel(s) {
  return s.attrs.nav ?? s.title.split(':')[0];
}

function renderToc(sections) {
  const items = sections
    .map(
      (s, i) =>
        `<li><a href="#${s.id}" data-toc="${s.id}"><span class="toc-n">${i + 1}</span><span lang="en">${inline(navLabel(s))}</span></a></li>`,
    )
    .join('');
  const legend = ['concept', 'example', 'code', 'exercise', 'warning']
    .map((k) => `<li><span class="swatch swatch-${k}" aria-hidden="true"></span>${T(UI[k])}</li>`)
    .join('');
  return `<nav class="toc card" aria-label="ในบทเรียนนี้ / In this lesson">
<p class="toc-title">${T(UI.inLesson)}</p>
<ol class="toc-list">${items}</ol>
<ul class="legend" aria-label="ประเภทเนื้อหา / Content kinds">${legend}</ul>
</nav>`;
}

const sid = (id) => id.toUpperCase();

function renderSection(s, index, ctx) {
  ctx.section = s;
  const summary = s.blocks.find((b) => b.type === 'container' && b.name === 'summary');
  const rest = s.blocks.filter((b) => b !== summary);
  const exercise = rest.length === 1 && rest[0].type === 'container' && rest[0].name === 'exercise' ? rest[0] : null;

  const heading = `<h2 id="${s.id}-title" lang="en">${inline(s.title)}</h2>${
    s.attrs.th ? `<p class="h-sub" data-only="th">${inline(s.attrs.th)}</p>` : ''
  }`;

  if (exercise) {
    return `<article class="section card section-exercise" id="${s.id}" aria-labelledby="${s.id}-title">
<div class="strip strip-exercise">${exerciseLabel(exercise)}<span class="sid">${sid(s.id)}</span></div>
<div class="section-body">
<div class="section-head">${heading}</div>
${renderExerciseBody(exercise, ctx)}
</div>
</article>`;
  }

  const strip = summary
    ? `<div class="strip"><p class="summary-text">${renderSummary(summary)}</p><span class="sid">${sid(s.id)}</span></div>`
    : '';
  const head = summary
    ? `<div class="section-head">${heading}</div>`
    : `<div class="section-head section-head-row"><div>${heading}</div><span class="sid">${sid(s.id)}</span></div>`;
  return `<article class="section card" id="${s.id}" aria-labelledby="${s.id}-title">
${strip}
<div class="section-body">
${head}
${renderBlocks(rest, ctx)}
</div>
</article>`;
}

function renderSummary(node) {
  const by = {};
  for (const line of node.lines) {
    const m = line.match(/^\s*(th|en)\s*:\s*(.*)$/);
    if (m) by[m[1]] = m[2];
    else if (line.trim()) throw new LectureError(ctxFile(), node.line, '::: summary lines must start with "th:" or "en:"');
  }
  if (!by.th && !by.en) throw new LectureError(ctxFile(), node.line, '::: summary is empty');
  return T([inline(by.th ?? by.en), inline(by.en ?? by.th)], { thHtml: true, enHtml: true });
}

let currentFile = '';
export const ctxFile = () => currentFile;
export function setFile(f) {
  currentFile = f;
}

// ---------------------------------------------------------------- blocks

const CODE_LANGS_SPECIAL = new Set(['output', 'dataframe', 'prompt', 'figure', 'plot', 'error', 'formula', 'read-result']);

export function renderBlocks(nodes, ctx) {
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type === 'md') out.push(block(n.text));
    else if (n.type === 'table') out.push(renderTable(n));
    else if (n.type === 'deflist') out.push(renderDeflist(n, ctx));
    else if (n.type === 'fence') {
      if (n.lang === 'output') throw new LectureError(ctxFile(), n.line, '```output must come right after a code block');
      if (CODE_LANGS_SPECIAL.has(n.lang)) {
        out.push(renderLaterBlock(n.lang));
        continue;
      }
      // a code cell may be followed by its ```output and ::: step-outputs
      let output = null;
      let stepOutputs = null;
      if (nodes[i + 1]?.type === 'fence' && nodes[i + 1].lang === 'output') output = nodes[++i];
      if (nodes[i + 1]?.type === 'container' && nodes[i + 1].name === 'step-outputs') stepOutputs = nodes[++i];
      out.push(renderCode(n, output, stepOutputs, ctx));
    } else if (n.type === 'container') out.push(renderContainer(n, ctx));
  }
  return out.join('\n');
}

function renderContainer(n, ctx) {
  switch (n.name) {
    case 'th':
    case 'en':
      return `<div data-only="${n.name}" lang="${n.name}">${renderBlocks(n.children, ctx)}</div>`;
    case 'concept':
      return `<div class="kind kind-concept">${tag('concept')}${renderBlocks(n.children, ctx)}</div>`;
    case 'example':
      return `<div class="kind kind-example"><div class="kind-head">${icon('example')}${T(UI.example)}</div><div class="kind-body">${renderBlocks(n.children, ctx)}</div></div>`;
    case 'warning':
      return `<div class="kind kind-warning">${icon('warning', 18)}<div class="kind-warning-body"><p class="kind-warning-label">${T(UI.warning)}</p>${renderBlocks(n.children, ctx)}</div></div>`;
    case 'exercise':
      return `<div class="kind kind-exercise"><div class="strip strip-exercise">${exerciseLabel(n)}</div><div class="kind-body">${renderExerciseBody(n, ctx)}</div></div>`;
    case 'tokens':
      return renderTokens(n);
    case 'focus':
      return `<div class="display">${renderFocusContent(n, ctx)}</div>`;
    case 'answer':
      return renderAnswer(n, ctx);
    case 'steps':
      // projector-only: focus mode shows these one step at a time (focus.mjs)
      return '';
    case 'transform':
      return renderTransform(n, { ...ctx, file: ctxFile(), renderBlocks: (nodes) => renderBlocks(nodes, ctx) });
    case 'summary':
      throw new LectureError(ctxFile(), n.line, '::: summary must sit directly under a section heading');
    case 'step-outputs':
      throw new LectureError(ctxFile(), n.line, '::: step-outputs must come right after a code block (and its ```output)');
    default:
      throw new LectureError(ctxFile(), n.line, `unknown block "::: ${n.name}"`);
  }
}

// `::: focus` holds one short thing to show big: plain text or a tokens row.
function renderFocusContent(n, ctx) {
  const onlyText = n.children.length === 1 && n.children[0].type === 'md' && !n.children[0].text.includes('\n\n');
  return onlyText ? `<p class="display-text">${inline(n.children[0].text.trim())}</p>` : renderBlocks(n.children, ctx);
}

function exerciseLabel(n) {
  const parts = [T(UI.exercise)];
  if (n.attrs.time) {
    const en = n.attrs.time_en ?? n.attrs.time.replace(/\s*นาที/, ' min').replace(/\s*ชั่วโมง/, ' hr');
    parts.push(T([n.attrs.time, en]));
  }
  if (n.attrs.mode) {
    const m = UI.mode[n.attrs.mode];
    if (!m) throw new LectureError(ctxFile(), n.line, `exercise mode="${n.attrs.mode}" must be one of ${Object.keys(UI.mode).join(', ')}`);
    parts.push(T(m));
  }
  return `<span class="strip-label">${icon('exercise', 15)}${parts.join('<span aria-hidden="true"> · </span>')}</span>`;
}

let answerSeq = 0;
function renderExerciseBody(n, ctx) {
  const answers = n.children.filter((c) => c.type === 'container' && c.name === 'answer');
  const others = n.children.filter((c) => !answers.includes(c));
  return `<div class="exercise-body">${renderBlocks(others, ctx)}${answers.map((a) => renderAnswer(a, ctx)).join('')}</div>`;
}

function renderAnswer(n, ctx) {
  const id = `answer-${ctx.section?.id ?? 'x'}-${++answerSeq}`;
  // "- ตา | กลม: {th="..." en="..."}" items become answer cards
  const items = n.lines.filter((l) => l.trim());
  const parsed = items.map((l) => {
    const m = l.match(/^\s*[-*]\s+(.*)$/);
    if (!m) return null;
    const [text, attrs] = splitTrailingAttrs(m[1]);
    if (!attrs.th && !attrs.en) return null;
    return { term: text.replace(/:\s*$/, ''), th: attrs.th ?? attrs.en, en: attrs.en ?? attrs.th };
  });
  const body = parsed.every(Boolean)
    ? `<ul class="answer-grid">${parsed
        .map((p) => `<li class="answer-card"><span class="answer-term">${inline(p.term)}</span><span class="answer-meaning">${T([inline(p.th), inline(p.en)], { thHtml: true, enHtml: true })}</span></li>`)
        .join('')}</ul>`
    : renderBlocks(n.children, ctx);
  return `<button type="button" class="btn btn-answer" aria-expanded="false" aria-controls="${id}"><span class="when-closed">${T(UI.showAnswer)}</span><span class="when-open">${T(UI.hideAnswer)}</span></button>
<div class="answer" id="${id}" hidden>${body}</div>`;
}

export function renderTokens(n) {
  const text = n.lines.join(' ').trim();
  const { label, result, note_th, note_en } = n.attrs;
  const content = text.includes('|')
    ? `<ul class="chips" aria-label="tokens">${text
        .split('|')
        .map((t) => `<li class="chip">${inline(t.trim())}</li>`)
        .join('')}</ul>`
    : `<p class="tokens-string">${inline(text)}</p>`;
  let note = '';
  if (label || note_th || note_en) {
    const mark = result === 'ok' ? icon('ok') : result === 'bad' ? icon('bad') : '';
    const sr = result === 'ok' ? T(['ถูก: ', 'Correct: ']) : result === 'bad' ? T(['ผิด: ', 'Wrong: ']) : '';
    const words = note_th || note_en ? T([note_th ?? note_en, note_en ?? note_th]) : '';
    note = `<p class="tokens-note${result ? ` tokens-${result}` : ''}">${mark}<span class="sr-only">${sr}</span>${label ? `<code>${esc(label)}</code>` : ''}${words}</p>`;
  }
  return `<div class="tokens">${content}${note}</div>`;
}


// ---------------------------------------------------------------- tables and definition lists

function cellHtml(cell, { code = false } = {}) {
  const [text, attrs] = splitTrailingAttrs(cell);
  return `<span lang="en">${inline(text)}</span>${attrs.th ? `<span class="cell-sub" data-only="th">${inline(attrs.th)}</span>` : ''}`;
}

export function renderTable(n) {
  const headText = n.head.map((c) => splitTrailingAttrs(c)[0].trim().toLowerCase());
  const k = headText.length;
  // "| Step | Before | After |" tables render as before → after rows
  if (k >= 3 && headText[k - 2] === 'before' && headText[k - 1] === 'after') {
    const head = `<tr>${n.head.slice(0, k - 2).map((c) => `<th scope="col">${cellHtml(c)}</th>`).join('')}<th scope="col">${cellHtml(n.head[k - 2])}</th><th aria-hidden="true"></th><th scope="col">${cellHtml(n.head[k - 1])}</th></tr>`;
    const rows = n.rows
      .map(
        (r) =>
          `<tr>${r
            .slice(0, k - 2)
            .map((c, j) => (j === 0 ? `<th scope="row">${cellHtml(c)}</th>` : `<td>${cellHtml(c)}</td>`))
            .join('')}<td>${inline(r[k - 2])}</td><td class="ba-arrow" aria-hidden="true">→</td><td>${inline(r[k - 1])}</td></tr>`,
      )
      .join('');
    return `<div class="table-scroll"><table class="ba-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  }
  const al = (j) => (n.align[j] ? ` style="text-align:${n.align[j]}"` : '');
  const head = `<tr>${n.head.map((c, j) => `<th scope="col"${al(j)}>${cellHtml(c)}</th>`).join('')}</tr>`;
  const rows = n.rows.map((r) => `<tr>${r.map((c, j) => `<td${al(j)}>${cellHtml(c)}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="data-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
}

export function renderDeflist(n, ctx) {
  return `<dl class="terms">${n.items
    .map((it) => {
      const [term, attrs] = splitTrailingAttrs(it.term);
      return `<div class="term-row"><dt lang="en">${inline(term)}${attrs.th ? `<span class="cell-sub" data-only="th">${inline(attrs.th)}</span>` : ''}</dt>${it.defs
        .map((d) => `<dd>${renderBlocks(d, ctx)}</dd>`)
        .join('')}</div>`;
    })
    .join('')}</dl>`;
}

// ---------------------------------------------------------------- code cells

const PY_STATEMENT = /^(import|from|def|class|if|elif|else|for|while|with|try|except|finally|return|raise|assert|pass|break|continue|global|nonlocal|del|async|await|print\s*\(|@|#)/;

// VS Code runs a file, which prints nothing for a bare final expression, so wrap it in print().
export function wrapLastExpression(code) {
  const lines = code.split('\n');
  let k = lines.length - 1;
  while (k >= 0 && !lines[k].trim()) k--;
  if (k < 0) return code;
  const last = lines[k];
  if (/^\s/.test(last) || PY_STATEMENT.test(last.trim())) return code;
  // an assignment (=, +=, ...) outside brackets is a statement
  let depth = 0;
  let quote = null;
  let comment = '';
  let expr = last;
  for (let c = 0; c < last.length; c++) {
    const ch = last[c];
    if (quote) { if (ch === quote && last[c - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '#') { expr = last.slice(0, c).trimEnd(); comment = `  ${last.slice(c)}`; break; }
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === '=' && depth === 0 && last[c + 1] !== '=' && !'=!<>'.includes(last[c - 1])) return code;
  }
  // a line continued from the previous one (open bracket or backslash) is left alone
  const before = lines.slice(0, k).join('\n');
  const opens = (before.match(/[([{]/g) ?? []).length - (before.match(/[)\]}]/g) ?? []).length;
  if (opens > 0 || /\\\s*$/.test(lines[k - 1] ?? '')) return code;
  lines[k] = `print(${expr.trim()})${comment}`;
  return lines.join('\n');
}

export function notebookJson(cells) {
  return JSON.stringify(
    {
      cells: cells.map((src) => ({
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: src.split('\n').map((l, i, a) => (i < a.length - 1 ? `${l}\n` : l)),
      })),
      metadata: {
        kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
        language_info: { name: 'python' },
      },
      nbformat: 4,
      nbformat_minor: 5,
    },
    null,
    1,
  );
}

function renderCode(n, output, stepOutputs, ctx) {
  const env = ctx.env;
  const isPython = ['python', 'py', 'python3'].includes(n.lang);
  const cell = ++ctx.cellCount;
  let code = n.text.replace(/\s+$/, '');
  if (env === 'vscode' && isPython) code = wrapLastExpression(code);

  const install = isPython && ctx.install && !ctx.installShown ? ctx.install : null;
  if (install) ctx.installShown = true;

  const lines = highlightLines(code, n.lang);
  let linesHtml = lines.map((l, k) => `<span class="ln" data-ln="${k + 1}">${l || ' '}</span>`).join('');
  let copyText = code;
  let pre = '';
  if (install && env === 'colab') {
    linesHtml = `<span class="ln ln-install">!pip install -q ${esc(install)}</span>${linesHtml}`;
    copyText = `!pip install -q ${install}\n${code}`;
  }
  if (install && env === 'vscode') {
    pre = `<div class="install-line"><span class="install-hint">${T(UI.installOnce)}</span><code class="install-cmd"><span class="prompt" aria-hidden="true">$</span> pip install ${esc(install)}</code></div>`;
  }

  const file = n.attrs.file;
  const base = file ? file.replace(/\.[^.]+$/, '') : `week${ctx.weekPad}_cell${cell}`;
  const copyId = ctx.addFile({ text: copyText });
  let downloadBtn = '';
  if (isPython && env === 'colab') {
    const nb = ctx.notebookFor(n) ?? notebookJson(install ? [`!pip install -q ${install}`, code] : [code]);
    const id = ctx.addFile({ name: `${base}.ipynb`, type: 'application/x-ipynb+json', text: nb });
    downloadBtn = `<button type="button" class="btn btn-dark" data-download="${id}">${icon('download')}<span lang="en">Download .ipynb</span></button>`;
  } else if (isPython && env === 'vscode') {
    const id = ctx.addFile({ name: file ?? `${base}.py`, type: 'text/x-python', text: `${code}\n` });
    downloadBtn = `<button type="button" class="btn btn-dark" data-download="${id}">${icon('download')}<span lang="en">Download .py</span></button>`;
  }

  const label =
    env === 'vscode' && file
      ? `<span class="cell-file">${esc(file)}</span>`
      : isPython && env === 'colab'
        ? `<span class="cell-n" aria-label="cell ${cell}">[${cell}]</span>`
        : '';

  let out = '';
  if (output) {
    const run = env === 'vscode' && isPython ? `<span class="out-cmd">$ python ${esc(file ?? `${base}.py`)}</span>\n` : '';
    out = `<div class="code-out"><span class="out-label" lang="en">Out</span><pre>${run}${esc(output.text.replace(/\s+$/, ''))}</pre></div>`;
  }

  // focus-mode step-through data (milestone 2)
  const stepAttr = n.attrs.steps ? ` data-steps="${esc(n.attrs.steps)}"` : '';
  let stepOut = '';
  if (stepOutputs) {
    const map = {};
    for (const l of stepOutputs.lines) {
      const m = l.match(/^\s*(\d+)\s*:\s?(.*)$/);
      if (m) map[m[1]] = m[2];
      else if (l.trim()) throw new LectureError(ctxFile(), stepOutputs.line, '::: step-outputs lines look like "4: output"');
    }
    stepOut = ` data-step-outputs="${esc(JSON.stringify(map))}"`;
  }

  return `${pre}<figure class="code-cell" data-env="${env}"${stepAttr}${stepOut}>
<figcaption class="code-head"><span class="code-tag">${icon('code')}${T(UI.code)}</span>${label}<span class="code-actions"><button type="button" class="btn btn-light" data-copy="${copyId}">${icon('copy')}${T(UI.copy)}</button>${downloadBtn}</span></figcaption>
<pre class="code" tabindex="0"><code>${linesHtml}</code></pre>${out}
</figure>`;
}

function renderLaterBlock(kind) {
  return `<div class="later-block"><code>${esc(kind)}</code> block: coming in milestone 3</div>`;
}
