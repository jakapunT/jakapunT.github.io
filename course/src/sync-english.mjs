// After a Thai edit, bring the matching English up to date (used by src/dev.mjs on save).
//
// It compares the file before and after the save rather than tracking line numbers:
// - a ::: th block whose text changed while its ::: en partner did not → translate it again
// - a ::: th block with no ::: en partner → add one after it
// - a ::: summary whose th: line changed while its en: line did not → translate the line
// - front matter lead_th changed while lead_en did not → translate it
// If the teacher changed the English too, the English is left alone.

import { load as loadYaml } from 'js-yaml';

function walk(nodes, fn) {
  nodes.forEach((n, i) => {
    fn(n, i, nodes);
    if (n.children) walk(n.children, fn);
    if (n.items) for (const it of n.items) for (const d of it.defs) walk(d, fn);
  });
}

const inner = (lines, c) => lines.slice(c.line, c.end - 1); // lines between ":::" lines
const indentOf = (line) => line.match(/^\s*/)[0];

function dedent(textLines) {
  const ind = Math.min(...textLines.filter((l) => l.trim()).map((l) => indentOf(l).length));
  return textLines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n').trim();
}

function pairs(parsed, lines) {
  const out = [];
  for (const s of parsed.sections) {
    walk(s.blocks, (n, i, siblings) => {
      if (n.type !== 'container' || n.name !== 'th') return;
      const next = siblings[i + 1];
      const prev = siblings[i - 1];
      const isEn = (x) => x?.type === 'container' && x.name === 'en';
      const isTh = (x) => x?.type === 'container' && x.name === 'th';
      // th then en is the normal order; an en before the th counts only if no th claims it
      const en = isEn(next) ? next : isEn(prev) && !isTh(siblings[i - 2]) ? prev : null;
      out.push({ th: n, en, section: s, thText: dedent(inner(lines, n)), enText: en ? dedent(inner(lines, en)) : null });
    });
  }
  return out;
}

function summaries(parsed, lines) {
  const out = [];
  for (const s of parsed.sections) {
    walk(s.blocks, (n) => {
      if (n.type !== 'container' || n.name !== 'summary') return;
      const rec = { section: s };
      for (let k = n.line; k < n.end - 1; k++) {
        const m = lines[k].match(/^(\s*)(th|en)\s*:\s*(.*)$/);
        if (m) rec[m[2]] = { line: k + 1, indent: m[1], text: m[3] };
      }
      out.push(rec);
    });
  }
  return out;
}

const yamlString = (v) => (/^[\w"'(][^:#]*$/.test(v) && !/^(true|false|null|yes|no)$/i.test(v) ? v : JSON.stringify(v));

// parseLecture is passed in so the dev server can hand over a freshly loaded parser.
export async function syncEnglish({ before, after, file, translate, parseLecture }) {
  const bLines = before.split('\n');
  const aLines = after.split('\n');
  const b = parseLecture(before, file);
  const a = parseLecture(after, file);
  const edits = []; // { start, end, lines } in the after file, applied bottom-up
  const done = [];

  // ::: th / ::: en pairs
  const bp = pairs(b, bLines);
  const ap = pairs(a, aLines);
  const sameShape = bp.length === ap.length;
  for (const [k, p] of ap.entries()) {
    const old = sameShape ? bp[k] : null;
    const thaiChanged = old ? old.thText !== p.thText : true;
    const englishUntouched = old ? old.enText === p.enText : true;
    if (!p.th || !p.thText) continue;
    if (p.en && !old) continue; // blocks were added or removed: only fill in missing English
    if (p.en && !(thaiChanged && englishUntouched)) continue;
    if (!p.en && old?.en) continue; // English was removed on purpose
    const english = await translate({ thai: p.thText, currentEnglish: p.enText, context: p.section.title });
    const indent = indentOf(aLines[(p.en ?? p.th).line - 1]);
    const body = english.split('\n').map((l) => (l ? indent + l : l));
    if (p.en) {
      edits.push({ start: p.en.line + 1, end: p.en.end - 1, lines: body });
    } else {
      edits.push({ start: p.th.end + 1, end: p.th.end, lines: [`${indent}::: en`, ...body, `${indent}:::`] });
    }
    done.push(`${p.section.id.toUpperCase()}: ${p.en ? 'English updated' : 'English added'}`);
  }

  // ::: summary th:/en: lines
  const bs = summaries(b, bLines);
  const as = summaries(a, aLines);
  if (bs.length === as.length) {
    for (const [k, s] of as.entries()) {
      const old = bs[k];
      if (!s.th || !s.en || !old.th || !old.en) continue;
      if (s.th.text === old.th.text || s.en.text !== old.en.text) continue;
      const english = (await translate({ thai: s.th.text, currentEnglish: s.en.text, context: `${s.section.title} (one-sentence summary)` })).replace(/\s*\n\s*/g, ' ');
      edits.push({ start: s.en.line, end: s.en.line, lines: [`${s.en.indent}en: ${english}`] });
      done.push(`${s.section.id.toUpperCase()}: summary English updated`);
    }
  }

  // front matter: lead_th → lead_en
  if (a.frontMatter) {
    const fm = (lines, f) => loadYaml(lines.slice(f.line, f.end - 1).join('\n')) ?? {};
    const oldMeta = b.frontMatter ? fm(bLines, b.frontMatter) : {};
    const newMeta = fm(aLines, a.frontMatter);
    if (newMeta.lead_th && newMeta.lead_th !== oldMeta.lead_th && newMeta.lead_en === oldMeta.lead_en) {
      const english = (await translate({ thai: newMeta.lead_th, currentEnglish: newMeta.lead_en, context: 'the lesson lead under the title (one or two sentences)' })).replace(/\s*\n\s*/g, ' ');
      const k = aLines.findIndex((l, i) => i < a.frontMatter.end && /^lead_en\s*:/.test(l));
      const line = `lead_en: ${yamlString(english)}`;
      if (k >= 0) edits.push({ start: k + 1, end: k + 1, lines: [line] });
      else edits.push({ start: a.frontMatter.end, end: a.frontMatter.end - 1, lines: [line] });
      done.push('lesson lead: English updated');
    }
  }

  if (!edits.length) return { text: after, done };
  const lines = [...aLines];
  for (const e of edits.sort((x, y) => y.start - x.start)) lines.splice(e.start - 1, e.end - e.start + 1, ...e.lines);
  const text = lines.join('\n');
  parseLecture(text, file); // never write a file that would not build
  return { text, done };
}
