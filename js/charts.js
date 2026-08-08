/**
 * Diagramme als Inline-SVG, ohne Fremdbibliothek.
 *
 * Farblogik:
 *  – Das Kategorien-Ranking ist eine Größenangabe einer einzigen Reihe. Es
 *    bekommt deshalb genau eine Akzentfarbe, keine neun bunten Balken. Die
 *    Kategorie steht als Text am Balken – Identität hängt nie an Farbe.
 *  – Der Wochenverlauf zeigt Ist als Balken und Soll als gestrichelte
 *    Referenzlinie in neutraler Schrift-Tinte. Ebenfalls nur eine Reihenfarbe.
 *  – Die Saldo-Kennzahl nutzt Statusfarben, immer zusammen mit Vorzeichen und
 *    Beschriftung (rot/grün allein ist für Rot-Grün-Sehschwäche nicht
 *    unterscheidbar – Text und Vorzeichen tragen die Aussage).
 *
 * Zu jedem Diagramm gehört eine ausklappbare Tabelle mit denselben Zahlen.
 */

import { KATEGORIEN, KATEGORIE_MAP } from './model.js';
import { minutenAlsStunden, minutenDezimal } from './soll.js';
import { deutschesDatum } from './export.js';
import { kalenderwoche } from './kalender-sh.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * Die Diagramme werden in ein festes viewBox-Koordinatensystem gezeichnet und
 * auf die Breite des Containers skaliert. Auf einem Telefon würde ein breites
 * viewBox die Schrift auf Briefmarkengröße schrumpfen - deshalb gibt es zwei
 * Layouts statt eines gestauchten.
 */
function istSchmal() {
  return typeof window !== 'undefined' && window.innerWidth < 680;
}

function el(name, attrs = {}, kinder = []) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) n.setAttribute(k, String(v));
  }
  for (const kind of kinder) n.appendChild(kind);
  return n;
}

function text(inhalt, attrs = {}) {
  const t = el('text', attrs);
  t.textContent = inhalt;
  return t;
}

/** Rechteck mit abgerundetem Datenende (4px) – Grundlinie bleibt eckig. */
function balkenPfad(x, y, breite, hoehe, radius, richtung) {
  const r = Math.max(0, Math.min(radius, richtung === 'rechts' ? breite : hoehe));
  if (r <= 0.5) return `M${x} ${y}h${breite}v${hoehe}h${-breite}Z`;
  if (richtung === 'rechts') {
    return (
      `M${x} ${y}` +
      `h${breite - r}a${r} ${r} 0 0 1 ${r} ${r}` +
      `v${hoehe - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
      `h${-(breite - r)}Z`
    );
  }
  return (
    `M${x} ${y + r}` +
    `a${r} ${r} 0 0 1 ${r} ${-r}` +
    `h${breite - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}` +
    `v${hoehe - r}h${-breite}Z`
  );
}

/* ------------------------------- Tooltip -------------------------------- */

let tooltipEl = null;
function tooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'viz-tooltip';
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function tooltipZeigen(ereignis, html) {
  const t = tooltip();
  t.innerHTML = html;
  t.hidden = false;
  const rand = 12;
  const breite = t.offsetWidth;
  let x = ereignis.clientX + rand;
  if (x + breite > window.innerWidth - 8) x = ereignis.clientX - breite - rand;
  t.style.left = `${Math.max(8, x)}px`;
  t.style.top = `${Math.max(8, ereignis.clientY - t.offsetHeight - rand)}px`;
}

function tooltipVerbergen() {
  if (tooltipEl) tooltipEl.hidden = true;
}

function hoverBinden(knoten, htmlFn) {
  knoten.addEventListener('pointerenter', (e) => tooltipZeigen(e, htmlFn()));
  knoten.addEventListener('pointermove', (e) => tooltipZeigen(e, htmlFn()));
  knoten.addEventListener('pointerleave', tooltipVerbergen);
  knoten.addEventListener('pointercancel', tooltipVerbergen);
}

/* -------------------------- Kategorien-Ranking -------------------------- */

/**
 * Waagerechtes Balkendiagramm: Anteil der Kategorien an der geleisteten Zeit,
 * absteigend sortiert.
 */
export function kategorienDiagramm(ergebnis) {
  const daten = KATEGORIEN.map((k) => ({
    id: k.id,
    name: k.name,
    minuten: ergebnis.proKategorie[k.id] || 0,
  }))
    .filter((d) => d.minuten > 0)
    .sort((a, b) => b.minuten - a.minuten);

  const wrap = document.createElement('figure');
  wrap.className = 'viz';

  if (!daten.length) {
    wrap.innerHTML = '<p class="viz-leer">Für diesen Zeitraum ist noch nichts erfasst.</p>';
    return wrap;
  }

  // Auf schmalen Displays steht die Beschriftung über dem Balken. Nebeneinander
  // müsste sie sonst so weit gestaucht werden, dass die längeren Kategorienamen
  // abgeschnitten würden - und ein halber Kategoriename ist wertlos.
  const schmal = istSchmal();
  const max = Math.max(...daten.map((d) => d.minuten));
  const zeilenhoehe = schmal ? 48 : 34;
  const balkenhoehe = schmal ? 16 : 18;
  const labelBreite = schmal ? 0 : 252;
  const wertBreite = schmal ? 76 : 86;
  const breite = schmal ? 360 : 720;
  const hoehe = daten.length * zeilenhoehe + 8;
  const plotBreite = breite - labelBreite - wertBreite;

  const svg = el('svg', {
    viewBox: `0 0 ${breite} ${hoehe}`,
    role: 'img',
    'aria-label': 'Verteilung der Arbeitszeit auf die Kategorien',
    class: 'viz-svg',
    preserveAspectRatio: 'xMinYMin meet',
  });

  daten.forEach((d, i) => {
    const y = i * zeilenhoehe + 4;
    const mitte = schmal ? y + zeilenhoehe - 14 : y + zeilenhoehe / 2 - 4;
    const laenge = Math.max(2, (d.minuten / max) * plotBreite);
    const anteil = ergebnis.istMinuten > 0 ? (d.minuten / ergebnis.istMinuten) * 100 : 0;

    const gruppe = el('g', { class: 'viz-zeile', tabindex: '0' });
    gruppe.appendChild(
      text(
        d.name,
        schmal
          ? { x: 0, y: y + 13, class: 'viz-label' }
          : { x: labelBreite - 12, y: mitte + 5, 'text-anchor': 'end', class: 'viz-label' },
      ),
    );
    // 2px Abstand zur Grundlinie hält die Balken optisch getrennt.
    gruppe.appendChild(
      el('path', {
        d: balkenPfad(labelBreite, mitte - balkenhoehe / 2, laenge, balkenhoehe, 4, 'rechts'),
        class: 'viz-balken',
      }),
    );
    gruppe.appendChild(
      text(`${minutenAlsStunden(d.minuten)}`, {
        x: labelBreite + laenge + 10,
        y: mitte + 5,
        class: 'viz-wert',
      }),
    );
    const titel = el('title');
    titel.textContent = `${d.name}: ${minutenAlsStunden(d.minuten)} (${anteil.toFixed(1)} %)`;
    gruppe.appendChild(titel);
    hoverBinden(
      gruppe,
      () =>
        `<strong>${d.name}</strong><br>${minutenAlsStunden(d.minuten)} · ${anteil.toFixed(1)} % der erfassten Zeit`,
    );
    svg.appendChild(gruppe);
  });

  // Grundlinie nur in der breiten Darstellung - schmal wäre sie am linken Rand
  // ohne Funktion.
  if (!schmal) {
    svg.appendChild(
      el('line', { x1: labelBreite, y1: 2, x2: labelBreite, y2: hoehe - 4, class: 'viz-achse' }),
    );
  }

  wrap.appendChild(svg);
  wrap.appendChild(
    tabellenKlappe('Zahlen als Tabelle', [
      ['Kategorie', 'Stunden', 'Anteil'],
      ...daten.map((d) => [
        d.name,
        minutenAlsStunden(d.minuten),
        ergebnis.istMinuten > 0 ? `${((d.minuten / ergebnis.istMinuten) * 100).toFixed(1)} %` : '-',
      ]),
    ]),
  );
  return wrap;
}

/* ---------------------------- Wochenverlauf ----------------------------- */

/**
 * Wochenverlauf: Balken = tatsächlich erfasste Zeit, gestrichelte Linie =
 * Soll-Arbeitszeit derselben Woche.
 */
export function wochenDiagramm(ergebnis) {
  const wochen = ergebnis.proWoche.filter((w) => w.ist > 0 || w.soll > 0);
  const wrap = document.createElement('figure');
  wrap.className = 'viz';

  if (!wochen.length) {
    wrap.innerHTML = '<p class="viz-leer">Für diesen Zeitraum liegen keine Wochen vor.</p>';
    return wrap;
  }

  const schmal = istSchmal();
  const breite = schmal ? 360 : 720;
  const hoehe = schmal ? 210 : 240;
  const randL = schmal ? 30 : 46;
  const randR = schmal ? 6 : 12;
  const randO = 16;
  const randU = 34;
  const plotB = breite - randL - randR;
  const plotH = hoehe - randO - randU;

  const maxMin = Math.max(...wochen.map((w) => Math.max(w.ist, w.soll)), 60);
  const maxStd = Math.ceil(maxMin / 60 / 5) * 5;
  const y = (min) => randO + plotH - (min / (maxStd * 60)) * plotH;

  const schritt = plotB / wochen.length;
  const balkenB = Math.max(4, Math.min(28, schritt - 6)); // >=2px Lücke zwischen Balken

  const svg = el('svg', {
    viewBox: `0 0 ${breite} ${hoehe}`,
    role: 'img',
    'aria-label': 'Wochenverlauf: erfasste Arbeitszeit im Vergleich zur Soll-Arbeitszeit',
    class: 'viz-svg',
    preserveAspectRatio: 'xMinYMin meet',
  });

  // Gitternetz, zurückhaltend
  const schritte = 5;
  for (let i = 0; i <= schritte; i += 1) {
    const std = (maxStd / schritte) * i;
    const yy = y(std * 60);
    svg.appendChild(el('line', { x1: randL, y1: yy, x2: breite - randR, y2: yy, class: 'viz-grid' }));
    svg.appendChild(
      text(`${Math.round(std)}`, { x: randL - 8, y: yy + 4, 'text-anchor': 'end', class: 'viz-tick' }),
    );
  }
  svg.appendChild(text('Std.', { x: randL - 8, y: randO - 4, 'text-anchor': 'end', class: 'viz-tick' }));

  wochen.forEach((w, i) => {
    const x = randL + i * schritt + (schritt - balkenB) / 2;
    const hoeheIst = Math.max(0, randO + plotH - y(w.ist));
    const gruppe = el('g', { class: 'viz-zeile', tabindex: '0' });
    if (hoeheIst > 0) {
      gruppe.appendChild(
        el('path', { d: balkenPfad(x, y(w.ist), balkenB, hoeheIst, 4, 'oben'), class: 'viz-balken' }),
      );
    }
    const saldo = w.ist - w.soll;
    const titel = el('title');
    titel.textContent = `KW ${kalenderwoche(w.start)}: ${minutenAlsStunden(w.ist)} von ${minutenAlsStunden(w.soll)}`;
    gruppe.appendChild(titel);
    // Unsichtbare, großzügige Trefferfläche
    gruppe.appendChild(
      el('rect', { x: randL + i * schritt, y: randO, width: schritt, height: plotH, class: 'viz-hit' }),
    );
    hoverBinden(
      gruppe,
      () =>
        `<strong>KW ${kalenderwoche(w.start)}</strong> (ab ${deutschesDatum(w.start)})<br>` +
        `Erfasst: ${minutenAlsStunden(w.ist)}<br>Soll: ${minutenAlsStunden(w.soll)}<br>` +
        `Saldo: ${minutenAlsStunden(saldo, true)}`,
    );
    svg.appendChild(gruppe);

    if (i % Math.ceil(wochen.length / (schmal ? 6 : 14)) === 0) {
      svg.appendChild(
        text(`${kalenderwoche(w.start)}`, {
          x: randL + i * schritt + schritt / 2,
          y: hoehe - randU + 18,
          'text-anchor': 'middle',
          class: 'viz-tick',
        }),
      );
    }
  });

  // Soll als gestrichelte Referenzlinie (Stufenlinie), in neutraler Tinte
  let d = '';
  wochen.forEach((w, i) => {
    const x1 = randL + i * schritt;
    const x2 = x1 + schritt;
    const yy = y(w.soll);
    d += `${i === 0 ? 'M' : 'L'}${x1} ${yy}L${x2} ${yy}`;
  });
  svg.appendChild(el('path', { d, class: 'viz-soll-linie', fill: 'none' }));

  svg.appendChild(
    el('line', { x1: randL, y1: randO + plotH, x2: breite - randR, y2: randO + plotH, class: 'viz-achse' }),
  );
  svg.appendChild(
    text('Kalenderwoche', {
      x: randL + plotB / 2,
      y: hoehe - 4,
      'text-anchor': 'middle',
      class: 'viz-achsentitel',
    }),
  );

  wrap.appendChild(svg);

  const legende = document.createElement('figcaption');
  legende.className = 'viz-legende';
  legende.innerHTML =
    '<span class="viz-legende-item"><span class="viz-swatch"></span>Erfasste Zeit</span>' +
    '<span class="viz-legende-item"><span class="viz-swatch-linie"></span>Soll-Arbeitszeit</span>';
  wrap.appendChild(legende);

  wrap.appendChild(
    tabellenKlappe('Zahlen als Tabelle', [
      ['Woche ab', 'KW', 'Erfasst', 'Soll', 'Saldo'],
      ...wochen.map((w) => [
        deutschesDatum(w.start),
        String(kalenderwoche(w.start)),
        minutenAlsStunden(w.ist),
        minutenAlsStunden(w.soll),
        minutenAlsStunden(w.ist - w.soll, true),
      ]),
    ]),
  );
  return wrap;
}

/* ------------------------------- Tabelle -------------------------------- */

function tabellenKlappe(titel, zeilen) {
  const details = document.createElement('details');
  details.className = 'viz-tabelle';
  const summary = document.createElement('summary');
  summary.textContent = titel;
  details.appendChild(summary);

  const tabelle = document.createElement('table');
  const [kopf, ...rest] = zeilen;
  const thead = document.createElement('thead');
  const kopfZeile = document.createElement('tr');
  for (const z of kopf) {
    const th = document.createElement('th');
    th.textContent = z;
    kopfZeile.appendChild(th);
  }
  thead.appendChild(kopfZeile);
  tabelle.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const zeile of rest) {
    const tr = document.createElement('tr');
    zeile.forEach((wert, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.setAttribute('scope', 'row');
      td.textContent = wert;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  tabelle.appendChild(tbody);
  details.appendChild(tabelle);
  return details;
}

/** Fortschrittsbalken Ist/Soll für die Kopfzeile. */
export function sollFortschritt(istMinuten, sollMinuten) {
  const anteil = sollMinuten > 0 ? Math.min(istMinuten / sollMinuten, 1.5) : 0;
  const wrap = document.createElement('div');
  wrap.className = 'fortschritt';
  wrap.innerHTML = `
    <div class="fortschritt-spur" role="img"
         aria-label="Erfasst ${minutenDezimal(istMinuten)} von ${minutenDezimal(sollMinuten)} Soll-Stunden">
      <div class="fortschritt-fuellung" style="width:${Math.min(anteil, 1) * 100}%"></div>
      ${anteil > 1 ? `<div class="fortschritt-über" style="width:${Math.min(anteil - 1, 0.5) * 100}%"></div>` : ''}
    </div>`;
  return wrap;
}

export { KATEGORIE_MAP };
