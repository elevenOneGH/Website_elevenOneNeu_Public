/**
 * elevenOne — Produkt-Widget Toggle
 * Klappt das Detail-Panel jeder Karte auf, mehrere parallel offen möglich.
 * aria-expanded wird gesetzt, [hidden] wird umgeschaltet.
 */
(function () {
  'use strict';

  document.querySelectorAll('.product-widget-toggle').forEach(btn => {
    // Details erst per JS einklappen → ohne JavaScript bleiben sie lesbar
    const target = document.getElementById(btn.getAttribute('aria-controls'));
    if (target && btn.getAttribute('aria-expanded') !== 'true') target.hidden = true;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('aria-controls');
      const body = id ? document.getElementById(id) : btn.nextElementSibling;
      if (!body) return;
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (open) {
        body.hidden = true;
      } else {
        body.hidden = false;
      }
      const labelSpan = btn.querySelector('span:not(.chevron)');
      if (labelSpan) {
        labelSpan.textContent = open ? 'Leistungen anzeigen' : 'Leistungen ausblenden';
      }
    });
  });
})();
