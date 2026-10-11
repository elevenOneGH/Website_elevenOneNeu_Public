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
        // Nur an echten Leerzeichen trennen — &nbsp; ( ) bleibt im Wort
        const parts = node.textContent.split(/([ \t\n\r]+)/);
        parts.forEach(part => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) {
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
    // Burger-Modus (muss zum CSS-Breakpoint in site.css passen; em → greift auch bei Textvergrößerung)
    const mobile = window.matchMedia('(max-width: 73.75em)');
    // Bei offenem Menü Seiteninhalt sperren, damit Tab im Menü bleibt
    // (Cookie-Banner wird bei offenem Menü per CSS ausgeblendet, body.nav-open)
    const behind = document.querySelectorAll('main, footer');

    // Geschlossenes Slide-in-Menü ist nur verschoben → per inert aus Tab-Reihenfolge
    // und Screenreader nehmen; am Desktop nie inert.
    function syncInert() {
      // Im Burger-Modus sind die Unterpunkte immer offen → Hauptpunkte ohne aria-expanded
      nav.querySelectorAll('.nav-trigger').forEach(b => {
        if (mobile.matches) b.removeAttribute('aria-expanded');
        else if (!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
      });
      const hide = mobile.matches && !nav.classList.contains('is-open');
      if ('inert' in nav) nav.inert = hide;
      if (hide) nav.setAttribute('aria-hidden', 'true'); else nav.removeAttribute('aria-hidden');
      const lock = mobile.matches && nav.classList.contains('is-open');
      behind.forEach(el => { if ('inert' in el) el.inert = lock; });
    }

    // Desktop-Dropdowns: öffnen per CSS (:hover/:focus-within); hier nur aria-expanded
    // mitführen und Escape zum Schließen (WCAG 1.4.13)
    nav.querySelectorAll('.nav-item.has-sub').forEach(item => {
      const trigger = item.querySelector('.nav-trigger');
      if (!trigger) return;
      const set = (open) => {
        if (mobile.matches) return;
        item.classList.toggle('is-dismissed', !open && item.matches(':hover, :focus-within'));
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      item.addEventListener('mouseenter', () => set(true));
      item.addEventListener('mouseleave', () => { item.classList.remove('is-dismissed'); set(false); });
      item.addEventListener('focusin', () => { if (!item.classList.contains('is-dismissed')) set(true); });
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) { item.classList.remove('is-dismissed'); set(false); }
      });
      trigger.addEventListener('click', (e) => {
        if (mobile.matches) return;
        // Maus/Touch (detail > 0): Hover/Fokus hat schon geöffnet → nicht gleich wieder
        // schließen; nur ein per Escape zugeklapptes Menü wieder aufmachen.
        // Tastatur (Enter/Leertaste, detail 0): umschalten.
        if (e.detail > 0) {
          if (item.classList.contains('is-dismissed')) set(true);
          return;
        }
        const open = trigger.getAttribute('aria-expanded') === 'true';
        item.classList.toggle('is-dismissed', open);
        trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      item.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || mobile.matches) return;
        item.classList.add('is-dismissed');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      });
    });

    function setOpen(open, returnFocus) {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      document.body.style.overflow = open ? 'hidden' : '';
      syncInert();
      if (open) {
        const first = nav.querySelector('button, a[href]');
        if (first) first.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open'), true));
    // Escape schließt das Menü und gibt den Fokus an den Burger-Knopf zurück
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('click', () => setOpen(false, false));
    });
    // Wechsel Desktop ↔ Burger: offenes Menü schließen, inert neu setzen
    mobile.addEventListener('change', () => { if (!mobile.matches) setOpen(false, false); syncInert(); });
    syncInert();
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
