// Page-view runtime: language switch, answer reveal, copy, downloads, table-of-contents highlight.
// Runs after StatiCrypt decrypts the page, so it must not depend on anything outside this file.
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'course-lang';

  // ---------- ไทย / EN ----------
  function setLang(lang, save) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-set-lang') === lang));
    }
    if (save) {
      try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode: choice lasts this visit only */ }
    }
  }
  setLang(root.getAttribute('data-lang') === 'en' ? 'en' : 'th', false);
  // Thai and English differ in length, so switching would jump the page. Keep the section
  // being read at the same place on screen.
  function readingAnchor() {
    var bar = document.querySelector('.topbar');
    var top = bar ? bar.getBoundingClientRect().bottom : 0;
    var blocks = document.querySelectorAll('main article.section, main .week-nav');
    for (var i = 0; i < blocks.length; i++) {
      var r = blocks[i].getBoundingClientRect();
      if (r.bottom > top + 8) return { el: blocks[i], offset: r.top };
    }
    return null;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-lang]');
    if (!b) return;
    var lang = b.getAttribute('data-set-lang');
    if (lang === root.getAttribute('data-lang')) return;
    var anchor = window.scrollY > 0 ? readingAnchor() : null;
    setLang(lang, true);
    if (anchor) window.scrollBy({ top: anchor.el.getBoundingClientRect().top - anchor.offset, behavior: 'instant' });
  });

  // ---------- small helpers ----------
  var files = {};
  try {
    var data = document.getElementById('course-files');
    if (data) files = JSON.parse(data.textContent);
  } catch (e) { /* no files */ }

  var live = document.getElementById('live');
  function announce(th, en) {
    if (!live) return;
    live.textContent = root.getAttribute('data-lang') === 'en' ? en : th;
    setTimeout(function () { live.textContent = ''; }, 2500);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  // Downloads are built from data inside this (decrypted) page, never fetched from the server.
  function download(file) {
    var blob = new Blob([file.text], { type: file.type || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.addEventListener('click', function (e) {
    // answer reveal
    var ans = e.target.closest('.btn-answer');
    if (ans) {
      var panel = document.getElementById(ans.getAttribute('aria-controls'));
      var open = ans.getAttribute('aria-expanded') !== 'true';
      ans.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
      return;
    }
    // the prompt behind a code cell's Prompt button
    var pr = e.target.closest('.btn-prompt');
    if (pr) {
      var box = document.getElementById(pr.getAttribute('aria-controls'));
      var show = pr.getAttribute('aria-expanded') !== 'true';
      pr.setAttribute('aria-expanded', String(show));
      if (box) box.hidden = !show;
      return;
    }
    // copy
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var f = files[cp.getAttribute('data-copy')];
      if (!f) return;
      copyText(f.text).then(
        function () {
          cp.classList.add('is-done');
          announce('คัดลอกแล้ว', 'Copied');
          setTimeout(function () { cp.classList.remove('is-done'); }, 1500);
        },
        function () { announce('คัดลอกไม่สำเร็จ', 'Copy failed'); }
      );
      return;
    }
    // PDF as slides: print the focus-mode frames, one 16:9 page each (focus.css, @media print)
    if (e.target.closest('[data-print-slides]')) {
      printSlides();
      return;
    }
    // download
    var dl = e.target.closest('[data-download]');
    if (dl) {
      var file = files[dl.getAttribute('data-download')];
      if (file) download(file);
    }
  });

  function printSlides() {
    var deck = document.getElementById('focus');
    if (!deck) return;
    // each printed slide gets its own "L10-S02 · Title" line (on screen the deck's top bar does this)
    var frames = deck.querySelectorAll('.fx-frame');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].querySelector('.fx-print-id')) continue;
      var label = document.createElement('p');
      label.className = 'fx-print-id';
      label.textContent = frames[i].getAttribute('data-section').toUpperCase() + ' · ' + frames[i].getAttribute('data-title');
      frames[i].insertBefore(label, frames[i].firstChild);
    }
    root.classList.add('print-slides');
    // a slide drawn for the projector can be taller than 1280×720 at print size: shrink its body to fit
    var bodies = [];
    for (var j = 0; j < frames.length; j++) {
      var f = frames[j];
      var over = f.scrollHeight - f.clientHeight;
      var body = f.querySelector('.fx-body, .fx-codegrid') || f.lastElementChild;
      if (over > 0 && body) {
        // zoom also changes how wide the content lays out, so search for the largest zoom that fits
        var lo = 0.4;
        var hi = 1;
        for (var step = 0; step < 7; step++) {
          var mid = (lo + hi) / 2;
          body.style.zoom = String(mid);
          if (f.scrollHeight - f.clientHeight > 0) hi = mid;
          else lo = mid;
        }
        body.style.zoom = String(lo);
        bodies.push(body);
      }
    }
    function done() {
      root.classList.remove('print-slides');
      bodies.forEach(function (b) { b.style.zoom = ''; });
      window.removeEventListener('afterprint', done);
    }
    window.addEventListener('afterprint', done);
    window.print();
  }

  // ---------- table of contents: mark the section being read ----------
  var links = document.querySelectorAll('[data-toc]');
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    for (var i = 0; i < links.length; i++) byId[links[i].getAttribute('data-toc')] = links[i];
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      var sections = document.querySelectorAll('article.section');
      for (var k = 0; k < sections.length; k++) {
        if (visible[sections[k].id]) { current = sections[k].id; break; }
      }
      if (!current) return;
      for (var id in byId) {
        if (id === current) byId[id].setAttribute('aria-current', 'true');
        else byId[id].removeAttribute('aria-current');
      }
    }, { rootMargin: '-20% 0px -55% 0px' });
    document.querySelectorAll('article.section').forEach(function (s) { io.observe(s); });
  }
})();
