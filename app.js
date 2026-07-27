/* Le SCF italiane — pagina interattiva.
   Nessuna dipendenza esterna: SVG costruito a mano, colori dai custom properties
   così il tema chiaro/scuro cambia senza ridisegnare. */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var DATA = (window.SCF_DATA || []).map(function (r) {
    r.modello = r.n_cf <= 3 ? 'Boutique' : (r.n_cf <= 7 ? 'Intermedia' : 'Rete');
    return r;
  });

  /* Etichette puramente descrittive: il dato disponibile e' il numero di consulenti
     iscritti, non il modello di business. Sui clienti, sulle masse o sui contratti
     questi dati non dicono nulla, quindi non se ne deduce nulla. */
  var MODELS = [
    { key: 'Boutique',   label: '1-3 consulenti', varName: '--series-1' },
    { key: 'Intermedia', label: '4-7 consulenti', varName: '--series-2' },
    { key: 'Rete',       label: '8+ consulenti',  varName: '--series-3' }
  ];
  var MODEL_COLOR = {};
  MODELS.forEach(function (m) { MODEL_COLOR[m.key] = 'var(' + m.varName + ')'; });

  /* ---------------- formattazione ---------------- */
  /* useGrouping esplicito: il default "min2" lascerebbe 5498 senza punto migliaia */
  var nfInt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: true });
  var nf1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1, useGrouping: true });

  /* assi con tacche tonde */
  function niceScale(maxVal, targetTicks, integerOnly) {
    targetTicks = targetTicks || 5;
    if (!(maxVal > 0)) return { max: 1, ticks: [0, 1] };
    var raw = maxVal / targetTicks;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / mag;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    if (integerOnly) step = Math.max(1, Math.round(step));
    var max = Math.ceil(maxVal / step) * step;
    var ticks = [];
    for (var v = 0; v <= max + step * 1e-9; v += step) ticks.push(v);
    return { max: max, ticks: ticks };
  }

  function eur(v) { return v == null ? 'n.d.' : '€ ' + nfInt.format(Math.round(v)); }
  function eurShort(v) {
    if (v == null) return 'n.d.';
    var a = Math.abs(v);
    if (a >= 1e6) return '€ ' + nf1.format(v / 1e6) + ' M';
    if (a >= 1e3) return '€ ' + nfInt.format(Math.round(v / 1e3)) + ' K';
    return '€ ' + nfInt.format(Math.round(v));
  }
  function pct(v) { return v == null ? '—' : (v > 0 ? '+' : '') + nf1.format(v) + '%'; }

  /* nome commerciale: via forma giuridica e "società di consulenza finanziaria" */
  function shortName(s) {
    var t = (s || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/\s*[-–,]?\s*societ[aà]'?\s+di\s+consulenza\s+finanziaria.*$/i, '');
    t = t.replace(/\s*\bs\.?\s?c\.?\s?f\.?\b.*$/i, '');
    t = t.replace(/\s*\b(s\.?r\.?l\.?s?\.?|s\.?p\.?a\.?|s\.?a\.?s\.?|s\.?n\.?c\.?)\b.*$/i, '');
    t = t.replace(/[\s.,'"“”()-]+$/, '');
    return t || s;
  }

  function median(a) { return quantile(a, 0.5); }
  function quantile(arr, p) {
    var v = arr.filter(function (x) { return x != null; }).slice().sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var k = (v.length - 1) * p, f = Math.floor(k), c = Math.min(f + 1, v.length - 1);
    return v[f] + (v[c] - v[f]) * (k - f);
  }
  function sum(arr) { return arr.reduce(function (a, b) { return a + (b || 0); }, 0); }

  /* ---------------- SVG helpers ---------------- */
  function el(name, attrs, styles) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (styles) for (var s in styles) n.style[s] = styles[s];
    return n;
  }
  function txt(x, y, s, opts) {
    opts = opts || {};
    var t = el('text', {
      x: x, y: y,
      'text-anchor': opts.anchor || 'start',
      'dominant-baseline': opts.baseline || 'auto'
    });
    t.style.fill = opts.fill || 'var(--muted)';
    t.style.fontSize = (opts.size || 11) + 'px';
    t.style.fontFamily = 'inherit';
    if (opts.weight) t.style.fontWeight = opts.weight;
    if (opts.tabular) t.style.fontVariantNumeric = 'tabular-nums';
    t.textContent = s;
    return t;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  function frame(svg, w, h, minW) {
    clear(svg);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    svg.style.minWidth = (minW || 0) + 'px';
    return svg;
  }
  /* barra con estremo-dato arrotondato 4px, base squadrata */
  function barV(x, y, w, h, r) {           // colonna verticale, cresce verso l'alto
    r = Math.min(r == null ? 4 : r, w / 2, h);
    if (h <= 0.5) return 'M' + x + ',' + (y + h) + 'h' + w;
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) +
           'h' + (w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'V' + (y + h) + 'Z';
  }
  function barH(x, y, w, h, r) {           // barra orizzontale, cresce verso destra
    r = Math.min(r == null ? 4 : r, h / 2, w);
    if (w <= 0.5) return 'M' + x + ',' + y + 'v' + h;
    return 'M' + x + ',' + y + 'H' + (x + w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
           'v' + (h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r + 'H' + x + 'Z';
  }
  function gridline(x1, y1, x2, y2) {
    var l = el('line', { x1: x1, y1: y1, x2: x2, y2: y2 });
    l.style.stroke = 'var(--grid)'; l.style.strokeWidth = '1';
    return l;
  }
  function axisline(x1, y1, x2, y2) {
    var l = el('line', { x1: x1, y1: y1, x2: x2, y2: y2 });
    l.style.stroke = 'var(--axis)'; l.style.strokeWidth = '1';
    return l;
  }

  /* ---------------- tooltip ---------------- */
  var tipEl = document.getElementById('tip');
  function tipShow(evt, name, rows) {
    while (tipEl.firstChild) tipEl.removeChild(tipEl.firstChild);
    var h = document.createElement('div');
    h.className = 't-name';
    h.textContent = name;                        // dati non fidati -> textContent
    tipEl.appendChild(h);
    rows.forEach(function (r) {
      var d = document.createElement('div'); d.className = 't-row';
      if (r.color) {
        var k = document.createElement('span'); k.className = 't-key';
        k.style.background = r.color; d.appendChild(k);
      }
      var v = document.createElement('span'); v.className = 't-val'; v.textContent = r.value;
      var l = document.createElement('span'); l.className = 't-lab'; l.textContent = r.label;
      d.appendChild(v); d.appendChild(l);
      tipEl.appendChild(d);
    });
    tipEl.style.opacity = '1';
    tipMove(evt);
  }
  function tipMove(evt) {
    var pad = 14, r = tipEl.getBoundingClientRect();
    var x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad;
    tipEl.style.left = Math.max(8, x) + 'px';
    tipEl.style.top = Math.max(8, y) + 'px';
  }
  function tipHide() { tipEl.style.opacity = '0'; }

  /* area di hit generosa (>=24px) + accessibilità da tastiera */
  function hit(node, name, rows) {
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', name + ' — ' + rows.map(function (r) { return r.value + ' ' + r.label; }).join(', '));
    node.addEventListener('pointerenter', function (e) { tipShow(e, name, rows); });
    node.addEventListener('pointermove', tipMove);
    node.addEventListener('pointerleave', tipHide);
    node.addEventListener('focus', function () {
      var b = node.getBoundingClientRect();
      tipShow({ clientX: b.left + b.width / 2, clientY: b.top }, name, rows);
    });
    node.addEventListener('blur', tipHide);
  }

  /* ---------------- stato + filtri ---------------- */
  /* soloBil parte spento: la pagina apre sull'albo intero (109 società). I grafici
     economici filtrano comunque da sé le società senza bilancio, via withBil(). */
  var state = { reg: '', mod: '', anno: '', soloBil: false, q: '', sort: 'fatt_ult', dir: -1, hidden: {} };

  function vintageOk(r) {
    if (!state.anno) return true;
    var y = r.anno_cost;
    if (y == null) return false;
    if (state.anno === '-2009') return y <= 2009;
    if (state.anno === '2010-2018') return y >= 2010 && y <= 2018;
    if (state.anno === '2019-2021') return y >= 2019 && y <= 2021;
    if (state.anno === '2022-2023') return y >= 2022 && y <= 2023;
    if (state.anno === '2024-') return y >= 2024;
    return true;
  }
  function filtered() {
    return DATA.filter(function (r) {
      if (state.reg && r.regione !== state.reg) return false;
      if (state.mod && r.modello !== state.mod) return false;
      if (!vintageOk(r)) return false;
      if (state.soloBil && r.fatt_ult == null) return false;
      return true;
    });
  }
  /* le sole società con bilancio: base di tutti i calcoli economici */
  function withBil(rows) { return rows.filter(function (r) { return r.fatt_ult != null; }); }

  /* ================= KPI ================= */
  function renderKpis(rows) {
    var b = withBil(rows);
    var tot = sum(b.map(function (r) { return r.fatt_ult; }));
    var cfTot = sum(rows.map(function (r) { return r.n_cf; }));
    var cfBil = sum(b.map(function (r) { return r.n_cf; }));
    var medPer = median(b.map(function (r) { return r.fatt_per_cf; }));
    var utili = b.map(function (r) { return r.utile_ult; }).filter(function (x) { return x != null; });

    document.getElementById('heroVal').textContent = medPer == null ? '—' : eur(medPer);

    var items = [
      { k: 'Società', v: nfInt.format(rows.length), s: b.length + ' con bilancio' },
      { k: 'Consulenti', v: nfInt.format(cfTot), s: cfBil + ' coperti da bilancio' },
      { k: 'Giro d\'affari', v: eurShort(tot), s: 'ultimo esercizio' },
      { k: 'Fatturato mediano', v: eurShort(median(b.map(function (r) { return r.fatt_ult; }))), s: 'per società' },
      { k: 'Utile aggregato', v: eurShort(sum(utili)), s: utili.filter(function (u) { return u > 0; }).length + ' in utile · ' + utili.filter(function (u) { return u < 0; }).length + ' in perdita' }
    ];
    var host = document.getElementById('kpis');
    host.textContent = '';
    items.forEach(function (it) {
      var d = document.createElement('div'); d.className = 'kpi';
      var a = document.createElement('div'); a.className = 'k'; a.textContent = it.k;
      var c = document.createElement('div'); c.className = 'v'; c.textContent = it.v;
      var e = document.createElement('div'); e.className = 's'; e.textContent = it.s;
      d.appendChild(a); d.appendChild(c); d.appendChild(e); host.appendChild(d);
    });
  }

  /* ================= SCATTER ================= */
  function renderScatter(rows) {
    var svg = frame(document.getElementById('scatter'), 900, 470, 620);
    var pts = withBil(rows).filter(function (r) {
      return r.fatt_per_cf > 0 && r.n_cf > 0 && !state.hidden[r.modello];
    });
    var L = 66, R = 22, T = 16, B = 54;
    var w = 900 - L - R, h = 470 - T - B;

    if (!pts.length) { svg.appendChild(txt(L, T + h / 2, 'Nessun dato per questi filtri.', { size: 13 })); return; }

    var lx = function (v) { return Math.log10(v); };
    var xMin = 0, xMax = lx(Math.max(100, Math.max.apply(null, pts.map(function (p) { return p.n_cf; }))));
    var yVals = pts.map(function (p) { return lx(p.fatt_per_cf); });
    var yMin = Math.floor(Math.min.apply(null, yVals)), yMax = Math.ceil(Math.max.apply(null, yVals));
    if (yMax - yMin < 1) yMax = yMin + 1;

    var X = function (v) { return L + (lx(v) - xMin) / (xMax - xMin) * w; };
    var Y = function (v) { return T + h - (lx(v) - yMin) / (yMax - yMin) * h; };

    // griglia + assi
    for (var e = yMin; e <= yMax; e++) {
      var yy = Y(Math.pow(10, e));
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, eurShort(Math.pow(10, e)), { anchor: 'end', baseline: 'middle', tabular: true }));
    }
    [1, 2, 3, 5, 10, 20, 50, 100].forEach(function (v) {
      if (lx(v) > xMax) return;
      var xx = X(v);
      svg.appendChild(gridline(xx, T, xx, T + h));
      svg.appendChild(txt(xx, T + h + 18, String(v), { anchor: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));
    svg.appendChild(txt(L + w / 2, T + h + 42, 'numero di consulenti finanziari', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
    var yl = txt(0, 0, 'fatturato per consulente', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' });
    yl.setAttribute('transform', 'translate(15,' + (T + h / 2) + ') rotate(-90)');
    svg.appendChild(yl);

    // regressione log-log sui punti visibili
    if (pts.length > 2) {
      var mx = pts.reduce(function (a, p) { return a + lx(p.n_cf); }, 0) / pts.length;
      var my = pts.reduce(function (a, p) { return a + lx(p.fatt_per_cf); }, 0) / pts.length;
      var num = 0, den = 0;
      pts.forEach(function (p) { num += (lx(p.n_cf) - mx) * (lx(p.fatt_per_cf) - my); den += Math.pow(lx(p.n_cf) - mx, 2); });
      if (den > 0) {
        var slope = num / den, icpt = my - slope * mx;
        var x1 = xMin, x2 = xMax;
        var ry1 = icpt + slope * x1, ry2 = icpt + slope * x2;
        var cl = Math.max(yMin, Math.min(yMax, ry1)), c2 = Math.max(yMin, Math.min(yMax, ry2));
        var ln = el('line', {
          x1: L, y1: T + h - (cl - yMin) / (yMax - yMin) * h,
          x2: L + w, y2: T + h - (c2 - yMin) / (yMax - yMin) * h
        });
        ln.style.stroke = 'var(--axis)'; ln.style.strokeWidth = '2'; ln.style.strokeLinecap = 'round';
        svg.appendChild(ln);   // nessuna etichetta: la didascalia sotto al grafico la spiega
      }
    }

    // punti: anello 2px nel colore superficie + area di hit 26px
    pts.sort(function (a, b) { return b.n_cf - a.n_cf; }).forEach(function (p) {
      var cx = X(p.n_cf), cy = Y(p.fatt_per_cf);
      var g = el('g');
      var c = el('circle', { cx: cx, cy: cy, r: 5.5 });
      c.style.fill = MODEL_COLOR[p.modello];
      c.style.stroke = 'var(--surface-1)'; c.style.strokeWidth = '2';
      var ht = el('circle', { cx: cx, cy: cy, r: 13 });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      g.appendChild(c); g.appendChild(ht);
      hit(ht, p.denominazione, [
        { value: eur(p.fatt_per_cf), label: 'per consulente', color: MODEL_COLOR[p.modello] },
        { value: eur(p.fatt_ult), label: 'fatturato ' + (p.anno_ult || '') },
        { value: String(p.n_cf), label: p.n_cf === 1 ? 'consulente' : 'consulenti' },
        { value: p.comune, label: '(' + p.provincia + ')' }
      ]);
      svg.appendChild(g);
    });

    // etichette dirette solo sugli estremi (mai un numero su ogni punto)
    var top = pts.slice().sort(function (a, b) { return b.fatt_per_cf - a.fatt_per_cf; })[0];
    var big = pts.slice().sort(function (a, b) { return b.n_cf - a.n_cf; })[0];
    [top, big].forEach(function (p, i) {
      if (!p) return;
      if (i === 1 && p === top) return;
      var t = txt(X(p.n_cf) + (i ? -11 : 11), Y(p.fatt_per_cf) - 10, shortName(p.denominazione),
        { anchor: i ? 'end' : 'start', size: 11, fill: 'var(--text-secondary)', weight: 600 });
      svg.appendChild(t);
    });
  }

  function renderLegendScatter() {
    var host = document.getElementById('legScatter');
    host.textContent = '';
    MODELS.forEach(function (m) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'it' + (state.hidden[m.key] ? ' off' : '');
      d.style.background = 'none'; d.style.border = 'none'; d.style.font = 'inherit'; d.style.padding = '0';
      d.setAttribute('aria-pressed', state.hidden[m.key] ? 'false' : 'true');
      var sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = MODEL_COLOR[m.key];
      var tx = document.createElement('span'); tx.textContent = m.label;
      d.appendChild(sw); d.appendChild(tx);
      d.addEventListener('click', function () {
        state.hidden[m.key] = !state.hidden[m.key];
        renderLegendScatter(); renderScatter(filtered());
      });
      host.appendChild(d);
    });
  }

  /* ================= BARRE: classi di dimensione ================= */
  function renderBarClasse(rows) {
    var svg = frame(document.getElementById('barClasse'), 560, 330, 420);
    var b = withBil(rows);
    var classes = [
      { lab: '1', f: function (r) { return r.n_cf === 1; } },
      { lab: '2', f: function (r) { return r.n_cf === 2; } },
      { lab: '3-5', f: function (r) { return r.n_cf >= 3 && r.n_cf <= 5; } },
      { lab: '6-10', f: function (r) { return r.n_cf >= 6 && r.n_cf <= 10; } },
      { lab: '11-20', f: function (r) { return r.n_cf >= 11 && r.n_cf <= 20; } },
      { lab: '20+', f: function (r) { return r.n_cf > 20; } }
    ].map(function (c) {
      var g = b.filter(c.f);
      return { lab: c.lab, n: g.length, v: median(g.map(function (r) { return r.fatt_per_cf; })) };
    }).filter(function (c) { return c.n > 0; });

    var L = 70, R = 16, T = 14, B = 64, w = 560 - L - R, h = 330 - T - B;
    if (!classes.length) { svg.appendChild(txt(L, T + h / 2, 'Nessun dato.', { size: 13 })); return; }
    var sc = niceScale(Math.max.apply(null, classes.map(function (c) { return c.v || 0; })), 4);
    var max = sc.max;
    var Y = function (v) { return T + h - (v / max) * h; };

    sc.ticks.forEach(function (v) {
      var yy = Y(v);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, eurShort(v), { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));

    var band = w / classes.length, bw = Math.min(24, band - 14);
    classes.forEach(function (c, i) {
      var x = L + band * i + (band - bw) / 2, y = Y(c.v), bh = T + h - y;
      var p = el('path', { d: barV(x, y, bw, bh, 4) });
      p.style.fill = 'var(--series-1)'; p.style.cursor = 'pointer';
      svg.appendChild(p);
      svg.appendChild(txt(x + bw / 2, y - 7, eurShort(c.v), { anchor: 'middle', size: 11, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      svg.appendChild(txt(x + bw / 2, T + h + 18, c.lab, { anchor: 'middle', size: 11.5, fill: 'var(--text-secondary)' }));
      /* la numerosita' e' parte del dato: su 2 societa' una mediana non descrive una classe */
      svg.appendChild(txt(x + bw / 2, T + h + 32, 'n=' + c.n, { anchor: 'middle', size: 10, tabular: true }));
      var ht = el('rect', { x: L + band * i, y: T, width: band, height: h });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, c.lab + (c.lab === '1' ? ' consulente' : ' consulenti'), [
        { value: eur(c.v), label: 'mediano per consulente', color: 'var(--series-1)' },
        { value: String(c.n), label: c.n === 1 ? 'società' : 'società' }
      ]);
      svg.appendChild(ht);
    });
    svg.appendChild(txt(L + w / 2, T + h + 54, 'consulenti per società', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
  }

  /* ================= ISTOGRAMMA fatturato/CF ================= */
  function renderHisto(rows) {
    var svg = frame(document.getElementById('histo'), 560, 330, 420);
    var b = withBil(rows);
    var bins = [
      { lab: '<25K', lo: 0, hi: 25e3 }, { lab: '25-50K', lo: 25e3, hi: 50e3 },
      { lab: '50-100K', lo: 50e3, hi: 100e3 }, { lab: '100-200K', lo: 100e3, hi: 200e3 },
      { lab: '200-400K', lo: 200e3, hi: 400e3 }, { lab: '>400K', lo: 400e3, hi: Infinity }
    ].map(function (x) {
      x.n = b.filter(function (r) { return r.fatt_per_cf >= x.lo && r.fatt_per_cf < x.hi; }).length;
      return x;
    });
    var L = 44, R = 16, T = 14, B = 52, w = 560 - L - R, h = 330 - T - B;
    var sc = niceScale(Math.max.apply(null, bins.map(function (x) { return x.n; })) * 1.1, 5, true);
    var Y = function (v) { return T + h - (v / sc.max) * h; };
    sc.ticks.forEach(function (v) {
      var yy = Y(v);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, String(v), { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));
    var band = w / bins.length, bw = Math.min(24, band - 12);
    bins.forEach(function (x, i) {
      var bx = L + band * i + (band - bw) / 2, y = Y(x.n);
      var p = el('path', { d: barV(bx, y, bw, T + h - y, 4) });
      p.style.fill = 'var(--series-1)';
      svg.appendChild(p);
      if (x.n > 0) svg.appendChild(txt(bx + bw / 2, y - 7, String(x.n), { anchor: 'middle', size: 11, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      svg.appendChild(txt(bx + bw / 2, T + h + 18, x.lab, { anchor: 'middle', size: 10.5, fill: 'var(--text-secondary)' }));
      var ht = el('rect', { x: L + band * i, y: T, width: band, height: h });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, x.lab + ' per consulente', [
        { value: String(x.n), label: 'società', color: 'var(--series-1)' },
        { value: b.length ? nf1.format(100 * x.n / b.length) + '%' : '—', label: 'del totale filtrato' }
      ]);
      svg.appendChild(ht);
    });
    svg.appendChild(txt(L + w / 2, T + h + 42, 'fatturato per consulente', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
  }

  /* ================= ISTOGRAMMA n. consulenti ================= */
  function renderHistoCF(rows) {
    var svg = frame(document.getElementById('histoCF'), 560, 330, 420);
    var bins = [
      { lab: '1', f: function (r) { return r.n_cf === 1; } },
      { lab: '2', f: function (r) { return r.n_cf === 2; } },
      { lab: '3-5', f: function (r) { return r.n_cf >= 3 && r.n_cf <= 5; } },
      { lab: '6-10', f: function (r) { return r.n_cf >= 6 && r.n_cf <= 10; } },
      { lab: '11-20', f: function (r) { return r.n_cf >= 11 && r.n_cf <= 20; } },
      { lab: '20+', f: function (r) { return r.n_cf > 20; } }
    ].map(function (x) { x.n = rows.filter(x.f).length; return x; });

    var L = 44, R = 16, T = 14, B = 52, w = 560 - L - R, h = 330 - T - B;
    var sc = niceScale(Math.max.apply(null, bins.map(function (x) { return x.n; })) * 1.1, 5, true);
    var Y = function (v) { return T + h - (v / sc.max) * h; };
    sc.ticks.forEach(function (v) {
      var yy = Y(v);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, String(v), { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));
    var band = w / bins.length, bw = Math.min(24, band - 12);
    bins.forEach(function (x, i) {
      var bx = L + band * i + (band - bw) / 2, y = Y(x.n);
      var p = el('path', { d: barV(bx, y, bw, T + h - y, 4) });
      p.style.fill = 'var(--series-1)';
      svg.appendChild(p);
      if (x.n > 0) svg.appendChild(txt(bx + bw / 2, y - 7, String(x.n), { anchor: 'middle', size: 11, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      svg.appendChild(txt(bx + bw / 2, T + h + 18, x.lab, { anchor: 'middle', size: 11, fill: 'var(--text-secondary)' }));
      var ht = el('rect', { x: L + band * i, y: T, width: band, height: h });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, x.lab + ' consulenti', [{ value: String(x.n), label: 'società', color: 'var(--series-1)' }]);
      svg.appendChild(ht);
    });
    svg.appendChild(txt(L + w / 2, T + h + 42, 'consulenti per società', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
  }

  /* ================= CONCENTRAZIONE ================= */
  function renderConc(rows) {
    var svg = frame(document.getElementById('conc'), 560, 330, 420);
    var b = withBil(rows).slice().sort(function (a, c) { return c.fatt_ult - a.fatt_ult; });
    var L = 48, R = 18, T = 16, B = 52, w = 560 - L - R, h = 330 - T - B;
    if (b.length < 2) { svg.appendChild(txt(L, T + h / 2, 'Dati insufficienti.', { size: 13 })); return; }
    var tot = sum(b.map(function (r) { return r.fatt_ult; })), cum = 0;
    var pts = b.map(function (r, i) { cum += r.fatt_ult; return { i: i + 1, p: 100 * cum / tot, r: r }; });
    var X = function (i) { return L + (i - 1) / (b.length - 1) * w; };
    var Y = function (p) { return T + h - p / 100 * h; };

    [0, 25, 50, 75, 100].forEach(function (p) {
      var yy = Y(p);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, p + '%', { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));

    var d = 'M' + X(1) + ',' + Y(pts[0].p);
    pts.forEach(function (p) { d += 'L' + X(p.i) + ',' + Y(p.p); });
    var area = el('path', { d: d + 'L' + X(b.length) + ',' + (T + h) + 'L' + X(1) + ',' + (T + h) + 'Z' });
    area.style.fill = 'var(--series-1)'; area.style.opacity = '.10';
    svg.appendChild(area);
    var line = el('path', { d: d });
    line.style.fill = 'none'; line.style.stroke = 'var(--series-1)';
    line.style.strokeWidth = '2'; line.style.strokeLinejoin = 'round'; line.style.strokeLinecap = 'round';
    svg.appendChild(line);

    [5, 10, 20].forEach(function (k) {
      if (k >= b.length) return;
      var p = pts[k - 1];
      var c = el('circle', { cx: X(p.i), cy: Y(p.p), r: 4.5 });
      c.style.fill = 'var(--series-1)'; c.style.stroke = 'var(--surface-1)'; c.style.strokeWidth = '2';
      svg.appendChild(c);
      svg.appendChild(txt(X(p.i) + 8, Y(p.p) + 4, 'top ' + k + ': ' + nf1.format(p.p) + '%',
        { size: 11, fill: 'var(--text-secondary)', weight: 600 }));
    });

    var ht = el('rect', { x: L, y: T, width: w, height: h });
    ht.style.fill = 'transparent'; ht.style.cursor = 'crosshair';
    ht.addEventListener('pointermove', function (e) {
      var bb = svg.getBoundingClientRect();
      var rel = (e.clientX - bb.left) / bb.width * 560;
      var idx = Math.round((rel - L) / w * (b.length - 1));
      idx = Math.max(0, Math.min(b.length - 1, idx));
      var p = pts[idx];
      tipShow(e, 'Prime ' + p.i + (p.i === 1 ? ' società' : ' società'), [
        { value: nf1.format(p.p) + '%', label: 'del giro d\'affari', color: 'var(--series-1)' },
        { value: eurShort(sum(b.slice(0, p.i).map(function (r) { return r.fatt_ult; }))), label: 'cumulato' }
      ]);
    });
    ht.addEventListener('pointerleave', tipHide);
    svg.appendChild(ht);
    svg.appendChild(txt(L + w / 2, T + h + 42, 'numero di società (dalla più grande)', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
  }

  /* ================= REGIONI ================= */
  var SEQ = ['var(--seq-100)', 'var(--seq-250)', 'var(--seq-450)', 'var(--seq-600)'];
  function renderRegioni(rows) {
    var svg = document.getElementById('regioni');
    var map = {};
    rows.forEach(function (r) {
      var a = map[r.regione] || (map[r.regione] = { n: 0, cf: 0, f: 0, cfb: 0, nb: 0 });
      a.n++; a.cf += r.n_cf;
      if (r.fatt_ult != null) { a.f += r.fatt_ult; a.cfb += r.n_cf; a.nb++; }
    });
    var arr = Object.keys(map).map(function (k) {
      var a = map[k]; a.reg = k; a.perCf = a.cfb ? a.f / a.cfb : null; return a;
    }).sort(function (x, y) { return y.f - x.f; });

    var rowH = 30, L = 168, R = 96, T = 10, B = 34;
    var H = T + B + arr.length * rowH;
    frame(svg, 900, Math.max(120, H), 560);
    if (!arr.length) { svg.appendChild(txt(L, 40, 'Nessun dato.', { size: 13 })); return; }
    var w = 900 - L - R;
    var max = Math.max.apply(null, arr.map(function (a) { return a.f; })) || 1;

    var perVals = arr.map(function (a) { return a.perCf; }).filter(function (x) { return x != null; });
    var qs = [quantile(perVals, .25), quantile(perVals, .5), quantile(perVals, .75)];
    function seqColor(v) {
      if (v == null) return 'var(--deemph)';
      if (v <= qs[0]) return SEQ[0];
      if (v <= qs[1]) return SEQ[1];
      if (v <= qs[2]) return SEQ[2];
      return SEQ[3];
    }

    arr.forEach(function (a, i) {
      var y = T + i * rowH, bh = Math.min(24, rowH - 8);
      var bw = a.f / max * w;
      svg.appendChild(txt(L - 12, y + rowH / 2, a.reg, { anchor: 'end', baseline: 'middle', size: 11.5, fill: 'var(--text-secondary)' }));
      var p = el('path', { d: barH(L, y + (rowH - bh) / 2, Math.max(bw, 1), bh, 4) });
      p.style.fill = seqColor(a.perCf);
      svg.appendChild(p);
      svg.appendChild(txt(L + bw + 9, y + rowH / 2, eurShort(a.f), { baseline: 'middle', size: 11, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      var ht = el('rect', { x: L, y: y, width: w, height: rowH });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, a.reg, [
        { value: eur(a.f), label: 'fatturato aggregato', color: seqColor(a.perCf) },
        { value: a.perCf == null ? 'n.d.' : eur(a.perCf), label: 'per consulente' },
        { value: a.n + ' / ' + a.cf, label: 'società / consulenti' }
      ]);
      svg.appendChild(ht);
    });

    // legenda della scala sequenziale (obbligatoria per un ramp continuo)
    var lx = L, ly = T + arr.length * rowH + 16;
    svg.appendChild(txt(lx, ly + 9, 'fatturato per consulente:', { size: 10.5, baseline: 'middle' }));
    var sx = lx + 150;
    SEQ.forEach(function (c, i) {
      var r = el('rect', { x: sx + i * 30, y: ly + 2, width: 26, height: 12, rx: 3 });
      r.style.fill = c; svg.appendChild(r);
    });
    svg.appendChild(txt(sx - 6, ly + 9, 'basso', { anchor: 'end', size: 10.5, baseline: 'middle' }));
    svg.appendChild(txt(sx + 4 * 30 + 2, ly + 9, 'alto', { size: 10.5, baseline: 'middle' }));
  }

  /* ================= CRESCITA (perimetro costante) ================= */
  function renderCrescita(rows) {
    /* id distinto da quello della <section>: un id duplicato farebbe svuotare la sezione */
    var svg = frame(document.getElementById('chartCrescita'), 560, 330, 400);
    var same = rows.filter(function (r) { return r.fatt_2022 && r.fatt_2023 && r.fatt_2024; });
    var sub = document.getElementById('subCrescita');
    var L = 66, R = 16, T = 26, B = 52, w = 560 - L - R, h = 330 - T - B;
    if (same.length < 3) {
      sub.textContent = 'Servono almeno 3 società con bilancio in tutti e tre gli anni: con questi filtri sono ' + same.length + '.';
      svg.appendChild(txt(L, T + h / 2, 'Perimetro troppo ristretto.', { size: 13 }));
      return;
    }
    var vals = [
      { y: '2022', v: sum(same.map(function (r) { return r.fatt_2022; })) },
      { y: '2023', v: sum(same.map(function (r) { return r.fatt_2023; })) },
      { y: '2024', v: sum(same.map(function (r) { return r.fatt_2024; })) }
    ];
    var cagr = 100 * (Math.pow(vals[2].v / vals[0].v, 0.5) - 1);
    sub.textContent = same.length + ' società con bilancio in tutti e tre gli anni · CAGR ' + pct(cagr);

    var sc = niceScale(vals[2].v, 4);
    var max = sc.max;
    var Y = function (v) { return T + h - v / max * h; };
    sc.ticks.forEach(function (v) {
      var yy = Y(v);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, eurShort(v), { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));

    var band = w / 3, bw = Math.min(24, band - 40);
    vals.forEach(function (d, i) {
      var x = L + band * i + (band - bw) / 2, y = Y(d.v);
      var p = el('path', { d: barV(x, y, bw, T + h - y, 4) });
      p.style.fill = 'var(--series-1)';
      svg.appendChild(p);
      svg.appendChild(txt(x + bw / 2, y - 20, eurShort(d.v), { anchor: 'middle', size: 11.5, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      if (i > 0) {
        var ch = 100 * (d.v / vals[i - 1].v - 1);
        var t = txt(x + bw / 2, y - 6, pct(ch), { anchor: 'middle', size: 11, weight: 620 });
        t.style.fill = ch >= 0 ? 'var(--good)' : 'var(--critical)';
        svg.appendChild(t);
      }
      svg.appendChild(txt(x + bw / 2, T + h + 18, d.y, { anchor: 'middle', size: 12, fill: 'var(--text-secondary)', tabular: true }));
      var ht = el('rect', { x: L + band * i, y: T, width: band, height: h });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, 'Esercizio ' + d.y, [
        { value: eur(d.v), label: 'fatturato aggregato', color: 'var(--series-1)' },
        { value: String(same.length), label: 'società a perimetro costante' }
      ]);
      svg.appendChild(ht);
    });
  }

  /* ================= VINTAGE ================= */
  function renderVintage(rows) {
    var svg = frame(document.getElementById('vintage'), 560, 330, 400);
    var buckets = [
      { lab: '≤2009', f: function (y) { return y <= 2009; } },
      { lab: '10-18', f: function (y) { return y >= 2010 && y <= 2018; } },
      { lab: '19-21', f: function (y) { return y >= 2019 && y <= 2021; } },
      { lab: '22-23', f: function (y) { return y >= 2022 && y <= 2023; } },
      { lab: '≥2024', f: function (y) { return y >= 2024; } }
    ].map(function (b) {
      var g = rows.filter(function (r) { return r.anno_cost != null && b.f(r.anno_cost); });
      b.n = g.length;
      b.med = median(withBil(g).map(function (r) { return r.fatt_per_cf; }));
      return b;
    });
    var L = 44, R = 16, T = 16, B = 52, w = 560 - L - R, h = 330 - T - B;
    var sc = niceScale(Math.max.apply(null, buckets.map(function (b) { return b.n; })) * 1.12, 5, true);
    var max = sc.max;
    var Y = function (v) { return T + h - v / max * h; };
    sc.ticks.forEach(function (v) {
      var yy = Y(v);
      svg.appendChild(gridline(L, yy, L + w, yy));
      svg.appendChild(txt(L - 10, yy, String(v), { anchor: 'end', baseline: 'middle', tabular: true }));
    });
    svg.appendChild(axisline(L, T + h, L + w, T + h));
    var band = w / buckets.length, bw = Math.min(24, band - 20);
    buckets.forEach(function (b, i) {
      var x = L + band * i + (band - bw) / 2, y = Y(b.n);
      var p = el('path', { d: barV(x, y, bw, T + h - y, 4) });
      p.style.fill = 'var(--series-1)';
      svg.appendChild(p);
      if (b.n) svg.appendChild(txt(x + bw / 2, y - 7, String(b.n), { anchor: 'middle', size: 11, fill: 'var(--text-secondary)', weight: 620, tabular: true }));
      svg.appendChild(txt(x + bw / 2, T + h + 18, b.lab, { anchor: 'middle', size: 11, fill: 'var(--text-secondary)' }));
      var ht = el('rect', { x: L + band * i, y: T, width: band, height: h });
      ht.style.fill = 'transparent'; ht.style.cursor = 'pointer';
      hit(ht, 'Costituite ' + b.lab, [
        { value: String(b.n), label: 'società', color: 'var(--series-1)' },
        { value: b.med == null ? 'n.d.' : eur(b.med), label: 'mediano per consulente' }
      ]);
      svg.appendChild(ht);
    });
    svg.appendChild(txt(L + w / 2, T + h + 42, 'periodo di costituzione', { anchor: 'middle', size: 12, fill: 'var(--text-secondary)' }));
  }

  /* ================= CALLOUT + SCHEDE MODELLO ================= */
  function renderModels(rows) {
    var b = withBil(rows);
    var bo = b.filter(function (r) { return r.n_cf <= 3; });
    var re = b.filter(function (r) { return r.n_cf >= 8; });
    var mb = median(bo.map(function (r) { return r.fatt_per_cf; }));
    var mr = median(re.map(function (r) { return r.fatt_per_cf; }));
    /* stesso confronto a parita' di anzianita': isola l'effetto "societa' giovane" */
    var oldB = bo.filter(function (r) { return r.anno_cost && r.anno_cost <= 2021; });
    var oldR = re.filter(function (r) { return r.anno_cost && r.anno_cost <= 2021; });
    var mb2 = median(oldB.map(function (r) { return r.fatt_per_cf; }));
    var mr2 = median(oldR.map(function (r) { return r.fatt_per_cf; }));

    var co = document.getElementById('modelCallout');
    co.textContent = '';
    var p = document.createElement('p');
    if (mb && mr) {
      p.appendChild(document.createTextNode('In mediana le società fino a 3 consulenti fatturano '));
      var st = document.createElement('strong');
      st.textContent = nf1.format(mb / mr) + ' volte';
      p.appendChild(st);
      p.appendChild(document.createTextNode(' per consulente rispetto a quelle con 8 o più'));
      if (mb2 && mr2) {
        p.appendChild(document.createTextNode('; restringendo alle sole società costituite entro il 2021 il rapporto è ' +
          nf1.format(mb2 / mr2) + ' volte, quindi non è un effetto dell\'età delle società.'));
      } else { p.appendChild(document.createTextNode('.')); }
      var p2 = document.createElement('p');
      p2.style.marginBottom = '0';
      p2.appendChild(document.createTextNode('Sono mediane, e nascondono una dispersione enorme: '));
      var srt = re.slice().sort(function (x, y) { return y.fatt_per_cf - x.fatt_per_cf; });
      if (srt.length > 1) {
        var s2 = document.createElement('strong');
        s2.textContent = 'fra le società con 8+ consulenti si va da ' + eur(srt[srt.length - 1].fatt_per_cf) +
          ' a ' + eur(srt[0].fatt_per_cf);
        p2.appendChild(s2);
        p2.appendChild(document.createTextNode('. La classe dimensionale non descrive un modo di lavorare.'));
      }
      co.appendChild(p); co.appendChild(p2);
    } else {
      p.textContent = 'Con questi filtri non ci sono abbastanza società per il confronto.';
      co.appendChild(p);
    }

    var host = document.getElementById('modelCards');
    host.textContent = '';
    [
      { t: 'Fino a 3 consulenti', c: MODEL_COLOR.Boutique, v: mb, n: bo.length, v2: mb2, n2: oldB.length },
      { t: '8 consulenti o più', c: MODEL_COLOR.Rete, v: mr, n: re.length, v2: mr2, n2: oldR.length }
    ].forEach(function (m) {
      var d = document.createElement('div'); d.className = 'model';
      var hd = document.createElement('div'); hd.className = 'h';
      var sw = document.createElement('span'); sw.className = 'sw';
      sw.style.cssText = 'width:11px;height:11px;border-radius:3px;flex:none;background:' + m.c;
      var tt = document.createElement('span'); tt.textContent = m.t;
      hd.appendChild(sw); hd.appendChild(tt);
      var bg = document.createElement('div'); bg.className = 'big';
      bg.textContent = m.v == null ? '—' : eur(m.v);
      var sm = document.createElement('div'); sm.className = 'small';
      sm.textContent = 'mediano per consulente · ' + m.n + ' società con bilancio';
      var ds = document.createElement('p');
      ds.textContent = m.v2 == null ? 'Base troppo piccola per il confronto a parità di anzianità.'
        : 'Solo quelle costituite entro il 2021: ' + eur(m.v2) + ' (' + m.n2 + ' società).';
      d.appendChild(hd); d.appendChild(bg); d.appendChild(sm); d.appendChild(ds);
      host.appendChild(d);
    });
  }

  /* ================= TABELLA ================= */
  var COLS = [
    { k: 'denominazione', l: 'Società', cls: 'name' },
    { k: 'modello', l: 'Modello' },
    { k: 'provincia', l: 'Pr.' },
    { k: 'n_cf', l: 'CF', num: true },
    { k: 'anno_ult', l: 'Anno' },
    { k: 'fatt_ult', l: 'Fatturato', num: true, fmt: eur },
    { k: 'fatt_per_cf', l: 'Per CF', num: true, fmt: eur },
    { k: 'utile_ult', l: 'Utile', num: true, fmt: eur, signed: true },
    { k: 'margine_pct', l: 'Margine', num: true, fmt: function (v) { return v == null ? '—' : nf1.format(v) + '%'; } },
    { k: 'cresc_24_pct', l: 'Cresc. 24', num: true, fmt: pct, signed: true },
    { k: 'piva', l: 'P.IVA' }
  ];

  function renderTable(rows) {
    var q = state.q.trim().toLowerCase();
    var list = rows.filter(function (r) {
      if (!q) return true;
      return (r.denominazione + ' ' + r.comune + ' ' + (r.piva || '')).toLowerCase().indexOf(q) >= 0;
    });
    list.sort(function (a, b) {
      var x = a[state.sort], y = b[state.sort];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      if (typeof x === 'string') return state.dir * x.localeCompare(y, 'it');
      return state.dir * (x - y);
    });

    var thead = document.getElementById('thead');
    thead.textContent = '';
    COLS.forEach(function (c) {
      var th = document.createElement('th');
      if (c.num) th.className = 'num';
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      th.appendChild(document.createTextNode(c.l + ' '));
      var ar = document.createElement('span'); ar.className = 'ar';
      ar.textContent = state.sort === c.k ? (state.dir === 1 ? '▲' : '▼') : '↕';
      th.appendChild(ar);
      if (state.sort === c.k) th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
      function doSort() {
        if (state.sort === c.k) state.dir = -state.dir;
        else { state.sort = c.k; state.dir = (c.num || c.k === 'anno_ult') ? -1 : 1; }
        renderTable(rows);
      }
      th.addEventListener('click', doSort);
      th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); } });
      thead.appendChild(th);
    });

    var tb = document.getElementById('tbody');
    tb.textContent = '';
    list.forEach(function (r) {
      var tr = document.createElement('tr');
      COLS.forEach(function (c) {
        var td = document.createElement('td');
        if (c.num) td.className = 'num';
        if (c.cls) td.className = c.cls;
        var v = r[c.k];
        if (c.k === 'modello') {
          var sp = document.createElement('span'); sp.className = 'pill';
          var pd = document.createElement('span'); pd.className = 'pd';
          pd.style.background = MODEL_COLOR[v];
          sp.appendChild(pd); sp.appendChild(document.createTextNode(v));
          td.appendChild(sp);
        } else {
          td.textContent = v == null ? '—' : (c.fmt ? c.fmt(v) : String(v));
          if (c.signed && typeof v === 'number') td.classList.add(v < 0 ? 'neg' : 'pos');
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    document.getElementById('tblNote').textContent =
      list.length + ' società mostrate. «—» significa dato non disponibile: 25 SCF non hanno un bilancio depositato consultabile.';
  }

  function downloadCsv() {
    var rows = filtered();
    var head = COLS.map(function (c) { return c.l; }).join(';');
    var body = rows.map(function (r) {
      return COLS.map(function (c) {
        var v = r[c.k];
        if (v == null) return '';
        return typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : String(v).replace('.', ',');
      }).join(';');
    }).join('\n');
    var blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scf-italia.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ================= render globale ================= */
  function renderAll() {
    var rows = filtered();
    document.getElementById('fCount').textContent =
      rows.length + ' società su ' + DATA.length + ' · ' + sum(rows.map(function (r) { return r.n_cf; })) + ' consulenti';
    renderKpis(rows);
    renderLegendScatter();
    renderScatter(rows);
    renderBarClasse(rows);
    renderHisto(rows);
    renderModels(rows);
    renderConc(rows);
    renderHistoCF(rows);
    renderRegioni(rows);
    renderCrescita(rows);
    renderVintage(rows);
    renderTable(rows);
  }

  /* ================= init ================= */
  function init() {
    var regs = Array.from(new Set(DATA.map(function (r) { return r.regione; }))).sort();
    var sel = document.getElementById('fReg');
    regs.forEach(function (r) {
      var o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o);
    });

    sel.addEventListener('change', function () { state.reg = this.value; renderAll(); });
    document.getElementById('fMod').addEventListener('change', function () { state.mod = this.value; renderAll(); });
    document.getElementById('fAnno').addEventListener('change', function () { state.anno = this.value; renderAll(); });
    document.getElementById('fBil').addEventListener('change', function () { state.soloBil = this.checked; renderAll(); });
    document.getElementById('fReset').addEventListener('click', function () {
      state.reg = state.mod = state.anno = ''; state.soloBil = false; state.hidden = {};
      sel.value = ''; document.getElementById('fMod').value = '';
      document.getElementById('fAnno').value = ''; document.getElementById('fBil').checked = false;
      renderAll();
    });
    var qi = document.getElementById('q');
    qi.addEventListener('input', function () { state.q = this.value; renderTable(filtered()); });
    document.getElementById('csvBtn').addEventListener('click', downloadCsv);

    // tema
    var saved = null;
    try { saved = localStorage.getItem('scf-theme'); } catch (e) { }
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      if (!cur) cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('scf-theme', next); } catch (e) { }
    });

    renderAll();
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(renderAll, 180); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
