/**
 * elevenOne — Core App Script
 * Reveal-Animationen, Mobile-Nav, Tracking-Wrapper, Smooth-Scroll, Header-Scroll-State.
 * Kein Module-Export — wird via klassisches <script src> geladen.
 */
(function () {
  'use strict';

  // ── Scroll-Reveal via IntersectionObserver ─────────────────
  // Strategie: Elemente sind via CSS sichtbar (opacity 1). JS hidet sie
  // nur wenn sie NICHT im viewport sind, sobald observer initialisiert ist.
  // Dann fade-in beim Scroll-Eintritt. Wenn JS fehlt → alle bleiben sichtbar.
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-hidden');
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

    // Hide elements that are NOT initially in viewport
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const inView = r.top < vh && r.bottom > 0;
      if (!inView) el.classList.add('is-hidden');
      else el.classList.add('visible');
      observer.observe(el);
    });
  }

  // ── Hero-Headline char-by-char reveal ──────────────────────
  function initHeroCharReveal() {
    const el = document.querySelector('[data-reveal-chars]');
    if (!el) return;
    const text = el.innerHTML;
    el.innerHTML = '';
    // Wir splitten Text-Knoten und behalten Inline-Tags wie <em> erhalten
    const wrap = document.createElement('div');
    wrap.innerHTML = text;
    let charIndex = 0;
    function processNode(node, target) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Wort-für-Wort wrapping: Wörter inline-block, Spaces als TextNode (Break-Punkt).
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            target.appendChild(document.createTextNode(part));
            return;
          }
          const word = document.createElement('span');
          word.className = 'word';
          part.split('').forEach(ch => {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.transitionDelay = (charIndex * 12) + 'ms';
            span.textContent = ch;
            word.appendChild(span);
            charIndex++;
          });
          target.appendChild(word);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        target.appendChild(clone);
        node.childNodes.forEach(child => processNode(child, clone));
      }
    }
    wrap.childNodes.forEach(n => processNode(n, el));
    requestAnimationFrame(() => el.classList.add('chars-in'));
  }

  // ── Mobile-Nav Toggle ──────────────────────────────────────
  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Header-State on scroll ─────────────────────────────────
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;
    let last = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 16);
      last = y;
    }, { passive: true });
  }

  // ── Tracking-Wrapper (gtag-Conversion-Events) ──────────────
  function initTracking() {
    document.querySelectorAll('[data-track]').forEach(el => {
      el.addEventListener('click', () => {
        const label = el.dataset.track;
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'conversion_click', { event_label: label });
        }
        // dev-Trace ohne gtag:
        if (window.console && !window.gtag) console.debug('[track]', label);
      });
    });
  }

  // ── aria-current="page" auf aktiven Nav-Link ───────────────
  // Setzt auf jedem Link in Site-Nav und Footer-Nav, dessen Pfad zur aktuellen URL passt.
  // CSS: 1px Copper-Hairline unter dem aktiven Link (Engineering-Precision-Stil).
  function initAriaCurrentPage() {
    const norm = (p) => {
      if (!p) return '/';
      // Trailing-Slash strippen außer bei Root
      let s = p.replace(/\/+$/, '');
      return s.length ? s : '/';
    };
    const currentPath = norm(window.location.pathname);
    const currentHtml = currentPath === '/' ? '/index.html' : currentPath;
    document.querySelectorAll('.site-nav a[href], .footer-nav a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      // nur interne, absolute Pfade behandeln
      if (!href || !href.startsWith('/')) return;
      const linkPath = norm(href.split('#')[0].split('?')[0]);
      const linkHtml = linkPath === '/' ? '/index.html' : linkPath;
      if (linkPath === currentPath || linkHtml === currentHtml) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // ── Smooth-Scroll für Anker-Links (mit prefers-reduced-motion) ──
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      });
    });
  }

  // ── Boot ───────────────────────────────────────────────────
  function boot() {
    initReveal();
    initHeroCharReveal();
    initNav();
    initHeader();
    initTracking();
    initSmoothAnchors();
    initAriaCurrentPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
