/**
 * Startseite: alle Lerngruppen als große Kacheln, jede mit den Zahlen, die
 * vor dem Öffnen interessieren. Fällige Entscheidungen werden hervorgehoben -
 * sie sind das Einzige, was ohne Nachfragen erledigt werden muss.
 */

import { h } from '../ui.js';
import * as store from '../store.js';
import { darf, siehtGruppe } from '../identitaet.js';

export function gruppenView(ctx) {
  const benutzer = store.aktiverBenutzer();
  const stand = store.getStand();
  const sichtbar = stand.gruppen.filter((g) => !g.archiviert && siehtGruppe(benutzer, g));

  const gitter = h('div', { class: 'kachel-gitter' });
  for (const g of sichtbar) {
    const s = store.statistik(g.id);
    gitter.appendChild(
      h(
        'article',
        {
          class: `kachel${s.entscheidung ? ' hat-entscheidung' : ''}`,
          tabindex: '0',
          role: 'button',
          'aria-label': `Lerngruppe ${g.name}, ${s.anzahl} Schüler`,
          onclick: () => ctx.gehe(`/g/${g.id}`),
          onkeydown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              ctx.gehe(`/g/${g.id}`);
            }
          },
        },
        [
          h('div', { class: 'kachel-kopf' }, [
            h('h2', { class: 'kachel-name', text: g.name }),
            h('span', { class: 'kachel-anzahl', text: `${s.anzahl} Schüler` }),
          ]),
          g.beschreibung ? h('p', { class: 'kachel-unter', text: g.beschreibung }) : null,
          h('div', { class: 'kachel-zahlen' }, [
            zahl('🌉', 'Brücke', s.bruecke, 'bruecke'),
            zahl('🛟', 'Floß', s.floss, 'floss'),
            zahl('⚠️', 'Entscheidung', s.entscheidung, 'entscheidung'),
          ]),
        ],
      ),
    );
  }

  if (!sichtbar.length) {
    gitter.appendChild(
      h('p', { class: 'leer-hinweis', text: 'Für dieses Konto ist noch keine Lerngruppe freigegeben.' }),
    );
  }

  const kopf = h('div', { class: 'seiten-kopf' }, [
    h('div', {}, [
      h('h1', { text: 'Lerngruppen' }),
      h('p', {
        class: 'unter',
        text: benutzer ? `Angemeldet als ${benutzer.name}` : 'Nicht angemeldet',
      }),
    ]),
    darf(benutzer, 'schueler.verwalten')
      ? h('button', {
          class: 'knopf',
          text: 'Verwaltung',
          onclick: () => ctx.gehe('/verwaltung'),
        })
      : null,
  ]);

  return h('div', { class: 'seite' }, [kopf, gitter]);
}

function zahl(ikone, text, wert, klasse) {
  return h('div', { class: `kachel-zahl ${klasse}${wert ? ' aktiv' : ''}` }, [
    h('span', { class: 'kachel-zahl-wert', text: String(wert) }),
    h('span', { class: 'kachel-zahl-text' }, [
      h('span', { 'aria-hidden': 'true', text: `${ikone} ` }),
      h('span', { text }),
    ]),
  ]);
}
