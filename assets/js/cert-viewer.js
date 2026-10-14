/* Zertifikat-Ansicht (Roadmap, 2026-10-14)
   Öffnet das Zertifikat als Bild (mit eingebranntem Wasserzeichen) in einem <dialog>.
   Kein PDF, kein Download-Link; Rechtsklick, Ziehen und Drucken der Bilder werden unterbunden.
   Ein Screenshot lässt sich technisch nicht verhindern, nur erschweren. */
(function () {
  'use strict';
  var cards = document.querySelectorAll('.cert-card[data-cert-src]');
  if (!cards.length || typeof HTMLDialogElement !== 'function') return;

  var dialog = document.createElement('dialog');
  dialog.className = 'cert-dialog';
  dialog.setAttribute('aria-labelledby', 'cert-dialog-title');
  dialog.innerHTML =
    '<div class="cert-dialog-head">' +
      '<h2 id="cert-dialog-title" class="cert-dialog-title"></h2>' +
      '<button type="button" class="cert-dialog-close" aria-label="Ansicht schließen">×</button>' +
    '</div>' +
    '<div class="cert-frame"><img class="cert-img" alt="" draggable="false"><span class="cert-shield" aria-hidden="true"></span></div>' +
    '<p class="cert-hint label-mono">Nur zur Ansicht · Ausgestellt von Everlast Consulting GmbH</p>';
  document.body.appendChild(dialog);

  var title = dialog.querySelector('.cert-dialog-title');
  var img = dialog.querySelector('.cert-img');
  var lastCard = null;

  function open(card) {
    var name = card.getAttribute('data-cert-title');
    title.textContent = 'Zertifikat ' + name;
    img.alt = 'Zertifikat ' + name + ' für Robert Hermann, ausgestellt von Everlast Consulting GmbH';
    img.src = card.getAttribute('data-cert-src');
    lastCard = card;
    dialog.showModal();
    document.documentElement.classList.add('cert-open');
  }

  function close() { dialog.close(); }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { open(card); });
  });
  dialog.querySelector('.cert-dialog-close').addEventListener('click', close);
  // Klick auf den abgedunkelten Hintergrund schließt
  dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('cert-open');
    img.removeAttribute('src');
    if (lastCard) lastCard.focus();
  });

  // Speichern erschweren: Kontextmenü und Ziehen auf Vorschau und Ansicht sperren
  function block(e) {
    if (e.target.closest && e.target.closest('.cert-list, .cert-dialog')) e.preventDefault();
  }
  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', block);

  // Drucken: offene Ansicht vorher schließen (Druck-CSS blendet die Zertifikate zusätzlich aus)
  window.addEventListener('beforeprint', function () { if (dialog.open) close(); });
})();
