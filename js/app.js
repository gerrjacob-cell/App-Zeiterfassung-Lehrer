/**
 * Einstiegspunkt: Zustand laden, Ansicht wählen, neu zeichnen.
 *
 * Bewusst ohne Framework und ohne Build-Schritt. Die App besteht aus statischen
 * Dateien, lässt sich auf jedem Webspace oder über GitHub Pages ausliefern und
 * ist damit auch in fünf Jahren noch wartbar.
 */

import { h, leeren, toast, dialogOeffnen } from './ui.js';
import * as store from './store.js';
import {
  aktuellesSchuljahr,
  schuljahrFuer,
  BUNDESLAENDER,
  bundesland,
  schulformenFuer,
} from './model.js';
import { baueJahreskalender, urlaubsvorschlag } from './soll.js';
import { iso } from './kalender.js';
import { erinnerungEinrichten } from './erinnerung.js';
import { speicherSichern, iosHinweisNoetig, iosHinweisMerken } from './geraet.js';

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

// Dauerhaften Speicher anfordern, damit der Browser die Daten nicht bei
// Platzmangel wegräumt.
speicherSichern();

// Auf dem iPhone ohne Installation drohen die Daten nach sieben Tagen ohne
// Nutzung verloren zu gehen. Das ist kein Detail, das man in die Einstellungen
// schreibt - das gehört einmal deutlich auf den Bildschirm. Aber erst, wenn die
// Ersteinrichtung durch ist: zwei gestapelte Dialoge beim allerersten Start
// sind eine Zumutung.
if (iosHinweisNoetig()) setTimeout(iosHinweisWennFrei, 1500);

function iosHinweisWennFrei() {
  if (!iosHinweisNoetig()) return;
  if (document.querySelector('dialog[open]') || !store.get().einstellungen.setupFertig) {
    setTimeout(iosHinweisWennFrei, 2000);
    return;
  }
  iosHinweisZeigen();
}

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

/* ---------------------------- iOS-Speicherhinweis ------------------------ */

function iosHinweisZeigen() {
  dialogOeffnen((dialog, schliessen) => {
    dialog.append(
      h('h2', { text: 'Bitte zum Startbildschirm hinzufügen' }),
      h('p', {
        text:
          'Diese App speichert alles nur auf deinem Gerät – das ist gut für den Datenschutz, hat auf ' +
          'dem iPhone aber einen Haken: Safari löscht die Daten von Websites, die sieben Tage lang ' +
          'nicht geöffnet wurden. In den Ferien ist das schnell erreicht.',
      }),
      h('p', {
        text:
          'Wird die App zum Startbildschirm hinzugefügt, gilt diese Löschung nicht mehr. In Safari: ' +
          'auf das Teilen-Symbol tippen, dann „Zum Home-Bildschirm“.',
      }),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Unabhängig davon lohnt sich der Backup-Export unter „Mehr“ – etwa zu jedem Halbjahr. ' +
          'Er ist die einzige Sicherung, die einen Gerätewechsel übersteht.',
      }),
      h('div', { class: 'btn-reihe', style: 'justify-content:flex-end;margin-top:1rem' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Verstanden',
          onclick: () => {
            iosHinweisMerken();
            schliessen();
          },
        }),
      ]),
    );
  });
}

/* ------------------------------ Erstes Setup ----------------------------- */

/**
 * Kurzer Einstieg beim ersten Start: nur das Nötigste, damit die Soll-Zeit
 * stimmt. Alles Weitere findet sich unter "Mehr".
 */
function erstesSetup() {
  dialogOeffnen((dialog, schliessen) => {
    const landFeld = h(
      'select',
      { id: 's-bundesland' },
      BUNDESLAENDER.map((l) => h('option', { value: l.id, text: l.name })),
    );
    landFeld.value = 'SH';

    const schulform = h('select', { id: 's-schulform' });
    const vollzeit = h('input', {
      id: 's-vollzeit', type: 'number', min: '10', max: '35', step: '0.5', value: '27',
    });
    const vollzeitFeld = h('div', { class: 'feld' }, [
      h('label', { for: 's-vollzeit', text: 'Pflichtstunden einer Vollzeitkraft' }),
      vollzeit,
      h('p', {
        class: 'feld-hinweis',
        text: 'Die volle Stundenzahl deiner Schulform – auch wenn du selbst in Teilzeit arbeitest.',
      }),
    ]);
    const meine = h('input', { id: 's-meine', type: 'number', min: '0', max: '35', step: '0.5', value: '27' });

    // Die Schulformliste hängt am Bundesland: geprüfte Pflichtstundenzahlen gibt
    // es nur für Schleswig-Holstein, anderswo wird die Zahl selbst eingetragen.
    function schulformenFuellen() {
      const liste = schulformenFuer(landFeld.value);
      schulform.replaceChildren(
        ...liste.map((s) =>
          h('option', {
            value: s.id,
            text:
              s.id === 'eigen'
                ? 'Eigene Angabe'
                : `${s.name} – ${String(s.stunden).replace('.', ',')} Pflichtstunden`,
          }),
        ),
      );
      schulform.value = liste.some((s) => s.id === 'gemeinschaftsschule') ? 'gemeinschaftsschule' : 'eigen';
      schulform.disabled = liste.length === 1;
      // Ohne geprüfte Voreinstellung muss die Vollzeit-Stundenzahl mit abgefragt
      // werden. Sonst würde die App die eingetragene Zahl gegen einen geratenen
      // Vollzeitwert rechnen und eine Vollzeitkraft als Teilzeit führen.
      vollzeitFeld.hidden = schulform.value !== 'eigen';
      const gewaehlt = liste.find((s) => s.id === schulform.value);
      if (gewaehlt) {
        vollzeit.value = String(gewaehlt.stunden);
        meine.value = String(gewaehlt.stunden);
      }
    }
    schulformenFuellen();

    landFeld.addEventListener('change', schulformenFuellen);
    schulform.addEventListener('change', () => {
      const gewaehlt = schulformenFuer(landFeld.value).find((s) => s.id === schulform.value);
      vollzeitFeld.hidden = schulform.value !== 'eigen';
      if (gewaehlt) {
        vollzeit.value = String(gewaehlt.stunden);
        meine.value = String(gewaehlt.stunden);
      }
    });
    // Wer die Vollzeitzahl anhebt, meint in aller Regel auch für sich selbst
    // Vollzeit - erst eine bewusste Änderung unten macht daraus Teilzeit.
    vollzeit.addEventListener('change', () => {
      if (Number(meine.value) >= Number(vollzeit.value)) meine.value = vollzeit.value;
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
      h('div', { class: 'feld' }, [h('label', { for: 's-bundesland', text: 'Bundesland' }), landFeld]),
      h('div', { class: 'feld' }, [h('label', { for: 's-schulform', text: 'Schulform' }), schulform]),
      vollzeitFeld,
      h('div', { class: 'feld' }, [
        h('label', { for: 's-meine', text: 'Meine bewilligten Unterrichtsstunden' }),
        meine,
        h('p', {
          class: 'feld-hinweis',
          text:
            'Bei Vollzeit die volle Pflichtstundenzahl, bei Teilzeit die Zahl aus dem Bescheid – ' +
            'jeweils ohne Abzug von Ermäßigungsstunden. Die trägst du später unter "Mehr" ein.',
        }),
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
          'Das Bundesland bestimmt Wochenarbeitszeit und Feiertage. Geprüfte Pflichtstundenzahlen ' +
          'gibt es nur für Schleswig-Holstein – sonst bitte die Zahl aus dem eigenen Bescheid ' +
          'eintragen. Alles ist später unter „Mehr“ anpassbar.',
      }),
      h('div', { class: 'btn-reihe', style: 'justify-content:flex-end;margin-top:1rem' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Los geht es',
          onclick: () => {
            const gewaehlt = schulformenFuer(landFeld.value).find((s) => s.id === schulform.value);
            const voll =
              schulform.value === 'eigen'
                ? Number(vollzeit.value) || 27
                : gewaehlt
                  ? gewaehlt.stunden
                  : 27;
            const eigene = Number(meine.value) || voll;
            store.einstellungenSetzen({
              bundesland: landFeld.value,
              wochenarbeitszeit: bundesland(landFeld.value).wochenarbeitszeit,
              schulform: schulform.value,
              pflichtstundenVollzeit: voll,
              beschaeftigungsart: eigene < voll ? 'teilzeit' : 'vollzeit',
              teilzeitEingabe: 'stunden',
              teilzeitStunden: eigene,
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
