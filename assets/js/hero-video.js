/* hero-video.js — Startseiten-Hero: Video „Neuronales Netz" in CD-Farben.
   Zwei Varianten (hell: Kupfer auf Papier, dunkel: Kupfer-Glut auf Ink) — geladen wird
   nur die zum aktiven Theme passende, beim Umschalten wird getauscht.
   Lädt erst nach dem Seiten-Load (Poster bleibt LCP-freundlich), respektiert
   „Bewegung reduzieren" (dann nur Poster) und pausiert außerhalb des Sichtbereichs. */
(function () {
  'use strict';

  var video = document.querySelector('[data-hero-video]');
  if (!video) return;
  var root = document.documentElement;
  var still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var started = false;

  function theme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function motionPaused() { return root.getAttribute('data-motion') === 'paused'; }

  function tryPlay() {
    if (motionPaused()) { video.pause(); return; }
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* Autoplay blockiert → Poster bleibt */ });
  }

  // Poster sofort passend setzen (vor dem Laden des Videos)
  function setPoster() { video.poster = video.getAttribute('data-poster-' + theme()); }

  function setSource() {
    var src = video.getAttribute('data-src-' + theme());
    if (video.getAttribute('src') === src) return;
    var t = video.currentTime || 0;
    video.src = src;
    video.addEventListener('loadedmetadata', function once() {
      video.removeEventListener('loadedmetadata', once);
      try { video.currentTime = t; } catch (e) { /* ignorieren */ }
    });
    tryPlay();
  }

  function start() {
    var c = navigator.connection;
    if ((window.matchMedia && matchMedia('(max-width: 600px)').matches) || (c && c.saveData)) return; // mobil/Datensparen: nur Poster (setPoster hält es theme-passend)
    if (started) return;
    started = true;
    video.preload = 'auto';
    setSource();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); else video.pause(); });
      }).observe(video);
    }
  }

  setPoster();

  // Theme-Wechsel: Poster und (falls laufend) Video tauschen.
  // Animations-Schalter: anhalten bzw. fortsetzen (Start ggf. nachholen).
  new MutationObserver(function (records) {
    var themeChanged = records.some(function (r) { return r.attributeName === 'data-theme'; });
    if (themeChanged) { setPoster(); if (started) setSource(); }
    if (motionPaused()) video.pause();
    else if (!still) { if (!started) start(); else tryPlay(); }
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });

  // Angehaltene Animationen: Video gar nicht erst laden (Start beim Fortsetzen)
  function startIfAllowed() { if (!motionPaused()) start(); }

  if (still) return;
  if (document.readyState === 'complete') startIfAllowed();
  else window.addEventListener('load', startIfAllowed);
})();
