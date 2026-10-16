// Local preview only (npm run dev). Never included in published pages.
//   ✎ Edit (or E): click a block to edit its Markdown; Save writes it back to the .md file.
//   ⌥ Option + click: open the .md file at that block's line in VS Code.
(function () {
  'use strict';
  var main = document.querySelector('[data-src-file]');
  if (!main) return;
  var FILE = main.getAttribute('data-src-file');
  var HEADERS = { 'Content-Type': 'application/json', 'X-Course-Dev': '1' };
  var KEY = 'course-dev-edit';
  var editing = false;
  try { editing = sessionStorage.getItem(KEY) === '1'; } catch (e) { /* ignore */ }

  // ---------- toolbar ----------
  var bar = document.createElement('div');
  bar.className = 'dev-bar';
  bar.innerHTML =
    '<button type="button" class="dev-toggle" aria-pressed="false"><span aria-hidden="true">✎</span> Edit</button>' +
    '<span class="dev-hint">⌥ click → VS Code</span>' +
    '<span class="dev-status" role="status"></span>';
  document.body.appendChild(bar);
  var toggle = bar.querySelector('.dev-toggle');
  var status = bar.querySelector('.dev-status');

  var outline = document.createElement('div');
  outline.className = 'dev-outline';
  outline.hidden = true;
  document.body.appendChild(outline);

  function setStatus(text, kind) {
    status.textContent = text || '';
    status.className = 'dev-status' + (kind ? ' is-' + kind : '');
  }

  function setEditing(on) {
    editing = on;
    toggle.setAttribute('aria-pressed', String(on));
    document.documentElement.classList.toggle('dev-editing', on);
    if (!on) outline.hidden = true;
    try { sessionStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  setEditing(editing);
  toggle.addEventListener('click', function () { setEditing(!editing); });

  // ---------- finding the block under the pointer ----------
  function blockAt(target) {
    if (!target || !target.closest || target.closest('.dev-bar, .dev-panel, #focus')) return null;
    return target.closest('[data-src]');
  }
  function rectOf(el) {
    // .src-node wrappers use display:contents, so measure their content instead
    if (getComputedStyle(el).display === 'contents') {
      var r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect();
    }
    return el.getBoundingClientRect();
  }
  function lines(el) {
    var p = el.getAttribute('data-src').split('-');
    return { start: Number(p[0]), end: Number(p[1] || p[0]) };
  }

  document.addEventListener('mousemove', function (e) {
    if (!editing || panel) return;
    var el = blockAt(e.target);
    if (!el) { outline.hidden = true; return; }
    var r = rectOf(el);
    outline.hidden = false;
    outline.style.top = (r.top - 4) + 'px';
    outline.style.left = (r.left - 4) + 'px';
    outline.style.width = (r.width + 8) + 'px';
    outline.style.height = (r.height + 8) + 'px';
    var l = lines(el);
    outline.setAttribute('data-label', 'L' + l.start + (l.end !== l.start ? '–' + l.end : ''));
  }, { passive: true });
  window.addEventListener('scroll', function () { outline.hidden = true; }, { passive: true });

  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: HEADERS, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.statusText); return j; }); });
  }

  function openInCode(line) {
    api('/__open', { file: FILE, line: line }).then(
      function () { setStatus('Opened in VS Code at line ' + line); },
      function (err) { setStatus(err.message, 'error'); }
    );
  }

  // capture phase, so links and buttons don't also fire
  document.addEventListener('click', function (e) {
    var el = blockAt(e.target);
    if (!el) return;
    if (e.altKey) {
      e.preventDefault(); e.stopPropagation();
      openInCode(lines(el).start);
      return;
    }
    if (editing && !panel) {
      e.preventDefault(); e.stopPropagation();
      openPanel(el);
    }
  }, true);

  // ---------- the edit panel ----------
  var panel = null;
  function openPanel(el) {
    var l = lines(el);
    outline.hidden = true;
    api('/__source?file=' + encodeURIComponent(FILE) + '&start=' + l.start + '&end=' + l.end).then(function (src) {
      el.classList.add('dev-target');
      panel = document.createElement('div');
      panel.className = 'dev-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Edit Markdown');
      panel.innerHTML =
        '<div class="dev-panel-head"><span class="dev-where"></span><button type="button" class="dev-link" data-act="code">Open in VS Code</button></div>' +
        '<textarea spellcheck="false" aria-label="Markdown source"></textarea>' +
        '<p class="dev-error" role="alert"></p>' +
        '<div class="dev-actions"><span class="dev-keys">⌘↩ save · Esc cancel</span>' +
        '<button type="button" class="dev-btn" data-act="cancel">ยกเลิก Cancel</button>' +
        '<button type="button" class="dev-btn dev-save" data-act="save">บันทึก Save</button></div>';
      document.body.appendChild(panel);
      panel.querySelector('.dev-where').textContent = FILE.split('/').pop() + (l.end !== l.start ? ' · lines ' + l.start + '–' + l.end : ' · line ' + l.start);
      var ta = panel.querySelector('textarea');
      var error = panel.querySelector('.dev-error');
      ta.value = src.text;
      ta.rows = Math.min(18, Math.max(3, src.text.split('\n').length + 1));
      ta.focus();

      function close() {
        el.classList.remove('dev-target');
        if (panel) panel.remove();
        panel = null;
      }
      function save() {
        if (ta.value === src.text) { close(); return; }
        var btn = panel.querySelector('.dev-save');
        btn.disabled = true;
        error.textContent = '';
        api('/__save', { file: FILE, start: l.start, end: l.end, original: src.text, text: ta.value }).then(
          function () {
            setStatus('Saved · rebuilding…', 'ok');
            try { sessionStorage.setItem('course-dev-scroll', String(window.scrollY)); } catch (e) { /* ignore */ }
            close();
          },
          function (err) { error.textContent = err.message; btn.disabled = false; }
        );
      }
      panel.addEventListener('click', function (e) {
        var act = e.target.getAttribute('data-act');
        if (act === 'cancel') close();
        else if (act === 'save') save();
        else if (act === 'code') openInCode(l.start);
      });
      panel.addEventListener('keydown', function (e) {
        e.stopPropagation(); // keep F and arrow keys away from focus mode
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
      });
    }, function (err) { setStatus(err.message, 'error'); });
  }

  // E toggles edit mode (when not typing)
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || panel) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.code === 'KeyE' && !document.documentElement.classList.contains('fx-on')) { e.preventDefault(); setEditing(!editing); }
  });

  // ---------- live reload, keeping the scroll position ----------
  try {
    var y = sessionStorage.getItem('course-dev-scroll');
    if (y) { sessionStorage.removeItem('course-dev-scroll'); window.scrollTo(0, Number(y)); }
  } catch (e) { /* ignore */ }
  new EventSource('/__reload').onmessage = function (e) {
    if (e.data === 'reload') {
      if (panel) { setStatus('The file changed; reload when you are done editing', 'error'); return; }
      try { sessionStorage.setItem('course-dev-scroll', String(window.scrollY)); } catch (err) { /* ignore */ }
      location.reload();
    } else if (e.data.indexOf('error ') === 0) {
      var msg = e.data.slice(6);
      try { msg = JSON.parse(msg); } catch (err) { /* keep raw */ }
      setStatus('Build failed: ' + msg, 'error');
    }
  };
})();
