/**
 * Auswertungswerkzeug für das Kollegium.
 *
 * Nimmt beliebig viele anonyme Kennzahlen-Dateien entgegen und rechnet daraus
 * ein Gesamtbild. Auch dieses Werkzeug läuft vollständig im Browser – die
 * Dateien werden gelesen, nicht hochgeladen.
 *
 * Bewusste Zurückhaltung: Unter fünf Beiträgen werden nur Summen gezeigt und
 * deutlich gewarnt. Bei kleinen Gruppen kann sonst schon der
 * Beschäftigungsumfang eine Person identifizierbar machen.
 */

import { h, toast } from './ui.js';
import { KATEGORIEN, KATEGORIE_MAP } from './model.js';
import { minutenAlsStunden } from './soll.js';
import { kategorienDiagramm, wochenDiagramm } from './charts.js';
import { xlsxBlob, herunterladen, deutschesDatum } from './export.js';

const MINDESTANZAHL = 5;
const beitraege = [];

const ablage = document.getElementById('ablage');
const dateiFeld = document.getElementById('dateien');
const ausgabe = document.getElementById('ausgabe');

dateiFeld.addEventListener('change', (e) => dateienLesen([...e.target.files]));

['dragenter', 'dragover'].forEach((typ) =>
  ablage.addEventListener(typ, (e) => {
    e.preventDefault();
    ablage.classList.add('aktiv');
  }),
);
['dragleave', 'drop'].forEach((typ) =>
  ablage.addEventListener(typ, (e) => {
    e.preventDefault();
    ablage.classList.remove('aktiv');
  }),
);
ablage.addEventListener('drop', (e) => dateienLesen([...e.dataTransfer.files]));

async function dateienLesen(dateien) {
  let neu = 0;
  let abgelehnt = 0;
  for (const datei of dateien) {
    try {
      const daten = JSON.parse(await datei.text());
      if (daten.format !== 'lehrerzeit-anonym') {
        abgelehnt += 1;
        continue;
      }
      if (beitraege.some((b) => b.pseudonym === daten.pseudonym)) continue;
      beitraege.push(daten);
      neu += 1;
    } catch {
      abgelehnt += 1;
    }
  }
  if (abgelehnt) toast(`${abgelehnt} Datei(en) waren keine anonymen Kennzahlen und wurden übersprungen.`);
  else if (neu) toast(`${neu} Beitrag/Beiträge übernommen.`);
  zeichnen();
}

function median(werte) {
  if (!werte.length) return 0;
  const s = [...werte].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function zeichnen() {
  ausgabe.replaceChildren();
  if (!beitraege.length) return;

  const n = beitraege.length;
  const sollStunden = beitraege.map((b) => b.sollStunden);
  const istStunden = beitraege.map((b) => b.istStunden);
  const saldi = beitraege.map((b) => b.saldoStunden);
  const umfaenge = beitraege.map((b) => b.beschaeftigungsumfangProzent);

  /* --------------------------- Beitragsliste -------------------------- */

  ausgabe.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: `${n} Beitr${n === 1 ? 'ag' : 'äge'} eingelesen` }),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Die Dateien bleiben auf diesem Rechner. Ein Neuladen der Seite verwirft alles – es wird ' +
          'nichts gespeichert.',
      }),
      h('div', { class: 'chip-reihe' }, [
        ...beitraege.map((b, i) =>
          h('button', {
            class: 'chip',
            type: 'button',
            title: `${deutschesDatum(b.zeitraumVon)} bis ${deutschesDatum(b.zeitraumBis)}`,
            text: `${b.pseudonym.slice(0, 6)} · ${b.beschaeftigungsumfangProzent} % ✕`,
            onclick: () => {
              beitraege.splice(i, 1);
              zeichnen();
            },
          }),
        ),
      ]),
    ]),
  );

  if (n < MINDESTANZAHL) {
    ausgabe.appendChild(
      h('div', { class: 'hinweis warnung' }, [
        h('strong', { text: 'Zu wenige Beiträge für eine Veröffentlichung. ' }),
        document.createTextNode(
          `Erst ab etwa ${MINDESTANZAHL} Beiträgen ist die Auswertung so weit verdichtet, dass sich ` +
            'keine Rückschlüsse auf einzelne Personen ziehen lassen. Bis dahin bitte nur intern ' +
            'zur Kontrolle nutzen, nicht in Konferenzen zeigen.',
        ),
      ]),
    );
  }

  /* ---------------------------- Kennzahlen ---------------------------- */

  const zeitraeume = new Set(beitraege.map((b) => `${b.zeitraumVon}|${b.zeitraumBis}`));
  if (zeitraeume.size > 1) {
    ausgabe.appendChild(
      h('div', { class: 'hinweis warnung' }, [
        h('strong', { text: 'Unterschiedliche Zeiträume. ' }),
        document.createTextNode(
          'Die Beiträge decken nicht denselben Zeitraum ab. Summen und Mittelwerte sind dann nur ' +
            'eingeschränkt vergleichbar – der Saldo je Beitrag bleibt aussagekräftig, die absoluten ' +
            'Stundenzahlen nicht.',
        ),
      ]),
    );
  }

  const mittelSaldo = saldi.reduce((s, x) => s + x, 0) / n;
  const ueberSoll = saldi.filter((s) => s > 0).length;

  ausgabe.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Gesamtbild' }),
      h('dl', { class: 'kennzahlen' }, [
        kennzahl('Mehrarbeit im Mittel', `${vorzeichen(mittelSaldo)} h`, `Median ${vorzeichen(median(saldi))} h`),
        kennzahl('über der Soll-Zeit', `${ueberSoll} von ${n}`, `${Math.round((ueberSoll / n) * 100)} % der Beiträge`),
        kennzahl(
          'Soll im Mittel',
          `${runden(sollStunden.reduce((s, x) => s + x, 0) / n)} h`,
          `Ist ${runden(istStunden.reduce((s, x) => s + x, 0) / n)} h`,
        ),
        kennzahl(
          'Beschäftigungsumfang',
          `${runden(umfaenge.reduce((s, x) => s + x, 0) / n)} %`,
          `von ${Math.min(...umfaenge)} % bis ${Math.max(...umfaenge)} %`,
        ),
      ]),
    ]),
  );

  /* ------------------------- Verteilung Saldo -------------------------- */

  ausgabe.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Verteilung der Salden' }),
      h('p', {
        class: 'feld-hinweis',
        text: 'Jeder Balken ist eine Person – sortiert, ohne Namen und ohne Reihenfolge der Abgabe.',
      }),
      saldoDiagramm(saldi),
    ]),
  );

  /* --------------------------- Kategorien ----------------------------- */

  const kategorienMinuten = {};
  for (const k of KATEGORIEN) {
    const summe = beitraege.reduce((s, b) => s + (b.kategorienStunden?.[k.id] || 0), 0);
    kategorienMinuten[k.id] = Math.round((summe / n) * 60);
  }
  const istMinuten = Object.values(kategorienMinuten).reduce((s, x) => s + x, 0);

  ausgabe.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Wofür die Zeit im Kollegium draufgeht' }),
      h('p', { class: 'feld-hinweis', text: 'Durchschnitt je Person im jeweils erfassten Zeitraum.' }),
      kategorienDiagramm({ proKategorie: kategorienMinuten, istMinuten }),
    ]),
  );

  /* -------------------------- Wochenverlauf ---------------------------- */

  const wochenKarte = new Map();
  for (const b of beitraege) {
    for (const w of b.wochen || []) {
      if (!wochenKarte.has(w.start)) wochenKarte.set(w.start, { start: w.start, ist: 0, soll: 0, n: 0 });
      const eintrag = wochenKarte.get(w.start);
      eintrag.ist += w.ist * 60;
      eintrag.soll += w.soll * 60;
      eintrag.n += 1;
    }
  }
  const proWoche = [...wochenKarte.values()]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((w) => ({ start: w.start, ist: Math.round(w.ist / w.n), soll: Math.round(w.soll / w.n) }));

  if (proWoche.length) {
    ausgabe.appendChild(
      h('div', { class: 'karte' }, [
        h('h2', { text: 'Wochenverlauf im Mittel' }),
        h('p', {
          class: 'feld-hinweis',
          text: 'Durchschnitt je Person und Woche. Wochen, zu denen niemand etwas beigetragen hat, fehlen.',
        }),
        wochenDiagramm({ proWoche }),
      ]),
    );
  }

  /* ------------------------------ Export ------------------------------- */

  ausgabe.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Gesamtauswertung exportieren' }),
      h('div', { class: 'btn-reihe' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Excel-Datei (.xlsx)',
          onclick: () => {
            herunterladen(gesamtXlsx(beitraege, kategorienMinuten, proWoche), 'Kollegium-Auswertung.xlsx');
            toast('Excel-Datei erzeugt.');
          },
        }),
        h('button', { class: 'btn', text: 'Seite drucken / als PDF', onclick: () => window.print() }),
        h('button', {
          class: 'btn gefahr',
          text: 'Alle Beiträge verwerfen',
          onclick: () => {
            beitraege.length = 0;
            dateiFeld.value = '';
            zeichnen();
          },
        }),
      ]),
    ]),
  );
}

/* ------------------------------ Bausteine -------------------------------- */

function kennzahl(titel, wert, zusatz) {
  return h('div', { class: 'kennzahl' }, [
    h('dt', { text: titel }),
    h('dd', {}, [document.createTextNode(wert), h('span', { class: 'zusatz', text: zusatz })]),
  ]);
}

function runden(x) {
  return Math.round(x * 10) / 10;
}

function vorzeichen(x) {
  const r = runden(x);
  return r > 0 ? `+${r}` : String(r);
}

/**
 * Ein Balken je Person, sortiert. Positive Salden (Mehrarbeit) zeigen nach
 * oben, negative nach unten; die Nulllinie ist beschriftet, damit die Richtung
 * nicht allein an der Farbe hängt.
 */
function saldoDiagramm(saldi) {
  const NS = 'http://www.w3.org/2000/svg';
  const werte = [...saldi].sort((a, b) => a - b);
  const breite = 720;
  const hoehe = 220;
  const randL = 44;
  const randR = 12;
  const randO = 12;
  const randU = 28;
  const plotB = breite - randL - randR;
  const plotH = hoehe - randO - randU;

  const grenze = Math.max(10, ...werte.map((w) => Math.abs(w)));
  const y0 = randO + plotH / 2;
  const y = (wert) => y0 - (wert / grenze) * (plotH / 2);
  const schritt = plotB / werte.length;
  const balkenB = Math.max(3, Math.min(40, schritt - 4));

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`);
  svg.setAttribute('class', 'viz-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Verteilung der Salden je Person');

  const linie = document.createElementNS(NS, 'line');
  linie.setAttribute('x1', randL);
  linie.setAttribute('x2', breite - randR);
  linie.setAttribute('y1', y0);
  linie.setAttribute('y2', y0);
  linie.setAttribute('class', 'viz-achse');
  svg.appendChild(linie);

  werte.forEach((wert, i) => {
    const x = randL + i * schritt + (schritt - balkenB) / 2;
    const oben = Math.min(y(wert), y0);
    const h2 = Math.max(2, Math.abs(y(wert) - y0));
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', oben);
    rect.setAttribute('width', balkenB);
    rect.setAttribute('height', h2);
    rect.setAttribute('rx', 3);
    rect.setAttribute('class', 'viz-balken');
    const titel = document.createElementNS(NS, 'title');
    titel.textContent = `${vorzeichen(wert)} Stunden`;
    rect.appendChild(titel);
    svg.appendChild(rect);
  });

  for (const [wert, beschriftung] of [
    [grenze, `+${Math.round(grenze)} h`],
    [0, '0'],
    [-grenze, `-${Math.round(grenze)} h`],
  ]) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', randL - 8);
    t.setAttribute('y', y(wert) + 4);
    t.setAttribute('text-anchor', 'end');
    t.setAttribute('class', 'viz-tick');
    t.textContent = beschriftung;
    svg.appendChild(t);
  }

  const achsentitel = document.createElementNS(NS, 'text');
  achsentitel.setAttribute('x', randL + plotB / 2);
  achsentitel.setAttribute('y', hoehe - 4);
  achsentitel.setAttribute('text-anchor', 'middle');
  achsentitel.setAttribute('class', 'viz-achsentitel');
  achsentitel.textContent = 'oben: Mehrarbeit · unten: unter der Soll-Zeit';
  svg.appendChild(achsentitel);

  const figur = h('figure', { class: 'viz' });
  figur.appendChild(svg);
  return figur;
}

function gesamtXlsx(beitraege, kategorienMinuten, proWoche) {
  const n = beitraege.length;
  const uebersicht = [
    ['Auswertung des Kollegiums'],
    ['Anzahl Beiträge', n],
    ['Erstellt am', deutschesDatum(new Date().toISOString().slice(0, 10))],
    [],
    ['Pseudonym', 'Schulform', 'Umfang (%)', 'Soll (Std.)', 'Ist (Std.)', 'Saldo (Std.)', 'von', 'bis'],
    ...beitraege.map((b) => [
      b.pseudonym,
      b.schulform,
      b.beschaeftigungsumfangProzent,
      b.sollStunden,
      b.istStunden,
      b.saldoStunden,
      deutschesDatum(b.zeitraumVon),
      deutschesDatum(b.zeitraumBis),
    ]),
  ];

  const kategorien = [
    ['Kategorie', 'Stunden im Mittel je Person'],
    ...KATEGORIEN.map((k) => [
      KATEGORIE_MAP[k.id].name,
      Math.round(((kategorienMinuten[k.id] || 0) / 60) * 100) / 100,
    ]),
  ];

  const wochen = [
    ['Woche ab', 'Ist im Mittel (Std.)', 'Soll im Mittel (Std.)'],
    ...proWoche.map((w) => [
      deutschesDatum(w.start),
      Math.round((w.ist / 60) * 100) / 100,
      Math.round((w.soll / 60) * 100) / 100,
    ]),
  ];

  return xlsxBlob([
    { name: 'Beiträge', zeilen: uebersicht, breiten: [16, 24, 12, 12, 12, 12, 12, 12] },
    { name: 'Kategorien', zeilen: kategorien, breiten: [36, 26] },
    { name: 'Wochen', zeilen: wochen, breiten: [14, 22, 22] },
  ]);
}

export { minutenAlsStunden };
