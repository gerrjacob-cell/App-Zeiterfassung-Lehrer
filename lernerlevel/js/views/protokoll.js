/**
 * Protokoll: alle Ereignisse über alle Lerngruppen, neueste zuerst.
 *
 * Für die Klassenleitung nachvollziehbar - wer hat wann was geändert. Auch
 * Korrekturen stehen hier, statt alte Einträge verschwinden zu lassen.
 */

import { h } from '../ui.js';
import * as store from '../store.js';
import { darf } from '../identitaet.js';
import { name as vollerName, zeitpunktLang } from '../model.js';

const zustand = { typ: 'alle', suche: '' };

const TYPEN = [
  { id: 'alle', text: 'Alle' },
  { id: 'rueckmeldung', text: '🟢 Rückmeldungen' },
  { id: 'verfahren.start', text: '🛟🌉 Starts' },
  { id: 'verfahren.abschluss', text: '✅ Abschlüsse' },
  { id: 'level.geaendert', text: '⬆️ Levelwechsel' },
  { id: 'rueckmeldung.storniert', text: '✏️ Korrekturen' },
];

export function protokollView(ctx) {
  const benutzer = store.aktiverBenutzer();
  if (!darf(benutzer, 'protokoll.sehen')) {
    return h('div', { class: 'seite' }, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('p', { class: 'leer-hinweis', text: 'Das Protokoll ist der Klassenleitung vorbehalten.' }),
    ]);
  }

  const suche = zustand.suche.trim().toLowerCase();
  const eintraege = store.protokoll(500).filter((e) => {
    if (zustand.typ !== 'alle' && e.typ !== zustand.typ) return false;
    if (!suche) return true;
    const s = e.schuelerId ? store.schueler(e.schuelerId) : null;
    const heuhaufen = `${s ? vollerName(s) : ''} ${e.titel} ${e.text} ${e.benutzerName}`.toLowerCase();
    return heuhaufen.includes(suche);
  });

  const filter = h('div', { class: 'filter-reihe' });
  for (const t of TYPEN) {
    filter.appendChild(
      h('button', {
        class: `chip${zustand.typ === t.id ? ' aktiv' : ''}`,
        type: 'button',
        text: t.text,
        onclick: () => {
          zustand.typ = t.id;
          ctx.neuZeichnen();
        },
      }),
    );
  }

  const liste = h('ol', { class: 'historie' });
  for (const e of eintraege) {
    const s = e.schuelerId ? store.schueler(e.schuelerId) : null;
    liste.appendChild(
      h('li', { class: 'historie-eintrag' }, [
        h('span', { class: 'historie-datum', text: zeitpunktLang(e.zeit).split(',')[0] }),
        h('span', { class: 'historie-ikone', 'aria-hidden': 'true', text: e.ikone }),
        h('span', { class: 'historie-text' }, [
          h('strong', { text: `${e.titel}${s ? ` · ${vollerName(s)}` : ''}` }),
          e.text ? h('span', { text: e.text }) : null,
          h('span', { class: 'unter', text: `${zeitpunktLang(e.zeit)} · ${e.benutzerName}` }),
        ]),
      ]),
    );
  }
  if (!eintraege.length) liste.appendChild(h('li', { class: 'leer-hinweis', text: 'Kein Eintrag passt zur Auswahl.' }));

  return h('div', { class: 'seite' }, [
    h('div', { class: 'seiten-kopf' }, [
      h('div', {}, [
        h('button', { class: 'zurueck', text: '‹ Verwaltung', onclick: () => ctx.gehe('/verwaltung') }),
        h('h1', { text: 'Protokoll' }),
        h('p', { class: 'unter', text: `${eintraege.length} Einträge · neueste zuerst` }),
      ]),
    ]),
    h('div', { class: 'werkzeugleiste' }, [
      h('input', {
        class: 'suche',
        type: 'search',
        placeholder: 'Suchen (Name, Vorgang, Person)…',
        value: zustand.suche,
        oninput: (e) => {
          zustand.suche = e.target.value;
          ctx.neuZeichnen();
        },
      }),
    ]),
    filter,
    h('section', { class: 'tafel' }, [liste]),
  ]);
}
