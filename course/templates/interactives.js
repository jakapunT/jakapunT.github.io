// ```stepper and ```sorter (src/interactives.mjs). Runs after StatiCrypt decrypts the page.
(function () {
  'use strict';

  function T(th, en) {
    return '<span data-only="th">' + th + '</span><span data-only="en" lang="en">' + en + '</span>';
  }

  // stepper: show one pre-rendered panel at a time
  [].forEach.call(document.querySelectorAll('figure[data-stp]'), function (el) {
    var panels = [].slice.call(el.querySelectorAll('.stp-panel'));
    var labels = [];
    try { labels = JSON.parse(el.getAttribute('data-labels')) || []; } catch (e) { /* labels stay empty */ }
    var range = el.querySelector('input[type="range"]');
    var pos = el.querySelector('.stp-pos');
    var ticks = [].slice.call(el.querySelectorAll('.stp-ticks li'));
    var i = 0;
    panels.forEach(function (p, k) { if (!p.hidden) i = k; });

    function show(k) {
      i = Math.max(0, Math.min(panels.length - 1, k));
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      ticks.forEach(function (t, j) { t.classList.toggle('is-on', j === i); });
      if (range) {
        range.value = String(i);
        range.setAttribute('aria-valuetext', labels[i] || String(i + 1));
      }
      if (pos) pos.textContent = (i + 1) + ' / ' + panels.length;
      var prev = el.querySelector('[data-stp="prev"]');
      var next = el.querySelector('[data-stp="next"]');
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === panels.length - 1;
    }

    if (range) range.addEventListener('input', function () { show(Number(range.value)); });
    ticks.forEach(function (t, j) { t.addEventListener('click', function () { show(j); }); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-stp]');
      if (!b || b === el) return;
      show(i + (b.getAttribute('data-stp') === 'next' ? 1 : -1));
    });
    show(i);
  });

  // sorter: Keep / Drop per row, then Check
  [].forEach.call(document.querySelectorAll('figure[data-srt]'), function (el) {
    var rows = [].slice.call(el.querySelectorAll('.srt-row'));
    var score = el.querySelector('.srt-score');

    function clearCheck() {
      rows.forEach(function (r) {
        r.classList.remove('is-right', 'is-wrong', 'is-unset');
        r.querySelector('.srt-why').hidden = true;
      });
      score.innerHTML = '';
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !el.contains(b)) return;
      var choice = b.getAttribute('data-choice');
      if (choice) {
        var group = b.parentNode.querySelectorAll('button');
        var on = b.getAttribute('aria-pressed') !== 'true';
        [].forEach.call(group, function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var row = b.closest('.srt-row');
        if (row.classList.contains('is-right') || row.classList.contains('is-wrong') || row.classList.contains('is-unset')) clearCheck();
        return;
      }
      var action = b.getAttribute('data-srt');
      if (action === 'reset') {
        rows.forEach(function (r) { [].forEach.call(r.querySelectorAll('[data-choice]'), function (x) { x.setAttribute('aria-pressed', 'false'); }); });
        clearCheck();
      } else if (action === 'check') {
        var right = 0;
        rows.forEach(function (r) {
          var picked = r.querySelector('[data-choice][aria-pressed="true"]');
          var answer = r.getAttribute('data-answer');
          var verdict = r.querySelector('.srt-verdict');
          var ok = picked && (answer === 'either' || picked.getAttribute('data-choice') === answer);
          r.classList.remove('is-right', 'is-wrong', 'is-unset');
          r.classList.add(!picked ? 'is-unset' : ok ? 'is-right' : 'is-wrong');
          if (ok) right++;
          verdict.innerHTML = answer === 'either' ? T('ตอบได้ทั้งสองแบบ ', 'Either is fine. ') : answer === 'keep' ? T('ควรเก็บ ', 'Keep. ') : T('ควรตัด ', 'Drop. ');
          r.querySelector('.srt-why').hidden = false;
        });
        score.innerHTML = T('ถูก ' + right + ' จาก ' + rows.length, right + ' of ' + rows.length + ' right');
      }
    });
  });
})();
