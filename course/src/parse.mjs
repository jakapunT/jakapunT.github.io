// Parses a lecture Markdown file into sections and a block tree.
//
// markdown-it-container cannot nest containers that use the same `:::` marker (the outer one
// closes at the inner one's `:::`), and the course syntax nests them everywhere
// (`::: concept` > `::: th`). So the block structure is parsed here with a stack, and
// markdown-it only renders the plain Markdown leaves.

import matter from 'gray-matter';

export class LectureError extends Error {
  constructor(file, line, message) {
    super(`${file}${line ? `:${line}` : ''}: ${message}`);
  }
}

// `{#w05-s02 th="..." .cls key=value flag}` → { id, class: [...], th: '...', key: 'value', flag: true }
export function parseAttrs(src) {
  const attrs = {};
  const re = /([#.])([\w-]+)|([\w:-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s"'}]+))|([\w-]+)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === '#') attrs.id = m[2];
    else if (m[1] === '.') (attrs.class ??= []).push(m[2]);
    else if (m[3]) attrs[m[3]] = m[4] != null ? m[4].replace(/\\"/g, '"') : m[5] ?? m[6];
    else if (m[7]) attrs[m[7]] = true;
  }
  return attrs;
}

// Splits a trailing `{...}` attribute block off a line of text, if it looks like attributes.
export function splitTrailingAttrs(text) {
  const m = text.match(/^(.*?)\s*\{([^{}]*)\}\s*$/s);
  if (!m || !/^\s*([#.][\w-]|[\w:-]+\s*=)/.test(m[2])) return [text, {}];
  return [m[1], parseAttrs(m[2])];
}

const FENCE_RE = /^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*(.*?)\s*$/;
const OPEN_RE = /^\s*:::\s*([\w-]+)\s*(.*?)\s*$/;
const CLOSE_RE = /^\s*:::\s*$/;

export function parseLecture(source, file) {
  const { data: meta, content } = matter(source);
  // line offset of the body inside the file, for error messages
  const bodyStart = source.slice(0, source.length - content.length).split('\n').length - 1;
  const lines = content.split('\n');

  const sections = [];
  let current = null;
  const preamble = [];
  let fence = null;
  lines.forEach((line, i) => {
    const f = line.match(FENCE_RE);
    if (fence) {
      if (f && f[2][0] === fence[0] && f[2].length >= fence.length && !f[3] && !f[4]) fence = null;
    } else if (f) {
      fence = f[2];
    } else {
      const h = line.match(/^##\s+(.+?)\s*$/);
      if (h) {
        const [title, attrs] = splitTrailingAttrs(h[1]);
        current = { title, attrs, id: attrs.id, line: bodyStart + i + 1, lines: [] };
        sections.push(current);
        return;
      }
    }
    (current ? current.lines : preamble).push({ text: line, n: bodyStart + i + 1 });
  });
  if (fence) throw new LectureError(file, null, 'a ``` code block is never closed');

  if (preamble.some((l) => l.text.trim())) {
    const first = preamble.find((l) => l.text.trim());
    throw new LectureError(file, first.n, 'content before the first "## " section heading');
  }

  const seen = new Map();
  for (const s of sections) {
    if (!s.id) throw new LectureError(file, s.line, `section "${s.title}" has no ID. Add one like {#w05-s01 th="..."}`);
    if (!/^w\d{2}-s\d{2}$/.test(s.id)) throw new LectureError(file, s.line, `section ID "${s.id}" must look like w05-s01`);
    if (seen.has(s.id)) throw new LectureError(file, s.line, `section ID "${s.id}" is already used on line ${seen.get(s.id)}`);
    seen.set(s.id, s.line);
    s.end = [...s.lines].reverse().find((l) => l.text.trim())?.n ?? s.line;
    s.blocks = parseBlocks(s.lines, file);
    delete s.lines;
  }
  // 1-based line range of the front matter, including both --- lines
  const frontMatter = bodyStart > 0 ? { line: 1, end: bodyStart } : null;
  return { meta, sections, frontMatter };
}

// lines: [{ text, n }] → nodes
export function parseBlocks(lines, file) {
  const nodes = [];
  let md = [];
  const flushMd = () => {
    const filled = md.filter((l) => l.text.trim());
    if (filled.length) nodes.push({ type: 'md', text: md.map((l) => l.text).join('\n'), line: filled[0].n, end: filled[filled.length - 1].n });
    md = [];
  };

  let i = 0;
  while (i < lines.length) {
    const { text, n } = lines[i];
    const t = text.trim();

    const f = text.match(FENCE_RE);
    if (f) {
      flushMd();
      const marker = f[2];
      const body = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const c = lines[j].text.match(FENCE_RE);
        if (c && c[2][0] === marker[0] && c[2].length >= marker.length && !c[3] && !c[4]) break;
        body.push(lines[j].text);
      }
      if (j >= lines.length) throw new LectureError(file, n, 'code block is never closed');
      const [, attrs] = splitTrailingAttrs(`x ${f[4]}`);
      nodes.push({ type: 'fence', lang: f[3] || '', attrs, text: dedent(body).join('\n'), line: n, end: lines[j].n });
      i = j + 1;
      continue;
    }

    const o = text.match(OPEN_RE);
    if (o) {
      flushMd();
      let depth = 1;
      let j = i + 1;
      let inFence = null;
      for (; j < lines.length; j++) {
        const lt = lines[j].text;
        const c = lt.match(FENCE_RE);
        if (inFence) { if (c && c[2][0] === inFence[0] && !c[3] && !c[4]) inFence = null; continue; }
        if (c) { inFence = c[2]; continue; }
        if (OPEN_RE.test(lt)) depth++;
        else if (CLOSE_RE.test(lt) && --depth === 0) break;
      }
      if (j >= lines.length) throw new LectureError(file, n, `"::: ${o[1]}" is never closed with ":::"`);
      const inner = lines.slice(i + 1, j);
      const [, attrs] = splitTrailingAttrs(`x ${o[2]}`);
      nodes.push({
        type: 'container',
        name: o[1],
        attrs,
        lines: inner.map((l) => l.text),
        children: parseBlocks(dedentLines(inner), file),
        line: n,
        end: lines[j].n,
      });
      i = j + 1;
      continue;
    }
    if (CLOSE_RE.test(text)) throw new LectureError(file, n, 'stray ":::" with no open block');

    // definition list: "Term" then ": definition", definitions indented by two spaces
    if (t && !/^[|#>`:\-*\d]/.test(t) && lines[i + 1] && /^:\s/.test(lines[i + 1].text)) {
      flushMd();
      const items = [];
      let last = n;
      while (i < lines.length) {
        const term = lines[i]?.text.trim();
        if (!term || !lines[i + 1] || !/^:\s/.test(lines[i + 1].text)) break;
        const item = { term, defs: [], line: lines[i].n };
        i++;
        while (i < lines.length && /^:\s/.test(lines[i].text)) {
          const def = [{ text: lines[i].text.replace(/^:\s+/, ''), n: lines[i].n }];
          i++;
          while (i < lines.length) {
            const lt = lines[i].text;
            if (/^ {2,}\S/.test(lt)) { def.push({ text: lt.slice(2), n: lines[i].n }); i++; continue; }
            if (!lt.trim()) {
              // a blank line belongs to the definition only if indented text follows
              let k = i;
              while (k < lines.length && !lines[k].text.trim()) k++;
              if (k < lines.length && /^ {2,}\S/.test(lines[k].text)) { def.push({ text: '', n: lines[i].n }); i++; continue; }
            }
            break;
          }
          item.defs.push(parseBlocks(def, file));
          last = [...def].reverse().find((d) => d.text.trim())?.n ?? last;
        }
        items.push(item);
        while (i < lines.length && !lines[i].text.trim()) i++;
      }
      nodes.push({ type: 'deflist', items, line: items[0].line, end: last });
      continue;
    }

    // table: a "|" row followed by a |---| separator row
    if (t.startsWith('|') && lines[i + 1] && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1].text)) {
      flushMd();
      const rows = [];
      let j = i;
      while (j < lines.length && lines[j].text.trim().startsWith('|')) rows.push(lines[j++].text.trim());
      const [head, sep, ...body] = rows;
      nodes.push({
        type: 'table',
        head: splitRow(head),
        align: splitRow(sep).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : null)),
        rows: body.map(splitRow),
        line: n,
        end: lines[j - 1].n,
      });
      i = j;
      continue;
    }

    md.push(lines[i]);
    i++;
  }
  flushMd();
  return nodes;
}

// Splits a table row on "|", ignoring pipes inside `code` or escaped as \|
export function splitRow(row) {
  const cells = [];
  let cur = '';
  let inCode = false;
  for (let k = 0; k < row.length; k++) {
    const ch = row[k];
    if (ch === '\\' && row[k + 1] === '|') { cur += '|'; k++; continue; }
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) { cells.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur);
  if (row.startsWith('|')) cells.shift();
  if (row.endsWith('|')) cells.pop();
  return cells.map((c) => c.trim());
}

function dedent(textLines) {
  const indents = textLines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return textLines.map((l) => l.slice(min));
}

function dedentLines(lines) {
  const texts = dedent(lines.map((l) => l.text));
  return lines.map((l, k) => ({ text: texts[k], n: l.n }));
}
