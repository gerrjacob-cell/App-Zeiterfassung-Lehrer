/**
 * Auswertung: Kennzahlen, Diagramme und alle Exporte.
 *
 * Der anonyme Kollegiums-Export ist bewusst ein eigener, ausdrücklicher
 * Schritt. Er enthält keine Namen, keine Notizen und keine Tagesdaten, und er
 * verlässt das Gerät nur, wenn die Lehrkraft die Datei selbst weitergibt.
 */

import { h, toast, bestaetigen } from '../ui.js';
import * as store from '../store.js';
import { KATEGORIEN, KATEGORIE_MAP, schuljahrZeitraum, beschaeftigungsfaktor } from '../model.js';
import { auswerten, minutenAlsStunden, jahresKennzahlen } from '../soll.js';
import { kategorienDiagramm, wochenDiagramm, sollFortschritt } from '../charts.js';
import {
  arbeitszeitXlsx,
  arbeitszeitCsv,
  anonymeKennzahlen,
  herunterladen,
  dateinameStempel,
  deutschesDatum,
} from '../export.js';
import { iso, ausIso, plusTage, wochenstart } from '../kalender-sh.js';

export function auswertungView(ctx) {
  const stand = store.get();
  const einst = stand.einstellungen;
  const sj = schuljahrZeitraum(einst.schuljahr);
  const heute = iso(new Date());

  const zeitraum = ctx.zeitraum || vorgabeZeitraum(einst, heute);
  const von = klemmen(zeitraum.von, sj.von, sj.bis);
  const bis = klemmen(zeitraum.bis, sj.von, sj.bis);
  const ergebnis = auswerten(ctx.kalender, stand.eintraege, von, bis);

  const wurzel = h('div');

  /* --------------------------- Zeitraumwahl -------------------------- */

  const vorgaben = [
    { id: 'woche', name: 'Diese Woche', ...wochenBereich(heute) },
    { id: 'monat', name: 'Dieser Monat', ...monatsBereich(heute) },
    { id: 'bisher', name: 'Schuljahr bis heute', von: sj.von, bis: heute < sj.bis ? heute : sj.bis },
    { id: 'jahr', name: 'Ganzes Schuljahr', von: sj.von, bis: sj.bis },
  ];

  const vonFeld = h('input', {
    type: 'date',
    id: 'z-von',
    value: von,
    min: sj.von,
    max: sj.bis,
    onchange: (e) => ctx.setZeitraum({ id: 'eigen', von: e.target.value, bis }),
  });
  const bisFeld = h('input', {
    type: 'date',
    id: 'z-bis',
    value: bis,
    min: sj.von,
    max: sj.bis,
    onchange: (e) => ctx.setZeitraum({ id: 'eigen', von, bis: e.target.value }),
  });

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Zeitraum' }),
      h(
        'div',
        { class: 'chip-reihe' },
        vorgaben.map((v) =>
          h('button', {
            class: 'chip',
            type: 'button',
            'aria-pressed': String(zeitraum.id === v.id),
            text: v.name,
            onclick: () => ctx.setZeitraum({ id: v.id, von: v.von, bis: v.bis }),
          }),
        ),
      ),
      h('div', { class: 'feld-reihe', style: 'margin-top:0.85rem' }, [
        h('div', { class: 'feld' }, [h('label', { for: 'z-von', text: 'von' }), vonFeld]),
        h('div', { class: 'feld' }, [h('label', { for: 'z-bis', text: 'bis' }), bisFeld]),
      ]),
    ]),
  );

  /* ---------------------------- Kennzahlen --------------------------- */

  const saldo = ergebnis.saldoMinuten;
  const kennzahlenKarte = h('div', { class: 'karte' }, [
    h('h2', { text: `${deutschesDatum(von)} bis ${deutschesDatum(bis)}` }),
    h('dl', { class: 'kennzahlen' }, [
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Soll-Arbeitszeit' }),
        h('dd', {}, [
          document.createTextNode(minutenAlsStunden(ergebnis.sollMinuten)),
          h('span', { class: 'zusatz', text: `${ergebnis.arbeitstage} Arbeitstage` }),
        ]),
      ]),
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Tatsächlich geleistet' }),
        h('dd', {}, [
          document.createTextNode(minutenAlsStunden(ergebnis.istMinuten)),
          h('span', { class: 'zusatz', text: `an ${ergebnis.tageMitErfassung} Tagen erfasst` }),
        ]),
      ]),
      h('div', { class: `kennzahl ${saldo > 0 ? 'mehrarbeit' : saldo < 0 ? 'minderarbeit' : ''}` }, [
        h('dt', { text: saldo > 0 ? 'Mehrarbeit' : 'Saldo' }),
        h('dd', {}, [
          document.createTextNode(minutenAlsStunden(saldo, true)),
          h('span', {
            class: 'zusatz',
            text:
              saldo > 0
                ? 'über der Soll-Arbeitszeit'
                : saldo < 0
                  ? 'unter der Soll-Arbeitszeit'
                  : 'genau im Soll',
          }),
        ]),
      ]),
    ]),
    sollFortschritt(ergebnis.istMinuten, ergebnis.sollMinuten),
  ]);

  if (ergebnis.tageMitErfassung < ergebnis.arbeitstage && ergebnis.arbeitstage > 0) {
    const luecken = ergebnis.arbeitstage - ergebnis.tageMitErfassung;
    kennzahlenKarte.appendChild(
      h('p', {
        class: 'feld-hinweis',
        text:
          `An ${luecken} von ${ergebnis.arbeitstage} Arbeitstagen ist nichts erfasst. ` +
          'Solange dort Lücken sind, ist der Saldo eher zu niedrig als zu hoch.',
      }),
    );
  }
  wurzel.appendChild(kennzahlenKarte);

  // Ohne eingetragenen Erholungsurlaub steht auch in den Ferien volle Soll-Zeit
  // im Kalender. Das ist rechnerisch korrekt, aber selten gewollt - und würde
  // den Saldo unbrauchbar machen.
  const jahrKennzahlen = jahresKennzahlen(ctx.kalender);
  if (jahrKennzahlen.urlaubstage === 0) {
    wurzel.appendChild(
      h('div', { class: 'hinweis warnung' }, [
        h('strong', { text: 'Noch kein Erholungsurlaub eingetragen. ' }),
        document.createTextNode(
          `Dadurch stehen alle ${jahrKennzahlen.arbeitstage} Werktage des Schuljahres als Soll-Zeit ` +
            'im Kalender, auch die Ferienwochen. Unter "Mehr" lassen sich die Urlaubstage mit einem ' +
            'Klick in die Ferien legen - danach stimmt der Saldo.',
        ),
        h('div', { class: 'btn-reihe', style: 'margin-top:0.6rem' }, [
          h('button', {
            class: 'btn klein',
            text: 'Zu den Einstellungen',
            onclick: () => ctx.setAnsicht('einstellungen'),
          }),
        ]),
      ]),
    );
  }

  /* ----------------------------- Diagramme --------------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Wofür die Zeit draufgeht' }),
      kategorienDiagramm(ergebnis),
    ]),
  );

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Wochenverlauf' }),
      h('p', {
        class: 'feld-hinweis',
        text: 'Balken: erfasste Zeit. Gestrichelt: Soll-Arbeitszeit derselben Woche – auch in den Ferien.',
      }),
      wochenDiagramm(ergebnis),
    ]),
  );

  /* ------------------------------ Export ----------------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Exportieren' }),
      h('p', {
        class: 'feld-hinweis',
        text: 'Alle Exporte werden auf diesem Gerät erzeugt. Nichts wird hochgeladen.',
      }),
      h('div', { class: 'btn-reihe' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Excel-Datei (.xlsx)',
          onclick: () => {
            herunterladen(
              arbeitszeitXlsx(einst, ergebnis, stand.eintraege),
              dateinameStempel('Arbeitszeit', einst, ergebnis, 'xlsx'),
            );
            toast('Excel-Datei erzeugt.');
          },
        }),
        h('button', {
          class: 'btn',
          text: 'CSV-Datei',
          onclick: () => {
            herunterladen(
              arbeitszeitCsv(einst, ergebnis, stand.eintraege),
              dateinameStempel('Arbeitszeit', einst, ergebnis, 'csv'),
            );
            toast('CSV-Datei erzeugt.');
          },
        }),
        h('button', {
          class: 'btn',
          text: 'Bericht drucken / als PDF',
          onclick: () => berichtDrucken(einst, ergebnis, ctx),
        }),
      ]),
    ]),
  );

  /* ------------------------- Anonymer Export ------------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Anonym zur Gesamtauswertung beitragen' }),
      h('p', {
        text:
          'Wer möchte, kann eine anonyme Kennzahlen-Datei abgeben. Aus vielen solcher Dateien lässt ' +
          'sich im Auswertungswerkzeug ein Bild des ganzen Kollegiums erzeugen – für Personalrat, ' +
          'Schulkonferenz oder eine gemeinsame Überlastungsanzeige.',
      }),
      h('details', {}, [
        h('summary', { text: 'Was genau steht in dieser Datei?' }),
        h('ul', {}, [
          h('li', { text: 'Beschäftigungsumfang in Prozent, Schulform und Schuljahr' }),
          h('li', { text: 'Summe der Soll- und Ist-Stunden sowie der Saldo' }),
          h('li', { text: 'Summen je Kategorie und Summen je Kalenderwoche' }),
          h('li', { text: 'ein bei jedem Export neu gewürfeltes Pseudonym' }),
        ]),
        h('p', {
          class: 'feld-hinweis',
          text:
            'Nicht enthalten: Name, Fächer, Klassen, Notizen, einzelne Einträge und einzelne Tage. ' +
            'Bitte beachten: Bei sehr kleinen Gruppen kann schon der Beschäftigungsumfang Rückschlüsse ' +
            'zulassen. Die Gesamtauswertung sollte deshalb erst ab etwa fünf Beiträgen gezeigt werden.',
        }),
      ]),
      h('div', { class: 'btn-reihe', style: 'margin-top:0.75rem' }, [
        h('button', {
          class: 'btn',
          text: 'Anonyme Kennzahlen exportieren',
          onclick: async () => {
            const ok = await bestaetigen(
              'Anonyme Kennzahlen exportieren',
              'Es wird eine Datei ohne Namen und ohne Notizen erzeugt. Du entscheidest selbst, ' +
                'ob und an wen du sie weitergibst.',
              'Datei erzeugen',
            );
            if (!ok) return;
            const daten = anonymeKennzahlen(einst, ergebnis);
            herunterladen(
              JSON.stringify(daten, null, 2),
              `anonym_${daten.pseudonym}_${von}_bis_${bis}.json`,
            );
            toast('Anonyme Datei erzeugt.');
          },
        }),
        h('a', {
          class: 'btn',
          href: 'auswertung.html',
          target: '_blank',
          rel: 'noopener',
          text: 'Auswertungswerkzeug öffnen',
        }),
      ]),
    ]),
  );

  /* ------------------------- Jahres-Einordnung ----------------------- */

  const jahr = jahrKennzahlen;
  wurzel.appendChild(
    h('div', { class: 'hinweis' }, [
      h('strong', { text: 'Wie das Soll zustande kommt: ' }),
      document.createTextNode(
        `${einst.wochenarbeitszeit} Wochenstunden bei Vollzeit, davon ` +
          `${Math.round(beschaeftigungsfaktor(einst) * 1000) / 10} % Beschäftigungsumfang. Im Schuljahr ` +
          `${einst.schuljahr} ergibt das ${minutenAlsStunden(jahr.sollMinuten)} an ${jahr.arbeitstage} ` +
          `Arbeitstagen – darunter ${jahr.ferienArbeitstage} Tage in der unterrichtsfreien Zeit, denn ` +
          `Ferien sind kein Urlaub. Als Erholungsurlaub sind ${jahr.urlaubstage} Tage hinterlegt.`,
      ),
    ]),
  );

  return wurzel;
}

/* ------------------------------- Hilfen ---------------------------------- */

function klemmen(wert, min, max) {
  if (!wert) return min;
  return wert < min ? min : wert > max ? max : wert;
}

function wochenBereich(datum) {
  const start = wochenstart(datum);
  return { von: start, bis: iso(plusTage(ausIso(start), 6)) };
}

function monatsBereich(datum) {
  const d = ausIso(datum);
  const von = iso(new Date(d.getFullYear(), d.getMonth(), 1, 12));
  const bis = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
  return { von, bis };
}

function vorgabeZeitraum(einst, heute) {
  const sj = schuljahrZeitraum(einst.schuljahr);
  return { id: 'bisher', von: sj.von, bis: heute < sj.bis ? heute : sj.bis };
}

/* ---------------------------- Druck-Bericht ------------------------------ */

/**
 * Baut einen druckfertigen Bericht in ein verstecktes Element und ruft den
 * Druckdialog auf. Über "Als PDF sichern" entsteht daraus eine Datei, die sich
 * einer Überlastungsanzeige beilegen lässt.
 */
function berichtDrucken(einst, ergebnis, ctx) {
  const ziel = document.getElementById('bericht');
  const jahr = jahresKennzahlen(ctx.kalender);
  const kategorienZeilen = KATEGORIEN.map((k) => ({
    name: k.name,
    minuten: ergebnis.proKategorie[k.id] || 0,
  }))
    .filter((k) => k.minuten > 0)
    .sort((a, b) => b.minuten - a.minuten);

  ziel.replaceChildren(
    h('h1', { text: 'Dokumentation der Arbeitszeit' }),
    h('table', {}, [
      h('tbody', {}, [
        zeile('Name', einst.name || '(nicht angegeben)'),
        zeile('Schuljahr', einst.schuljahr),
        zeile('Zeitraum', `${deutschesDatum(ergebnis.von)} bis ${deutschesDatum(ergebnis.bis)}`),
        zeile(
          'Beschäftigungsumfang',
          `${einst.pflichtstundenIst} von ${einst.pflichtstundenSoll} Pflichtstunden ` +
            `(${Math.round(beschaeftigungsfaktor(einst) * 1000) / 10} %)`,
        ),
        zeile('Wöchentliche Arbeitszeit bei Vollzeit', `${einst.wochenarbeitszeit} Stunden`),
        zeile('Erstellt am', deutschesDatum(iso(new Date()))),
      ]),
    ]),

    h('h2', { text: 'Ergebnis' }),
    h('table', {}, [
      h('tbody', {}, [
        zeile('Soll-Arbeitszeit im Zeitraum', minutenAlsStunden(ergebnis.sollMinuten)),
        zeile('Tatsächlich geleistete Arbeitszeit', minutenAlsStunden(ergebnis.istMinuten)),
        zeile('Saldo', minutenAlsStunden(ergebnis.saldoMinuten, true)),
        zeile('Arbeitstage mit Soll-Zeit', String(ergebnis.arbeitstage)),
        zeile('Tage mit Erfassung', String(ergebnis.tageMitErfassung)),
      ]),
    ]),

    h('h2', { text: 'Verteilung auf die Tätigkeiten' }),
    h('table', {}, [
      h('thead', {}, [
        h('tr', {}, [h('th', { text: 'Kategorie' }), h('th', { text: 'Stunden' }), h('th', { text: 'Anteil' })]),
      ]),
      h(
        'tbody',
        {},
        kategorienZeilen.map((k) =>
          h('tr', {}, [
            h('td', { text: k.name }),
            h('td', { text: minutenAlsStunden(k.minuten) }),
            h('td', {
              text:
                ergebnis.istMinuten > 0
                  ? `${((k.minuten / ergebnis.istMinuten) * 100).toFixed(1)} %`
                  : '-',
            }),
          ]),
        ),
      ),
    ]),
    kategorienDiagramm(ergebnis),

    h('h2', { class: 'seitenumbruch', text: 'Wochenverlauf' }),
    wochenDiagramm(ergebnis),

    h('h2', { text: 'Grundlage der Berechnung' }),
    h('p', {
      text:
        `Zugrunde gelegt ist die regelmäßige wöchentliche Arbeitszeit von ${einst.wochenarbeitszeit} ` +
        'Stunden bei Vollzeit, anteilig nach Beschäftigungsumfang. Soll-Arbeitszeit besteht an jedem ' +
        'Werktag, der weder gesetzlicher Feiertag noch Erholungsurlaub noch Krankheitstag ist – auch in ' +
        `der unterrichtsfreien Zeit. Für das Schuljahr ${einst.schuljahr} ergibt das ` +
        `${minutenAlsStunden(jahr.sollMinuten)} an ${jahr.arbeitstage} Arbeitstagen bei ` +
        `${jahr.urlaubstage} Tagen Erholungsurlaub.`,
    }),
    h('p', {
      text:
        'Die Angaben beruhen auf der Selbstaufschreibung der Lehrkraft. Sie wurden fortlaufend erfasst ' +
        'und sind nach Kategorien getrennt nachvollziehbar.',
    }),
    h('p', { style: 'margin-top:2rem', text: 'Ort, Datum, Unterschrift: ______________________________' }),
  );

  window.print();
}

function zeile(bezeichnung, wert) {
  return h('tr', {}, [h('th', { scope: 'row', text: bezeichnung }), h('td', { text: wert })]);
}

export { KATEGORIE_MAP };
