/**
 * Wiederverwendete Bausteine der Oberfläche: Schülerzeile, Statusabzeichen,
 * Rückmeldeknöpfe, Statistikbalken. Alles, was in mehreren Ansichten gleich
 * aussehen muss, steht hier - damit ein Status überall identisch wirkt.
 */

import { h, toast } from '../ui.js';
import * as store from '../store.js';
import {
  ART,
  BEWERTUNG,
  STATUS,
  datumLang,
  fristText,
  heuteIso,
  name as vollerName,
  tageZwischen,
} from '../model.js';

/* Kurzes Aufblitzen nach einer Rückmeldung - das visuelle Quittieren. */
let markierung = null;

export function markieren(schuelerId, wert) {
  markierung = { schuelerId, wert, zeit: Date.now() };
}

function markierungFuer(schuelerId) {
  if (!markierung || markierung.schuelerId !== schuelerId) return null;
  return Date.now() - markierung.zeit < 1500 ? markierung.wert : null;
}

/* ------------------------------------------------------------- Abzeichen --- */

export function levelAbzeichen(level, { gross = false } = {}) {
  return h('span', {
    class: `level level-${level}${gross ? ' gross' : ''}`,
    text: `Level ${level}`,
  });
}

export function statusAbzeichen(statusId, verfahren) {
  const s = STATUS[statusId];
  const zusatz =
    verfahren && statusId !== STATUS.normal.id
      ? statusId === STATUS.entscheidung.id
        ? ` · ${ART[verfahren.art].name}`
        : ''
      : '';
  return h('span', { class: `status status-${statusId}` }, [
    h('span', { class: 'status-ikone', 'aria-hidden': 'true', text: s.ikone }),
    h('span', { text: (statusId === STATUS.normal.id ? 'Normal' : s.name) + zusatz }),
  ]);
}

export function bilanzZeile(bilanz, { klein = true } = {}) {
  if (!bilanz.gesamt) {
    return h('span', { class: 'bilanz leer', text: 'noch keine Rückmeldung' });
  }
  return h('span', { class: `bilanz${klein ? ' klein' : ''}` }, [
    h('span', { class: 'bilanz-teil gut', text: `🟢 ${bilanz.erfuellt}` }),
    h('span', { class: 'bilanz-teil mittel', text: `🟡 ${bilanz.teilweise}` }),
    h('span', { class: 'bilanz-teil schlecht', text: `🔴 ${bilanz.nicht}` }),
  ]);
}

/* --------------------------------------------------- Rückmeldeknöpfe ----- */

/**
 * Die drei Knöpfe, um die sich die ganze App dreht. Ein Tipp speichert sofort:
 * keine Rückfrage, kein Pflichtfeld, kein Seitenwechsel. Korrigierbar bleibt
 * es trotzdem - über "Rückgängig" im Hinweis.
 */
export function rueckmeldeKnoepfe(schuelerId, { gross = false, nachAktion = null } = {}) {
  const reihe = h('div', { class: `rueckmeldung${gross ? ' gross' : ''}` });
  for (const b of [BEWERTUNG.erfuellt, BEWERTUNG.teilweise, BEWERTUNG.nicht]) {
    reihe.appendChild(
      h('button', {
        class: `rm-knopf rm-${b.id}`,
        type: 'button',
        'aria-label': `Rückmeldung: ${b.name}`,
        onclick: (e) => {
          e.stopPropagation();
          const r = store.rueckmeldungGeben(schuelerId, b.id);
          if (!r) return;
          markieren(schuelerId, b.id);
          const s = store.schueler(schuelerId);
          toast(`${b.ikone} ${b.name} · ${vollerName(s)}`, {
            text: 'Rückgängig',
            fn: () => {
              store.rueckmeldungStornieren(r.id, 'direkt zurückgenommen');
              toast('Rückmeldung zurückgenommen.');
            },
          });
          if (nachAktion) nachAktion();
        },
      }, [
        h('span', { class: 'rm-ikone', 'aria-hidden': 'true', text: b.ikone }),
        h('span', { class: 'rm-text', text: gross ? b.name.toUpperCase() : b.kurz }),
      ]),
    );
  }
  return reihe;
}

/* ------------------------------------------------------- Schülerzeile ---- */

/**
 * Eine Zeile der Klassenübersicht: alles Wichtige auf einen Blick, die
 * häufigste Aktion direkt daneben. Ein Tipp auf die Zeile öffnet das Profil.
 */
export function schuelerZeile(schueler, { beiOeffnen, beiEntscheidung, beiStart, darfAbschliessen, darfStarten }) {
  const heute = heuteIso();
  const v = store.offenesVerfahren(schueler.id);
  const status = store.statusDesSchuelers(schueler.id, heute);
  const blitz = markierungFuer(schueler.id);

  // Der Name ist der eigentliche Knopf zum Profil - so bleibt die Zeile per
  // Tastatur erreichbar, ohne verschachtelte Knöpfe zu erzeugen.
  const kopf = h('div', { class: 'zeile-kopf' }, [
    h('button', {
      class: 'zeile-name',
      type: 'button',
      text: vollerName(schueler),
      onclick: (e) => {
        e.stopPropagation();
        beiOeffnen(schueler);
      },
    }),
    levelAbzeichen(schueler.level),
  ]);

  const infos = h('div', { class: 'zeile-infos' }, [statusAbzeichen(status, v)]);
  if (v) {
    const tage = tageZwischen(v.beginn, heute);
    infos.appendChild(
      h('span', {
        class: 'zeile-dauer',
        text: `seit ${datumLang(v.beginn)} · ${tage} ${tage === 1 ? 'Tag' : 'Tage'} · ${fristText(v, heute)}`,
      }),
    );
    infos.appendChild(bilanzZeile(store.bilanzVon(v.id)));
  }

  const aktionen = h('div', { class: 'zeile-aktionen' });
  if (v && status === STATUS.entscheidung.id && darfAbschliessen) {
    aktionen.appendChild(
      h('button', {
        class: 'knopf warnung entscheidung-knopf',
        type: 'button',
        text: '⚠️ Entscheiden',
        onclick: (e) => {
          e.stopPropagation();
          beiEntscheidung(schueler, v);
        },
      }),
    );
  }
  if (v) aktionen.appendChild(rueckmeldeKnoepfe(schueler.id));
  // Ohne laufendes Verfahren bleibt der Platz für den einen Knopf, der hier
  // sinnvoll ist: ein Verfahren beginnen, ohne die Seite zu wechseln.
  if (!v && darfStarten) {
    aktionen.appendChild(
      h('button', {
        class: 'knopf leise',
        type: 'button',
        text: '🛟 / 🌉 Verfahren starten',
        onclick: (e) => {
          e.stopPropagation();
          beiStart(schueler);
        },
      }),
    );
  }

  return h(
    'article',
    {
      class: `zeile zeile-${status}${v ? '' : ' zeile-schlank'}${blitz ? ` blitz blitz-${blitz}` : ''}`,
      'aria-label': `${vollerName(schueler)}, Level ${schueler.level}, ${STATUS[status].name}`,
      onclick: () => beiOeffnen(schueler),
    },
    [h('div', { class: 'zeile-text' }, [kopf, infos]), aktionen],
  );
}

/* --------------------------------------------------------- Statistik ----- */

export function kennzahl(ikone, text, wert, klasse = '') {
  return h('div', { class: `kennzahl ${klasse}`.trim() }, [
    h('span', { class: 'kennzahl-wert', text: String(wert) }),
    h('span', { class: 'kennzahl-text' }, [
      h('span', { 'aria-hidden': 'true', text: `${ikone} ` }),
      h('span', { text }),
    ]),
  ]);
}

export function levelBalken(werte, gesamt) {
  const zeile = (level) => {
    const anzahl = werte[level] || 0;
    const anteil = gesamt ? Math.round((anzahl / gesamt) * 100) : 0;
    return h('div', { class: 'balken-zeile' }, [
      h('span', { class: `balken-marke level level-${level}`, text: `Level ${level}` }),
      h('div', { class: 'balken-spur' }, [
        h('div', { class: `balken-fuellung level-flaeche-${level}`, style: `width:${anteil}%` }),
      ]),
      h('span', { class: 'balken-wert', text: String(anzahl) }),
    ]);
  };
  return h('div', { class: 'balken' }, [1, 2, 3, 4].map(zeile));
}
