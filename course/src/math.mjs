// LaTeX math, rendered with KaTeX at build time (CLAUDE.md §4, §6): inline $...$ and display $$...$$.
// No math JavaScript ships to the browser; a page with math gets KaTeX's CSS (katexCss) and its
// fonts are self-hosted next to ours (copyKatexFonts → public/courses/_fonts/katex/).
//
// Inline $...$ follows pandoc's rule so prices are left alone: the opening $ must be followed by a
// non-space, the closing $ preceded by a non-space and not followed by a digit. "$500 to $900"
// therefore stays text. Write \$ for a literal dollar sign right before other math-looking text.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import katex from 'katex';

const require = createRequire(import.meta.url);
const katexDir = path.dirname(require.resolve('katex/package.json'));

export function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: true, output: 'htmlAndMathml', strict: 'ignore' });
  } catch (e) {
    throw new Error(`math ${displayMode ? '$$...$$' : '$...$'} "${tex}": ${e.message}`);
  }
}

function mathInline(state, silent) {
  const src = state.src;
  const start = state.pos;
  if (src.charCodeAt(start) !== 0x24 /* $ */ || src.charCodeAt(start + 1) === 0x24) return false;
  const first = src[start + 1];
  if (!first || /\s/.test(first)) return false;
  let end = start + 1;
  for (;;) {
    end = src.indexOf('$', end);
    if (end < 0) return false;
    if (src[end - 1] === '\\') {
      end++;
      continue;
    }
    if (/\s/.test(src[end - 1]) || /\d/.test(src[end + 1] ?? '')) return false;
    break;
  }
  if (!silent) {
    const token = state.push('math_inline', 'math', 0);
    token.content = src.slice(start + 1, end);
  }
  state.pos = end + 1;
  return true;
}

// $$ on its own line(s):  $$\n...\n$$  or  $$ ... $$ on one line
function mathBlock(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];
  if (state.src.slice(pos, pos + 2) !== '$$') return false;
  const firstLine = state.src.slice(pos + 2, max).trim();
  let content;
  let next = startLine;
  if (firstLine.endsWith('$$') && firstLine.length > 2) {
    content = firstLine.slice(0, -2);
  } else {
    const lines = [firstLine];
    let found = false;
    while (++next < endLine) {
      pos = state.bMarks[next] + state.tShift[next];
      max = state.eMarks[next];
      const line = state.src.slice(pos, max).trim();
      if (line.endsWith('$$')) {
        lines.push(line.slice(0, -2));
        found = true;
        break;
      }
      lines.push(line);
    }
    if (!found) return false;
    content = lines.join('\n');
  }
  if (silent) return true;
  state.line = next + 1;
  const token = state.push('math_block', 'math', 0);
  token.block = true;
  token.content = content.trim();
  token.map = [startLine, state.line];
  return true;
}

export function mathPlugin(md) {
  md.inline.ruler.after('escape', 'math_inline', mathInline);
  md.block.ruler.before('paragraph', 'math_block', mathBlock, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.renderer.rules.math_inline = (tokens, i) => renderMath(tokens[i].content, false);
  md.renderer.rules.math_block = (tokens, i) => `<div class="math-display">${renderMath(tokens[i].content, true)}</div>\n`;
}

export const hasMath = (html) => html.includes('class="katex');

// KaTeX's stylesheet with its font URLs pointed at the self-hosted copies (woff2 only)
let cssCache = null;
export function katexCss(fontsUrl) {
  cssCache ??= fs.readFileSync(path.join(katexDir, 'dist', 'katex.min.css'), 'utf8');
  return cssCache.replace(/src:url\(fonts\/([\w-]+)\.woff2\) format\("woff2"\)(,url\([^)]*\) format\("[\w-]+"\))*/g, (_, f) => `src:url(${fontsUrl}katex/${f}.woff2) format("woff2")`);
}

export function copyKatexFonts(fontsDir) {
  const dir = path.join(fontsDir, 'katex');
  fs.mkdirSync(dir, { recursive: true });
  const srcDir = path.join(katexDir, 'dist', 'fonts');
  for (const f of fs.readdirSync(srcDir).filter((x) => x.endsWith('.woff2'))) {
    const src = path.join(srcDir, f);
    const dst = path.join(dir, f);
    if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) fs.copyFileSync(src, dst);
  }
}
