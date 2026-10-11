/* theme.js — Hell/Dunkel-Umschalter (CD: data-theme="dark" auf <html>, Schlüssel 'e1-theme').
   Hell ist Standard. Das initiale Setzen vor dem ersten Zeichnen übernimmt ein
   Inline-Snippet im <head>; dieses Skript verdrahtet nur den Knopf. */
(function () {
  'use strict';

  var KEY = 'e1-theme';
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');

  function current() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function apply(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0A0806' : '#FFFDFA');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      var dark = theme === 'dark';
      // Umschaltknopf-Muster: feste Beschriftung „Dunkel", Zustand nur über aria-pressed
      // (sichtbarer Text = zugänglicher Name, WCAG 2.5.3)
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('title', dark ? 'Dunkles Design ausschalten' : 'Dunkles Design einschalten');
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) { /* Speicher gesperrt → nur für diese Seite */ }
      apply(next);
    });
  });

  apply(current());

  /* ── Animationen anhalten (WCAG 2.2.2) ─────────────────────────────
     Globaler Schalter für Punkte-Welle und Hero-Video: <html data-motion="paused">,
     gemerkt unter 'e1-motion'. dots.js und hero-video.js beobachten das Attribut. */
  var MKEY = 'e1-motion';

  function motionPaused() { return root.getAttribute('data-motion') === 'paused'; }

  // Bei „Bewegung reduzieren" (System) laufen Welle und Video ohnehin nicht → Schalter ausblenden
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyMotion(paused) {
    if (paused) root.setAttribute('data-motion', 'paused');
    else root.removeAttribute('data-motion');
    document.querySelectorAll('[data-motion-toggle]').forEach(function (btn) {
      btn.hidden = reduced;
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.textContent = paused ? 'Animationen fortsetzen' : 'Animationen anhalten';
    });
  }

  try { if (localStorage.getItem(MKEY) === 'paused') root.setAttribute('data-motion', 'paused'); } catch (e) { /* ignorieren */ }

  document.querySelectorAll('[data-motion-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = !motionPaused();
      try { localStorage.setItem(MKEY, next ? 'paused' : 'running'); } catch (e) { /* ignorieren */ }
      applyMotion(next);
    });
  });

  applyMotion(motionPaused());
})();
