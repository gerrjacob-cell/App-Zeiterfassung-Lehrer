/**
 * Stundenplan. Er dient zwei Zwecken: der Ein-Klick-Übernahme des Unterrichts
 * in der Tagesansicht und einer ehrlichen Gegenrechnung – wie viel der
 * Wochenarbeitszeit ist bereits durch reine Unterrichtszeit belegt, bevor
 * überhaupt vorbereitet, korrigiert oder kommuniziert wurde.
 */

import { h, toast } from '../ui.js';
import * as store from '../store.js';
import { minutenAlsStunden } from '../soll.js';
import { beschaeftigungsfaktor } from '../model.js';

const TAGE = [
  { nr: 1, name: 'Montag', kurz: 'Mo' },
  { nr: 2, name: 'Dienstag', kurz: 'Di' },
  { nr: 3, name: 'Mittwoch', kurz: 'Mi' },
  { nr: 4, name: 'Donnerstag', kurz: 'Do' },
  { nr: 5, name: 'Freitag', kurz: 'Fr' },
];

/** JS-Wochentag (0 = Sonntag) -> belegte Stunden dieses Tages. */
export function stundenFuerWochentag(plan, jsTag) {
  if (!plan || !Array.isArray(plan.stunden)) return [];
  if (jsTag < 1 || jsTag > 5) return [];
  return plan.stunden
    .filter((s) => s.tag === jsTag && (s.fach || '').trim() !== '')
    .sort((a, b) => a.nr - b.nr);
}

export function unterrichtsminutenFuerTag(plan, jsTag, einst) {
  const dauer = Number(einst.unterrichtsstundeMinuten) || 45;
  return stundenFuerWochentag(plan, jsTag).length * dauer;
}

export function wochenUnterrichtsminuten(plan, einst) {
  let summe = 0;
  for (let t = 1; t <= 5; t += 1) summe += unterrichtsminutenFuerTag(plan, t, einst);
  return summe;
}

export function stundenplanView(ctx) {
  const stand = store.get();
  const einst = stand.einstellungen;
  const plan = stand.stundenplan;
  const anzahl = Math.max(6, Math.min(14, Number(plan.stundenProTag) || 10));

  const wurzel = h('div');

  const belegt = wochenUnterrichtsminuten(plan, einst);
  const wochenSoll = (Number(einst.wochenarbeitszeit) || 41) * 60 * beschaeftigungsfaktor(einst);
  const anteil = wochenSoll > 0 ? Math.round((belegt / wochenSoll) * 100) : 0;

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Stundenplan' }),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Fach oder Klasse eintragen – leere Felder gelten als Freistunde. In der Tagesansicht lässt ' +
          'sich der Unterricht des Tages danach mit einem Klick übernehmen.',
      }),
      h('dl', { class: 'kennzahlen' }, [
        h('div', { class: 'kennzahl' }, [
          h('dt', { text: 'Unterricht pro Woche' }),
          h('dd', {}, [
            document.createTextNode(minutenAlsStunden(belegt)),
            h('span', {
              class: 'zusatz',
              text: `${stundenGesamt(plan)} Unterrichtsstunden a ${einst.unterrichtsstundeMinuten} min`,
            }),
          ]),
        ]),
        h('div', { class: 'kennzahl' }, [
          h('dt', { text: 'Anteil an der Wochenarbeitszeit' }),
          h('dd', {}, [
            document.createTextNode(`${anteil} %`),
            h('span', { class: 'zusatz', text: `von ${minutenAlsStunden(wochenSoll)} Soll` }),
          ]),
        ]),
        h('div', { class: 'kennzahl' }, [
          h('dt', { text: 'Rest für alles andere' }),
          h('dd', {}, [
            document.createTextNode(minutenAlsStunden(Math.max(0, wochenSoll - belegt))),
            h('span', { class: 'zusatz', text: 'Vorbereitung, Korrektur, Konferenzen, Eltern' }),
          ]),
        ]),
      ]),
    ]),
  );

  /* ------------------------------ Raster ------------------------------- */

  const tabelle = h('table', { class: 'plan' });
  const thead = h('thead', {}, [
    h('tr', {}, [
      h('th', { class: 'stundennr', text: 'Std.' }),
      ...TAGE.map((t) => h('th', { text: t.name, abbr: t.kurz })),
    ]),
  ]);
  const tbody = h('tbody');

  for (let nr = 1; nr <= anzahl; nr += 1) {
    const zeile = h('tr', {}, [h('th', { class: 'stundennr', scope: 'row', text: `${nr}.` })]);
    for (const tag of TAGE) {
      const vorhanden = plan.stunden.find((s) => s.tag === tag.nr && s.nr === nr);
      const feld = h('input', {
        type: 'text',
        value: vorhanden?.fach || '',
        placeholder: '',
        'aria-label': `${tag.name}, ${nr}. Stunde`,
        maxlength: '16',
        onchange: (ereignis) => {
          const wert = ereignis.target.value.trim();
          store.aendern((s) => {
            const i = s.stundenplan.stunden.findIndex((x) => x.tag === tag.nr && x.nr === nr);
            if (!wert) {
              if (i >= 0) s.stundenplan.stunden.splice(i, 1);
            } else if (i >= 0) {
              s.stundenplan.stunden[i].fach = wert;
            } else {
              s.stundenplan.stunden.push({ tag: tag.nr, nr, fach: wert });
            }
          });
          ctx.neuZeichnen();
        },
      });
      zeile.appendChild(h('td', {}, [feld]));
    }
    tbody.appendChild(zeile);
  }

  tabelle.append(thead, tbody);

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('div', { class: 'tabelle-wrap' }, [tabelle]),
      h('div', { class: 'feld-reihe', style: 'margin-top:1rem' }, [
        h('div', { class: 'feld' }, [
          h('label', { for: 'sp-anzahl', text: 'Stunden pro Tag im Raster' }),
          h('input', {
            id: 'sp-anzahl',
            type: 'number',
            min: '6',
            max: '14',
            value: String(anzahl),
            onchange: (e) => {
              store.aendern((s) => {
                s.stundenplan.stundenProTag = Number(e.target.value) || 10;
              });
              ctx.neuZeichnen();
            },
          }),
        ]),
        h('div', { class: 'feld' }, [
          h('label', { for: 'sp-dauer', text: 'Dauer einer Unterrichtsstunde (Minuten)' }),
          h('input', {
            id: 'sp-dauer',
            type: 'number',
            min: '30',
            max: '120',
            step: '5',
            value: String(einst.unterrichtsstundeMinuten),
            onchange: (e) => {
              store.einstellungenSetzen({ unterrichtsstundeMinuten: Number(e.target.value) || 45 });
              ctx.neuZeichnen();
            },
          }),
        ]),
      ]),
      h('div', { class: 'btn-reihe' }, [
        h('button', {
          class: 'btn gefahr klein',
          text: 'Stundenplan leeren',
          onclick: () => {
            store.aendern((s) => {
              s.stundenplan.stunden = [];
            });
            toast('Stundenplan geleert.');
            ctx.neuZeichnen();
          },
        }),
      ]),
    ]),
  );

  wurzel.appendChild(
    h('div', { class: 'hinweis' }, [
      h('strong', { text: 'Wichtig: ' }),
      document.createTextNode(
        'Die Ein-Klick-Übernahme bucht ausschließlich die reine Unterrichtszeit. Pausenaufsichten, ' +
          'Vor- und Nachbereitung, Korrekturen und Gespräche müssen zusätzlich erfasst werden – ' +
          'sonst zeigt die Dokumentation weniger Arbeitszeit, als tatsächlich geleistet wurde.',
      ),
    ]),
  );

  return wurzel;
}

function stundenGesamt(plan) {
  if (!plan || !Array.isArray(plan.stunden)) return 0;
  return plan.stunden.filter((s) => (s.fach || '').trim() !== '').length;
}
