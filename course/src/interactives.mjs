// Interactive blocks added for stats-dh lesson 10 (model tuning). Runtime: templates/interactives.js.
// Both reuse the .ixp card look of ```index-explorer, so focus mode scales them the same way.
//
// ```stepper {control="slider"}       one bar chart per step; a slider (or ← → buttons) moves between them
// title_th: ...                          the card header
// title_en: ...
// slider_th: ค่า alpha                   label of the slider (control="slider")
// slider_en: alpha
// start: 2                               step shown first (default 0)
// steps:
//   - label: "alpha = 0.1"               shown above the bars, and under the slider as its tick
//     bars: { bmi: 505, bp: 317, ... }   name: value; negative values grow left of a centre line
//     highlight: [bmi]                   bars drawn in the accent colour (e.g. the round's winner)
//     note_th: ...                       one sentence under the bars
//     note_en: ...
// A bar whose value is exactly 0 is drawn as "0" with a crossed-out name (a feature Lasso dropped).
// Every step is rendered at build time; the script only shows one at a time.
//
// ```sorter                             click Keep / Drop for each column, then Check
// target: SalePrice
// items:
//   - name: OwnerName
//     def_th: ชื่อเจ้าของ
//     def_en: Owner's name
//     answer: drop                       keep | drop | either (any choice is fine; the reason matters)
//     why_th: ...
//     why_en: ...

import { load as loadYaml } from 'js-yaml';
import { esc, inline, T, icon } from './render.mjs';
import { LectureError } from './parse.mjs';

const TH = (th, en) => T([inline(String(th ?? en ?? '')), inline(String(en ?? th ?? ''))], { thHtml: true, enHtml: true });

function yamlOf(n, ctx, kind) {
  try {
    return loadYaml(n.text);
  } catch (e) {
    throw new LectureError(ctx.file, n.line, `\`\`\`${kind} is not valid YAML: ${e.message.split('\n')[0]}`);
  }
}

const fmt = (v) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000));

function renderStepper(n, ctx) {
  const d = yamlOf(n, ctx, 'stepper');
  if (!d || !Array.isArray(d.steps) || !d.steps.length) throw new LectureError(ctx.file, n.line, '```stepper needs steps: (a list)');
  const values = d.steps.flatMap((s, k) => {
    if (!s.bars || typeof s.bars !== 'object') throw new LectureError(ctx.file, n.line, `\`\`\`stepper step ${k + 1} needs bars: { name: value, ... }`);
    return Object.values(s.bars).map(Number);
  });
  const max = Math.max(...values.map(Math.abs)) || 1;
  const signed = values.some((v) => v < 0);
  const start = Math.min(Math.max(Number(d.start) || 0, 0), d.steps.length - 1);
  const slider = (n.attrs.control ?? 'slider') === 'slider';

  const panels = d.steps
    .map((s, k) => {
      const hl = new Set(s.highlight ?? []);
      const bars = Object.entries(s.bars)
        .map(([name, raw]) => {
          const v = Number(raw);
          const w = ((Math.abs(v) / max) * (signed ? 50 : 100)).toFixed(2);
          const cls = ['stp-bar', v < 0 ? 'is-neg' : '', hl.has(name) ? 'is-hl' : ''].filter(Boolean).join(' ');
          const zero = v === 0;
          return `<li class="stp-row${zero ? ' is-zero' : ''}${hl.has(name) ? ' is-hl' : ''}"><span class="stp-name">${esc(name)}</span><span class="stp-track${signed ? ' is-signed' : ''}">${zero ? '' : `<span class="${cls}" style="--w:${w}%"></span>`}</span><span class="stp-val">${fmt(v)}</span></li>`;
        })
        .join('');
      const note = s.note_th || s.note_en ? `<p class="stp-note">${TH(s.note_th, s.note_en)}</p>` : '';
      return `<div class="stp-panel" data-step="${k}"${k === start ? '' : ' hidden'}><p class="stp-label">${inline(String(s.label ?? ''))}</p><ul class="stp-bars">${bars}</ul>${note}</div>`;
    })
    .join('');

  const labels = d.steps.map((s) => String(s.label ?? ''));
  const control = slider
    ? `<label class="stp-slider"><span class="stp-slider-label">${TH(d.slider_th ?? 'เลื่อน', d.slider_en ?? 'Slide')}</span><input type="range" min="0" max="${d.steps.length - 1}" step="1" value="${start}" aria-valuetext="${esc(labels[start])}"></label><ol class="stp-ticks">${labels.map((l, k) => `<li style="--f:${labels.length > 1 ? k / (labels.length - 1) : 0}">${esc(l.replace(/^[^=]*=\s*/, ''))}</li>`).join('')}</ol>`
    : `<div class="stp-buttons"><button type="button" data-stp="prev">← ${T(['ก่อนหน้า', 'Back'])}</button><span class="stp-pos" aria-live="polite">${start + 1} / ${d.steps.length}</span><button type="button" data-stp="next">${T(['ถัดไป', 'Next'])} →</button></div>`;

  return `<figure class="ixp stp" data-stp data-labels="${esc(JSON.stringify(labels))}">
<figcaption class="ixp-head">${icon('pointer', 16)}${TH(d.title_th ?? 'ลองเล่น', d.title_en ?? 'Try it')}</figcaption>
<div class="ixp-body"><div class="stp-control">${control}</div>${panels}</div>
</figure>`;
}

const ANSWERS = new Set(['keep', 'drop', 'either']);

function renderSorter(n, ctx) {
  const d = yamlOf(n, ctx, 'sorter');
  if (!d || !Array.isArray(d.items) || !d.items.length) throw new LectureError(ctx.file, n.line, '```sorter needs items: (a list)');
  const rows = d.items
    .map((it, k) => {
      if (!it.name || !ANSWERS.has(it.answer)) throw new LectureError(ctx.file, n.line, `\`\`\`sorter item ${k + 1} needs name: and answer: keep | drop | either`);
      return `<li class="srt-row" data-answer="${it.answer}">
<div class="srt-feat"><code>${esc(it.name)}</code><span class="srt-def">${TH(it.def_th, it.def_en)}</span></div>
<div class="srt-btns" role="group" aria-label="${esc(it.name)}"><button type="button" data-choice="keep" aria-pressed="false">${icon('ok', 14)}${T(['เก็บ', 'Keep'])}</button><button type="button" data-choice="drop" aria-pressed="false">${icon('bad', 14)}${T(['ตัด', 'Drop'])}</button></div>
<p class="srt-why" hidden><span class="srt-verdict"></span>${TH(it.why_th, it.why_en)}</p>
</li>`;
    })
    .join('');
  return `<figure class="ixp srt" data-srt>
<figcaption class="ixp-head">${icon('pointer', 16)}${T(['ลองเล่น: เก็บหรือตัด', 'Try it: keep or drop'])}${d.target ? `<span class="srt-target">target: <code>${esc(d.target)}</code></span>` : ''}</figcaption>
<div class="ixp-body"><ul class="srt-list">${rows}</ul>
<div class="srt-actions"><button type="button" data-srt="check">${T(['ตรวจคำตอบ', 'Check'])}</button><button type="button" data-srt="reset">${T(['เริ่มใหม่', 'Reset'])}</button><span class="srt-score" aria-live="polite"></span></div></div>
</figure>`;
}

export const INTERACTIVE_LANGS = new Set(['stepper', 'sorter']);

export function renderInteractive(n, ctx) {
  return n.lang === 'stepper' ? renderStepper(n, ctx) : renderSorter(n, ctx);
}
