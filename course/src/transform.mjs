// ::: transform {before="data/x.csv" after="data/y.csv" code="df.groupby(...)" group="decade"}
// A before → after table pair. Rows in the same group share a tint and keep their group value
// as a text label; columns named in the code are highlighted. Authors supply both CSVs; nothing
// is computed in the browser.

import { esc, inline, T } from './render.mjs';
import { highlightLines } from './highlight.mjs';
import { LectureError } from './parse.mjs';

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return { header: header.map((h) => h.trim()), rows: body };
}

const isNumber = (s) => /^-?\d+(\.\d+)?$/.test(String(s).trim());

function table(csv, { hot, groupCol, groupIndex, cls }) {
  const gi = csv.header.indexOf(groupCol);
  const head = csv.header
    .map((h) => `<th scope="col" class="${hot.has(h) ? 'tf-hot' : ''}${csv.rows.every((r) => isNumber(r[csv.header.indexOf(h)] ?? '')) ? ' tf-num' : ''}">${esc(h)}</th>`)
    .join('');
  const body = csv.rows
    .map((r, k) => {
      const g = gi >= 0 ? r[gi] : null;
      const tint = g != null ? groupIndex(g) % 4 : null;
      const lastOfGroup = g != null && (csv.rows[k + 1]?.[gi] !== g);
      return `<tr${tint != null ? ` class="tf-g${tint}${lastOfGroup ? ' tf-gap' : ''}"` : ''}>${r
        .map((c, j) => `<td class="${isNumber(c) ? 'tf-num' : ''}${j === gi ? ' tf-group' : ''}">${esc(c)}</td>`)
        .join('')}</tr>`;
    })
    .join('');
  return `<div class="table-scroll"><table class="tf-table ${cls}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function renderTransform(n, ctx) {
  const { before, after, code, group } = n.attrs;
  if (!before || !after) throw new LectureError(ctx.file, n.line, '::: transform needs before="data/....csv" and after="data/....csv"');
  const b = parseCsv(ctx.readData(before, n.line));
  const a = parseCsv(ctx.readData(after, n.line));
  // a column is "used" if the code names it in quotes
  const named = new Set([...(code ?? '').matchAll(/["']([^"']+)["']/g)].map((m) => m[1]));
  const hot = new Set(b.header.filter((h) => named.has(h)));
  const groups = new Map();
  const groupIndex = (g) => {
    if (!groups.has(g)) groups.set(g, groups.size);
    return groups.get(g);
  };
  const codeHtml = code ? `<code class="tf-code">${highlightLines(code, 'python').join('')}</code>` : '';
  const arrowText = n.attrs.arrow_th || n.attrs.arrow_en ? `<span class="tf-arrow-text">${T([n.attrs.arrow_th ?? n.attrs.arrow_en, n.attrs.arrow_en ?? n.attrs.arrow_th])}</span>` : '';
  const caption = n.lines.filter((l) => l.trim()).length ? `<div class="tf-caption">${ctx.renderBlocks(n.children)}</div>` : '';
  return `<div class="transform">
${codeHtml}
<div class="tf-pair">
${table(b, { hot, groupCol: group, groupIndex, cls: 'tf-before' })}
<div class="tf-arrow" aria-hidden="true"><svg width="64" height="28" viewBox="0 0 64 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h52M46 4l10 10-10 10"/></svg>${arrowText}</div>
${table(a, { hot: new Set(), groupCol: group, groupIndex, cls: 'tf-after' })}
</div>
<p class="sr-only">${T([`ตารางก่อน ${b.rows.length} แถว ตารางหลัง ${a.rows.length} แถว`, `Before: ${b.rows.length} rows. After: ${a.rows.length} rows.`])}</p>
${caption}
</div>`;
}
