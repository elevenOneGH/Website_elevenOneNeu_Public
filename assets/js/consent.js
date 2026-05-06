/**
 * elevenOne — Cookie-Consent Layer (DSGVO-konform, minimal)
 * - Default: keine Cookies, keine Tracker.
 * - LocalStorage-Key: eo-consent-v1 → "granted" | "denied"
 * - Erst bei "granted" wird gtag.js nachgeladen.
 * - Banner via Footer-Link "Cookie-Einstellungen" widerrufbar.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'eo-consent-v1';
  // Platzhalter: vom User später durch echte Google-Ads-ID ersetzen.
  const GTAG_ID = 'AW-XXXXXXXXX';

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

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
    if (value === 'granted') loadGtag();
    hideBanner();
  }

  function hideBanner() {
    const banner = document.querySelector('[data-consent-banner]');
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    const banner = document.querySelector('[data-consent-banner]');
    if (banner) banner.hidden = false;
  }

  function init() {
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}

    if (stored === 'granted') {
      loadGtag();
    } else if (stored !== 'denied') {
      showBanner();
    }

    // Buttons binden
    document.querySelectorAll('[data-consent-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.consentAction;
        if (action === 'accept')  setConsent('granted');
        if (action === 'decline') setConsent('denied');
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
