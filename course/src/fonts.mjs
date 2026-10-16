// Self-hosted fonts (from @fontsource, the same Google Fonts files) so body text can be split
// by script with unicode-range: Latin glyphs from Anuphan, Thai glyphs from Sarabun, even
// inside one Thai paragraph (CLAUDE.md §4). Fonts are design, not content, so they ship as
// public files next to the encrypted pages: public/courses/_fonts/.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkgDir = (name) => path.dirname(require.resolve(`${name}/package.json`));

const RANGE = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  thai: 'U+02D7,U+0303,U+0331,U+0E01-0E5B,U+200C-200D,U+25CC',
};

// [css family, fontsource package, file prefix, subset, weight]
const FACES = [];
for (const w of [400, 500, 600]) {
  // body text: Latin from Anuphan, Thai from Sarabun
  FACES.push(['Course Text', '@fontsource/anuphan', 'anuphan', 'latin', w]);
  FACES.push(['Course Text', '@fontsource/anuphan', 'anuphan', 'latin-ext', w]);
  FACES.push(['Course Text', '@fontsource/sarabun', 'sarabun', 'thai', w]);
  // headings and English UI: Anuphan for every script
  FACES.push(['Course Head', '@fontsource/anuphan', 'anuphan', 'latin', w]);
  FACES.push(['Course Head', '@fontsource/anuphan', 'anuphan', 'latin-ext', w]);
  FACES.push(['Course Head', '@fontsource/anuphan', 'anuphan', 'thai', w]);
}
for (const w of [400, 500]) FACES.push(['Course Mono', '@fontsource/ibm-plex-mono', 'ibm-plex-mono', 'latin', w]);

const fileName = (prefix, subset, w) => `${prefix}-${subset}-${w}-normal.woff2`;

export function copyFonts(outDir) {
  const dir = path.join(outDir, '_fonts');
  fs.mkdirSync(dir, { recursive: true });
  for (const [, pkg, prefix, subset, w] of FACES) {
    const f = fileName(prefix, subset, w);
    const src = path.join(pkgDir(pkg), 'files', f);
    const dst = path.join(dir, f);
    if (!fs.existsSync(dst) || fs.statSync(dst).size !== fs.statSync(src).size) fs.copyFileSync(src, dst);
  }
}

// urlPrefix: path from the page to the _fonts folder, e.g. "../_fonts/"
export function fontFaceCss(urlPrefix) {
  return FACES.map(
    ([family, , prefix, subset, w]) =>
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(${urlPrefix}${fileName(prefix, subset, w)}) format('woff2');unicode-range:${RANGE[subset]}}`,
  ).join('\n');
}

export function preloadLinks(urlPrefix) {
  return ['sarabun-thai-400-normal.woff2', 'anuphan-latin-400-normal.woff2', 'anuphan-latin-600-normal.woff2']
    .map((f) => `<link rel="preload" href="${urlPrefix}${f}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');
}
