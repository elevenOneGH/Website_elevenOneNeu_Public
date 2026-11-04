/**
 * Workshop-Feedback (vorübergehend, Spec: docs/specs/spec-workshop-feedback.md)
 * - Passwortprüfung, Fragen und Speicherung liegen im n8n-Ablauf hinter /api/workshop-feedback.
 * - Freitexte nur per textContent ausgeben, nie als HTML.
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-wf]');
  if (!root) return;

  const API = '/api/workshop-feedback';
  const KEY_PW = 'wf-pw';
  const KEY_ID = 'wf-id';
  const POLL_MS = 5000;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const $ = (name) => root.querySelector('[data-wf-' + name + ']');
  const counter = document.querySelector('[data-wf-counter]');

  let password = '';
  let role = '';
  let closed = false;
  let lastResults = null;
  let pollTimer = null;

  /* ── Hilfen ─────────────────────────────────────────────── */
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.append(c));
    return node;
  }
  function svg(tag, attrs, ...children) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    children.forEach((c) => node.append(c));
    return node;
  }
  function readStore(store, key) { try { return store.getItem(key) || ''; } catch (e) { return ''; } }
  function writeStore(store, key, value) { try { store.setItem(key, value); } catch (e) { /* ignorieren */ } }
  function clearStore(store, key) { try { store.removeItem(key); } catch (e) { /* ignorieren */ } }

  let memoryId = '';
  function clientId() {
    let id = readStore(localStorage, KEY_ID) || memoryId;
    if (!id) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      memoryId = id;
      writeStore(localStorage, KEY_ID, id);
    }
    return id;
  }

  function motionStill() {
    return document.documentElement.getAttribute('data-motion') === 'paused' ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  async function post(action, extra) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(Object.assign({ action, pw: password, id: clientId() }, extra || {}))
    });
    const text = await res.text();
    let data = null;
    // n8n antwortet bei einem Abbruch mit 200 und leerem Inhalt, das zählt als Fehler
    try { data = JSON.parse(text); } catch (e) { /* unten behandelt */ }
    if (!data || typeof data !== 'object') throw new Error('leere Antwort');
    data.status = res.status;
    return data;
  }

  function show(view) {
    root.querySelectorAll('[data-wf-view]').forEach((s) => { s.hidden = s.getAttribute('data-wf-view') !== view; });
    window.scrollTo(0, 0);
    $('title').focus({ preventScroll: true });
  }

  function setText(node, text) {
    node.textContent = text || '';
    node.hidden = !text;
  }

  /* ── Zähler ─────────────────────────────────────────────── */
  function renderCounter(count, expected) {
    counter.textContent = '';
    counter.append(el('strong', null, String(count)), ' von ' + expected + ' abgegeben');
    counter.hidden = false;
    if (role === 'admin') renderAdminStatus(count, expected);
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const data = await post('count');
        if (data.status === 401) { logout(); return; }
        if (data.ok) {
          closed = data.closed;
          renderCounter(data.count, data.expected);
          const hint = $('closed-hint');
          if (hint) hint.hidden = !closed;
        }
      } catch (e) { /* nächster Versuch in 5 Sekunden */ }
    }, POLL_MS);
  }

  function logout() {
    clearInterval(pollTimer);
    pollTimer = null;
    password = '';
    role = '';
    clearStore(sessionStorage, KEY_PW);
    counter.hidden = true;
    $('title').textContent = 'Workshop Feedback';
    show('login');
  }

  /* ── Anmeldung ──────────────────────────────────────────── */
  async function login(pw, silent) {
    password = pw;
    const button = $('login-button');
    const error = $('login-error');
    setText(error, '');
    button.disabled = true;
    try {
      const data = await post('login');
      if (data.status === 401 || !data.ok) {
        password = '';
        clearStore(sessionStorage, KEY_PW);
        if (!silent) setText(error, 'Das Passwort stimmt nicht. Bitte versuchen Sie es noch einmal.');
        return;
      }
      writeStore(sessionStorage, KEY_PW, password);
      role = data.role;
      closed = data.closed;
      $('title').textContent = data.title;
      renderCounter(data.count, data.expected);
      startPolling();
      if (role === 'admin') {
        openAdmin(data);
      } else if (data.submitted) {
        show('thanks');
      } else if (closed) {
        show('closed');
      } else {
        renderSurvey(data.survey);
        show('survey');
      }
    } catch (e) {
      password = '';
      setText(error, 'Keine Verbindung zum Server. Bitte prüfen Sie Ihr Internet und versuchen Sie es noch einmal.');
    } finally {
      button.disabled = false;
    }
  }

  $('login').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = root.querySelector('#wf-password');
    if (!input.value.trim()) { setText($('login-error'), 'Bitte geben Sie das Passwort ein.'); input.focus(); return; }
    login(input.value);
    input.value = '';
  });

  /* ── Umfrage ────────────────────────────────────────────── */
  function questionTitle(q, tag, attrs) {
    const title = el(tag, attrs, el('span', { class: 'wf-num' }, q.nr + '.'));
    if (q.lead) title.append(el('strong', null, q.lead));
    if (q.text) title.append(q.text);
    if (!q.required) title.append(' ', el('span', { class: 'wf-optional' }, '(freiwillig)'));
    return title;
  }

  function optionsGroup(q, kind, values, labels) {
    const group = el('div', { class: 'wf-options wf-options-' + kind });
    values.forEach((value, i) => {
      group.append(el('label', { class: 'wf-option' },
        el('input', { type: 'radio', name: q.id, value: value }),
        el('span', null, labels[i])));
    });
    return group;
  }

  function renderSurvey(survey) {
    const form = $('survey');
    form.textContent = '';
    survey.questions.forEach((q) => {
      let box;
      if (q.type === 'text') {
        box = el('div', { class: 'wf-question', 'data-q': q.id },
          questionTitle(q, 'label', { class: 'wf-question-title', for: 'wf-' + q.id }),
          el('input', { class: 'wf-input', id: 'wf-' + q.id, type: 'text', name: q.id, maxlength: '200', autocomplete: 'off' }));
      } else {
        box = el('fieldset', { class: 'wf-question', 'data-q': q.id }, questionTitle(q, 'legend', null));
        if (q.type === 'scale') {
          box.append(optionsGroup(q, 'scale', survey.scale.map((_, i) => String(i + 1)), survey.scale));
        } else if (q.type === 'choice') {
          box.append(optionsGroup(q, 'choice', q.options, q.options));
        } else {
          const values = Array.from({ length: 11 }, (_, i) => String(i));
          box.append(optionsGroup(q, 'nps', values, values));
          box.append(el('div', { class: 'wf-nps-hint' }, el('span', null, '0 = unwahrscheinlich'), el('span', null, '10 = sehr wahrscheinlich')));
        }
      }
      form.append(box);
    });
    const error = el('p', { class: 'wf-error', role: 'alert', hidden: '' });
    const button = el('button', { type: 'submit', class: 'btn btn-primary wf-submit' }, 'Feedback absenden');
    form.append(error, button);
    form.onsubmit = (e) => { e.preventDefault(); submitSurvey(survey, form, button, error); };
    form.onchange = (e) => {
      const box = e.target.closest('[data-q]');
      if (box) markMissing(box, false);
    };
    $('closed-hint').hidden = true;
  }

  function markMissing(box, missing) {
    box.classList.toggle('is-missing', missing);
    const note = box.querySelector('.wf-missing-note');
    if (missing && !note) box.append(el('p', { class: 'wf-missing-note' }, 'Bitte beantworten Sie diese Frage.'));
    if (!missing && note) note.remove();
  }

  async function submitSurvey(survey, form, button, error) {
    const answers = {};
    let firstMissing = null;
    survey.questions.forEach((q) => {
      const box = form.querySelector('[data-q="' + q.id + '"]');
      const input = q.type === 'text' ? form.elements[q.id] : form.querySelector('input[name="' + q.id + '"]:checked');
      const value = input ? input.value.trim() : '';
      answers[q.id] = value;
      const missing = q.required && !value;
      markMissing(box, missing);
      if (missing && !firstMissing) firstMissing = box;
    });
    if (firstMissing) {
      setText(error, 'Bitte beantworten Sie die markierten Fragen.');
      firstMissing.scrollIntoView({ block: 'center', behavior: motionStill() ? 'auto' : 'smooth' });
      const focusable = firstMissing.querySelector('input');
      if (focusable) focusable.focus({ preventScroll: true });
      return;
    }
    setText(error, '');
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    try {
      const data = await post('submit', { answers });
      if (data.ok) {
        renderCounter(data.count, data.expected);
        show('thanks');
        return;
      }
      if (data.status === 401) { logout(); return; }
      setText(error, data.error === 'closed'
        ? 'Die Umfrage ist derzeit geschlossen. Ihre Eingaben bleiben stehen. Bitte wenden Sie sich an den Trainer und senden Sie danach erneut.'
        : 'Das hat nicht geklappt. Ihre Eingaben bleiben stehen, bitte senden Sie noch einmal.');
    } catch (e) {
      setText(error, 'Keine Verbindung zum Server. Ihre Eingaben bleiben stehen, bitte senden Sie noch einmal.');
    }
    button.disabled = false;
    button.textContent = 'Erneut senden';
  }

  /* ── Admin ──────────────────────────────────────────────── */
  function renderAdminStatus(count, expected) {
    $('admin-status').textContent = closed
      ? 'Umfrage geschlossen und gespeichert: ' + count + ' von ' + expected + ' Abgaben.'
      : 'Umfrage läuft: ' + count + ' von ' + expected + ' Abgaben. Sobald alle abgegeben haben, speichern Sie hier.';
  }

  function adminButtons() {
    $('save').hidden = closed;
    $('reopen').hidden = !closed;
    $('print').hidden = !closed;
  }

  function openAdmin(data) {
    adminButtons();
    renderAdminStatus(data.count, data.expected);
    show('admin');
    if (closed && data.results) renderResults(data.results, data.expected, true);
    else clearResults();
  }

  function clearResults() {
    lastResults = null;
    $('results').textContent = '';
  }

  async function adminAction(action, button) {
    const error = $('admin-error');
    setText(error, '');
    button.disabled = true;
    try {
      const data = await post(action);
      if (data.status === 401) { logout(); return null; }
      if (!data.ok) { setText(error, 'Das hat nicht geklappt. Bitte versuchen Sie es noch einmal.'); return null; }
      closed = data.closed;
      adminButtons();
      renderCounter(data.count, data.expected);
      return data;
    } catch (e) {
      setText(error, 'Keine Verbindung zum Server. Bitte versuchen Sie es noch einmal.');
      return null;
    } finally {
      button.disabled = false;
    }
  }

  $('save').addEventListener('click', async () => {
    const data = await adminAction('save', $('save'));
    if (data) renderResults(data.results, data.expected, true);
  });
  $('reopen').addEventListener('click', async () => {
    if (await adminAction('reopen', $('reopen'))) clearResults();
  });
  // Im PDF sollen die Freitexte stehen, auch wenn sie am Bildschirm eingeklappt sind
  $('print').addEventListener('click', () => {
    const texts = $('results').querySelector('details');
    const wasOpen = texts ? texts.open : false;
    if (texts) texts.open = true;
    window.print();
    if (texts) texts.open = wasOpen;
  });
  $('reset').addEventListener('click', () => $('reset-dialog').showModal());
  $('reset-cancel').addEventListener('click', () => $('reset-dialog').close());
  $('reset-confirm').addEventListener('click', async () => {
    $('reset-dialog').close();
    if (await adminAction('reset', $('reset'))) clearResults();
  });

  /* ── Auswertung (Anzahlen, keine Prozente und Mittelwerte: Feedback-Konzept §7) ── */
  // Monotone Kurve: verläuft durch alle Punkte und schwingt nicht über die echten Werte hinaus
  function monotonePath(points) {
    const n = points.length;
    const dx = [], slope = [], tangent = [];
    for (let i = 0; i < n - 1; i++) {
      dx[i] = points[i + 1][0] - points[i][0];
      slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
    }
    tangent[0] = slope[0];
    tangent[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
      tangent[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (2 * slope[i - 1] * slope[i]) / (slope[i - 1] + slope[i]);
    }
    let d = 'M' + points[0][0] + ' ' + points[0][1];
    for (let i = 0; i < n - 1; i++) {
      const h = dx[i] / 3;
      d += ' C' + (points[i][0] + h) + ' ' + (points[i][1] + tangent[i] * h) + ' ' +
        (points[i + 1][0] - h) + ' ' + (points[i + 1][1] - tangent[i + 1] * h) + ' ' +
        points[i + 1][0] + ' ' + points[i + 1][1];
    }
    return d;
  }

  function curveChart(container, cfg) {
    const width = Math.max(container.clientWidth, 240);
    const tickLines = cfg.labels.some((l) => l.indexOf('\n') >= 0) ? 2 : 1;
    const top = cfg.bands ? 40 : 26;
    const bottom = 12 + tickLines * 13;
    const height = cfg.height || 190;
    // Mit Bereichen: Abstand = halber Punktabstand, damit die Bereiche genau die Breite füllen
    const inset = cfg.bands ? width / (cfg.values.length * 2) : 26;
    const base = height - bottom;
    const max = Math.max(cfg.max, 1);
    const xAt = (i) => inset + (i * (width - inset * 2)) / (cfg.values.length - 1);
    const yAt = (v) => base - (v / max) * (base - top);
    const points = cfg.values.map((v, i) => [xAt(i), yAt(v)]);
    const delay = (cfg.delay || 0) + 'ms';

    const chart = svg('svg', {
      class: 'wf-svg', width: width, height: height, viewBox: '0 0 ' + width + ' ' + height,
      role: 'img', 'aria-label': cfg.label
    });
    const step = (width - inset * 2) / (cfg.values.length - 1);
    (cfg.bands || []).forEach((band) => {
      const x0 = xAt(band.from) - step / 2 + 1;
      const x1 = xAt(band.to) + step / 2 - 1;
      chart.append(svg('rect', { class: 'wf-band', x: x0, y: 0, width: x1 - x0, height: base, rx: 4 }));
      chart.append(svg('text', { class: 'wf-band-label', x: (x0 + x1) / 2, y: 16 }, band.label));
    });
    chart.append(svg('line', { class: 'wf-baseline', x1: 0, x2: width, y1: base, y2: base }));

    const line = monotonePath(points);
    const area = line + ' L' + points[points.length - 1][0] + ' ' + base + ' L' + points[0][0] + ' ' + base + ' Z';
    const areaNode = svg('path', { class: 'wf-area', d: area });
    const lineNode = svg('path', { class: 'wf-line', d: line, pathLength: 1 });
    areaNode.style.setProperty('--d', delay);
    lineNode.style.setProperty('--d', delay);
    chart.append(areaNode, lineNode);

    cfg.values.forEach((v, i) => {
      const [x, y] = points[i];
      const group = svg('g', null, svg('title', null, cfg.labels[i].replace('\n', ' ') + ': ' + v));
      group.append(svg('circle', { class: 'wf-hit', cx: x, cy: y, r: 16 }));
      const dot = svg('circle', { class: 'wf-dot', cx: x, cy: y, r: 5 });
      dot.style.setProperty('--d', delay);
      group.append(dot);
      if (v > 0) {
        const value = svg('text', { class: 'wf-value', x: x, y: y - 11 }, String(v));
        value.style.setProperty('--d', delay);
        group.append(value);
      }
      chart.append(group);
      cfg.labels[i].split('\n').forEach((part, line) => {
        chart.append(svg('text', { class: 'wf-tick', x: x, y: base + 15 + line * 13 }, part));
      });
    });
    container.append(chart);
  }

  function countUp(node, target, animate) {
    if (!animate || target === 0) { node.textContent = String(target); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 1000, 1);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    node.textContent = '0';
    requestAnimationFrame(tick);
  }

  function chartCard(title, sub, delay) {
    const card = el('section', { class: 'wf-chart-card' }, el('h2', null, title));
    if (sub) card.append(sub);
    card.style.setProperty('--d', delay + 'ms');
    return card;
  }

  function renderResults(results, expected, animateRequested) {
    lastResults = { results, expected };
    const animate = animateRequested && !motionStill();
    const box = $('results');
    box.textContent = '';
    box.classList.toggle('wf-animate', animate);

    // Rücklauf
    const share = Math.min(results.n / Math.max(expected, 1), 1);
    const number = svg('text', { class: 'wf-ring-number', x: 66, y: 72 }, String(results.n));
    const ringValue = svg('circle', {
      class: 'wf-ring-value', cx: 66, cy: 66, r: 52, pathLength: 1,
      transform: 'rotate(-90 66 66)'
    });
    ringValue.style.setProperty('--share', share);
    const ring = svg('svg', {
      class: 'wf-return-ring', viewBox: '0 0 132 132', role: 'img',
      'aria-label': results.n + ' von ' + expected + ' haben abgegeben'
    }, svg('circle', { class: 'wf-ring-track', cx: 66, cy: 66, r: 52 }), ringValue, number,
    svg('text', { class: 'wf-ring-of', x: 66, y: 90 }, 'von ' + expected));
    const returnCard = chartCard('Rücklauf', null, 0);
    returnCard.append(el('div', { class: 'wf-return' }, ring,
      el('p', { class: 'wf-return-text' }, results.n + ' von ' + expected + ' Personen haben abgegeben.')));
    box.append(returnCard);
    countUp(number, results.n, animate);

    // Nutzen je Teil
    const grid = el('div', { class: 'wf-results-grid' });
    box.append(grid);
    const maxPart = Math.max.apply(null, results.teile.flatMap((t) => t.stufen));
    const panels = [];
    results.teile.forEach((teil, i) => {
      const sub = el('p', { class: 'wf-chart-sub' }, el('strong', null, teil.zustimmung + ' von ' + results.n), ' trifft voll oder eher zu');
      const card = chartCard(teil.label, sub, 150 + i * 120);
      const plot = el('div', null);
      card.append(plot);
      grid.append(card);
      panels.push({ plot, teil, i });
    });
    panels.forEach(({ plot, teil, i }) => {
      curveChart(plot, {
        values: teil.stufen,
        labels: results.stufenKurz,
        max: maxPart,
        delay: 250 + i * 180,
        label: teil.label + ': ' + results.stufenKurz.map((l, k) => l.replace('\n', ' ') + ' ' + teil.stufen[k]).join(', ')
      });
    });

    // Lernform
    const bars = el('ol', { class: 'wf-bars' });
    const maxForm = Math.max.apply(null, results.lernform.map((f) => f.count).concat(1));
    results.lernform.forEach((form, i) => {
      const fill = el('div', { class: 'wf-bar-fill' });
      fill.style.setProperty('--w', (form.count / maxForm) * 100 + '%');
      fill.style.setProperty('--d', 500 + i * 120 + 'ms');
      bars.append(el('li', null,
        el('div', { class: 'wf-bar-head' }, el('span', null, form.label), el('span', { class: 'wf-bar-count' }, String(form.count))),
        el('div', { class: 'wf-bar-track' }, fill)));
    });
    const formCard = chartCard('Lernform, die am meisten gebracht hat', null, 450);
    formCard.append(bars);
    box.append(formCard);

    // Empfehlung
    const rec = results.empfehlung;
    const recSub = el('p', { class: 'wf-chart-sub' }, el('strong', null, rec.n + ' von ' + results.n), ' haben diese freiwillige Frage beantwortet');
    const recCard = chartCard('Empfehlung an einen Kollegen', recSub, 600);
    const recPlot = el('div', null);
    recCard.append(recPlot);
    box.append(recCard);
    curveChart(recPlot, {
      values: rec.werte,
      labels: rec.werte.map((_, i) => String(i)),
      max: Math.max.apply(null, rec.werte),
      height: 230,
      delay: 700,
      bands: [
        { from: 0, to: 6, label: '0–6: ' + rec.gruppen.niedrig },
        { from: 7, to: 8, label: '7–8: ' + rec.gruppen.mittel },
        { from: 9, to: 10, label: '9–10: ' + rec.gruppen.hoch }
      ],
      label: 'Empfehlung: 0 bis 6 ' + rec.gruppen.niedrig + ', 7 bis 8 ' + rec.gruppen.mittel + ', 9 bis 10 ' + rec.gruppen.hoch
    });

    // Freitexte: eingeklappt, damit am Beamer nichts einer Person zuzuordnen ist
    const details = el('details', { class: 'wf-chart-card wf-texts' }, el('summary', null, 'Freitexte anzeigen'));
    const textBlock = (title, items) => {
      details.append(el('h3', null, title));
      if (!items.length) { details.append(el('p', { class: 'wf-empty' }, 'Keine Angaben.')); return; }
      details.append(el('ul', null, ...items.map((t) => el('li', null, t))));
    };
    textBlock('Was nehmen Sie konkret mit?', results.mitnahme);
    textBlock('Was würde den Workshop noch besser machen?', results.verbesserung);
    details.style.setProperty('--d', '750ms');
    box.append(details);
  }

  // Die Kurven sind in echten Pixeln gezeichnet, also bei Größenänderung neu aufbauen (ohne Animation)
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (lastResults && !$('results').closest('[hidden]')) {
        const open = $('results').querySelector('details[open]') !== null;
        renderResults(lastResults.results, lastResults.expected, false);
        if (open) $('results').querySelector('details').open = true;
      }
    }, 150);
  });

  /* ── Start: nach einem Neuladen angemeldet bleiben ──────── */
  const saved = readStore(sessionStorage, KEY_PW);
  if (saved) login(saved, true);
})();
