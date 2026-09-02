/**
 * Dashboard einer Lerngruppe - die wichtigste Ansicht.
 *
 * Aufbau von oben nach unten: Zusammenfassung, Filter, Schülerliste. Die
 * häufigste Handlung ist damit: Lerngruppe öffnen -> Schüler sehen -> 🟢/🟡/🔴
 * antippen. Zwei Tipps, kein Seitenwechsel.
 */

import { h } from '../ui.js';
import * as store from '../store.js';
import { darf } from '../identitaet.js';
import { STATUS, heuteIso, name as vollerName } from '../model.js';
import { kennzahl, levelBalken, schuelerZeile } from './bausteine.js';
import { abschlussDialog, artWahlDialog } from './verfahren.js';

/** Filterzustand je Lerngruppe - bleibt beim Neuzeichnen erhalten. */
const zustaende = new Map();

function zustandFuer(gruppenId) {
  if (!zustaende.has(gruppenId)) {
    zustaende.set(gruppenId, { status: 'alle', level: 'alle', suche: '', statistik: false });
  }
  return zustaende.get(gruppenId);
}

export function dashboardView(ctx, gruppenId) {
  const gruppe = store.gruppe(gruppenId);
  if (!gruppe) return h('p', { class: 'leer-hinweis', text: 'Diese Lerngruppe gibt es nicht.' });

  const benutzer = store.aktiverBenutzer();
  const z = zustandFuer(gruppenId);
  const heute = heuteIso();
  const stat = store.statistik(gruppenId, heute);
  const alle = store.schuelerDerGruppe(gruppenId);

  const liste = h('div', { class: 'liste' });
  const filterLeiste = h('div', { class: 'filter' });
  const trefferText = h('p', { class: 'treffer' });

  const suchfeld = h('input', {
    class: 'suche',
    type: 'search',
    inputmode: 'search',
    placeholder: 'Namen suchen…',
    value: z.suche,
    'aria-label': 'Schülernamen suchen',
    oninput: (e) => {
      z.suche = e.target.value;
      listeZeichnen();
    },
  });

  const beiOeffnen = (s) => ctx.gehe(`/g/${gruppenId}/s/${s.id}`);
  const beiEntscheidung = async (s, v) => {
    await abschlussDialog(s, v);
  };
  const beiStart = (s) => artWahlDialog(s);

  function passt(s) {
    const status = store.statusDesSchuelers(s.id, heute);
    if (z.status !== 'alle' && z.status !== status) return false;
    if (z.level !== 'alle' && s.level !== Number(z.level)) return false;
    const suche = z.suche.trim().toLowerCase();
    if (suche && !vollerName(s).toLowerCase().includes(suche)) return false;
    return true;
  }

  function listeZeichnen() {
    const gefiltert = alle.filter(passt);
    liste.replaceChildren();
    for (const s of gefiltert) {
      liste.appendChild(
        schuelerZeile(s, {
          beiOeffnen,
          beiEntscheidung,
          beiStart,
          darfAbschliessen: darf(benutzer, 'verfahren.abschliessen'),
          darfStarten: darf(benutzer, 'verfahren.starten'),
        }),
      );
    }
    if (!gefiltert.length) {
      liste.appendChild(h('p', { class: 'leer-hinweis', text: 'Kein Schüler passt zu dieser Auswahl.' }));
    }
    trefferText.textContent =
      gefiltert.length === alle.length
        ? `${alle.length} Schüler`
        : `${gefiltert.length} von ${alle.length} Schülern`;
    filterZeichnen();
  }

  function filterZeichnen() {
    filterLeiste.replaceChildren();
    const statusFilter = [
      { id: 'alle', text: `Alle (${stat.anzahl})` },
      { id: STATUS.normal.id, text: `🟢 Normal (${stat.normal})` },
      { id: STATUS.bruecke.id, text: `🌉 Brücke (${stat.bruecke})` },
      { id: STATUS.floss.id, text: `🛟 Floß (${stat.floss})` },
      { id: STATUS.entscheidung.id, text: `⚠️ Entscheidung (${stat.entscheidung})` },
    ];
    const gruppeA = h('div', { class: 'filter-reihe', role: 'group', 'aria-label': 'Nach Status filtern' });
    for (const f of statusFilter) {
      gruppeA.appendChild(
        h('button', {
          class: `chip gross${z.status === f.id ? ' aktiv' : ''}${f.id === 'entscheidung' && stat.entscheidung ? ' warnung' : ''}`,
          type: 'button',
          text: f.text,
          'aria-pressed': z.status === f.id ? 'true' : 'false',
          onclick: () => {
            z.status = z.status === f.id ? 'alle' : f.id;
            listeZeichnen();
          },
        }),
      );
    }
    const gruppeB = h('div', { class: 'filter-reihe', role: 'group', 'aria-label': 'Nach Level filtern' });
    for (const l of ['alle', 1, 2, 3, 4]) {
      gruppeB.appendChild(
        h('button', {
          class: `chip${String(z.level) === String(l) ? ' aktiv' : ''}`,
          type: 'button',
          text: l === 'alle' ? 'Alle Level' : `Level ${l} (${stat.level[l]})`,
          'aria-pressed': String(z.level) === String(l) ? 'true' : 'false',
          onclick: () => {
            z.level = String(z.level) === String(l) ? 'alle' : l;
            listeZeichnen();
          },
        }),
      );
    }
    filterLeiste.append(gruppeA, gruppeB);
  }

  listeZeichnen();

  const kopf = h('div', { class: 'seiten-kopf' }, [
    h('div', {}, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('h1', { text: gruppe.name }),
      h('p', { class: 'unter', text: `${stat.anzahl} Schüler${gruppe.beschreibung ? ` · ${gruppe.beschreibung}` : ''}` }),
    ]),
    h('div', { class: 'kopf-aktionen' }, [
      h('button', {
        class: `knopf${z.statistik ? ' aktiv' : ''}`,
        text: '📊 Statistik',
        onclick: () => {
          z.statistik = !z.statistik;
          ctx.neuZeichnen();
        },
      }),
      darf(benutzer, 'schueler.verwalten')
        ? h('button', { class: 'knopf', text: 'Verwaltung', onclick: () => ctx.gehe('/verwaltung') })
        : null,
    ]),
  ]);

  const zusammenfassung = h('div', { class: 'kennzahlen' }, [
    kennzahl('🟢', 'Normal', stat.normal, 'normal'),
    kennzahl('🌉', 'Brücke', stat.bruecke, 'bruecke'),
    kennzahl('🛟', 'Floß', stat.floss, 'floss'),
    kennzahl('⚠️', 'Entscheidung fällig', stat.entscheidung, `entscheidung${stat.entscheidung ? ' warnend' : ''}`),
  ]);

  const statistikTafel = z.statistik
    ? h('section', { class: 'tafel' }, [
        h('h2', { text: `Statistik · ${gruppe.name}` }),
        h('p', { class: 'unter', text: `${stat.anzahl} Schüler · Stand ${new Date().toLocaleDateString('de-DE')}` }),
        levelBalken(stat.level, stat.anzahl),
        h('div', { class: 'tafel-zahlen' }, [
          kennzahl('🌉', 'Brücke', stat.bruecke, 'bruecke'),
          kennzahl('🛟', 'Floß', stat.floss, 'floss'),
          kennzahl('⚠️', 'Entscheidung fällig', stat.entscheidung, 'entscheidung'),
        ]),
      ])
    : null;

  const entscheidungsHinweis =
    stat.entscheidung && z.status !== STATUS.entscheidung.id
      ? h('button', {
          class: 'banner warnung',
          type: 'button',
          text: `⚠️ ${stat.entscheidung} ${stat.entscheidung === 1 ? 'Entscheidung ist' : 'Entscheidungen sind'} fällig – anzeigen`,
          onclick: () => {
            z.status = STATUS.entscheidung.id;
            listeZeichnen();
          },
        })
      : null;

  return h('div', { class: 'seite' }, [
    kopf,
    zusammenfassung,
    statistikTafel,
    entscheidungsHinweis,
    h('div', { class: 'werkzeugleiste' }, [suchfeld, trefferText]),
    filterLeiste,
    liste,
  ]);
}
