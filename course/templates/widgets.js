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

  var all = document.querySelectorAll('.ixp');
  for (var i = 0; i < all.length; i++) explorer(all[i]);
})();
