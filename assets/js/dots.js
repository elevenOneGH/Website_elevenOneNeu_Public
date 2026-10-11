/* dots.js — CD-Hintergrund: Punkteraster mit diagonaler Wellenbewegung über die Punktgröße.
   Übernommen aus reference/cd-elevenone/elevenone.js der Handouts (Stand 06.10.2026):
   15 Bilder/s genügen (die Welle braucht 15 s je Periode), „Bewegung reduzieren" → ruhendes
   Raster, Farbe folgt dem Theme (data-theme auf <html>). */
(function () {
  'use strict';

  var canvas = document.getElementById('dotCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var root = document.documentElement;
  var SPACING = 24, BASE_R = 1.4, AMP = 2.0, WL = 880, PERIOD = 15;
  var FRAME_MS = 1000 / 15, last = -Infinity, lastT = 0, t0 = null;
  var still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    paint(lastT);
  }

  function paint(t) {
    var isDark = root.getAttribute('data-theme') === 'dark';
    // Deckkraft 2026-10-09 auf Wunsch leicht angehoben (vorher 0,16 / 0,22)
    ctx.fillStyle = isDark ? 'rgba(254,245,226,0.22)' : 'rgba(86,74,58,0.32)';
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    for (var x = SPACING / 2; x < w; x += SPACING) {
      for (var y = SPACING / 2; y < h; y += SPACING) {
        var phase = (x + y) * 0.7071 / WL - t / PERIOD;
        var r = Math.max(0.3, BASE_R + AMP * Math.sin(6.2832 * phase));
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, 6.2832);
      }
    }
    ctx.fill();
  }

  var running = false, rafId = 0;

  function loop(ts) {
    if (!running) return;
    if (ts - last >= FRAME_MS) {
      // Nach einer Pause dort weitermachen, wo die Welle stand (kein Sprung)
      if (t0 === null) t0 = ts - lastT * 1000;
      last = ts;
      lastT = (ts - t0) / 1000;
      paint(lastT);
    }
    rafId = requestAnimationFrame(loop);
  }

  function paused() { return still || root.getAttribute('data-motion') === 'paused'; }

  function sync() {
    if (paused()) {
      running = false;
      cancelAnimationFrame(rafId);
      t0 = null;
    } else if (!running) {
      running = true;
      rafId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener('resize', resize);
  // Theme-Wechsel: sofort in neuer Farbe zeichnen (wichtig für das ruhende Raster);
  // Animations-Schalter (data-motion): Welle anhalten bzw. fortsetzen.
  new MutationObserver(function () { paint(lastT); sync(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });

  resize();
  sync();
})();
