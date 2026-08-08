/**
 * Einstiegspunkt: Zustand laden, Ansicht wählen, neu zeichnen.
 *
 * Bewusst ohne Framework und ohne Build-Schritt. Die App besteht aus statischen
 * Dateien, lässt sich auf jedem Webspace oder über GitHub Pages ausliefern und
 * ist damit auch in fünf Jahren noch wartbar.
 */

import { h, leeren, toast, dialogOeffnen } from './ui.js';
import * as store from './store.js';
import { aktuellesSchuljahr, schuljahrFuer, PFLICHTSTUNDEN_SH } from './model.js';
import { baueJahreskalender, urlaubsvorschlag } from './soll.js';
import { iso } from './kalender-sh.js';
import { erinnerungEinrichten } from './erinnerung.js';

import { heuteView } from './views/heute.js';
import { wocheView } from './views/woche.js';
import { auswertungView } from './views/auswertung.js';
import { stundenplanView } from './views/stundenplan.js';
import { einstellungenView, themaAnwenden } from './views/einstellungen.js';

const ANSICHTEN = {
  heute: { name: 'Heute', bauen: heuteView, ikone: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/>' },
  woche: {
    name: 'Woche',
    bauen: wocheView,
    ikone: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  },
  auswertung: {
    name: 'Auswertung',
    bauen: auswertungView,
    ikone: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  },
  stundenplan: {
    name: 'Plan',
    bauen: stundenplanView,
    ikone: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12"/>',
  },
  einstellungen: {
    name: 'Mehr',
    bauen: einstellungenView,
    ikone: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  },
};

const ctx = {
  ansicht: 'heute',
  datum: iso(new Date()),
  zeitraum: null,
  letzteKategorie: 'vorbereitung',
  kalender: null,
  ticks: [],
  setDatum(datum) {
    ctx.datum = datum;
    ctx.neuZeichnen();
  },
  setAnsicht(ansicht) {
    location.hash = `#/${ansicht}`;
  },
  setZeitraum(z) {
    ctx.zeitraum = z;
    ctx.neuZeichnen();
  },
  registriereTick(fn) {
    ctx.ticks.push(fn);
  },
  neuZeichnen() {
    zeichnen();
  },
};

/* --------------------------------- Start --------------------------------- */

store.laden();
themaAnwenden(store.get().einstellungen.theme);
aufbauen();
routenLesen();
window.addEventListener('hashchange', routenLesen);
setInterval(() => ctx.ticks.forEach((fn) => fn()), 1000);
erinnerungEinrichten();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Ohne Service Worker funktioniert die App weiterhin, nur nicht offline. */
    });
  });
}

// Nach dem Wechsel in ein neues Schuljahr freundlich darauf hinweisen.
if (schuljahrFuer(new Date()) !== store.get().einstellungen.schuljahr) {
  setTimeout(
    () =>
      toast(
        `Das aktuelle Schuljahr ist ${aktuellesSchuljahr()} – eingestellt ist ` +
          `${store.get().einstellungen.schuljahr}. Umstellen unter "Mehr".`,
        6000,
      ),
    1200,
  );
}

if (!store.get().einstellungen.setupFertig) setTimeout(erstesSetup, 300);

/* -------------------------------- Aufbau --------------------------------- */

function aufbauen() {
  const nav = document.querySelector('.nav');
  leeren(nav);
  for (const [id, def] of Object.entries(ANSICHTEN)) {
    const knopf = h('button', {
      type: 'button',
      'data-ansicht': id,
      onclick: () => ctx.setAnsicht(id),
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = def.ikone;
    knopf.append(svg, h('span', { text: def.name }));
    nav.appendChild(knopf);
  }
}

function routenLesen() {
  const ziel = (location.hash || '').replace(/^#\//, '');
  const gewechselt = ctx.ansicht !== (ANSICHTEN[ziel] ? ziel : 'heute');
  ctx.ansicht = ANSICHTEN[ziel] ? ziel : 'heute';
  zeichnen();
  if (gewechselt) window.scrollTo({ top: 0, behavior: 'auto' });
}

// Die Diagramme haben ein eigenes Layout für schmale Displays. Beim Drehen des
// Geräts muss deshalb neu gezeichnet werden - aber nur, wenn die Grenze auch
// wirklich überschritten wurde.
let warSchmal = window.innerWidth < 680;
let umbruchTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(umbruchTimer);
  umbruchTimer = setTimeout(() => {
    const schmal = window.innerWidth < 680;
    if (schmal !== warSchmal) {
      warSchmal = schmal;
      zeichnen();
    }
  }, 200);
});

function zeichnen() {
  const stand = store.get();
  ctx.ticks = [];
  ctx.kalender = baueJahreskalender(stand.einstellungen, stand.tagesTypen, stand.eigeneFerien);

  const kopf = document.querySelector('.kopf-titel');
  leeren(kopf).append(
    h('strong', { text: 'Lehrerzeit' }),
    h('span', {
      text: `Schuljahr ${stand.einstellungen.schuljahr}${stand.einstellungen.name ? ` · ${stand.einstellungen.name}` : ''}`,
    }),
  );

  for (const knopf of document.querySelectorAll('.nav button')) {
    if (knopf.dataset.ansicht === ctx.ansicht) knopf.setAttribute('aria-current', 'page');
    else knopf.removeAttribute('aria-current');
  }

  const haupt = document.querySelector('main');
  leeren(haupt);

  const problem = store.speicherProblem();
  if (problem) haupt.appendChild(h('div', { class: 'hinweis fehler', text: problem }));

  haupt.appendChild(ANSICHTEN[ctx.ansicht].bauen(ctx));
  document.title = `${ANSICHTEN[ctx.ansicht].name} · Lehrerzeit`;
}

/* ------------------------------ Erstes Setup ----------------------------- */

/**
 * Kurzer Einstieg beim ersten Start: nur das Nötigste, damit die Soll-Zeit
 * stimmt. Alles Weitere findet sich unter "Mehr".
 */
function erstesSetup() {
  dialogOeffnen((dialog, schliessen) => {
    const schulform = h(
      'select',
      { id: 's-schulform' },
      PFLICHTSTUNDEN_SH.filter((s) => s.id !== 'eigen').map((s) =>
        h('option', { value: s.id, text: `${s.name} – ${s.stunden} Pflichtstunden` }),
      ),
    );
    schulform.value = 'gemeinschaftsschule';

    const meine = h('input', { id: 's-meine', type: 'number', min: '0', max: '35', step: '0.5', value: '27' });
    schulform.addEventListener('change', () => {
      const gewaehlt = PFLICHTSTUNDEN_SH.find((s) => s.id === schulform.value);
      if (gewaehlt) meine.value = String(gewaehlt.stunden);
    });

    const name = h('input', { id: 's-name', type: 'text', placeholder: 'optional' });
    const urlaubVerteilen = h('input', { id: 's-urlaub', type: 'checkbox', checked: true, style: 'width:auto;min-height:0' });

    dialog.append(
      h('h2', { text: 'Willkommen' }),
      h('p', {
        text:
          'Diese App dokumentiert deine Arbeitszeit – nur für dich, nur auf diesem Gerät. ' +
          'Drei Angaben genügen für den Anfang.',
      }),
      h('div', { class: 'feld' }, [h('label', { for: 's-schulform', text: 'Schulform' }), schulform]),
      h('div', { class: 'feld' }, [
        h('label', { for: 's-meine', text: 'Meine Pflichtstunden (bei Teilzeit weniger)' }),
        meine,
      ]),
      h('div', { class: 'feld' }, [h('label', { for: 's-name', text: 'Name für Ausdrucke' }), name]),
      h('div', { class: 'feld' }, [
        h('label', { for: 's-urlaub', style: 'display:flex;gap:0.5rem;align-items:center' }, [
          urlaubVerteilen,
          document.createTextNode('30 Urlaubstage in die Ferien legen'),
        ]),
      ]),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Die Pflichtstundenzahlen sind Voreinstellungen für Schleswig-Holstein und in den ' +
          'Einstellungen jederzeit anpassbar.',
      }),
      h('div', { class: 'btn-reihe', style: 'justify-content:flex-end;margin-top:1rem' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Los geht es',
          onclick: () => {
            const gewaehlt = PFLICHTSTUNDEN_SH.find((s) => s.id === schulform.value);
            store.einstellungenSetzen({
              schulform: schulform.value,
              pflichtstundenSoll: gewaehlt ? gewaehlt.stunden : 27,
              pflichtstundenIst: Number(meine.value) || (gewaehlt ? gewaehlt.stunden : 27),
              name: name.value.trim(),
              schuljahr: aktuellesSchuljahr(),
              setupFertig: true,
            });
            if (urlaubVerteilen.checked) {
              const stand = store.get();
              const vorschlag = urlaubsvorschlag(stand.einstellungen, stand.eigeneFerien);
              store.aendern((s) => Object.assign(s.tagesTypen, vorschlag));
            }
            schliessen();
            ctx.neuZeichnen();
            toast('Fertig. Der Stundenplan unter "Plan" spart später am meisten Zeit.');
          },
        }),
      ]),
    );
  });
}
