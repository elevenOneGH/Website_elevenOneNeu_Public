/* WebMCP (https://webmachinelearning.github.io/webmcp/): stellt KI-Agenten im Browser
   Werkzeuge bereit. Ohne WebMCP-fähigen Browser passiert nichts.
   Spec: docs/specs/spec-agent-readiness.md */
(function () {
  'use strict';
  var mc = document.modelContext || navigator.modelContext;
  if (!mc || typeof mc.registerTool !== 'function') return;

  var PAGES = {
    'start': '/index.md',
    'leistungen': '/leistungen/index.md',
    'fuer-wen': '/fuer-wen.md',
    'warum-elevenone': '/warum-elevenone.md',
    'industrie-produktion': '/branchen/industrie-produktion.md',
    'bau': '/branchen/bau.md',
    'six-steps': '/projektmanagement/six-steps.md',
    'pcp-engineering': '/projektmanagement/pcp-engineering.md',
    'ueber-uns': '/unternehmen/ueber-uns.md',
    'roadmap': '/unternehmen/roadmap.md',
    'kontakt': '/kontakt.md',
    'impressum': '/recht/impressum.md',
    'datenschutz': '/recht/datenschutz.md'
  };

  function text(t) { return { content: [{ type: 'text', text: t }] }; }

  function readPage(key) {
    return fetch(PAGES[key], { headers: { Accept: 'text/markdown' } }).then(function (r) {
      if (!r.ok) throw new Error('Seite nicht verfügbar (' + r.status + ')');
      return r.text();
    }).then(text);
  }

  var tools = [
    {
      name: 'get_page_content',
      description: 'Liefert den Inhalt einer Seite von elevenone.at als Markdown (KI-Beratung und KI-Einführung im Mittelstand, DACH-Raum).',
      inputSchema: {
        type: 'object',
        properties: { page: { type: 'string', enum: Object.keys(PAGES), description: 'Welche Seite gelesen werden soll' } },
        required: ['page']
      },
      annotations: { readOnlyHint: true },
      execute: function (input) { return readPage(input && PAGES[input.page] ? input.page : 'start'); }
    },
    {
      name: 'get_service_packages',
      description: 'Liefert die Pakete von elevenOne (Ready-Paket, Business 3 Monate, Professional 6 Monate, Excellence 12 Monate) samt FAQ. Es gibt keine öffentlichen Preise.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      execute: function () { return readPage('leistungen'); }
    },
    {
      name: 'request_consultation',
      description: 'Öffnet einen E-Mail-Entwurf an info@elevenone.at für ein kostenloses Erstgespräch (30 Minuten, Videokonferenz). Der Nutzer prüft und sendet die E-Mail selbst.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name der anfragenden Person' },
          company: { type: 'string', description: 'Firma' },
          industry: { type: 'string', description: 'Branche' },
          message: { type: 'string', description: 'Anliegen in ein bis drei Sätzen' },
          timeslots: { type: 'string', description: 'Zwei bis drei mögliche Zeitfenster' }
        },
        required: ['name', 'company', 'message']
      },
      execute: function (input) {
        input = input || {};
        var body = [
          'Name: ' + (input.name || ''),
          'Firma: ' + (input.company || ''),
          'Branche: ' + (input.industry || ''),
          '',
          'Anliegen:',
          input.message || '',
          '',
          'Mögliche Zeitfenster: ' + (input.timeslots || '')
        ].join('\n');
        var href = 'mailto:info@elevenone.at?subject=' + encodeURIComponent('Erstgespräch: ' + (input.company || '')) +
          '&body=' + encodeURIComponent(body);
        window.location.href = href;
        return text('E-Mail-Entwurf an info@elevenone.at wurde geöffnet. Der Nutzer muss ihn prüfen und selbst absenden. elevenOne antwortet an Werktagen innerhalb von 24 Stunden mit Terminvorschlägen.');
      }
    }
  ];

  tools.forEach(function (tool) {
    try {
      var r = mc.registerTool(tool);
      if (r && typeof r.catch === 'function') r.catch(function () {});
    } catch (e) { /* WebMCP-Entwurf geändert: Seite funktioniert trotzdem */ }
  });
})();
