// Interactive blocks. Runs after StatiCrypt decrypts the page; depends on nothing else.
//
// ```index-explorer: a small table showing positions (for .iloc) and index labels (for .loc).
// Clicking a cell, an index label or a column name shows both ways to reach it. The view
// switch (original / sorted / filtered) shows that labels stay with their rows while
// positions are counted again from 0.
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(th, en) {
    return '<span data-only="th">' + th + '</span><span data-only="en" lang="en">' + en + '</span>';
  }
  function q(s) { return '"' + esc(s) + '"'; }

  function explorer(el) {
    var d;
    try { d = JSON.parse(el.getAttribute('data-ixp')); } catch (e) { return; }
    if (!d) return;
    var body = el.querySelector('.ixp-body');
    var n = d.columns[0].shown.length;
    var name = d.name;
    var state = { view: 'orig', kind: 'cell', label: d.pick || 0, col: d.sort != null ? d.sort : 0 };

    var views = [{ id: 'orig', th: 'ตารางเดิม', en: 'Original' }];
    if (d.sort != null) views.push({ id: 'sorted', th: 'เรียงตาม ' + esc(d.columns[d.sort].name), en: 'Sorted by ' + esc(d.columns[d.sort].name) });
    if (d.filter) views.push({ id: 'filtered', th: 'กรอง ' + esc(d.columns[d.filter.col].name) + ' ≥ ' + d.filter.min, en: 'Filtered ' + esc(d.columns[d.filter.col].name) + ' ≥ ' + d.filter.min });

    function rowsFor(view) {
      var labels = [];
      for (var i = 0; i < n; i++) labels.push(i);
      if (view === 'sorted') {
        var raw = d.columns[d.sort].raw;
        // like sort_values(ascending=False): highest first, ties keep order, missing last
        labels.sort(function (a, b) {
          var x = raw[a], y = raw[b];
          if (x == null && y == null) return a - b;
          if (x == null) return 1;
          if (y == null) return -1;
          return y - x || a - b;
        });
      } else if (view === 'filtered') {
        var col = d.columns[d.filter.col].raw;
        labels = labels.filter(function (i) { return col[i] != null && col[i] >= d.filter.min; });
      }
      return labels;
    }

    function viewVar() { return state.view === 'sorted' ? 'ranked' : state.view === 'filtered' ? 'high' : name; }
    function viewCode() {
      if (state.view === 'sorted') return 'ranked = ' + name + '.sort_values(' + q(d.columns[d.sort].name) + ', ascending=False)';
      if (state.view === 'filtered') return 'high = ' + name + '.loc[' + name + '[' + q(d.columns[d.filter.col].name) + '] &gt;= ' + d.filter.min + ']';
      return name + ' = pd.read_csv(...)';
    }

    function readout(labels) {
      var v = viewVar();
      var pos = labels.indexOf(state.label);
      var c = state.col;
      var colName = d.columns[c] ? d.columns[c].name : '';
      var L = '<b class="ixp-lab">' + state.label + '</b>';
      var P = '<b class="ixp-pos-n">' + pos + '</b>';
      var C = '<b class="ixp-pos-n">' + c + '</b>';
      if (state.kind !== 'col' && pos < 0) {
        return '<p class="ixp-gone">' + T('แถวที่มีป้ายชื่อ ' + state.label + ' ถูกกรองออกไปแล้ว ลองคลิกแถวอื่น', 'The row labelled ' + state.label + ' was filtered out. Click another row.') + '</p>';
      }
      var loc, iloc, what;
      if (state.kind === 'cell') {
        loc = v + '.loc[' + L + ', ' + q(colName) + ']';
        iloc = v + '.iloc[' + P + ', ' + C + ']';
        what = '<code class="ixp-val">' + esc(d.columns[c].shown[state.label]) + '</code>';
      } else if (state.kind === 'row') {
        loc = v + '.loc[' + L + ']';
        iloc = v + '.iloc[' + P + ']';
        what = T('ทั้งแถว (Series)', 'the whole row (a Series)');
      } else {
        loc = v + '[' + q(colName) + ']';
        iloc = v + '.iloc[:, ' + C + ']';
        what = T('ทั้งคอลัมน์ (Series)', 'the whole column (a Series)');
      }
      var note = '';
      if (state.kind !== 'col') {
        note = pos === state.label
          ? T('ในตารางนี้ป้ายชื่อ ' + state.label + ' อยู่ที่ตำแหน่ง ' + pos + ' พอดี จึงดูเหมือนกัน', 'Here label ' + state.label + ' happens to sit at position ' + pos + ', so they look alike.')
          : T('ป้ายชื่อ ' + state.label + ' อยู่ที่ตำแหน่ง ' + pos + ' ป้ายชื่อติดไปกับแถว ตำแหน่งนับใหม่จาก 0', 'Label ' + state.label + ' is at position ' + pos + ': the label travels with the row; positions are counted again from 0.');
      }
      return '<div class="ixp-lines">' +
        '<p><span class="ixp-tag ixp-tag-loc">.loc</span><code>' + loc + '</code><span class="ixp-res"><span class="ixp-arrow" aria-hidden="true">→</span>' + what + '<span class="ixp-why">' + T('ใช้ป้ายชื่อ', 'by label') + '</span></span></p>' +
        '<p><span class="ixp-tag ixp-tag-iloc">.iloc</span><code>' + iloc + '</code><span class="ixp-res"><span class="ixp-arrow" aria-hidden="true">→</span>' + what + '<span class="ixp-why">' + T('ใช้ตำแหน่ง', 'by position') + '</span></span></p>' +
        '</div>' + (note ? '<p class="ixp-note">' + note + '</p>' : '');
    }

    function render() {
      var labels = rowsFor(state.view);
      var h = '<div class="ixp-views" role="group" aria-label="มุมมอง / View">';
      views.forEach(function (vw) {
        h += '<button type="button" data-view="' + vw.id + '" aria-pressed="' + (vw.id === state.view) + '">' + T(vw.th, vw.en) + '</button>';
      });
      h += '</div><p class="ixp-code"><code>' + viewCode() + '</code></p>';
      h += '<div class="ixp-grid"><div class="ixp-tablewrap"><table class="ixp-table"><thead>';
      h += '<tr class="ixp-colpos"><th class="ixp-c-pos"></th><th class="ixp-c-idx"></th>';
      d.columns.forEach(function (col, j) { h += '<th class="ixp-pos-cell' + (state.kind !== 'row' && state.col === j ? ' is-on' : '') + '">' + j + '</th>'; });
      h += '</tr><tr><th scope="col" class="ixp-c-pos">' + T('ตำแหน่ง', 'position') + '<small>.iloc</small></th><th scope="col" class="ixp-c-idx">index<small>.loc</small></th>';
      d.columns.forEach(function (col, j) {
        h += '<th scope="col" class="' + (col.numeric ? 'ixp-num' : '') + '"><button type="button" class="ixp-colbtn' + (state.kind === 'col' && state.col === j ? ' is-sel' : '') + '" data-col="' + j + '">' + esc(col.name) + '</button></th>';
      });
      h += '</tr></thead><tbody>';
      labels.forEach(function (label, pos) {
        var rowOn = state.label === label && state.kind !== 'col';
        h += '<tr class="' + (rowOn ? 'is-row' : '') + '">';
        h += '<td class="ixp-c-pos' + (rowOn ? ' is-on' : '') + '">' + pos + '</td>';
        h += '<th scope="row" class="ixp-c-idx"><button type="button" class="ixp-rowbtn' + (state.kind === 'row' && rowOn ? ' is-sel' : '') + '" data-row="' + label + '">' + label + '</button></th>';
        d.columns.forEach(function (col, j) {
          var v = col.shown[label];
          var on = (state.kind === 'cell' && rowOn && state.col === j) || (state.kind === 'col' && state.col === j);
          h += '<td class="' + (col.numeric ? 'ixp-num' : '') + (v === 'NaN' ? ' ixp-nan' : '') + '"><button type="button" class="ixp-cell' + (on ? ' is-sel' : '') + '" data-cell="' + label + ',' + j + '" aria-label="' + esc(col.name) + ', index ' + label + ': ' + esc(v) + '">' + esc(v) + '</button></td>';
        });
        h += '</tr>';
      });
      h += '</tbody></table></div><div class="ixp-out" aria-live="polite">' + readout(labels) + '</div></div>';
      h += '<p class="ixp-hint">' + T('คลิกช่องไหนก็ได้ คลิกเลข index เพื่อเลือกทั้งแถว หรือคลิกชื่อคอลัมน์เพื่อเลือกทั้งคอลัมน์ แล้วลองเปลี่ยนมุมมองด้านบน', 'Click any cell, an index label for a whole row, or a column name for a whole column. Then switch the view above.') + '</p>';
      body.innerHTML = h;
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      var focusKey = null;
      if (b.hasAttribute('data-view')) { state.view = b.getAttribute('data-view'); focusKey = '[data-view="' + state.view + '"]'; }
      else if (b.hasAttribute('data-cell')) {
        var p = b.getAttribute('data-cell').split(',');
        state.kind = 'cell'; state.label = Number(p[0]); state.col = Number(p[1]);
        focusKey = '[data-cell="' + b.getAttribute('data-cell') + '"]';
      } else if (b.hasAttribute('data-row')) { state.kind = 'row'; state.label = Number(b.getAttribute('data-row')); focusKey = '[data-row="' + state.label + '"]'; }
      else if (b.hasAttribute('data-col')) { state.kind = 'col'; state.col = Number(b.getAttribute('data-col')); focusKey = '[data-col="' + state.col + '"]'; }
      else return;
      e.stopPropagation(); // keep focus-mode click handlers out of it
      render();
      var again = focusKey && el.querySelector(focusKey); // keep keyboard focus where it was
      if (again) again.focus();
    });
    // arrow keys are left alone, so a clicker still moves focus-mode frames after a click here
    render();
  }

  var all = document.querySelectorAll('.ixp[data-ixp]');
  for (var i = 0; i < all.length; i++) explorer(all[i]);
})();

// ```bpe-explorer: Byte-Pair Encoding one merge at a time. Every step was computed at build
// time (src/blocks.mjs); this only shows step k: the corpus as pieces (the piece made by the
// last merge highlighted), the neighbouring pairs counted, and the vocabulary learned so far.
(function () {
  'use strict';
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function T(th, en) {
    return '<span data-only="th">' + th + '</span><span data-only="en" lang="en">' + en + '</span>';
  }
  function chip(t, cls) {
    return '<span class="bpe-chip' + (cls ? ' ' + cls : '') + '">' + esc(t) + '</span>';
  }

  function explorer(el) {
    var d;
    try { d = JSON.parse(el.getAttribute('data-bpe')); } catch (e) { return; }
    var body = el.querySelector('.ixp-body');
    var last = d.steps.length - 1;
    var k = 0;

    function render() {
      var s = d.steps[k];
      var html = '<div class="bpe-bar">' +
        '<button type="button" data-go="first"' + (k === 0 ? ' disabled' : '') + '>' + T('เริ่มใหม่', 'Restart') + '</button>' +
        '<button type="button" data-go="prev"' + (k === 0 ? ' disabled' : '') + '>◀ ' + T('ก่อนหน้า', 'Back') + '</button>' +
        '<span class="bpe-count">' + T('รวมไปแล้ว ' + k + ' / ' + last + ' รอบ', k + ' of ' + last + ' merges') + '</span>' +
        '<button type="button" class="bpe-next" data-go="next"' + (k === last ? ' disabled' : '') + '>' + T('ถัดไป', 'Next') + ' ▶</button>' +
        '</div>';

      // what just happened / what happens next
      var best = null;
      for (var i = 0; i < s.pairs.length; i++) if (s.pairs[i].best) best = s.pairs[i];
      var say;
      if (k === 0) say = T('เริ่มจากตัวอักษรเดี่ยว (_ คือท้ายคำ) แล้วนับคู่ที่อยู่ติดกัน', 'Start from single letters (_ marks the end of a word), then count the neighbouring pairs');
      else say = T('รวม <b>' + esc(s.made) + '</b> แล้ว ทุกที่ที่คู่นี้อยู่ติดกันกลายเป็นชิ้นเดียว', 'Merged <b>' + esc(s.made) + '</b>: wherever the pair sat side by side, it is now one piece');
      html += '<p class="bpe-say">' + say + '</p>';

      // corpus
      html += '<div class="bpe-grid"><div><p class="bpe-h">' + T('คลังคำ (แบ่งเป็นชิ้น)', 'Corpus, as pieces') + '</p><table class="bpe-words"><tbody>';
      s.words.forEach(function (w) {
        html += '<tr><th scope="row">' + esc(w.word) + ' <span class="bpe-x">×' + w.count + '</span></th><td>' +
          w.pieces.map(function (p) { return chip(p, p === s.made ? 'bpe-new' : (p.length > 1 ? 'bpe-merged' : '')); }).join('') + '</td></tr>';
      });
      html += '</tbody></table></div>';

      // pair counts
      html += '<div><p class="bpe-h">' + T('คู่ที่อยู่ติดกัน นับกี่ครั้ง', 'Neighbouring pairs, counted') + '</p><table class="bpe-pairs"><tbody>';
      s.pairs.forEach(function (p) {
        html += '<tr' + (p.best && k < last ? ' class="bpe-best"' : '') + '><td>' + chip(p.a) + '+' + chip(p.b) + '</td><td class="bpe-n">' + p.count + '</td><td class="bpe-from">' + esc(p.from) + '</td></tr>';
      });
      html += '</tbody></table>';
      if (k < last && best) html += '<p class="bpe-next-say">' + T('มากที่สุด → รอบถัดไปจะรวม ', 'Most frequent → next merge: ') + chip(best.a) + '+' + chip(best.b) + ' → ' + chip(best.a + best.b, 'bpe-new') + '</p>';
      html += '</div></div>';

      // vocabulary
      html += '<p class="bpe-h">' + T('ชิ้นที่เรียนได้ (ตามลำดับ)', 'Pieces learned, in order') + '</p><p class="bpe-vocab">' +
        (s.learned.length ? s.learned.map(function (t, i) { return chip(t, i === s.learned.length - 1 ? 'bpe-new' : 'bpe-merged'); }).join(' ') : '<span class="bpe-none">' + T('ยังไม่มี', 'none yet') + '</span>') + '</p>';

      if (k === last && d.test) {
        html += '<p class="bpe-test">' + T('คำใหม่ที่ไม่เคยเห็น <b>' + esc(d.test.word) + '</b> ตัดได้เป็น ', 'A word never seen, <b>' + esc(d.test.word) + '</b>, becomes ') +
          d.test.pieces.map(function (p) { return chip(p, p.length > 1 ? 'bpe-merged' : ''); }).join('') + '</p>';
      }
      body.innerHTML = html;
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-go]');
      if (!b || !el.contains(b)) return;
      var go = b.getAttribute('data-go');
      if (go === 'next' && k < last) k++;
      else if (go === 'prev' && k > 0) k--;
      else if (go === 'first') k = 0;
      e.stopPropagation(); // keep focus-mode click handlers out of it
      render();
      var again = el.querySelector('[data-go="' + (k === last ? 'prev' : go === 'first' ? 'next' : go) + '"]');
      if (again && !again.disabled) again.focus();
    });
    render();
  }

  var all = document.querySelectorAll('.bpe');
  for (var i = 0; i < all.length; i++) explorer(all[i]);
})();
