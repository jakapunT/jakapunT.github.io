// Focus mode (CLAUDE.md §7): the same lecture as projector frames, one idea per frame.
// Frames are rendered here at build time; templates/focus.js only switches between them.
//
// What a section becomes:
//   ::: focus      → one frame per block, showing exactly its content (overrides the default)
//   ::: steps      → one frame, one step per list item
//   code {steps=}  → one frame that highlights one line per step, with ::: step-outputs
//   ::: transform  → one frame with the before → after tables
//   otherwise      → heading + the first example, tokens, figure, plot, dataframe, code,
//                    table or key-term list (heading alone if there is none)
// Paragraphs never show; the teacher says them.

import { esc, inline, T, UI, icon, renderTokens, renderTable, renderBlocks, wrapLastExpression, ctxFile } from './render.mjs';
import { renderTransform } from './transform.mjs';
import { highlightLines } from './highlight.mjs';
import { splitTrailingAttrs, LectureError } from './parse.mjs';

const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const bi = (th, en) => T([th ?? en ?? '', en ?? th ?? ''], { thHtml: true, enHtml: true });

export function renderFocusDeck(lecture, ctx) {
  const frames = [];
  for (const s of lecture.sections) frames.push(...sectionFrames(s, ctx));
  return frames.join('\n');
}

function sectionFrames(s, ctx) {
  ctx.section = s;
  const out = [];
  const head = (size = '') => `<header class="fx-head${size}"><h2 lang="en">${inline(s.title)}</h2>${s.attrs.th ? `<p class="fx-sub" data-only="th">${inline(s.attrs.th)}</p>` : ''}</header>`;
  const frame = (kind, body, { steps = 1, extra = '' } = {}) =>
    `<section class="fx-frame fx-k-${kind}" data-section="${s.id}" data-title="${esc(plain(inline(s.title)))}" data-steps="${steps}"${extra} hidden>${body}</section>`;

  const walk = (nodes, fn, parentExercise = null) => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      fn(n, i, nodes, parentExercise);
      if (n.type === 'container' && !['th', 'en', 'answer', 'focus', 'summary'].includes(n.name)) {
        walk(n.children, fn, n.name === 'exercise' ? n : parentExercise);
      }
    }
  };

  walk(s.blocks, (n, i, siblings, exercise) => {
    if (n.type === 'container' && n.name === 'focus') {
      const answer = exercise?.children.find((c) => c.type === 'container' && c.name === 'answer');
      out.push(focusFrame(n, exercise, answer, head, frame, ctx));
    } else if (n.type === 'container' && n.name === 'steps') {
      out.push(stepsFrame(n, head, frame));
    } else if (n.type === 'fence' && n.attrs.steps) {
      const next = siblings[i + 1]?.type === 'fence' && siblings[i + 1].lang === 'output' ? siblings[i + 2] : siblings[i + 1];
      const stepOutputs = next?.type === 'container' && next.name === 'step-outputs' ? next : null;
      out.push(codeFrame(n, stepOutputs, s, frame, ctx));
    } else if (n.type === 'container' && n.name === 'transform') {
      out.push(frame('transform', `${head(' fx-head-sm')}<div class="fx-body">${renderTransform(n, { ...ctx, file: ctxFile(), renderBlocks: (nodes) => renderBlocks(nodes, ctx) })}</div>`));
    }
  });
  if (out.length) return out;

  // default: heading plus the first visual block
  let visual = null;
  walk(s.blocks, (n) => {
    if (visual) return;
    if (n.type === 'container' && (n.name === 'example' || n.name === 'tokens')) visual = n;
    else if (n.type === 'fence' && !['output'].includes(n.lang)) visual = n;
    else if (n.type === 'table' || n.type === 'deflist') visual = n;
  });
  const compact = visual && (visual.type === 'table' || visual.type === 'fence');
  return [frame(visual ? 'default' : 'title', `${head(!visual ? ' fx-head-lg' : compact ? ' fx-head-sm' : '')}${visual ? `<div class="fx-body">${visualHtml(visual, ctx)}</div>` : ''}`)];
}

function visualHtml(n, ctx) {
  if (n.type === 'container' && n.name === 'example') {
    const inner = n.children.filter((c) => !(c.type === 'container' && ['th', 'en'].includes(c.name)));
    return `<div class="fx-example">${inner.map((c) => visualHtml(c, ctx) ?? '').join('')}</div>`;
  }
  if (n.type === 'container' && n.name === 'tokens') return renderTokens(n);
  if (n.type === 'table') return renderTable(n);
  if (n.type === 'deflist') {
    return `<ul class="fx-terms">${n.items.map((it) => `<li lang="en">${inline(splitTrailingAttrs(it.term)[0])}</li>`).join('')}</ul>`;
  }
  if (n.type === 'fence') {
    if (['dataframe', 'prompt', 'figure', 'plot', 'error', 'formula', 'read-result'].includes(n.lang)) return '';
    return `<pre class="fx-code fx-code-plain"><code>${codeLines(n, ctx)}</code></pre>`;
  }
  if (n.type === 'md') return '';
  return '';
}

function codeLines(n, ctx) {
  let code = n.text.replace(/\s+$/, '');
  if (ctx.env === 'vscode' && ['python', 'py', 'python3'].includes(n.lang)) code = wrapLastExpression(code);
  return highlightLines(code, n.lang)
    .map((l, k) => `<span class="ln" data-ln="${k + 1}"><span class="ln-n" aria-hidden="true">${k + 1}</span><span class="ln-c">${l || ' '}</span></span>`)
    .join('');
}

// ---------------------------------------------------------------- ::: focus (and exercises)

function focusFrame(n, exercise, answer, head, frame, ctx) {
  const onlyText = n.children.length === 1 && n.children[0].type === 'md' && !n.children[0].text.includes('\n\n');
  const content = onlyText ? `<p class="fx-display">${inline(n.children[0].text.trim())}</p>` : `<div class="fx-blocks">${renderBlocks(n.children, ctx)}</div>`;
  if (!exercise) return frame('focus', `${head()}<div class="fx-body">${content}</div>`);

  const label = exerciseLabelText(exercise);
  const steps = [`<div class="fx-step" data-step="0">${content}</div>`];
  if (answer) steps.push(`<div class="fx-step" data-step="1">${answerCards(answer)}</div>`);
  return frame(
    'exercise',
    `${head(' fx-head-sm')}<p class="fx-ex-label">${icon('exercise', 22)}${label}</p><div class="fx-body fx-reveal">${steps.join('')}</div>`,
    { steps: steps.length, extra: answer ? ' data-answer="1"' : '' },
  );
}

function exerciseLabelText(n) {
  const parts = [T(UI.exercise)];
  if (n.attrs.time) parts.push(T([n.attrs.time, n.attrs.time_en ?? n.attrs.time.replace(/\s*นาที/, ' min')]));
  if (n.attrs.mode && UI.mode[n.attrs.mode]) parts.push(T(UI.mode[n.attrs.mode]));
  return parts.join('<span aria-hidden="true"> · </span>');
}

function answerCards(answer) {
  const cards = answer.lines
    .map((l) => l.match(/^\s*[-*]\s+(.*)$/))
    .filter(Boolean)
    .map((m) => {
      const [text, attrs] = splitTrailingAttrs(m[1]);
      return `<li class="fx-answer-card"><span class="fx-answer-term">${inline(text.replace(/:\s*$/, ''))}</span>${attrs.th || attrs.en ? `<span class="fx-answer-meaning">${bi(attrs.th && inline(attrs.th), attrs.en && inline(attrs.en))}</span>` : ''}</li>`;
    });
  return `<ul class="fx-answers">${cards.join('')}</ul>`;
}

// ---------------------------------------------------------------- ::: steps

function parseSteps(n) {
  const items = [];
  for (const line of n.lines) {
    const m = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (m) {
      const [text, attrs] = splitTrailingAttrs(m[1]);
      items.push({ text: text.trim(), attrs });
    } else if (line.trim()) {
      throw new LectureError(ctxFile(), n.line, '::: steps must be a numbered list (1. 2. 3.)');
    }
  }
  if (!items.length) throw new LectureError(ctxFile(), n.line, '::: steps is empty');
  return items;
}

function stepsFrame(n, head, frame) {
  const items = parseSteps(n);
  const morph = items.some((it) => it.text.includes('→') || it.attrs.prompt_th || it.attrs.prompt_en || it.attrs.note_th || it.attrs.note_en);
  if (!morph) {
    // a plain list: past steps stay, faded; future steps stay hidden
    const lis = items.map((it, k) => `<li class="fx-step" data-step="${k}">${inline(it.text)}${note(it)}</li>`).join('');
    return frame('steps fx-list', `${head()}<div class="fx-body"><ol class="fx-steplist">${lis}</ol></div>`, { steps: items.length });
  }

  // a morphing stage: one object changes in place (string → dashed box → token chips)
  let object = null;
  const past = [];
  const stages = items.map((it, k) => {
    const m = it.text.match(/^(.*?)\s*→\s*(.*)$/);
    let caption = '';
    if (!m) {
      object = { kind: 'text', html: inline(it.text) };
      const p = it.attrs.prompt_th || it.attrs.prompt_en ? bi(it.attrs.prompt_th, it.attrs.prompt_en) : '';
      caption = p ? `<p class="fx-prompt">${p}</p>` : '';
    } else {
      const [, label, result] = m;
      let summary = result;
      let tone = it.attrs.result ?? null;
      if (result.includes('|')) {
        const parts = result.split('|').map((t) => t.trim()).filter(Boolean);
        object = { kind: 'chips', parts };
        summary = `${parts.length} tokens`;
        tone ??= 'ok';
      } else if (/^\d+\s+\S+$/.test(result.trim()) && object) {
        // "split() → 1 token": the same object, now marked as one unit
        object = { ...object, kind: object.kind === 'chips' ? 'chips' : 'boxed' };
        tone ??= 'bad';
      } else {
        object = { kind: 'text', html: inline(result) };
      }
      const pastHtml = past.length ? `<p class="fx-past">${past.map((p) => `(${p})`).join(' ')}</p>` : '';
      caption = `<p class="fx-caption"><span class="fx-label${tone ? ` tone-${tone}` : ''}">${tone === 'ok' ? icon('ok', 26) : tone === 'bad' ? icon('bad', 26) : ''}<code>${esc(label)}</code> → ${esc(summary)}</span>${note(it)}</p>${pastHtml}`;
      past.push(`${esc(label)} → ${esc(summary)}`);
    }
    return `<div class="fx-step" data-step="${k}"><div class="fx-object">${objectHtml(object)}</div>${caption}</div>`;
  });
  return frame('steps fx-morph', `${head()}<div class="fx-body"><div class="fx-stage">${stages.join('')}</div></div>`, { steps: items.length });
}

function note(it) {
  return it.attrs.note_th || it.attrs.note_en ? `<span class="fx-note">${bi(it.attrs.note_th && inline(it.attrs.note_th), it.attrs.note_en && inline(it.attrs.note_en))}</span>` : '';
}

function objectHtml(o) {
  if (!o) return '';
  if (o.kind === 'chips') return `<ul class="fx-chips">${o.parts.map((p) => `<li>${inline(p)}</li>`).join('')}</ul>`;
  return `<p class="fx-string${o.kind === 'boxed' ? ' is-boxed' : ''}">${o.html}</p>`;
}

// ---------------------------------------------------------------- code step-through

function codeFrame(n, stepOutputs, s, frame, ctx) {
  const lines = String(n.attrs.steps).split(',').map((x) => Number(x.trim())).filter(Boolean);
  const total = n.text.replace(/\s+$/, '').split('\n').length;
  const bad = lines.find((l) => l < 1 || l > total);
  if (bad) throw new LectureError(ctxFile(), n.line, `steps="${n.attrs.steps}" names line ${bad}, but the code has ${total} lines`);
  const outputs = {};
  for (const l of stepOutputs?.lines ?? []) {
    const m = l.match(/^\s*(\d+)\s*:\s?(.*)$/);
    if (m) outputs[m[1]] = m[2];
  }
  const side = lines
    .map((ln, k) => {
      const out = outputs[ln];
      return `<div class="fx-step fx-out" data-step="${k}"><p class="fx-out-label">${T([`ผลลัพธ์ของบรรทัด ${ln}`, `Output of line ${ln}`])}</p>${
        out != null ? `<pre class="fx-out-value">${esc(out)}</pre>` : `<p class="fx-out-none">${T(['บรรทัดนี้ไม่แสดงผล', 'This line prints nothing'])}</p>`
      }</div>`;
    })
    .join('');
  return frame(
    'code',
    `<header class="fx-head fx-head-sm"><h2 lang="en">${inline(s.title)}</h2></header><div class="fx-codegrid"><pre class="fx-code"><code>${codeLines(n, ctx)}</code></pre><div class="fx-side">${side}</div></div>`,
    { steps: lines.length, extra: ` data-lines="${lines.join(',')}"` },
  );
}

// ---------------------------------------------------------------- deck chrome

export function focusDeckHtml(framesHtml) {
  return `<div id="focus" class="fx" hidden role="dialog" aria-modal="true" aria-label="โหมดโฟกัส / Focus mode" tabindex="-1">
<div class="fx-top"><span class="fx-where"></span><span class="fx-count" aria-live="polite"></span></div>
<div class="fx-frames">
${framesHtml}
</div>
<div class="fx-bottom">
<div class="fx-progress"></div>
<div class="fx-keys">
<button type="button" class="fx-key" data-fx="next"><span aria-hidden="true">→</span> <span class="fx-next-label"></span></button>
<button type="button" class="fx-key" data-fx="prev"><span aria-hidden="true">←</span> ${T(['ย้อนกลับ', 'Back'])}</button>
<button type="button" class="fx-key" data-fx="exit"><kbd>F</kbd> ${T(['ออก', 'Exit'])}</button>
</div>
</div>
</div>`;
}
