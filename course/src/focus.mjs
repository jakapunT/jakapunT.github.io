// Focus mode (CLAUDE.md §7): the same lecture as projector frames, one idea per frame.
// Frames are rendered here at build time; templates/focus.js only switches between them.
//
// What a section becomes:
//   ::: focus      → one frame per block, showing exactly its content (overrides the default)
//   ::: steps      → one frame, one step per list item
//   code {steps=}  → one frame that highlights one line per step, with ::: step-outputs
//   ::: transform  → one frame with the before → after tables ({focus=false}: none, for a ::: focus copy)
//   otherwise      → heading + the first example, tokens, figure, plot, dataframe, code,
//                    table or key-term list (heading alone if there is none)
// Paragraphs never show; the teacher says them.

import { esc, inline, T, UI, icon, renderTokens, renderTable, renderBlocks, wrapLastExpression, ctxFile, splitColumns, outputTable, plotDataSnippet } from './render.mjs';
import { renderTransform } from './transform.mjs';
import { renderDataframe, renderPrompt, renderFigure, renderIndexExplorer, renderCards, imageTag, renderBpeExplorer } from './blocks.mjs';
import { highlightLines } from './highlight.mjs';
import { renderInteractive, INTERACTIVE_LANGS } from './interactives.mjs';
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

  // ::: columns: one two-part frame, each side showing only what projects well
  // (code, tables, figures, prompts, and lists such as a ::: steps loop beside them)
  const columnsFrame = (cols) => {
    const [main, side] = splitColumns(cols.children);
    const left = focusPiece(main, ctx);
    const right = focusPiece(side, ctx);
    if (left && right) {
      const even = cols.attrs.split === 'even' ? ' fx-cols-even' : '';
      return frame('cols', `${head(' fx-head-sm')}<div class="fx-body"><div class="fx-cols${even}"><div class="fx-col">${left}</div><div class="fx-col">${right}</div></div></div>`);
    }
    if (left || right) return frame('default', `${head(' fx-head-sm')}<div class="fx-body">${left || right}</div>`);
    return null;
  };

  const walk = (nodes, fn, parentExercise = null) => {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      fn(n, i, nodes, parentExercise);
      if (n.type === 'container' && !['th', 'en', 'answer', 'focus', 'summary', 'columns'].includes(n.name)) {
        walk(n.children, fn, n.name === 'exercise' ? n : parentExercise);
      }
    }
  };

  walk(s.blocks, (n, i, siblings, exercise) => {
    if (n.type === 'container' && n.name === 'columns') {
      const f = columnsFrame(n);
      if (f) out.push(f);
      return;
    }
    if (n.type === 'container' && n.name === 'focus') {
      const answer = exercise?.children.find((c) => c.type === 'container' && c.name === 'answer');
      out.push(focusFrame(n, exercise, answer, head, frame, ctx));
    } else if (n.type === 'container' && n.name === 'steps') {
      out.push(stepsFrame(n, head, frame));
    } else if (n.type === 'fence' && n.attrs.steps) {
      const next = siblings[i + 1]?.type === 'fence' && siblings[i + 1].lang === 'output' ? siblings[i + 2] : siblings[i + 1];
      const stepOutputs = next?.type === 'container' && next.name === 'step-outputs' ? next : null;
      out.push(codeFrame(n, stepOutputs, s, frame, ctx));
    } else if (n.type === 'fence' && siblings[i + 1]?.type === 'fence' && siblings[i + 1].lang === 'output' && siblings[i + 1].attrs.plot) {
      // a plotting cell: the code beside the chart it draws
      const plot = `<div class="fx-plot">${imageTag(siblings[i + 1].attrs.plot, { ...ctx, file: ctxFile() }, siblings[i + 1].attrs.alt ?? '', siblings[i + 1].line)}</div>`;
      out.push(frame('cols', `${head(' fx-head-sm')}<div class="fx-body"><div class="fx-cols fx-cols-plot"><div class="fx-col">${visualHtml(n, ctx)}${plotDataSnippet(n, ctx)}</div><div class="fx-col">${plot}</div></div></div>`));
    } else if (n.type === 'fence' && n.lang === 'cards' && n.attrs.focus !== 'false') {
      out.push(frame('widget', `${head(' fx-head-sm')}<div class="fx-body">${renderCards(n, { ...ctx, file: ctxFile() })}</div>`));
    } else if (n.type === 'fence' && n.lang === 'bpe-explorer') {
      out.push(frame('widget', `${head(' fx-head-sm')}<div class="fx-body">${renderBpeExplorer(n, { ...ctx, file: ctxFile() })}</div>`));
    } else if (n.type === 'fence' && INTERACTIVE_LANGS.has(n.lang)) {
      out.push(frame('widget', `${head(' fx-head-sm')}<div class="fx-body">${renderInteractive(n, { ...ctx, file: ctxFile() })}</div>`));
    } else if (n.type === 'fence' && n.lang === 'index-explorer') {
      out.push(frame('widget', `${head(' fx-head-sm')}<div class="fx-body">${renderIndexExplorer(n, { ...ctx, file: ctxFile() })}</div>`));
    } else if (n.type === 'container' && n.name === 'transform' && n.attrs.focus !== 'false') {
      out.push(frame('transform', `${head(' fx-head-sm')}<div class="fx-body">${renderTransform(n, { ...ctx, file: ctxFile(), renderBlocks: (nodes) => renderBlocks(nodes, ctx) })}</div>`));
    }
  });
  if (out.length) return out;

  // default: heading plus the first visual block
  let visual = null;
  walk(s.blocks, (n) => {
    if (visual) return;
    if (n.type === 'container' && (n.name === 'example' || n.name === 'tokens')) visual = n;
    else if (n.type === 'fence' && n.lang !== 'output' && !(n.lang === 'prompt' && n.attrs.attach) && n.attrs.focus !== 'false') visual = n;
    else if (n.type === 'table' || n.type === 'deflist') visual = n;
  });
  const compact = visual && (visual.type === 'table' || visual.type === 'fence');
  return [frame(visual ? 'default' : 'title', `${head(!visual ? ' fx-head-lg' : compact ? ' fx-head-sm' : '')}${visual ? `<div class="fx-body">${visualHtml(visual, ctx)}</div>` : ''}`)];
}

// What one side of a ::: columns frame shows: visuals as they are, lists as big points.
// Paragraphs and warnings are what the teacher says, so they never show.
function focusPiece(nodes, ctx) {
  return nodes
    .map((n, i) => {
      if (n.type === 'fence' && n.lang === 'output') {
        // shown under its code: in a side-by-side frame the results are what students compare
        if (nodes[i - 1]?.type !== 'fence') return '';
        if (n.attrs.plot) return `<div class="fx-plot">${imageTag(n.attrs.plot, { ...ctx, file: ctxFile() }, n.attrs.alt ?? '', n.line)}</div>`;
        return `<div class="fx-mini-out">${n.attrs.table ? outputTable(n.text, n.attrs.table) : `<pre>${esc(n.text.replace(/\s+$/, ''))}</pre>`}</div>`;
      }
      if (n.type === 'fence' && n.lang === 'prompt' && n.attrs.attach) return ''; // behind the code's Prompt button in page view
      if (n.type === 'fence') return visualHtml(n, ctx);
      if (n.type === 'table') return renderTable(n);
      if (n.type === 'md') return pointsHtml(n.text);
      if (n.type === 'container') {
        if (n.name === 'th' || n.name === 'en') {
          const inner = focusPiece(n.children, ctx);
          return inner ? `<div data-only="${n.name}" lang="${n.name}">${inner}</div>` : '';
        }
        if (n.name === 'steps') return pointsHtml(n.lines.join('\n'), true);
        if (['concept', 'example'].includes(n.name)) return focusPiece(n.children, ctx);
        if (n.name === 'tokens') return renderTokens(n);
      }
      return '';
    })
    .join('');
}

function pointsHtml(text, stripAttrs = false) {
  const items = text
    .split('\n')
    .map((l) => l.match(/^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/))
    .filter(Boolean);
  if (!items.length) return '';
  const ordered = !items[0][1];
  const li = items
    .map((m) => {
      if (!stripAttrs) return `<li>${inline(m[3])}</li>`;
      const [text, attrs] = splitTrailingAttrs(m[3]);
      return `<li>${inline(text)}${attrs.th ? `<em data-only="th">${inline(attrs.th)}</em>` : ''}</li>`;
    })
    .join('');
  return ordered ? `<ol class="fx-points">${li}</ol>` : `<ul class="fx-points">${li}</ul>`;
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
    if (n.lang === 'dataframe') return renderDataframe(n, { ...ctx, file: ctxFile() });
    if (n.lang === 'prompt') return renderPrompt(n, { ...ctx, file: ctxFile() });
    if (n.lang === 'figure') return renderFigure(n, { ...ctx, file: ctxFile() });
    if (n.lang === 'cards') return renderCards(n, { ...ctx, file: ctxFile() });
    if (['plot', 'error', 'formula', 'read-result'].includes(n.lang)) return '';
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
  // a frame that is only a figure, a table, cards or a transform: small heading, so the visual gets the height
  const visualOnly = n.children.every((c) => (c.type === 'fence' && ['figure', 'cards'].includes(c.lang)) || c.type === 'table' || (c.type === 'container' && c.name === 'transform'));
  if (!exercise) return frame('focus', `${head(visualOnly ? ' fx-head-sm' : '')}<div class="fx-body">${content}</div>`);

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
  // list items of the answer itself: not lines inside a code or prompt fence, and not lists
  // inside a nested ::: th / ::: en block (those explain the answer in page view)
  let inFence = false;
  let depth = 0;
  const listLines = answer.lines.filter((l) => {
    if (/^\s*(```|~~~)/.test(l)) inFence = !inFence;
    if (inFence) return false;
    if (/^\s*:::\s*\S/.test(l)) depth++;
    else if (/^\s*:::\s*$/.test(l)) depth = Math.max(0, depth - 1);
    return depth === 0;
  });
  const cards = listLines
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
    const lis = items.map((it, k) => `<li class="fx-step" data-step="${k}">${inline(it.text)}${it.attrs.th ? `<span class="fx-note" data-only="th">${inline(it.attrs.th)}</span>` : ''}${note(it)}</li>`).join('');
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
  // long lines get a wider code column and smaller type so nothing is cut off
  const longest = Math.max(...n.text.split('\n').map((l) => l.length));
  const width = longest > 62 ? ' fx-code-xlong' : longest > 44 ? ' fx-code-long' : '';
  return frame(
    'code',
    `<header class="fx-head fx-head-sm"><h2 lang="en">${inline(s.title)}</h2></header><div class="fx-codegrid${width}"><pre class="fx-code"><code>${codeLines(n, ctx)}</code></pre><div class="fx-side">${side}</div></div>`,
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
