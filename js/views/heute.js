/**
 * Tagesansicht: Timer, Ein-Klick-Übernahme des Stundenplans, Schnellerfassung
 * und die Liste der Einträge des Tages.
 */

import { h, toast, bestaetigen, dialogOeffnen } from '../ui.js';
import * as store from '../store.js';
import {
  KATEGORIEN,
  KATEGORIE_MAP,
  TAGESTYPEN,
  ERMAESSIGUNG_ARTEN,
  leererEintrag,
} from '../model.js';
import { minutenAlsStunden, parseDauer } from '../soll.js';
import { WOCHENTAGE, ausIso, iso, plusTage } from '../kalender-sh.js';
import { deutschesDatum } from '../export.js';
import { unterrichtsminutenFuerTag, stundenFuerWochentag } from './stundenplan.js';

const SCHNELLWERTE = [15, 30, 45, 60, 90];

export function heuteView(ctx) {
  const datum = ctx.datum;
  const stand = store.get();
  const einst = stand.einstellungen;
  const tagInfo = ctx.kalender.tage.get(datum);
  const eintraege = store.eintraegeFuerTag(datum);
  const ist = eintraege.reduce((s, e) => s + (Number(e.minuten) || 0), 0);
  const soll = tagInfo ? tagInfo.sollMinuten : 0;

  const wurzel = h('div');
  wurzel.appendChild(datumsleiste(ctx));

  if (!tagInfo) {
    wurzel.appendChild(
      h('div', {
        class: 'hinweis warnung',
        html:
          `Dieses Datum liegt außerhalb des eingestellten Schuljahres ` +
          `<strong>${einst.schuljahr}</strong>. Das Schuljahr kann in den Einstellungen gewechselt werden.`,
      }),
    );
    return wurzel;
  }

  /* -------------------------- Tagesbilanz -------------------------- */

  const saldo = ist - soll;
  const bilanz = h('div', { class: 'karte' }, [
    h('dl', { class: 'kennzahlen' }, [
      kennzahl('Soll heute', soll > 0 ? minutenAlsStunden(soll) : '-', tagesartText(tagInfo)),
      kennzahl('Erfasst', minutenAlsStunden(ist), `${eintraege.length} Eintr${eintraege.length === 1 ? 'ag' : 'äge'}`),
      saldoKennzahl(saldo, soll),
    ]),
  ]);
  wurzel.appendChild(bilanz);

  /* ----------------------------- Timer ----------------------------- */

  wurzel.appendChild(timerKarte(ctx));

  /* --------------------- Stundenplan übernehmen -------------------- */

  const planStunden = stundenFuerWochentag(stand.stundenplan, ausIso(datum).getDay());
  const bereitsUebernommen = eintraege.some((e) => e.quelle === 'stundenplan');
  if (planStunden.length && !tagInfo.wochenende) {
    const minuten = unterrichtsminutenFuerTag(stand.stundenplan, ausIso(datum).getDay(), einst);
    wurzel.appendChild(
      h('div', { class: 'karte' }, [
        h('h2', { text: 'Unterricht laut Stundenplan' }),
        h('p', {
          class: 'feld-hinweis',
          text:
            `${planStunden.length} Unterrichtsstunden (${minutenAlsStunden(minuten)}): ` +
            planStunden.map((s) => s.fach || `${s.nr}. Stunde`).join(', '),
        }),
        bereitsUebernommen
          ? h('p', { class: 'feld-hinweis', text: 'Für heute bereits übernommen.' })
          : h('div', { class: 'btn-reihe' }, [
              h('button', {
                class: 'btn primaer',
                text: `Mit einem Klick übernehmen (${minutenAlsStunden(minuten)})`,
                onclick: () => {
                  store.eintragHinzufuegen({
                    ...leererEintrag(datum, 'unterricht'),
                    minuten,
                    notiz: `Unterricht laut Stundenplan: ${planStunden
                      .map((s) => s.fach || `${s.nr}.`)
                      .join(', ')}`,
                    quelle: 'stundenplan',
                  });
                  toast('Unterricht übernommen. Vor- und Nachbereitung bitte zusätzlich erfassen.');
                  ctx.neuZeichnen();
                },
              }),
              h('button', {
                class: 'btn',
                text: 'Abweichend erfassen',
                onclick: () => eintragDialog(ctx, { datum, kategorieId: 'unterricht', minuten }),
              }),
            ]),
      ]),
    );
  }

  /* ------------------------ Schnellerfassung ------------------------ */

  const schnell = h('div', { class: 'karte' }, [
    h('h2', { text: 'Schnell erfassen' }),
    h('p', {
      class: 'feld-hinweis',
      text: 'Kategorie wählen, dann Dauer antippen. Für Details oder eine Notiz den Knopf "Genau erfassen" nutzen.',
    }),
  ]);

  let gewaehlteKategorie = ctx.letzteKategorie || 'vorbereitung';
  const chips = h('div', { class: 'chip-reihe', role: 'group', 'aria-label': 'Kategorie' });
  const werte = h('div', { class: 'btn-reihe', style: 'margin-top:0.75rem' });

  function chipsZeichnen() {
    chips.replaceChildren(
      ...KATEGORIEN.map((k) =>
        h('button', {
          class: 'chip',
          type: 'button',
          'aria-pressed': String(k.id === gewaehlteKategorie),
          title: k.beschreibung,
          text: k.kurz,
          onclick: () => {
            gewaehlteKategorie = k.id;
            ctx.letzteKategorie = k.id;
            chipsZeichnen();
          },
        }),
      ),
    );
  }
  chipsZeichnen();

  werte.append(
    ...SCHNELLWERTE.map((m) =>
      h('button', {
        class: 'btn klein',
        type: 'button',
        text: `+ ${m < 60 ? `${m} min` : minutenAlsStunden(m)}`,
        onclick: () => {
          store.eintragHinzufuegen({ ...leererEintrag(datum, gewaehlteKategorie), minuten: m });
          toast(`${KATEGORIE_MAP[gewaehlteKategorie].name}: ${minutenAlsStunden(m)} erfasst.`);
          ctx.neuZeichnen();
        },
      }),
    ),
    h('button', {
      class: 'btn klein',
      type: 'button',
      text: 'Genau erfassen',
      onclick: () => eintragDialog(ctx, { datum, kategorieId: gewaehlteKategorie }),
    }),
  );

  schnell.append(chips, werte);
  wurzel.appendChild(schnell);

  /* ------------------------- Liste der Einträge -------------------- */

  const liste = h('div', { class: 'karte' }, [h('h2', { text: 'Einträge des Tages' })]);
  if (!eintraege.length) {
    liste.appendChild(h('p', { class: 'leer', text: 'Noch nichts erfasst.' }));
  } else {
    liste.appendChild(
      h(
        'ul',
        { class: 'eintraege' },
        eintraege.map((e) =>
          h('li', { class: 'eintrag' }, [
            h('div', {}, [
              h('div', { class: 'eintrag-titel', text: KATEGORIE_MAP[e.kategorieId]?.name || e.kategorieId }),
              h('div', {
                class: 'eintrag-meta',
                text:
                  [e.beginn && e.ende ? `${e.beginn}-${e.ende}` : null, e.notiz]
                    .filter(Boolean)
                    .join(' · ') || quellenText(e.quelle),
              }),
            ]),
            h('div', { class: 'eintrag-dauer', text: minutenAlsStunden(e.minuten) }),
            h('div', { class: 'btn-reihe' }, [
              h('button', {
                class: 'btn klein',
                text: 'Bearbeiten',
                'aria-label': `Eintrag bearbeiten: ${KATEGORIE_MAP[e.kategorieId]?.name}`,
                onclick: () => eintragDialog(ctx, e),
              }),
              h('button', {
                class: 'btn klein gefahr',
                text: 'Löschen',
                'aria-label': `Eintrag löschen: ${KATEGORIE_MAP[e.kategorieId]?.name}`,
                onclick: async () => {
                  if (await bestaetigen('Eintrag löschen', 'Diesen Eintrag wirklich löschen?', 'Löschen', true)) {
                    store.eintragLoeschen(e.id);
                    ctx.neuZeichnen();
                  }
                },
              }),
            ]),
          ]),
        ),
      ),
    );
  }
  wurzel.appendChild(liste);

  /* --------------------------- Tagesart ---------------------------- */

  if (!tagInfo.wochenende && !tagInfo.feiertag) {
    const aktuell = stand.tagesTypen[datum] || 'normal';
    wurzel.appendChild(
      h('div', { class: 'karte' }, [
        h('h2', { text: 'Tagesart' }),
        h('p', {
          class: 'feld-hinweis',
          text:
            'Urlaub und Krankheit setzen die Soll-Arbeitszeit dieses Tages auf null. ' +
            'Ferientage sind kein Urlaub – sie sind reguläre Arbeitstage, solange kein Urlaub eingetragen ist.',
        }),
        h(
          'div',
          { class: 'chip-reihe' },
          Object.values(TAGESTYPEN).map((t) =>
            h('button', {
              class: 'chip',
              type: 'button',
              'aria-pressed': String(t.id === aktuell),
              text: t.name,
              onclick: () => {
                store.tagestypSetzen(datum, t.id);
                ctx.neuZeichnen();
              },
            }),
          ),
        ),
      ]),
    );
  }

  return wurzel;
}

/* ------------------------------ Bausteine -------------------------------- */

function kennzahl(titel, wert, zusatz, klasse = '') {
  return h('div', { class: `kennzahl ${klasse}` }, [
    h('dt', { text: titel }),
    h('dd', {}, [document.createTextNode(wert), zusatz ? h('span', { class: 'zusatz', text: zusatz }) : null]),
  ]);
}

export function saldoKennzahl(saldo, soll) {
  if (soll === 0 && saldo === 0) return kennzahl('Saldo', '-', 'kein Soll an diesem Tag');
  const mehr = saldo > 0;
  // Vorzeichen und Beschriftung tragen die Aussage – nicht die Farbe allein.
  return kennzahl(
    'Saldo',
    minutenAlsStunden(saldo, true),
    mehr ? 'über der Soll-Zeit' : saldo < 0 ? 'unter der Soll-Zeit' : 'genau im Soll',
    mehr ? 'mehrarbeit' : saldo < 0 ? 'minderarbeit' : '',
  );
}

function tagesartText(tagInfo) {
  if (tagInfo.feiertag) return tagInfo.feiertag;
  if (tagInfo.typ === 'urlaub') return 'Erholungsurlaub';
  if (tagInfo.typ === 'krank') return 'krank';
  if (tagInfo.typ === 'frei') return tagInfo.wochenende ? 'Wochenende' : 'dienstfrei';
  return tagInfo.ferien ? 'unterrichtsfreie Zeit' : 'Schultag';
}

function quellenText(quelle) {
  return quelle === 'timer' ? 'per Timer' : quelle === 'stundenplan' ? 'aus dem Stundenplan' : 'nachgetragen';
}

function datumsleiste(ctx) {
  const d = ausIso(ctx.datum);
  const heute = iso(new Date());
  return h('div', { class: 'datumsleiste' }, [
    h('button', {
      class: 'btn',
      'aria-label': 'Vorheriger Tag',
      text: '‹',
      onclick: () => ctx.setDatum(iso(plusTage(d, -1))),
    }),
    h('div', { class: 'mitte' }, [
      h('strong', { text: `${WOCHENTAGE[d.getDay()]}, ${deutschesDatum(ctx.datum)}` }),
      h('span', { text: ctx.datum === heute ? 'heute' : '' }),
    ]),
    h('button', {
      class: 'btn',
      'aria-label': 'Nächster Tag',
      text: '›',
      onclick: () => ctx.setDatum(iso(plusTage(d, 1))),
    }),
    ctx.datum !== heute
      ? h('button', { class: 'btn klein', text: 'Heute', onclick: () => ctx.setDatum(heute) })
      : null,
  ]);
}

/* -------------------------------- Timer ---------------------------------- */

function timerKarte(ctx) {
  const stand = store.get();
  const timer = stand.laufenderTimer;
  const karte = h('div', { class: 'karte' }, [h('h2', { text: 'Timer' })]);

  if (timer) {
    const uhr = h('div', { class: 'timer-uhr', 'aria-live': 'off', text: '00:00:00' });
    const aktualisieren = () => {
      const sek = Math.max(0, Math.floor((Date.now() - new Date(timer.start).getTime()) / 1000));
      const hh = String(Math.floor(sek / 3600)).padStart(2, '0');
      const mm = String(Math.floor((sek % 3600) / 60)).padStart(2, '0');
      const ss = String(sek % 60).padStart(2, '0');
      uhr.textContent = `${hh}:${mm}:${ss}`;
    };
    aktualisieren();
    ctx.registriereTick(aktualisieren);

    karte.appendChild(
      h('div', { class: 'timer' }, [
        uhr,
        h('div', { class: 'timer-info' }, [
          h('strong', { text: KATEGORIE_MAP[timer.kategorieId]?.name || timer.kategorieId }),
          h('br'),
          document.createTextNode(`gestartet um ${new Date(timer.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`),
        ]),
        h('button', {
          class: 'btn primaer',
          text: 'Stoppen und speichern',
          onclick: () => timerStoppen(ctx),
        }),
        h('button', {
          class: 'btn gefahr klein',
          text: 'Verwerfen',
          onclick: async () => {
            if (await bestaetigen('Timer verwerfen', 'Die laufende Messung wird nicht gespeichert.', 'Verwerfen', true)) {
              store.aendern((s) => {
                s.laufenderTimer = null;
              });
              ctx.neuZeichnen();
            }
          },
        }),
      ]),
    );
    return karte;
  }

  const auswahl = h(
    'select',
    { 'aria-label': 'Kategorie für den Timer' },
    KATEGORIEN.map((k) => h('option', { value: k.id, text: k.name })),
  );
  auswahl.value = ctx.letzteKategorie || 'vorbereitung';

  karte.appendChild(
    h('div', { class: 'timer' }, [
      h('div', { style: 'flex:1;min-width:200px' }, [auswahl]),
      h('button', {
        class: 'btn primaer',
        text: 'Timer starten',
        onclick: () => {
          ctx.letzteKategorie = auswahl.value;
          store.aendern((s) => {
            s.laufenderTimer = { kategorieId: auswahl.value, start: new Date().toISOString() };
          });
          ctx.neuZeichnen();
        },
      }),
    ]),
  );
  karte.appendChild(
    h('p', {
      class: 'feld-hinweis',
      text:
        'Der Timer läuft weiter, auch wenn die App geschlossen wird. Wer lieber am Abend nachträgt, ' +
        'nutzt die Schnellerfassung oder die Wochenansicht.',
    }),
  );
  return karte;
}

function timerStoppen(ctx) {
  const timer = store.get().laufenderTimer;
  if (!timer) return;
  const start = new Date(timer.start);
  const ende = new Date();
  const minuten = Math.max(1, Math.round((ende - start) / 60000));
  const datum = iso(start);
  store.aendern((s) => {
    s.laufenderTimer = null;
  });
  store.eintragHinzufuegen({
    ...leererEintrag(datum, timer.kategorieId),
    minuten,
    beginn: start.toTimeString().slice(0, 5),
    ende: ende.toTimeString().slice(0, 5),
    quelle: 'timer',
  });
  toast(`${minutenAlsStunden(minuten)} erfasst.`);
  ctx.neuZeichnen();
}

/* ---------------------------- Eintrags-Dialog ---------------------------- */

export function eintragDialog(ctx, vorlage) {
  const istNeu = !vorlage.id;
  dialogOeffnen((dialog, schliessen) => {
    const kategorie = h(
      'select',
      { id: 'd-kategorie' },
      KATEGORIEN.map((k) => h('option', { value: k.id, text: k.name })),
    );
    kategorie.value = vorlage.kategorieId || 'vorbereitung';

    const datum = h('input', { type: 'date', id: 'd-datum', value: vorlage.datum || ctx.datum });
    const dauer = h('input', {
      type: 'text',
      id: 'd-dauer',
      inputmode: 'text',
      placeholder: 'z. B. 1:30, 90 oder 1,5',
      value: vorlage.minuten ? minutenAlsStunden(vorlage.minuten).replace(' h', '') : '',
    });
    const beginn = h('input', { type: 'time', id: 'd-beginn', value: vorlage.beginn || '' });
    const ende = h('input', { type: 'time', id: 'd-ende', value: vorlage.ende || '' });
    const notiz = h('input', {
      type: 'text',
      id: 'd-notiz',
      maxlength: '160',
      placeholder: 'optional, z. B. Klassenarbeit 8b',
      value: vorlage.notiz || '',
    });

    // Zuordnung zu einer Funktionsaufgabe mit Anrechnungsstunden. Nur sichtbar,
    // wenn es überhaupt solche Aufgaben gibt - sonst wäre es ein leeres Feld,
    // das niemand versteht.
    const einstellungen = store.get().einstellungen;
    const aufgaben = (einstellungen.ermaessigungen || []).filter(
      (a) => ERMAESSIGUNG_ARTEN[a.art]?.aufgabenbezogen,
    );
    const aufgabe = aufgaben.length
      ? h(
          'select',
          { id: 'd-aufgabe' },
          [
            h('option', { value: '', text: '– keine –' }),
            ...aufgaben.map((a) =>
              h('option', { value: a.id, text: `${a.bezeichnung} (${a.stunden} Std.)` }),
            ),
          ],
        )
      : null;
    if (aufgabe) aufgabe.value = vorlage.aufgabeId || '';

    // Aus Beginn und Ende die Dauer ableiten, sobald beides gesetzt ist.
    const dauerAusZeit = () => {
      if (!beginn.value || !ende.value) return;
      const [bh, bm] = beginn.value.split(':').map(Number);
      const [eh, em] = ende.value.split(':').map(Number);
      let min = eh * 60 + em - (bh * 60 + bm);
      if (min < 0) min += 24 * 60;
      dauer.value = minutenAlsStunden(min).replace(' h', '');
    };
    beginn.addEventListener('change', dauerAusZeit);
    ende.addEventListener('change', dauerAusZeit);

    const fehler = h('p', { class: 'hinweis fehler', hidden: true });

    dialog.append(
      h('h2', { text: istNeu ? 'Zeit erfassen' : 'Eintrag bearbeiten' }),
      fehler,
      h('div', { class: 'feld' }, [h('label', { for: 'd-kategorie', text: 'Kategorie' }), kategorie]),
      h('div', { class: 'feld-reihe' }, [
        h('div', { class: 'feld' }, [h('label', { for: 'd-datum', text: 'Datum' }), datum]),
        h('div', { class: 'feld' }, [h('label', { for: 'd-dauer', text: 'Dauer' }), dauer]),
      ]),
      h('div', { class: 'feld-reihe' }, [
        h('div', { class: 'feld' }, [h('label', { for: 'd-beginn', text: 'Beginn (optional)' }), beginn]),
        h('div', { class: 'feld' }, [h('label', { for: 'd-ende', text: 'Ende (optional)' }), ende]),
      ]),
      h('div', { class: 'feld' }, [h('label', { for: 'd-notiz', text: 'Notiz (optional)' }), notiz]),
      aufgabe
        ? h('div', { class: 'feld' }, [
            h('label', { for: 'd-aufgabe', text: 'Gehört zu einer Aufgabe mit Anrechnungsstunden?' }),
            aufgabe,
            h('p', {
              class: 'feld-hinweis',
              text:
                'Wird zugeordnet, vergleicht die Auswertung den tatsächlichen Aufwand mit der ' +
                'gewährten Entlastung.',
            }),
          ])
        : null,
      h('p', {
        class: 'feld-hinweis',
        text: 'Notizen bleiben auf diesem Gerät. In den anonymen Kollegiums-Export gehen sie nie ein.',
      }),
      h('div', { class: 'btn-reihe', style: 'justify-content:flex-end;margin-top:1rem' }, [
        h('button', { class: 'btn', text: 'Abbrechen', onclick: schliessen }),
        h('button', {
          class: 'btn primaer',
          text: 'Speichern',
          onclick: () => {
            const minuten = parseDauer(dauer.value);
            if (minuten <= 0) {
              fehler.hidden = false;
              fehler.textContent = 'Bitte eine Dauer angeben, zum Beispiel 1:30, 90 oder 1,5.';
              dauer.focus();
              return;
            }
            const daten = {
              datum: datum.value,
              kategorieId: kategorie.value,
              minuten,
              beginn: beginn.value || null,
              ende: ende.value || null,
              notiz: notiz.value.trim(),
              aufgabeId: aufgabe && aufgabe.value ? aufgabe.value : null,
            };
            if (istNeu) store.eintragHinzufuegen({ ...leererEintrag(daten.datum, daten.kategorieId), ...daten });
            else store.eintragAendern(vorlage.id, daten);
            schliessen();
            toast(istNeu ? 'Eintrag gespeichert.' : 'Eintrag aktualisiert.');
            ctx.neuZeichnen();
          },
        }),
      ]),
    );
  });
}
