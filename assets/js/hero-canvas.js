/**
 * elevenOne — Hero "Schaltplan" Canvas
 * Engineering-Schema-Ästhetik: zufällige Knoten (Crosshairs in Copper-Hairlines),
 * verbunden durch dünne Linien. Bronze-Pulse auf einem aktiven Knoten.
 * Pausiert bei prefers-reduced-motion.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let W = 0, H = 0;
  let nodes = [];
  let edges = [];
  let activeIdx = 0;
  let lastSwitch = 0;
  let drawProgress = 0; // 0..1 für Erst-Anim
  let mouse = { x: -999, y: -999 };

  const COPPER = '#A84221';
  const BRONZE = '#D4A040';
  const HAIRLINE = 'rgba(168, 66, 33, 0.22)';
  const HAIR_FAINT = 'rgba(168, 66, 33, 0.10)';

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    nodes = [];
    // Grid-Variation: 4 Spalten × 5 Reihen, jeweils zufällig versetzt
    const cols = 4, rows = 5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5 + (Math.random() - 0.5) * 0.4) * (W / cols);
        const y = (r + 0.5 + (Math.random() - 0.5) * 0.4) * (H / rows);
        nodes.push({ x, y });
      }
    }
    // Edges: jede Node mit 1-2 Nachbarn rechts/unten verbinden
    edges = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // suche 2 nächste Nachbarn im Halbkreis rechts/unten
      const candidates = nodes.map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
        .filter(o => o.j !== i && nodes[o.j].x >= n.x - 10)
        .sort((a, b) => a.d - b.d).slice(0, 2);
      candidates.forEach(o => {
        if (!edges.find(e => (e.a === i && e.b === o.j) || (e.a === o.j && e.b === i))) {
          edges.push({ a: i, b: o.j });
        }
      });
    }
  }

  function drawCrosshair(x, y, size, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
    ctx.stroke();
    // Kleines Quadrat in der Mitte
    ctx.strokeRect(x - 1.5, y - 1.5, 3, 3);
  }

  function tick(t) {
    ctx.clearRect(0, 0, W, H);

    // Hintergrund-Hairline-Raster (CAD-Ästhetik)
    ctx.strokeStyle = HAIR_FAINT; ctx.lineWidth = 1;
    const stepY = H / 12;
    for (let y = stepY; y < H; y += stepY) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Edges
    if (drawProgress < 1) drawProgress = Math.min(1, drawProgress + 0.012);
    const drawn = Math.floor(edges.length * drawProgress);
    for (let i = 0; i < drawn; i++) {
      const e = edges[i];
      const A = nodes[e.a], B = nodes[e.b];
      ctx.strokeStyle = HAIRLINE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }

    // Active-node Wechsel alle 1.5s
    if (!reduced && t - lastSwitch > 1500) {
      activeIdx = Math.floor(Math.random() * nodes.length);
      lastSwitch = t;
    }

    // Knoten zeichnen
    nodes.forEach((n, i) => {
      const isActive = i === activeIdx;
      const isHover = Math.hypot(n.x - mouse.x, n.y - mouse.y) < 30;
      if (isActive || isHover) {
        // Pulsierender Bronze-Akzent
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.005);
        ctx.globalAlpha = pulse;
        drawCrosshair(n.x, n.y, 12, BRONZE, 1.5);
        ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = BRONZE;
        ctx.font = '500 9px "IBM Plex Mono", monospace';
        ctx.fillText(`N.${String(i+1).padStart(2,'0')}`, n.x + 16, n.y + 3);
      } else {
        drawCrosshair(n.x, n.y, 6, COPPER, 1);
      }
    });

    if (!reduced) requestAnimationFrame(tick);
  }

  // Mouse-Interaction
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

  window.addEventListener('resize', resize);
  resize();
  if (reduced) {
    // Einmaliger Frame, danach statisch
    drawProgress = 1;
    tick(0);
  } else {
    requestAnimationFrame(tick);
  }
})();
