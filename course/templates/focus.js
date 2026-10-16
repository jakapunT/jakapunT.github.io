// Focus mode runtime: F or the Focus button opens it at the section being read.
// → / PageDown / Space go forward, ← / PageUp go back (clickers send these), Esc or F leave
// it at the same section in page view. Frames are pre-rendered by src/focus.mjs.
(function () {
  'use strict';
  var deck = document.getElementById('focus');
  if (!deck) return;
  var root = document.documentElement;
  var frames = [].slice.call(deck.querySelectorAll('.fx-frame'));
  if (!frames.length) return;
  var where = deck.querySelector('.fx-where');
  var count = deck.querySelector('.fx-count');
  var progress = deck.querySelector('.fx-progress');
  var nextBtn = deck.querySelector('[data-fx="next"]');
  var prevBtn = deck.querySelector('[data-fx="prev"]');
  var nextLabel = deck.querySelector('.fx-next-label');
  var pageParts = [].slice.call(document.querySelectorAll('body > :not(#focus):not(#live):not(script)'));
  var fi = 0;
  var si = 0;
  var opener = null;
  var ownFullscreen = false;

  function en() { return root.getAttribute('data-lang') === 'en'; }
  function tr(th, enText) { return en() ? enText : th; }
  function sid(id) { return id.toUpperCase(); }
  function steps(f) { return Number(f.getAttribute('data-steps')) || 1; }

  function render() {
    var f = frames[fi];
    var n = steps(f);
    frames.forEach(function (x, k) { x.hidden = k !== fi; });
    [].forEach.call(f.querySelectorAll('.fx-step'), function (el) {
      var k = Number(el.getAttribute('data-step'));
      el.classList.toggle('is-past', k < si);
      el.classList.toggle('is-current', k === si);
      el.classList.toggle('is-future', k > si);
      el.setAttribute('aria-hidden', String(k > si));
    });
    f.setAttribute('data-step', String(si));

    var lines = (f.getAttribute('data-lines') || '').split(',').filter(Boolean);
    if (lines.length) {
      [].forEach.call(f.querySelectorAll('.fx-code .ln'), function (ln) {
        ln.classList.toggle('is-cur', ln.getAttribute('data-ln') === lines[si]);
      });
    }

    var sectionId = f.getAttribute('data-section');
    where.textContent = sid(sectionId) + ' · ' + f.getAttribute('data-title');
    var sections = [];
    frames.forEach(function (x) { var s = x.getAttribute('data-section'); if (sections.indexOf(s) < 0) sections.push(s); });
    count.textContent = n > 1
      ? tr('ขั้นที่ ' + (si + 1) + ' / ' + n, 'Step ' + (si + 1) + ' / ' + n)
      : tr('หัวข้อ ' + (sections.indexOf(sectionId) + 1) + ' / ' + sections.length, 'Section ' + (sections.indexOf(sectionId) + 1) + ' / ' + sections.length);

    // progress: line numbers for code, dots for steps
    var html = '';
    if (lines.length) {
      html = '<span class="fx-lines-label">' + tr('บรรทัด', 'Line') + '</span>';
      lines.forEach(function (l, k) { html += '<span class="fx-linebox' + (k < si ? ' is-past' : k === si ? ' is-current' : '') + '">' + l + '</span>'; });
    } else if (n > 1) {
      for (var k = 0; k < n; k++) html += '<span class="fx-dot' + (k < si ? ' is-past' : k === si ? ' is-current' : '') + '"></span>';
    }
    progress.innerHTML = html;
    progress.setAttribute('aria-hidden', 'true');

    var lastStep = si === n - 1;
    var atEnd = lastStep && fi === frames.length - 1;
    nextBtn.hidden = atEnd;
    prevBtn.hidden = fi === 0 && si === 0;
    if (lastStep && !atEnd) {
      var nextSection = frames[fi + 1].getAttribute('data-section');
      nextLabel.textContent = nextSection === sectionId ? tr('ถัดไป', 'Next') : tr('ไปหัวข้อ ', 'Go to ') + sid(nextSection);
    } else {
      nextLabel.textContent = lines.length ? tr('บรรทัดถัดไป', 'Next line') : tr('ขั้นถัดไป', 'Next step');
    }
  }

  function go(delta) {
    var n = steps(frames[fi]);
    if (delta > 0) {
      if (si < n - 1) si++;
      else if (fi < frames.length - 1) { fi++; si = 0; }
    } else if (si > 0) si--;
    else if (fi > 0) { fi--; si = steps(frames[fi]) - 1; }
    render();
  }

  function currentSection() {
    var arts = document.querySelectorAll('article.section');
    var best = null;
    for (var i = 0; i < arts.length; i++) {
      var r = arts[i].getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.35) best = arts[i];
    }
    return (best || arts[0] || {}).id;
  }

  function open(sectionId) {
    if (!deck.hidden) return;
    opener = document.activeElement;
    var id = sectionId || currentSection();
    fi = 0;
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].getAttribute('data-section') === id) { fi = i; break; }
    }
    si = 0;
    pageParts.forEach(function (el) { el.setAttribute('inert', ''); });
    root.classList.add('fx-on');
    deck.hidden = false;
    render();
    deck.focus();
    if (deck.requestFullscreen && !document.fullscreenElement) {
      deck.requestFullscreen().then(function () { ownFullscreen = true; }, function () { /* stays as a full-window overlay */ });
    }
  }

  function close() {
    if (deck.hidden) return;
    var id = frames[fi].getAttribute('data-section');
    deck.hidden = true;
    root.classList.remove('fx-on');
    pageParts.forEach(function (el) { el.removeAttribute('inert'); });
    if (ownFullscreen && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    ownFullscreen = false;
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ block: 'start' });
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    // e.code, so F works with the Thai keyboard layout too
    if (e.code === 'KeyF') { e.preventDefault(); deck.hidden ? open() : close(); return; }
    if (deck.hidden) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        if (e.key === 'Enter' && t && t.tagName === 'BUTTON') return;
        e.preventDefault(); go(1); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); go(-1); break;
      case 'Home': e.preventDefault(); fi = 0; si = 0; render(); break;
      case 'End': e.preventDefault(); fi = frames.length - 1; si = steps(frames[fi]) - 1; render(); break;
      case 'Escape': e.preventDefault(); close(); break;
    }
  });

  // leaving full screen with the browser's own Esc also leaves focus mode
  document.addEventListener('fullscreenchange', function () {
    if (ownFullscreen && !document.fullscreenElement && !deck.hidden) close();
  });

  document.addEventListener('click', function (e) {
    var jump = e.target.closest('[data-fx-open]');
    if (jump) { open(jump.getAttribute('data-fx-open')); return; }
    var b = e.target.closest('[data-fx]');
    if (b) {
      var a = b.getAttribute('data-fx');
      if (a === 'open') open();
      else if (a === 'next') go(1);
      else if (a === 'prev') go(-1);
      else if (a === 'exit') close();
    }
  });

  // re-render labels when the language changes inside focus mode
  new MutationObserver(function () { if (!deck.hidden) render(); }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
})();
