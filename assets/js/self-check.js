/* self-check.js — ICP-Selbstcheck. Rein clientseitig, keine Speicherung, keine Cookies. */
(function () {
  'use strict';

  // Antwortpunkte: 0 / 1 / 2. Gewichte aus dem ICP-Scoring adaptiert.
  var QUESTIONS = [
    { id: 'structure', ko: true, weight: 5, text: 'Gibt es in Ihrem Unternehmen mehrere Abteilungen, Teams oder Standorte mit eigenen Aufgaben?',
      options: [ { label: 'Nein, alles läuft über wenige Personen', points: 0 }, { label: 'Einige Teams oder zwei Standorte', points: 1 }, { label: 'Mehrere Abteilungen, Teams oder Standorte', points: 2 } ] },
    { id: 'workload', ko: false, weight: 4, text: 'Gibt es bei Ihnen wiederkehrende, dokumentenlastige Abläufe, die viel Zeit binden (z. B. Angebote, Lieferscheine, Prüfnachweise, Bautagesberichte)?',
      options: [ { label: 'Kaum, das meiste ist Einzelfall', points: 0 }, { label: 'In einzelnen Bereichen', points: 1 }, { label: 'Ja, in mehreren Teams täglich', points: 2 } ] },
    { id: 'privacy', ko: false, weight: 4, text: 'Wie wichtig ist Ihnen ein geregelter, DSGVO-konformer KI-Einsatz mit klaren Rollen und Rechten?',
      options: [ { label: 'Kein Thema für uns', points: 0 }, { label: 'Wird diskutiert, ist aber nicht geregelt', points: 1 }, { label: 'Sehr wichtig — KI soll nach klaren Regeln laufen', points: 2 } ] },
    { id: 'data', ko: false, weight: 2, text: 'Liegen bei Ihnen 3–5 Jahre saubere Buchhaltungs-/Saldenlisten vor?',
      options: [ { label: 'Nein', points: 0 }, { label: 'Lückenhaft', points: 1 }, { label: 'Ja, sauber vorhanden', points: 2 } ] },
    { id: 'decider', ko: false, weight: 2, text: 'Wer entscheidet über ein solches Vorhaben?',
      options: [ { label: 'Ein Gremium, das extern freigeben lassen muss', points: 0 }, { label: 'Eine Bereichsleitung bereitet vor, die Geschäftsführung entscheidet', points: 1 }, { label: 'Geschäftsführung/Eigentümer direkt', points: 2 } ] },
    { id: 'branche', ko: false, weight: 2, text: 'In welcher Branche sind Sie tätig?',
      options: [ { label: 'Andere Branche', points: 0 }, { label: 'Metall- oder Bauindustrie', points: 1 }, { label: 'Logistik / Spedition / Transport', points: 2 } ] },
    { id: 'region', ko: false, weight: 1, text: 'Wo ist Ihr Unternehmen tätig?',
      options: [ { label: 'Außerhalb des DACH-Raums', points: 0 }, { label: 'Nur Deutschland oder Schweiz', points: 1 }, { label: 'Österreich (auch zusätzlich Deutschland oder Schweiz)', points: 2 } ] },
    { id: 'service', ko: false, weight: 1, text: 'Suchen Sie eher ein Werkzeug oder eine begleitete Lösung?',
      options: [ { label: 'Nur Software/Lizenz', points: 0 }, { label: 'Noch unklar', points: 1 }, { label: 'Eine begleitete Lösung', points: 2 } ] }
  ];

  var VERDICTS = {
    good:  { title: 'Das passt sehr gut.', body: 'Ihr Profil trifft genau auf die Unternehmen zu, mit denen elevenOne am wirkungsvollsten arbeitet. Ein Erstgespräch lohnt sich.', cta: true },
    maybe: { title: 'Das passt unter Umständen.', body: 'Einige Voraussetzungen sind erfüllt, andere klären wir am besten persönlich. Im Erstgespräch sehen wir gemeinsam, ob und wie ein Vorhaben trägt.', cta: true },
    no:    { title: 'Derzeit vermutlich noch nicht der richtige Zeitpunkt.', body: 'Das Konzept von elevenOne entfaltet seinen Nutzen vor allem in Unternehmen mit mehreren Abteilungen, Teams oder Standorten, die eigene Aufgaben haben. Melden Sie sich gern, wenn sich das ändert.', cta: false }
  };

  // Reine Funktion — mit Beispiel-Eingaben verifizierbar.
  function computeResult(answers) {
    var koFailed = false, score = 0, max = 0, zeros = 0;
    QUESTIONS.forEach(function (q) {
      var pts = (typeof answers[q.id] === 'number') ? answers[q.id] : 0;
      if (q.ko && pts === 0) koFailed = true;
      if (pts === 0) zeros++;
      score += pts * q.weight;
      max += 2 * q.weight;
    });
    var percent = max ? Math.round((score / max) * 100) : 0;
    var verdict;
    if (koFailed) verdict = 'no';
    else if (percent >= 75) verdict = 'good';
    else if (percent >= 45) verdict = 'maybe';
    else verdict = 'no';
    // „Sehr gut" nur ohne Ausschlussmerkmale: sobald eine Frage gar nicht passt
    // (z. B. nur Software, kaum wiederkehrende Abläufe, außerhalb des DACH-Raums),
    // höchstens „unter Umständen"
    if (verdict === 'good' && zeros >= 1) verdict = 'maybe';
    return { verdict: verdict, percent: percent, koFailed: koFailed };
  }

  // DOM-Wiring: nur wenn der Container existiert (Progressive Enhancement).
  function init() {
    var app = document.querySelector('[data-selfcheck-app]');
    var fallback = document.querySelector('[data-selfcheck-fallback]');
    if (!app) return;
    if (fallback) fallback.hidden = true;

    var total = QUESTIONS.length;
    var answers = {};
    var picked = {};

    // ── Grundgerüst: Fortschritt · Frage-Bühne · Ergebnis-Panel ──
    app.innerHTML = '';
    app.classList.add('selfcheck-widget');

    var progress = document.createElement('div');
    progress.className = 'selfcheck-progress';

    var progressText = document.createElement('p');
    progressText.className = 'selfcheck-progress-text label-mono';

    var track = document.createElement('div');
    track.className = 'selfcheck-progress-bar';
    track.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('span');
    fill.className = 'selfcheck-progress-fill';
    track.appendChild(fill);

    progress.appendChild(progressText);
    progress.appendChild(track);

    var stage = document.createElement('div');
    stage.className = 'selfcheck-stage';

    var result = document.createElement('div');
    result.className = 'selfcheck-result';
    result.setAttribute('aria-live', 'polite');
    result.hidden = true;

    app.appendChild(progress);
    app.appendChild(stage);
    app.appendChild(result);

    // ── Fortschrittsanzeige (Position im Ablauf, keine Punktzahl) ──
    function updateProgress(index) {
      progressText.textContent = 'Frage ' + (index + 1) + ' von ' + total;
      fill.style.width = ((index + 1) / total * 100) + '%';
    }

    // ── Eine Frage rendern ──────────────────────────────────────
    function renderStep(index, doFocus) {
      result.hidden = true;
      result.className = 'selfcheck-result';
      result.textContent = '';
      progress.hidden = false;

      var q = QUESTIONS[index];
      var qid = 'sc-q-' + q.id;

      var step = document.createElement('div');
      step.className = 'selfcheck-step is-active';

      var heading = document.createElement('h3');
      heading.className = 'selfcheck-question';
      heading.id = qid;
      heading.setAttribute('tabindex', '-1');
      heading.textContent = q.text;

      var group = document.createElement('div');
      group.className = 'selfcheck-options';
      // Einzelauswahl → Radiogruppe (Pfeiltasten bewegen den Fokus, Auswahl mit Enter/Leertaste/Klick)
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-labelledby', qid);

      q.options.forEach(function (opt, oi) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'selfcheck-option';
        // Auswahl über den Index merken (mehrere Optionen können gleich viele Punkte haben)
        var chosen = picked[q.id] === oi;
        if (chosen) btn.classList.add('is-selected');
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', chosen ? 'true' : 'false');
        btn.tabIndex = -1;

        var mark = document.createElement('span');
        mark.className = 'selfcheck-option-mark';
        mark.setAttribute('aria-hidden', 'true');

        var label = document.createElement('span');
        label.className = 'selfcheck-option-label';
        label.textContent = opt.label;

        btn.appendChild(mark);
        btn.appendChild(label);
        btn.addEventListener('click', function () {
          answers[q.id] = opt.points;
          picked[q.id] = oi;
          if (index + 1 < total) {
            renderStep(index + 1, true);
          } else {
            showResult(true);
          }
        });
        group.appendChild(btn);
      });

      // Roving tabindex: ein Tab-Stopp für die Gruppe (gewählte Option oder erste)
      var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
      var current = radios.filter(function (r) { return r.getAttribute('aria-checked') === 'true'; })[0] || radios[0];
      current.tabIndex = 0;
      group.addEventListener('keydown', function (e) {
        var i = radios.indexOf(document.activeElement);
        if (i < 0) return;
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = radios[(i + 1) % radios.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = radios[(i - 1 + radios.length) % radios.length];
        if (!next) return;
        e.preventDefault();
        radios[i].tabIndex = -1;
        next.tabIndex = 0;
        next.focus();
      });

      var nav = document.createElement('div');
      nav.className = 'selfcheck-nav';
      if (index > 0) {
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'selfcheck-back';
        back.textContent = '← Zurück';
        back.addEventListener('click', function () { renderStep(index - 1, true); });
        nav.appendChild(back);
      }

      step.appendChild(heading);
      step.appendChild(group);
      step.appendChild(nav);

      stage.textContent = '';
      stage.appendChild(step);
      updateProgress(index);

      // Fokus erst nach Interaktion setzen (kein Fokus-Klau beim Laden).
      if (doFocus) heading.focus();
    }

    // ── Ergebnis anzeigen (nur verbale Einstufung, keine Punktzahl) ──
    function showResult(doFocus) {
      var res = computeResult(answers);
      var v = VERDICTS[res.verdict];

      stage.textContent = '';
      progress.hidden = true;

      result.className = 'selfcheck-result is-' + res.verdict;
      result.textContent = '';
      result.hidden = false;

      var mark = document.createElement('span');
      mark.className = 'selfcheck-result-mark label-mono';
      mark.textContent = 'IHR ERGEBNIS';

      var title = document.createElement('h3');
      title.className = 'selfcheck-result-title';
      title.setAttribute('tabindex', '-1');
      title.textContent = v.title;

      var body = document.createElement('p');
      body.className = 'selfcheck-result-body';
      // Begründung beim negativen Ergebnis nur dann über die Struktur, wenn genau die fehlt
      body.textContent = (res.verdict === 'no' && !res.koFailed)
        ? 'Mehrere Voraussetzungen sind derzeit nicht erfüllt. Melden Sie sich gern, wenn sich das ändert, oder sprechen Sie uns trotzdem an.'
        : v.body;

      result.appendChild(mark);
      result.appendChild(title);
      result.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'selfcheck-result-actions';

      if (v.cta) {
        var cta = document.createElement('a');
        cta.className = 'btn btn-primary';
        cta.href = '/kontakt';
        cta.setAttribute('data-track', 'selfcheck_cta');
        cta.textContent = 'Ergebnis im Erstgespräch besprechen →';
        // initTracking() in app.js bindet [data-track]-Handler nur einmal beim
        // Seiten-Boot — dieser CTA existiert erst nach Abschluss des Selbstchecks,
        // daher hier dieselbe Tracking-Logik verbatim nachgezogen.
        cta.addEventListener('click', function () {
          var label = cta.dataset.track;
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'conversion_click', { event_label: label });
          } else if (window.console) {
            console.debug('[track]', label);
          }
        });
        actions.appendChild(cta);
      } else {
        // Auch beim negativen Ergebnis einen dezenten Ausweg anbieten
        var contact = document.createElement('a');
        contact.className = 'btn btn-ghost';
        contact.href = '/kontakt';
        contact.textContent = 'Trotzdem Kontakt aufnehmen →';
        actions.appendChild(contact);
      }

      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'btn btn-secondary selfcheck-reset';
      again.textContent = 'Selbstcheck nochmal starten';
      again.addEventListener('click', reset);
      actions.appendChild(again);

      result.appendChild(actions);

      if (doFocus) title.focus();
    }

    // ── Zurücksetzen ────────────────────────────────────────────
    function reset() {
      answers = {};
      picked = {};
      renderStep(0, true);
    }

    // Erststart ohne Fokus-Klau.
    renderStep(0, false);
  }

  if (document.readyState !== 'loading') init(); else document.addEventListener('DOMContentLoaded', init);

  // Für Verifikation im Browser-Kontext:
  window.__selfCheck = { computeResult: computeResult, QUESTIONS: QUESTIONS };
})();
