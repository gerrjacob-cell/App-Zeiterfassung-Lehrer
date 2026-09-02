/**
 * Einstiegspunkt: Datenquelle wählen, Route lesen, Ansicht zeichnen.
 *
 * Ohne Framework und ohne Build-Schritt. Die App besteht aus statischen
 * Dateien und läuft auf jedem Webspace - auch auf einem Schulserver.
 *
 * Umstellung auf Server/Datenbank später: hier eine Zeile.
 *   const quelle = new ServerQuelle('/api');
 */

import { h, leeren, dialog } from './ui.js';
import * as store from './store.js';
import { LokaleQuelle } from './quelle.js';
import { ROLLEN, siehtGruppe } from './identitaet.js';
import { name as vollerName } from './model.js';

import { gruppenView } from './views/gruppen.js';
import { dashboardView } from './views/dashboard.js';
import { schuelerView } from './views/schueler.js';
import { verwaltungView } from './views/verwaltung.js';
import { protokollView } from './views/protokoll.js';

const quelle = new LokaleQuelle();

const ctx = {
  gehe(pfad) {
    location.hash = pfad.startsWith('#') ? pfad : `#${pfad}`;
  },
  neuZeichnen: () => zeichnen(),
};

function route() {
  const roh = location.hash.replace(/^#/, '') || '/';
  const [pfad, abfrageText] = roh.split('?');
  return {
    teile: pfad.split('/').filter(Boolean),
    abfrage: Object.fromEntries(new URLSearchParams(abfrageText || '')),
  };
}

function ansicht() {
  const { teile, abfrage } = route();

  if (teile[0] === 'g' && teile[1]) {
    if (teile[2] === 's' && teile[3]) {
      const gruppe = store.gruppe(teile[1]);
      return schuelerView(ctx, teile[3], {
        zurueck: { text: gruppe ? gruppe.name : 'Zurück', pfad: `/g/${teile[1]}` },
      });
    }
    return dashboardView(ctx, teile[1]);
  }

  if (teile[0] === 's' && teile[1]) return qrAnsicht(teile[1]);
  if (teile[0] === 'verwaltung') return verwaltungView(ctx, abfrage);
  if (teile[0] === 'protokoll') return protokollView(ctx);

  return gruppenView(ctx);
}

/**
 * Die Route, auf die später der QR-Code zeigt. Sie enthält nur das Token -
 * und prüft, bevor sie etwas anzeigt, ob dieses Konto den Schüler sehen darf.
 */
function qrAnsicht(token) {
  const s = store.schuelerNachToken(token);
  const benutzer = store.aktiverBenutzer();
  if (!s) {
    return h('div', { class: 'seite' }, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('p', { class: 'leer-hinweis', text: 'Zu diesem Code gehört kein Schüler.' }),
    ]);
  }
  const erlaubt = s.gruppen.some((id) => siehtGruppe(benutzer, store.gruppe(id)));
  if (!erlaubt) {
    return h('div', { class: 'seite' }, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('section', { class: 'tafel' }, [
        h('h2', { text: 'Kein Zugriff' }),
        h('p', { class: 'unter', text: 'Dieses Konto ist keiner Lerngruppe dieses Schülers zugeordnet. Der QR-Code allein gibt keinen Zugang.' }),
      ]),
    ]);
  }
  return h('div', {}, [
    h('p', { class: 'banner', text: '📷 Über QR-Code geöffnet · Zugriff geprüft' }),
    schuelerView(ctx, s.id, { zurueck: { text: 'Lerngruppen', pfad: '/' } }),
  ]);
}

/* ---------------------------------------------------------------- Kopf --- */

function kopfZeichnen() {
  const kopf = leeren(document.getElementById('kopf'));
  const benutzer = store.aktiverBenutzer();
  const stand = store.getStand();

  kopf.appendChild(
    h('button', {
      class: 'marke',
      title: 'Zur Startseite',
      onclick: () => ctx.gehe('/'),
    }, [
      h('span', { class: 'marke-zeichen', 'aria-hidden': 'true', text: '▚' }),
      h('span', { class: 'marke-text' }, [
        h('strong', { text: 'Lernerlevel Manager' }),
        h('span', { class: 'marke-unter', text: stand.demo ? 'Prototyp mit fiktiven Daten' : 'Prototyp' }),
      ]),
    ]),
  );

  kopf.appendChild(
    h('button', { class: 'konto', onclick: kontoDialog }, [
      h('span', { class: 'konto-name', text: benutzer ? benutzer.name : 'Kein Konto' }),
      h('span', { class: 'konto-rolle', text: benutzer ? ROLLEN[benutzer.rolle].name : '' }),
    ]),
  );
}

/**
 * Kontowechsel - im Prototyp der Ersatz für eine Anmeldung. Er zeigt vor
 * allem, wie sich die Rechte unterscheiden: eine Lehrkraft sieht ihre
 * Lerngruppen und gibt Rückmeldungen, die Klassenleitung verwaltet.
 */
function kontoDialog() {
  const stand = store.getStand();
  return dialog('Konto wechseln', (schliessen) => [
    h('p', { class: 'hinweis', text: 'Der Prototyp hat bewusst kein Login: ein nachgebautes Anmeldefenster würde Sicherheit nur vortäuschen. Produktiv steht hier die Anmeldung (z. B. über IServ).' }),
    ...stand.benutzer.map((b) =>
      h('button', {
        class: `konto-wahl${b.id === stand.aktiverBenutzer ? ' aktiv' : ''}`,
        type: 'button',
        onclick: () => {
          store.benutzerWechseln(b.id);
          schliessen(b.id);
        },
      }, [
        h('strong', { text: b.name }),
        h('span', { class: 'unter', text: ROLLEN[b.rolle].name }),
        h('span', {
          class: 'unter',
          text: `Lerngruppen: ${b.gruppen.map((id) => (store.gruppe(id) ? store.gruppe(id).name : '?')).join(', ')}`,
        }),
      ]),
    ),
    h('div', { class: 'dialog-fuss' }, [
      h('button', { class: 'knopf', text: 'Schließen', onclick: () => schliessen(null) }),
    ]),
  ]);
}

/* -------------------------------------------------------------- Zeichnen --- */

let letzteRoute = '';

function zeichnen() {
  const aktuelleRoute = location.hash;
  const wechsel = aktuelleRoute !== letzteRoute;
  const scroll = window.scrollY;

  // Fokus im Suchfeld überlebt das Neuzeichnen - sonst reißt jede Änderung
  // die Eingabe ab.
  const aktiv = document.activeElement;
  const suchFokus = aktiv && aktiv.classList.contains('suche') ? aktiv.selectionStart : null;

  kopfZeichnen();
  const inhalt = leeren(document.getElementById('inhalt'));
  inhalt.appendChild(ansicht());
  document.title = titelFuerRoute();

  if (wechsel) {
    window.scrollTo(0, 0);
    letzteRoute = aktuelleRoute;
  } else {
    window.scrollTo(0, scroll);
    if (suchFokus !== null) {
      const feld = inhalt.querySelector('.suche');
      if (feld) {
        feld.focus();
        feld.setSelectionRange(suchFokus, suchFokus);
      }
    }
  }
}

function titelFuerRoute() {
  const { teile } = route();
  if (teile[0] === 'g' && teile[1]) {
    const g = store.gruppe(teile[1]);
    if (teile[2] === 's' && teile[3]) {
      const s = store.schueler(teile[3]);
      return s ? `${vollerName(s)} · Lernerlevel Manager` : 'Lernerlevel Manager';
    }
    return g ? `${g.name} · Lernerlevel Manager` : 'Lernerlevel Manager';
  }
  if (teile[0] === 'verwaltung') return 'Verwaltung · Lernerlevel Manager';
  if (teile[0] === 'protokoll') return 'Protokoll · Lernerlevel Manager';
  return 'Lernerlevel Manager';
}

async function start() {
  await store.starten(quelle);
  store.abonnieren(() => zeichnen());
  window.addEventListener('hashchange', zeichnen);
  zeichnen();
}

start().catch((err) => {
  console.error(err);
  document.getElementById('inhalt').textContent =
    'Die App konnte nicht gestartet werden. Bitte die Seite neu laden.';
});
