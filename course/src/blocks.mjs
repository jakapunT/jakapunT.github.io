// Content blocks written as fenced code: ```dataframe and ```prompt (CLAUDE.md §6).

import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';
import { esc, icon, inline, T } from './render.mjs';
import { parseCsv } from './transform.mjs';
import { LectureError } from './parse.mjs';

// ---------------------------------------------------------------- ```dataframe

const isInt = (s) => /^-?\d+$/.test(s);
const isFloat = (s) => /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s);
const isBool = (s) => /^(true|false)$/i.test(s);

// The dtype pandas.read_csv would give a column (int64, float64, bool or object).
export function inferDtype(values) {
  const present = values.filter((v) => v !== '');
  const missing = present.length < values.length;
  if (!present.length) return 'float64';
  if (present.every(isBool)) return missing ? 'object' : 'bool';
  if (present.every(isInt)) return missing ? 'float64' : 'int64';
  if (present.every(isFloat)) return 'float64';
  return 'object';
}

// pandas prints a float column with the same number of decimals on every row.
export function formatColumn(values, dtype) {
  if (dtype === 'float64') {
    const decimals = Math.max(1, ...values.filter((v) => v !== '').map((v) => (v.includes('.') ? v.split('.')[1].length : 0)));
    return values.map((v) => (v === '' ? 'NaN' : Number(v).toFixed(Math.min(decimals, 6))));
  }
  if (dtype === 'bool') return values.map((v) => (v.toLowerCase() === 'true' ? 'True' : 'False'));
  return values.map((v) => {
    if (v === '') return 'NaN';
    if (dtype === 'object' && isBool(v)) return v.toLowerCase() === 'true' ? 'True' : 'False';
    return v.length > 50 ? `${v.slice(0, 47)}...` : v; // pandas display.max_colwidth
  });
}

export function renderDataframe(n, ctx) {
  const { src, name = 'df', show = 5 } = n.attrs;
  const text = src ? ctx.readData(src, n.line) : n.text;
  if (!text.trim()) throw new LectureError(ctx.file, n.line, '```dataframe needs src="data/file.csv" or CSV lines inside the block');
  const csv = parseCsv(text);
  const ncols = csv.header.length;
  const nrows = csv.rows.length;
  const limit = Math.max(1, Number(show) || 5);
  const shown = csv.rows.slice(0, limit);
  const cols = csv.header.map((h, j) => {
    const all = csv.rows.map((r) => (r[j] ?? '').trim());
    const dtype = inferDtype(all);
    return { name: h, dtype, cells: formatColumn(shown.map((r) => (r[j] ?? '').trim()), dtype) };
  });
  const num = (c) => c.dtype === 'int64' || c.dtype === 'float64';

  const head = `<tr><th scope="col" class="df-index"><span class="sr-only">index</span></th>${cols
    .map((c) => `<th scope="col" class="${num(c) ? 'df-num' : ''}"><span class="df-col">${esc(c.name)}</span><span class="df-dtype">${c.dtype}</span></th>`)
    .join('')}</tr>`;
  const body = shown
    .map((_, i) => `<tr><th scope="row" class="df-index">${i}</th>${cols.map((c) => `<td class="${num(c) ? 'df-num' : ''}${c.cells[i] === 'NaN' ? ' df-nan' : ''}">${esc(c.cells[i])}</td>`).join('')}</tr>`)
    .join('');
  const more = nrows > limit ? `<tr class="df-more"><th scope="row" class="df-index">…</th>${cols.map(() => '<td>…</td>').join('')}</tr>` : '';

  const fileName = src ? path.basename(src) : `${name}.csv`;
  const copyId = ctx.addFile({ text: `${name} = pd.read_csv("${fileName}")` });
  const csvId = ctx.addFile({ name: fileName, type: 'text/csv;charset=utf-8', text: text.endsWith('\n') ? text : `${text}\n` });
  return `<figure class="df">
<figcaption class="df-head"><span class="df-tag">${icon('table', 14)}<span lang="en">DataFrame</span> <code>${esc(name)}</code></span><span class="code-actions"><button type="button" class="btn btn-light" data-copy="${copyId}">${icon('copy')}${T(['คัดลอกโค้ด', 'Copy code'])}</button><button type="button" class="btn btn-dark" data-download="${csvId}">${icon('download')}<span lang="en">Download CSV</span></button></span></figcaption>
<div class="table-scroll df-scroll" tabindex="0" role="region" aria-label="${esc(name)}"><table class="df-table"><thead>${head}</thead><tbody>${body}${more}</tbody></table></div>
<p class="df-shape"><span lang="en">${nrows} rows × ${ncols} columns</span>${nrows > limit ? ` ${T([`(แสดง ${limit} แถวแรก)`, `(first ${limit} shown)`])}` : ''}</p>
</figure>`;
}

// ---------------------------------------------------------------- ```prompt

const ROLE = {
  system: ['ระบบ (system)', 'System'],
  user: ['ผู้ใช้ (user)', 'User'],
  output: ['ผลลัพธ์ที่คาดไว้', 'Expected output'],
};

export function renderPrompt(n, ctx) {
  // th: | ... / en: | ...  → one prompt per language, each with its own Copy button
  let bilingual = null;
  try {
    const y = loadYaml(n.text);
    if (y && typeof y === 'object' && !Array.isArray(y) && typeof y.th === 'string' && typeof y.en === 'string') bilingual = y;
  } catch {
    /* not YAML */
  }
  if (bilingual) {
    const title = n.attrs.title
      ? `<span class="prompt-title">${n.attrs.title_th ? TH(n.attrs.title_th, n.attrs.title) : inline(n.attrs.title)}</span>`
      : n.attrs.attach
        ? `<span class="prompt-title">${T(['prompt ที่เขียนโค้ดนี้', 'the prompt that writes this code'])}</span>`
        : '';
    const copy = (lang) => {
      const id = ctx.addFile({ text: bilingual[lang].trim() });
      return `<button type="button" class="btn btn-light" data-copy="${id}" data-only="${lang}"${lang === 'en' ? ' lang="en"' : ''}>${icon('copy')}${lang === 'th' ? 'คัดลอก' : 'Copy'}</button>`;
    };
    return `<figure class="prompt-card">
<figcaption class="prompt-head"><span class="prompt-tag">${icon('chat', 14)}<span lang="en">Prompt</span></span>${title}<span class="code-actions">${copy('th')}${copy('en')}</span></figcaption>
<div class="prompt-part prompt-user" data-only="th" lang="th"><pre class="prompt-text">${esc(bilingual.th.trim())}</pre></div>
<div class="prompt-part prompt-user" data-only="en" lang="en"><pre class="prompt-text">${esc(bilingual.en.trim())}</pre></div>
</figure>`;
  }
  let parts = null;
  try {
    const y = loadYaml(n.text);
    if (y && typeof y === 'object' && !Array.isArray(y) && Object.keys(y).some((k) => ROLE[k])) parts = y;
  } catch {
    /* not YAML: the whole block is the prompt */
  }
  const roles = parts
    ? Object.keys(ROLE).filter((k) => parts[k] != null).map((k) => ({ role: k, text: typeof parts[k] === 'string' ? parts[k] : JSON.stringify(parts[k]) }))
    : [{ role: 'user', text: n.text }];
  const copyText = roles.filter((r) => r.role !== 'output').map((r) => (roles.length > 1 ? `${r.role}: ${r.text}` : r.text)).join('\n\n').trim();
  const copyId = ctx.addFile({ text: copyText });
  // title_th gives the Thai title; title alone shows in both languages
  const title = n.attrs.title ? `<span class="prompt-title">${n.attrs.title_th ? TH(n.attrs.title_th, n.attrs.title) : inline(n.attrs.title)}</span>` : '';
  return `<figure class="prompt-card">
<figcaption class="prompt-head"><span class="prompt-tag">${icon('chat', 14)}<span lang="en">Prompt</span></span>${title}<span class="code-actions"><button type="button" class="btn btn-light" data-copy="${copyId}">${icon('copy')}${T(['คัดลอก', 'Copy'])}</button></span></figcaption>
${roles
  .map((r) => `<div class="prompt-part prompt-${r.role}">${roles.length > 1 || r.role !== 'user' ? `<p class="prompt-role">${T(ROLE[r.role])}</p>` : ''}<pre class="prompt-text">${esc(r.text.replace(/\s+$/, ''))}</pre></div>`)
  .join('')}
</figure>`;
}

// ---------------------------------------------------------------- ```figure

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };

// A plot or card image as a data URI (it must sit inside the encrypted page). Plots come from
// ```output {plot="images/….png"}, which `npm run outputs` writes from the cell's figure.
export function imageTag(src, ctx, alt = '', line = 1) {
  const file = path.join(ctx.sourceDir, src);
  if (!fs.existsSync(file)) {
    return `<div class="fig-placeholder">${icon('image', 22)}<span>${T(['ยังไม่มีรูป (รัน npm run outputs)', 'Image not made yet (run npm run outputs)'])}</span><code>${esc(src)}</code></div>`;
  }
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) throw new LectureError(ctx.file, line, `image "${src}" must be .png, .jpg, .gif or .webp`);
  const bytes = fs.readFileSync(file);
  if (bytes.length > 300 * 1024) console.warn(`warning: ${src} is ${Math.round(bytes.length / 1024)} KB; compress it below 300 KB (it is embedded in the page)`);
  return `<img src="data:${type};base64,${bytes.toString('base64')}" alt="${esc(alt)}">`;
}

// Images go inside the encrypted page: SVG inline (page fonts, tokens.css colours, ไทย/EN
// labels), other images as data URIs. Figures are numbered per lesson: รูปที่ 10.1, 10.2 ...
export function renderFigure(n, ctx) {
  // the same image shown twice (page view and a projector-only ::: focus) keeps one number
  ctx.figureBySrc ??= new Map();
  n.figNo ??= (n.attrs.src && ctx.figureBySrc.get(n.attrs.src)) || ++ctx.figureCount;
  if (n.attrs.src && !ctx.figureBySrc.has(n.attrs.src)) ctx.figureBySrc.set(n.attrs.src, n.figNo);
  const label = `${Number(ctx.lessonPad)}.${n.figNo}`;
  const { src, source, alt } = n.attrs;
  const captionTh = n.text.trim();
  const captionEn = n.attrs.en ?? captionTh;
  const file = src ? path.join(ctx.sourceDir, src) : null;

  let media;
  if (!file || !fs.existsSync(file)) {
    media = `<div class="fig-placeholder">${icon('image', 22)}<span>${T(['ยังไม่มีรูป', 'Image not added yet'])}</span><code>${esc(src ?? 'images/….png')}</code></div>`;
  } else if (file.endsWith('.svg')) {
    media = fs
      .readFileSync(file, 'utf8')
      .replace(/<\?xml[^>]*>\s*/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '');
  } else {
    const type = MIME[path.extname(file).toLowerCase()];
    if (!type) throw new LectureError(ctx.file, n.line, `figure src "${src}" must be .svg, .png, .jpg, .gif or .webp`);
    const bytes = fs.readFileSync(file);
    if (bytes.length > 300 * 1024) console.warn(`warning: ${src} is ${Math.round(bytes.length / 1024)} KB; compress it below 300 KB (it is embedded in the page)`);
    media = `<img src="data:${type};base64,${bytes.toString('base64')}" alt="${esc(alt ?? captionEn)}">`;
  }
  const credit = source ? ` <a class="fig-source" href="${esc(source)}" target="_blank" rel="noopener">${T(['ที่มา', 'Source'])}</a>` : '';
  return `<figure class="fig">
<div class="fig-media">${media}</div>
<figcaption class="fig-caption"><span class="fig-n">${T([`รูปที่ ${label}`, `Figure ${label}`])}</span> ${T([inline(captionTh), inline(captionEn)], { thHtml: true, enHtml: true })}${credit}</figcaption>
</figure>`;
}

// ---------------------------------------------------------------- ```index-explorer

// An interactive table for .loc / .iloc: click a cell, row label or column name to see both
// ways to reach it; switch to a sorted or filtered view to see labels stay while positions move.
// The table itself is drawn by templates/widgets.js from the data embedded here.
//   ```index-explorer {src="data/reviews_small.csv" name="small" cols="Airline Name,Rating,Seat Type" sort="Rating" filter="Rating >= 7"}
export function renderIndexExplorer(n, ctx) {
  const { src, name = 'df', cols, sort, filter, rows, pick } = n.attrs;
  if (!src) throw new LectureError(ctx.file, n.line, '```index-explorer needs src="data/....csv"');
  const csv = parseCsv(ctx.readData(src, n.line));
  if (rows) csv.rows = csv.rows.slice(0, Number(rows)); // the first rows only: labels stay 0, 1, 2 ...
  const names = cols ? cols.split(',').map((c) => c.trim()) : csv.header;
  const idx = names.map((c) => {
    const j = csv.header.indexOf(c);
    if (j < 0) throw new LectureError(ctx.file, n.line, `index-explorer: no column "${c}" in ${src}`);
    return j;
  });
  const columns = idx.map((j, k) => {
    const values = csv.rows.map((r) => (r[j] ?? '').trim());
    const dtype = inferDtype(values);
    const numeric = dtype === 'int64' || dtype === 'float64';
    return { name: names[k], numeric, shown: formatColumn(values, dtype), raw: numeric ? values.map((v) => (v === '' ? null : Number(v))) : null };
  });
  const f = filter?.match(/^\s*(.+?)\s*>=\s*(-?[\d.]+)\s*$/);
  if (filter && !f) throw new LectureError(ctx.file, n.line, 'index-explorer filter must look like "Rating >= 7"');
  const col = (c) => {
    const k = names.indexOf(c);
    if (k < 0 || !columns[k].numeric) throw new LectureError(ctx.file, n.line, `index-explorer: "${c}" must be one of the shown number columns`);
    return k;
  };
  const data = {
    name,
    columns,
    sort: sort ? col(sort) : null,
    filter: f ? { col: col(f[1]), min: Number(f[2]) } : null,
    pick: Math.min(Number(pick) || 0, csv.rows.length - 1), // the label selected at the start
  };
  return `<figure class="ixp" data-ixp="${esc(JSON.stringify(data))}">
<figcaption class="ixp-head">${icon('pointer', 16)}${T(['ลองเล่น: index อยู่ตรงไหนในตาราง', 'Try it: where is the index?'])}</figcaption>
<div class="ixp-body"><p class="ixp-nojs">${T(['ส่วนนี้ต้องเปิด JavaScript', 'This part needs JavaScript'])}</p></div>
</figure>`;
}

// ---------------------------------------------------------------- ```cards
// Infographic cards, one per situation: what happens to a small column (before → after), what
// to do, and the prompt to give AI. YAML list; each item:
//   when_th / when_en, do_th / do_en, prompt_th / prompt_en, tone (keep | drop | label | check),
//   col (column name), before (list, ~ for empty), and either after (list: ~ empty, "-" removed)
//   or after_th / after_en (a short result in words).
const TONES = new Set(['keep', 'drop', 'label', 'check']);
const TH = (th, en) => T([inline(String(th)), inline(String(en ?? th))], { thHtml: true, enHtml: true });

// A card cell's text, escaped, with line-break points where a long code name may wrap without
// cutting a word: after _ . / and between camelCase parts (Sequential·Feature·Selector).
const cell = (v) => esc(String(v)).replace(/([_./])(?=\w)/g, '$1<wbr>').replace(/([a-z])(?=[A-Z][a-z])/g, '$1<wbr>');

// The same break points inside inline `code` of a card's text.
const codeBreaks = (html) => html.replace(/<code>([^<]*)<\/code>/g, (m, c) => `<code>${c.replace(/([_./])(?=\w)/g, '$1<wbr>').replace(/([a-z])(?=[A-Z][a-z])/g, '$1<wbr>')}</code>`);

function miniColumn(name, cells, highlight) {
  const rows = cells
    .map((v, k) => {
      if (v === '-') return `<tr class="pc-removed"><td>${icon('bad', 12)}<span class="sr-only">removed</span></td></tr>`;
      if (v == null) return `<tr><td class="pc-nan">NaN</td></tr>`;
      const changed = highlight && highlight[k] == null && highlight[k] !== undefined;
      return `<tr><td${changed ? ' class="pc-new"' : ''}>${cell(v)}</td></tr>`;
    })
    .join('');
  return `<table class="pc-col"><thead><tr><th scope="col">${cell(name)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// Two circles, the left and right tables of a join; the shaded part is what the join keeps.
let vennSeq = 0;
function venn(kind, left = 'left', right = 'right') {
  const id = `venn${++vennSeq}`;
  const A = '<circle cx="54" cy="36" r="30"/>';
  const B = '<circle cx="90" cy="36" r="30"/>';
  const fill = {
    inner: `<clipPath id="${id}">${A}</clipPath><g class="venn-on" clip-path="url(#${id})">${B}</g>`,
    left: `<g class="venn-on">${A}</g>`,
    right: `<g class="venn-on">${B}</g>`,
    outer: `<g class="venn-on">${A}${B}</g>`,
  }[kind];
  if (!fill) return '';
  return `<svg class="venn" viewBox="0 0 144 88" role="img" aria-label="${esc(kind)}">${fill}<g class="venn-line">${A}${B}</g><text x="42" y="82" text-anchor="middle">${esc(left)}</text><text x="102" y="82" text-anchor="middle">${esc(right)}</text></svg>`;
}

function resultTable(cols, rows) {
  const head = cols.map((c) => `<th scope="col">${cell(c)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((v) => (v == null ? '<td class="pc-nan">NaN</td>' : `<td>${cell(v)}</td>`)).join('')}</tr>`).join('');
  return `<table class="pc-col pc-result-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function renderCards(n, ctx) {
  let items;
  try {
    items = loadYaml(n.text);
  } catch (e) {
    throw new LectureError(ctx.file, n.line, `\`\`\`cards is not valid YAML: ${e.message.split('\n')[0]}`);
  }
  if (!Array.isArray(items) || !items.length) throw new LectureError(ctx.file, n.line, '```cards needs a YAML list of cards');
  // ```cards {start=3}: a set split into two blocks (one projector frame each) keeps counting
  const start = Math.max(1, Math.floor(Number(n.attrs.start)) || 1);
  const cards = items.map((c, k) => {
    for (const f of ['when_th', 'when_en', 'do_th', 'do_en']) {
      if (!c[f]) throw new LectureError(ctx.file, n.line, `\`\`\`cards item ${k + 1} needs ${f}`);
    }
    const tone = TONES.has(c.tone) ? c.tone : 'keep';
    let vis = '';
    if (c.venn) {
      // a join card: which part of the two tables survives, then the rows it keeps
      const [l, r] = Array.isArray(c.tables) ? c.tables : ['left', 'right'];
      vis = `<div class="pc-vis pc-vis-venn">${venn(c.venn, l, r)}${Array.isArray(c.rows) && Array.isArray(c.cols) ? resultTable(c.cols, c.rows) : ''}</div>`;
    } else if (Array.isArray(c.rows) && Array.isArray(c.cols)) {
      vis = `<div class="pc-vis">${resultTable(c.cols, c.rows)}</div>`;
    } else if (c.img) {
      // a small chart: card galleries (which chart for which data, good vs bad)
      vis = `<div class="pc-vis pc-vis-img">${imageTag(c.img, ctx, c.alt ?? c.when_en, n.line)}</div>`;
    } else if (c.col && Array.isArray(c.before)) {
      const after = Array.isArray(c.after)
        ? miniColumn(c.col, c.after, c.before)
        : `<p class="pc-result">${TH(c.after_th ?? '', c.after_en)}</p>`;
      vis = `<div class="pc-vis">${miniColumn(c.col, c.before)}<span class="pc-arrow" aria-hidden="true">→</span>${after}</div>`;
    }
    const prompt = c.prompt_th
      ? `<div class="pc-prompt"><p class="pc-prompt-tag">${icon('chat', 13)}<span lang="en">Prompt</span></p><p class="pc-prompt-text">${TH(c.prompt_th, c.prompt_en)}</p></div>`
      : '';
    return `<li class="pc-card pc-${tone}">
<p class="pc-when"><span class="pc-n">${start + k}</span><span>${TH(c.when_th, c.when_en)}</span></p>
${vis}
<p class="pc-do">${icon('ok', 16)}<span>${codeBreaks(TH(c.do_th, c.do_en))}</span></p>
${prompt}
</li>`;
  });
  // ```cards {cols=3}: more, smaller cards per row (a gallery of small charts)
  const cols = Number(n.attrs.cols);
  return `<ol class="pc-grid${cols >= 2 && cols <= 4 ? ` pc-cols-${cols}` : ''}"${start > 1 ? ` start="${start}"` : ''}>${cards.join('\n')}</ol>`;
}

// ---------------------------------------------------------------- ```bpe-explorer

// A step-through of Byte-Pair Encoding: the corpus as pieces, the most frequent neighbouring
// pair, then that pair merged, one merge per click. Every step is computed here at build time;
// templates/widgets.js only shows them.
//   ```bpe-explorer
//   corpus: { low: 5, lowest: 2, newer: 6, wider: 3, new: 2 }
//   merges: 8
//   test: lower
//   ```
export function renderBpeExplorer(n, ctx) {
  let cfg;
  try {
    cfg = loadYaml(n.text);
  } catch (e) {
    throw new LectureError(ctx.file, n.line, `\`\`\`bpe-explorer is not valid YAML: ${e.message.split('\n')[0]}`);
  }
  if (!cfg?.corpus || typeof cfg.corpus !== 'object') throw new LectureError(ctx.file, n.line, '```bpe-explorer needs corpus: { word: count, ... }');
  const merges = Number(cfg.merges ?? 8);
  let words = Object.entries(cfg.corpus).map(([w, c]) => ({ word: w, count: Number(c), pieces: [...w, '_'] }));
  const countPairs = () => {
    const pairs = new Map(); // insertion order breaks ties, like Python's Counter + max
    for (const w of words) {
      for (let i = 0; i < w.pieces.length - 1; i++) {
        const key = w.pieces[i] + '\u0000' + w.pieces[i + 1];
        const p = pairs.get(key) ?? { a: w.pieces[i], b: w.pieces[i + 1], count: 0, from: new Map() };
        p.count += w.count;
        p.from.set(w.word, w.count);
        pairs.set(key, p);
      }
    }
    return [...pairs.values()];
  };
  const steps = [];
  const learned = [];
  for (let k = 0; k <= merges; k++) {
    const pairs = countPairs();
    let best = null;
    for (const p of pairs) if (!best || p.count > best.count) best = p;
    const top = [...pairs].sort((x, y) => y.count - x.count).slice(0, 5);
    if (best && !top.includes(best)) top[top.length - 1] = best;
    steps.push({
      words: words.map((w) => ({ word: w.word, count: w.count, pieces: [...w.pieces] })),
      made: k > 0 ? learned[k - 1] : null,
      learned: [...learned],
      pairs: top.map((p) => ({ a: p.a, b: p.b, count: p.count, from: [...p.from].map(([w, c]) => `${w} ×${c}`).join(', '), best: p === best })),
    });
    if (k === merges || !best) break;
    const merged = best.a + best.b;
    learned.push(merged);
    for (const w of words) {
      const out = [];
      for (let i = 0; i < w.pieces.length; i++) {
        if (i < w.pieces.length - 1 && w.pieces[i] === best.a && w.pieces[i + 1] === best.b) {
          out.push(merged);
          i++;
        } else out.push(w.pieces[i]);
      }
      w.pieces = out;
    }
  }
  // a new word, cut with the learned merges applied in order
  let test = null;
  if (cfg.test) {
    let pieces = [...String(cfg.test), '_'];
    for (const m of learned) {
      const out = [];
      for (let i = 0; i < pieces.length; i++) {
        if (i < pieces.length - 1 && pieces[i] + pieces[i + 1] === m) {
          out.push(m);
          i++;
        } else out.push(pieces[i]);
      }
      pieces = out;
    }
    test = { word: String(cfg.test), pieces };
  }
  const data = { steps, test };
  return `<figure class="ixp bpe" data-bpe="${esc(JSON.stringify(data))}">
<figcaption class="ixp-head">${icon('pointer', 16)}${T(['ลองเล่น: BPE รวมคู่ทีละรอบ กด ถัดไป', 'Try it: BPE, one merge per click'])}</figcaption>
<div class="ixp-body"><p class="ixp-nojs">${T(['ส่วนนี้ต้องเปิด JavaScript', 'This part needs JavaScript'])}</p></div>
</figure>`;
}
