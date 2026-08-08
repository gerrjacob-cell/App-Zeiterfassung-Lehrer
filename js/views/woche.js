/**
 * Wochenansicht. Zwei Dinge: der Überblick über Soll und Ist der Woche und -
 * praktisch wichtiger – das schnelle Nachtragen. Realistisch stoppt niemand
 * jede Korrekturstunde mit; die Matrix erlaubt es, eine ganze Woche in einer
 * Minute nachzupflegen.
 */

import { h, toast } from '../ui.js';
import * as store from '../store.js';
import { KATEGORIEN, leererEintrag } from '../model.js';
import { minutenAlsStunden, parseDauer } from '../soll.js';
import { WOCHENTAGE_KURZ, ausIso, iso, plusTage, wochenstart, kalenderwoche } from '../kalender-sh.js';
import { deutschesDatum } from '../export.js';
import { saldoKennzahl } from './heute.js';

export function wocheView(ctx) {
  const start = wochenstart(ctx.datum);
  const tage = Array.from({ length: 7 }, (_, i) => iso(plusTage(ausIso(start), i)));
  const heute = iso(new Date());
  const stand = store.get();

  const wurzel = h('div');

  /* --------------------------- Navigation ---------------------------- */

  wurzel.appendChild(
    h('div', { class: 'datumsleiste' }, [
      h('button', {
        class: 'btn',
        'aria-label': 'Vorherige Woche',
        text: '‹',
        onclick: () => ctx.setDatum(iso(plusTage(ausIso(start), -7))),
      }),
      h('div', { class: 'mitte' }, [
        h('strong', { text: `KW ${kalenderwoche(start)}` }),
        h('span', { text: `${deutschesDatum(start)} bis ${deutschesDatum(tage[6])}` }),
      ]),
      h('button', {
        class: 'btn',
        'aria-label': 'Nächste Woche',
        text: '›',
        onclick: () => ctx.setDatum(iso(plusTage(ausIso(start), 7))),
      }),
      wochenstart(heute) !== start
        ? h('button', { class: 'btn klein', text: 'Diese Woche', onclick: () => ctx.setDatum(heute) })
        : null,
    ]),
  );

  /* ---------------------------- Kennzahlen --------------------------- */

  let sollWoche = 0;
  let istWoche = 0;
  const tagesDaten = tage.map((d) => {
    const info = ctx.kalender.tage.get(d);
    const soll = info ? info.sollMinuten : 0;
    const ist = store.eintraegeFuerTag(d).reduce((s, e) => s + (Number(e.minuten) || 0), 0);
    sollWoche += soll;
    istWoche += ist;
    return { datum: d, info, soll, ist };
  });

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('dl', { class: 'kennzahlen' }, [
        h('div', { class: 'kennzahl' }, [
          h('dt', { text: 'Soll der Woche' }),
          h('dd', { text: minutenAlsStunden(sollWoche) }),
        ]),
        h('div', { class: 'kennzahl' }, [
          h('dt', { text: 'Erfasst' }),
          h('dd', { text: minutenAlsStunden(istWoche) }),
        ]),
        saldoKennzahl(istWoche - sollWoche, sollWoche),
      ]),
    ]),
  );

  /* ------------------------- Tagesübersicht ------------------------- */

  const uebersicht = h('table');
  uebersicht.append(
    h('thead', {}, [
      h('tr', {}, [
        h('th', { text: 'Tag' }),
        h('th', { text: 'Art' }),
        h('th', { class: 'zahl', text: 'Soll' }),
        h('th', { class: 'zahl', text: 'Ist' }),
        h('th', { class: 'zahl', text: 'Saldo' }),
      ]),
    ]),
    h(
      'tbody',
      {},
      tagesDaten.map((t) => {
        const saldo = t.ist - t.soll;
        const zeile = h('tr', { class: t.soll === 0 ? 'tag-frei' : '' }, [
          h('th', { scope: 'row' }, [
            h('button', {
              class: 'btn klein',
              text: `${WOCHENTAGE_KURZ[ausIso(t.datum).getDay()]} ${deutschesDatum(t.datum).slice(0, 6)}`,
              title: 'Diesen Tag öffnen',
              onclick: () => {
                ctx.setDatum(t.datum);
                ctx.setAnsicht('heute');
              },
            }),
          ]),
          h('td', { text: artText(t.info) }),
          h('td', { class: 'zahl', text: t.soll ? minutenAlsStunden(t.soll) : '-' }),
          h('td', { class: 'zahl', text: t.ist ? minutenAlsStunden(t.ist) : '-' }),
          h('td', {
            class: `zahl ${saldo > 0 ? 'saldo-plus' : saldo < 0 ? 'saldo-minus' : ''}`,
            text: t.soll || t.ist ? minutenAlsStunden(saldo, true) : '-',
          }),
        ]);
        return zeile;
      }),
    ),
  );

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Die Woche im Überblick' }),
      h('div', { class: 'tabelle-wrap' }, [uebersicht]),
    ]),
  );

  /* ----------------------------- Matrix ------------------------------ */

  const matrix = h('table', { class: 'matrix' });
  matrix.appendChild(
    h('thead', {}, [
      h('tr', {}, [
        h('th', { class: 'kat', text: 'Kategorie' }),
        ...tage.map((d) =>
          h('th', {
            class: `zahl ${d === heute ? 'heute' : ''}`,
            text: `${WOCHENTAGE_KURZ[ausIso(d).getDay()]} ${Number(d.slice(8, 10))}.`,
          }),
        ),
        h('th', { class: 'zahl', text: 'Summe' }),
      ]),
    ]),
  );

  const koerper = h('tbody');
  for (const kategorie of KATEGORIEN) {
    const zeile = h('tr', {}, [h('th', { class: 'kat', scope: 'row', text: kategorie.name })]);
    let summe = 0;
    for (const datum of tage) {
      const zellenEintraege = stand.eintraege.filter(
        (e) => e.datum === datum && e.kategorieId === kategorie.id,
      );
      const minuten = zellenEintraege.reduce((s, e) => s + (Number(e.minuten) || 0), 0);
      summe += minuten;
      const bearbeitbar = zelleBearbeitbar(zellenEintraege);

      const feld = h('input', {
        type: 'text',
        inputmode: 'text',
        value: minuten ? minutenAlsStunden(minuten).replace(' h', '') : '',
        placeholder: '',
        disabled: !bearbeitbar,
        title: bearbeitbar
          ? `${kategorie.name} am ${deutschesDatum(datum)} – Eingabe z. B. 1:30, 90 oder 1,5`
          : 'Mehrere oder detaillierte Einträge – bitte in der Tagesansicht bearbeiten.',
        'aria-label': `${kategorie.name}, ${deutschesDatum(datum)}`,
        onchange: (ereignis) => {
          const neu = parseDauer(ereignis.target.value);
          matrixSpeichern(datum, kategorie.id, neu, zellenEintraege);
          ctx.neuZeichnen();
        },
      });
      zeile.appendChild(h('td', { class: datum === heute ? 'heute' : '' }, [feld]));
    }
    zeile.appendChild(h('td', { class: 'zahl', text: summe ? minutenAlsStunden(summe) : '-' }));
    koerper.appendChild(zeile);
  }

  const summenZeile = h('tr', {}, [h('th', { class: 'kat', scope: 'row', text: 'Summe' })]);
  for (const t of tagesDaten) {
    summenZeile.appendChild(h('td', { class: 'zahl', text: t.ist ? minutenAlsStunden(t.ist) : '-' }));
  }
  summenZeile.appendChild(h('td', { class: 'zahl', text: minutenAlsStunden(istWoche) }));
  koerper.appendChild(summenZeile);

  matrix.appendChild(koerper);

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Woche nachtragen' }),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Dauer als 1:30, 90 oder 1,5 eintragen. Leeres Feld löscht den Wert. Zellen mit mehreren ' +
          'oder mit per Timer erfassten Einträgen sind gesperrt und werden in der Tagesansicht bearbeitet.',
      }),
      h('div', { class: 'tabelle-wrap' }, [matrix]),
    ]),
  );

  return wurzel;
}

/**
 * Eine Zelle ist nur dann direkt bearbeitbar, wenn dabei nichts verloren gehen
 * kann: kein Eintrag, oder genau ein schlichter, manuell erfasster Eintrag ohne
 * Notiz und ohne Uhrzeiten.
 */
function zelleBearbeitbar(eintraege) {
  if (eintraege.length === 0) return true;
  if (eintraege.length > 1) return false;
  const e = eintraege[0];
  return !e.notiz && !e.beginn && !e.ende && e.quelle === 'manuell';
}

function matrixSpeichern(datum, kategorieId, minuten, vorhandene) {
  if (vorhandene.length === 0) {
    if (minuten > 0) {
      store.eintragHinzufuegen({ ...leererEintrag(datum, kategorieId), minuten });
      toast(`${minutenAlsStunden(minuten)} nachgetragen.`);
    }
    return;
  }
  const e = vorhandene[0];
  if (minuten > 0) store.eintragAendern(e.id, { minuten });
  else store.eintragLoeschen(e.id);
}

function artText(info) {
  if (!info) return '-';
  if (info.feiertag) return info.feiertag;
  if (info.wochenende) return 'Wochenende';
  if (info.typ === 'urlaub') return 'Erholungsurlaub';
  if (info.typ === 'krank') return 'krank';
  if (info.typ === 'frei') return 'dienstfrei';
  return info.ferien ? 'unterrichtsfrei' : 'Schultag';
}
