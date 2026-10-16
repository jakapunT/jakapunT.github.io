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
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-lang]');
    if (b) setLang(b.getAttribute('data-set-lang'), true);
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
    // download
    var dl = e.target.closest('[data-download]');
    if (dl) {
      var file = files[dl.getAttribute('data-download')];
      if (file) download(file);
    }
  });

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
