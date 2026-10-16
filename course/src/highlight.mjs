// Build-time syntax highlighting with Shiki. Nothing ships to the browser: each line becomes
// <span class="ln"> with token spans coloured through the --code-* variables in tokens.css.

import { createHighlighter } from 'shiki';

// Theme colours are placeholders that map back to CSS variables, so tokens.css stays the
// single source of truth for colours.
const VARS = {
  '#000001': 'var(--code-fg)',
  '#000002': 'var(--code-keyword)',
  '#000003': 'var(--code-string)',
  '#000004': 'var(--code-comment)',
  '#000005': 'var(--code-number)',
};

const theme = {
  name: 'course-paper',
  type: 'dark',
  colors: { 'editor.background': '#000000', 'editor.foreground': '#000001' },
  tokenColors: [
    { settings: { foreground: '#000001' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#000004' } },
    { scope: ['string', 'punctuation.definition.string', 'string.quoted', 'constant.character.escape'], settings: { foreground: '#000003' } },
    {
      scope: ['keyword', 'keyword.control', 'keyword.operator.logical', 'keyword.operator.new', 'storage', 'storage.type', 'storage.modifier', 'keyword.control.import', 'keyword.control.flow', 'constant.language'],
      settings: { foreground: '#000002' },
    },
    { scope: ['constant.numeric'], settings: { foreground: '#000005' } },
  ],
};

const LANG_ALIASES = { py: 'python', sh: 'bash', shell: 'bash', console: 'bash', text: 'text', txt: 'text' };
const LANGS = ['python', 'bash', 'json', 'yaml', 'sql', 'javascript', 'r', 'markdown', 'csv'];

let highlighter;
export async function initHighlighter() {
  highlighter ??= await createHighlighter({ themes: [theme], langs: LANGS });
  return highlighter;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Returns an array of HTML strings, one per line.
export function highlightLines(code, lang) {
  const l = LANG_ALIASES[lang] ?? lang;
  if (!l || l === 'text' || !LANGS.includes(l)) return code.split('\n').map(esc);
  const lines = highlighter.codeToTokensBase(code, { lang: l, theme: 'course-paper' });
  return lines.map((tokens) =>
    tokens
      .map((t) => {
        const color = VARS[(t.color ?? '').toLowerCase()];
        return !color || color === 'var(--code-fg)' ? esc(t.content) : `<span style="color:${color}">${esc(t.content)}</span>`;
      })
      .join(''),
  );
}
