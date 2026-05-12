/**
 * elevenOne — Cookie-Consent Layer (DSGVO-konform, granular)
 * - Default: keine Cookies, keine Tracker.
 * - LocalStorage-Key: eo-consent-v2 → JSON { necessary:true, analytics:bool }
 * - Migration vom alten v1-Format (string "granted" | "denied").
 * - Analytics-Toggle steuert das Nachladen von gtag.js.
 * - Banner via Footer-Link "Cookie-Einstellungen" jederzeit widerrufbar.
 */
(function () {
  'use strict';

  const STORAGE_KEY_V2 = 'eo-consent-v2';
  const STORAGE_KEY_V1 = 'eo-consent-v1';
  // Platzhalter: vom User später durch echte Google-Ads-ID ersetzen.
  const GTAG_ID = 'AW-XXXXXXXXX';

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2);
      if (raw) {
        const obj = JSON.parse(raw);
        return { necessary: true, analytics: !!obj.analytics };
      }
      // Migration v1 -> v2
      const v1 = localStorage.getItem(STORAGE_KEY_V1);
      if (v1 === 'granted') {
        const migrated = { necessary: true, analytics: true };
        writeState(migrated);
        return migrated;
      }
      if (v1 === 'denied') {
        const migrated = { necessary: true, analytics: false };
        writeState(migrated);
        return migrated;
      }
    } catch (e) {}
    return null; // kein gespeicherter State -> Banner zeigen
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state)); } catch (e) {}
  }

  function loadGtag() {
    if (window.gtag || GTAG_ID === 'AW-XXXXXXXXX') {
      // Platzhalter erkannt — kein realer Load, nur Dummy-gtag für data-track-Events.
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GTAG_ID);
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GTAG_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GTAG_ID);
  }

  function applyState(state) {
    writeState(state);
    if (state.analytics) loadGtag();
    hideBanner();
  }

  function hideBanner() {
    const banner = document.querySelector('[data-consent-banner]');
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    const banner = document.querySelector('[data-consent-banner]');
    if (!banner) return;
    banner.hidden = false;
    // Beim Re-Öffnen den aktuellen Analytics-Stand in den Toggle übertragen
    const current = readState();
    const toggle = banner.querySelector('#consent-analytics');
    if (toggle && current) toggle.checked = !!current.analytics;
  }

  function readAnalyticsToggle() {
    const toggle = document.querySelector('#consent-analytics');
    return toggle ? !!toggle.checked : false;
  }

  function init() {
    const stored = readState();

    if (stored && stored.analytics) {
      loadGtag();
    } else if (!stored) {
      showBanner();
    }

    // Buttons binden
    document.querySelectorAll('[data-consent-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.consentAction;
        if (action === 'accept') {
          applyState({ necessary: true, analytics: readAnalyticsToggle() });
        }
        if (action === 'decline') {
          applyState({ necessary: true, analytics: false });
        }
        if (action === 'accept-all') {
          applyState({ necessary: true, analytics: true });
        }
      });
    });

    // Footer-Link „Cookie-Einstellungen" → Banner re-anzeigen
    document.querySelectorAll('[data-consent-reopen]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showBanner();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
