/**
 * Schülerdetail: Status, laufendes Verfahren, große Rückmeldeknöpfe, Historie.
 *
 * Der schnelle Weg bleibt auch hier ein Tipp. Die Bemerkung ist eingeklappt
 * und optional - sie darf den Ablauf nie aufhalten.
 */

import { h, toast, bestaetigen, dialog, feld } from '../ui.js';
import * as store from '../store.js';
import { darf } from '../identitaet.js';
import {
  ART,
  BEWERTUNG,
  LEVEL,
  STATUS,
  artMoeglich,
  datumLang,
  fristText,
  heuteIso,
  kategorie,
  name as vollerName,
  tageZwischen,
  zeitpunktLang,
} from '../model.js';
import { bilanzZeile, levelAbzeichen, markieren, statusAbzeichen } from './bausteine.js';
import { stimmen } from '../model.js';
import { abschlussDialog, verfahrenStartenDialog } from './verfahren.js';
import { produktivUrl, qrElement, rendererVorhanden, zielUrl } from '../qr.js';

export function schuelerView(ctx, schuelerId, { zurueck }) {
  const s = store.schueler(schuelerId);
  if (!s) return h('p', { class: 'leer-hinweis', text: 'Dieser Schüler ist nicht vorhanden.' });

  const benutzer = store.aktiverBenutzer();
  const heute = heuteIso();
  const v = store.offenesVerfahren(s.id);
  const status = store.statusDesSchuelers(s.id, heute);

  const kopf = h('div', { class: 'seiten-kopf' }, [
    h('div', {}, [
      h('button', { class: 'zurueck', text: `‹ ${zurueck.text}`, onclick: () => ctx.gehe(zurueck.pfad) }),
      h('h1', { text: vollerName(s) }),
      h('div', { class: 'kopf-marken' }, [
        levelAbzeichen(s.level, { gross: true }),
        statusAbzeichen(status, v),
        s.archiviert ? h('span', { class: 'status status-archiv', text: 'archiviert' }) : null,
      ]),
      h('p', { class: 'unter', text: gruppenText(s) }),
    ]),
  ]);

  const inhalt = [kopf];

  if (v) inhalt.push(verfahrensTafel(ctx, s, v, status, benutzer));
  else inhalt.push(normalTafel(ctx, s, benutzer));

  inhalt.push(historieTafel(s));

  if (darf(benutzer, 'level.aendern') || darf(benutzer, 'schueler.verwalten')) {
    inhalt.push(leitungsTafel(ctx, s, benutzer));
  }

  return h('div', { class: 'seite' }, inhalt);
}

function gruppenText(s) {
  const namen = s.gruppen.map((id) => (store.gruppe(id) ? store.gruppe(id).name : id));
  return namen.length ? `Lerngruppen: ${namen.join(', ')}` : 'Keiner Lerngruppe zugeordnet';
}

/* ------------------------------------------------- laufendes Verfahren --- */

function verfahrensTafel(ctx, s, v, status, benutzer) {
  const art = ART[v.art];
  const bilanz = store.bilanzVon(v.id);
  const dauer = tageZwischen(v.beginn, heuteIso());
  const bemerkung = h('textarea', {
    class: 'eingabe',
    rows: '2',
    placeholder: 'Optionale Bemerkung – wird mit der nächsten Rückmeldung gespeichert',
  });
  const bemerkungsBox = h('div', { class: 'bemerkung', hidden: true }, [feld('Bemerkung (optional)', bemerkung)]);

  const eigene = store.eigeneStimme(s.id);
  const knoepfe = h('div', { class: 'rueckmeldung gross' });
  for (const b of [BEWERTUNG.erfuellt, BEWERTUNG.teilweise, BEWERTUNG.nicht]) {
    const gewaehlt = eigene && eigene.wert === b.id;
    knoepfe.appendChild(
      h('button', {
        class: `rm-knopf rm-${b.id}${gewaehlt ? ' gewaehlt' : ''}`,
        type: 'button',
        'aria-pressed': gewaehlt ? 'true' : 'false',
        onclick: () => {
          const vorher = store.eigeneStimme(s.id);
          const r = store.rueckmeldungGeben(s.id, b.id, bemerkung.value);
          if (!r) return;
          if (r.unveraendert) {
            toast(`Deine Rückmeldung steht schon auf ${b.ikone} ${b.name}.`);
            return;
          }
          bemerkung.value = '';
          markieren(s.id, b.id);
          const altB = vorher ? BEWERTUNG[vorher.wert] : null;
          toast(altB ? `${b.ikone} ${b.name} · ersetzt ${altB.ikone} ${altB.name}` : `${b.ikone} ${b.name} gespeichert`, {
            text: 'Rückgängig',
            fn: () => {
              store.rueckmeldungStornieren(r.id, 'direkt zurückgenommen');
              toast(altB ? `Zurück auf ${altB.ikone} ${altB.name}.` : 'Rückmeldung zurückgenommen.');
            },
          });
        },
      }, [
        h('span', { class: 'rm-ikone', 'aria-hidden': 'true', text: b.ikone }),
        h('span', { class: 'rm-text', text: b.name.toUpperCase() }),
      ]),
    );
  }

  const entscheidung =
    status === STATUS.entscheidung.id
      ? h('div', { class: 'entscheidung-tafel' }, [
          h('p', { class: 'entscheidung-text', text: `⚠️ Frist erreicht (${datumLang(v.frist)}). Das Verfahren wartet auf eine Entscheidung.` }),
          darf(benutzer, 'verfahren.abschliessen')
            ? h('button', {
                class: 'knopf gross warnung',
                text: `${art.ikone} ${art.name.toUpperCase()} ABSCHLIESSEN`,
                onclick: () => abschlussDialog(s, v),
              })
            : h('p', { class: 'hinweis', text: 'Der Abschluss erfolgt durch die Klassenleitung.' }),
        ])
      : null;

  return h('section', { class: `tafel tafel-${v.art}` }, [
    h('div', { class: 'tafel-kopf' }, [
      h('h2', { text: `${art.ikone} ${art.aktivText}` }),
      h('span', { class: 'tafel-frist', text: fristText(v, heuteIso()) }),
    ]),
    h('p', { class: 'ziel-satz', text: `„${v.zieltext}“` }),
    h('p', { class: 'unter', text: `${kategorie(v.kategorieId).name} · Beginn ${datumLang(v.beginn)} · Frist ${datumLang(v.frist)} · ${dauer} ${dauer === 1 ? 'Tag' : 'Tage'} laufend` }),
    h('p', { class: 'unter', text: v.art === ART.floss.id ? `Gefährdet: Level ${v.startLevel} → ${v.zielLevel}` : `Möglicher Aufstieg: Level ${v.startLevel} → ${v.zielLevel}` }),
    h('div', { class: 'bilanz-gross' }, [
      bilanzZeile(bilanz, { klein: false }),
      h('span', {
        class: 'quote',
        text: bilanz.gesamt
          ? `${bilanz.gesamt} ${bilanz.gesamt === 1 ? 'Lehrkraft hat' : 'Lehrkräfte haben'} bewertet · Zielerreichung ${Math.round(bilanz.quote * 100)} %`
          : 'noch keine Rückmeldung',
      }),
    ]),
    entscheidung,
    knoepfe,
    h('p', {
      class: 'unter eigene-stimme',
      text: eigene
        ? `Deine Rückmeldung: ${BEWERTUNG[eigene.wert].ikone} ${BEWERTUNG[eigene.wert].name}. Ein Tipp auf eine andere Farbe ersetzt sie.`
        : 'Du hast in diesem Verfahren noch nicht bewertet. Jede Lehrkraft gibt eine Rückmeldung.',
    }),
    h('button', {
      class: 'text-knopf',
      type: 'button',
      text: '+ Bemerkung ergänzen (optional)',
      onclick: (e) => {
        bemerkungsBox.hidden = !bemerkungsBox.hidden;
        e.target.textContent = bemerkungsBox.hidden ? '+ Bemerkung ergänzen (optional)' : '– Bemerkung ausblenden';
        if (!bemerkungsBox.hidden) bemerkung.focus();
      },
    }),
    bemerkungsBox,
    rueckmeldungsListe(v, benutzer),
  ]);
}

function rueckmeldungsListe(v, benutzer) {
  const alle = store.rueckmeldungenZu(v.id);
  const eintraege = alle.slice().reverse();
  if (!eintraege.length) return null;
  // Gültig ist je Lehrkraft die letzte Rückmeldung; frühere sind ersetzt.
  const gueltigeIds = new Set(stimmen(alle).map((r) => r.id));
  const liste = h('ul', { class: 'rm-liste' });
  for (const r of eintraege) {
    const b = BEWERTUNG[r.wert];
    const ersetzt = !r.storniert && !gueltigeIds.has(r.id);
    liste.appendChild(
      h('li', { class: `rm-eintrag${r.storniert || ersetzt ? ' storniert' : ''}` }, [
        h('span', { class: 'rm-eintrag-ikone', 'aria-hidden': 'true', text: b.ikone }),
        h('span', { class: 'rm-eintrag-text' }, [
          h('strong', { text: b.name }),
          h('span', { class: 'unter', text: `${zeitpunktLang(r.datum)} · ${r.benutzerName}` }),
          r.bemerkung ? h('span', { class: 'rm-bemerkung', text: r.bemerkung }) : null,
          r.storniert ? h('span', { class: 'storno-marke', text: `zurückgenommen${r.stornoGrund ? `: ${r.stornoGrund}` : ''}` }) : null,
          ersetzt ? h('span', { class: 'storno-marke', text: 'später geändert' }) : null,
        ]),
        !r.storniert && !ersetzt && darf(benutzer, 'rueckmeldung.korrigieren')
          ? h('button', {
              class: 'text-knopf',
              text: 'korrigieren',
              onclick: async () => {
                const grund = await grundAbfragen();
                if (grund === null) return;
                store.rueckmeldungStornieren(r.id, grund);
                toast('Rückmeldung zurückgenommen. Die Korrektur bleibt in der Historie sichtbar.');
              },
            })
          : null,
      ]),
    );
  }
  return h('details', { class: 'aufklapp' }, [
    h('summary', {
      text: `Rückmeldungen dieses Verfahrens (${gueltigeIds.size} von ${eintraege.length} gültig)`,
    }),
    liste,
  ]);
}

function grundAbfragen() {
  return dialog('Rückmeldung korrigieren', (schliessen) => {
    const eingabe = h('input', { class: 'eingabe', type: 'text', placeholder: 'z. B. falscher Schüler' });
    return [
      h('p', { class: 'dialog-frage', text: 'Die Rückmeldung wird nicht gelöscht, sondern als zurückgenommen markiert. Der Grund erscheint in der Historie.' }),
      feld('Grund (optional)', eingabe),
      h('div', { class: 'dialog-fuss' }, [
        h('button', { class: 'knopf', text: 'Abbrechen', onclick: () => schliessen(null) }),
        h('button', { class: 'knopf primaer', text: 'Zurücknehmen', onclick: () => schliessen(eingabe.value.trim()) }),
      ]),
    ];
  });
}

/* ----------------------------------------------------- ohne Verfahren --- */

function normalTafel(ctx, s, benutzer) {
  const darfStarten = darf(benutzer, 'verfahren.starten');
  return h('section', { class: 'tafel' }, [
    h('div', { class: 'tafel-kopf' }, [h('h2', { text: '🟢 Status: Normal' })]),
    h('p', { class: 'unter', text: 'Es läuft kein Verfahren.' }),
    darfStarten
      ? h('div', { class: 'abschluss-knoepfe' }, [
          h('button', {
            class: 'knopf gross floss',
            type: 'button',
            disabled: !artMoeglich(ART.floss.id, s.level),
            text: '🛟 FLOSS STARTEN',
            onclick: () => verfahrenStartenDialog(s, ART.floss.id),
          }),
          h('button', {
            class: 'knopf gross bruecke',
            type: 'button',
            disabled: !artMoeglich(ART.bruecke.id, s.level),
            text: '🌉 BRÜCKE STARTEN',
            onclick: () => verfahrenStartenDialog(s, ART.bruecke.id),
          }),
        ])
      : h('p', { class: 'hinweis', text: 'Keine Berechtigung, ein Verfahren zu starten.' }),
    !artMoeglich(ART.floss.id, s.level)
      ? h('p', { class: 'hinweis', text: 'Level 1: ein Abstieg ist nicht möglich, deshalb kein Floß.' })
      : null,
    !artMoeglich(ART.bruecke.id, s.level)
      ? h('p', { class: 'hinweis', text: 'Level 4: ein Aufstieg ist nicht möglich, deshalb keine Brücke.' })
      : null,
  ]);
}

/* --------------------------------------------------------- Historie ----- */

function historieTafel(s) {
  const alle = store.historieVon(s.id);
  const GRENZE = 12;
  let vollstaendig = alle.length <= GRENZE;

  const liste = h('ol', { class: 'historie' });
  const mehrKnopf = h('button', {
    class: 'text-knopf',
    type: 'button',
    hidden: vollstaendig,
    text: `Alle ${alle.length} Einträge anzeigen`,
    onclick: () => {
      vollstaendig = true;
      mehrKnopf.hidden = true;
      zeichnen();
    },
  });

  function zeichnen() {
    const ereignisse = vollstaendig ? alle : alle.slice(0, GRENZE);
    liste.replaceChildren();
    for (const e of ereignisse) {
      liste.appendChild(
        h('li', { class: `historie-eintrag typ-${e.typ.replace('.', '-')}` }, [
          h('span', { class: 'historie-datum', text: datumLang(e.zeit.slice(0, 10)) }),
          h('span', { class: 'historie-ikone', 'aria-hidden': 'true', text: e.ikone }),
          h('span', { class: 'historie-text' }, [
            h('strong', { text: e.titel }),
            e.text ? h('span', { text: e.text }) : null,
            h('span', { class: 'unter', text: `${zeitpunktLang(e.zeit)} · ${e.benutzerName}` }),
          ]),
        ]),
      );
    }
    if (!ereignisse.length) {
      liste.appendChild(h('li', { class: 'leer-hinweis', text: 'Noch keine Einträge.' }));
    }
  }

  zeichnen();

  return h('section', { class: 'tafel' }, [
    h('div', { class: 'tafel-kopf' }, [h('h2', { text: 'Historie' })]),
    h('p', {
      class: 'unter',
      text: 'Einträge werden nie überschrieben. Korrekturen erscheinen als eigener Eintrag.',
    }),
    liste,
    mehrKnopf,
  ]);
}

/* -------------------------------------------------- Leitung / Zugang ---- */

function leitungsTafel(ctx, s, benutzer) {
  const teile = [];

  if (darf(benutzer, 'level.aendern')) {
    const wahl = h('div', { class: 'kategorien' });
    for (const l of LEVEL) {
      wahl.appendChild(
        h('button', {
          class: `chip level-chip level-${l}${s.level === l ? ' aktiv' : ''}`,
          type: 'button',
          text: `Level ${l}`,
          onclick: async () => {
            if (s.level === l) return;
            const ok = await bestaetigen(
              'Level ändern',
              `${vollerName(s)} wird von Level ${s.level} auf Level ${l} gesetzt. Die Änderung wird protokolliert.`,
              `Level ${l} setzen`,
              l < s.level,
            );
            if (!ok) return;
            store.levelSetzen(s.id, l, 'manuell durch Klassenleitung');
            toast(`Level auf ${l} gesetzt.`);
          },
        }),
      );
    }
    teile.push(h('h3', { class: 'unter', text: 'Level manuell setzen' }), wahl);
  }

  if (darf(benutzer, 'schueler.verwalten')) {
    teile.push(
      h('div', { class: 'knopf-reihe' }, [
        h('button', { class: 'knopf', text: 'Stammdaten bearbeiten', onclick: () => ctx.gehe(`/verwaltung?schueler=${s.id}`) }),
        h('button', {
          class: 'knopf',
          text: s.archiviert ? 'Archivierung aufheben' : 'Schüler archivieren',
          onclick: async () => {
            const ok = await bestaetigen(
              s.archiviert ? 'Archivierung aufheben' : 'Schüler archivieren',
              s.archiviert
                ? `${vollerName(s)} erscheint wieder in den Lerngruppen.`
                : `${vollerName(s)} erscheint nicht mehr in den Lerngruppen. Historie und Verfahren bleiben erhalten.`,
              s.archiviert ? 'Aufheben' : 'Archivieren',
              !s.archiviert,
            );
            if (!ok) return;
            store.schuelerArchivieren(s.id, !s.archiviert);
          },
        }),
      ]),
    );

    teile.push(h('h3', { class: 'unter', text: 'Zugang / QR-Code' }), zugangsTafel(s));
  }

  if (!teile.length) return null;
  return h('section', { class: 'tafel' }, [h('div', { class: 'tafel-kopf' }, [h('h2', { text: 'Klassenleitung' })]), ...teile]);
}

function zugangsTafel(s) {
  const box = h('div', { class: 'qr-box' });
  const grafik = qrElement(s, 160);
  box.appendChild(
    grafik ||
      h('div', { class: 'qr-platzhalter' }, [
        h('span', { 'aria-hidden': 'true', text: '▣' }),
        h('span', { class: 'unter', text: 'QR-Grafik folgt mit der Produktivversion' }),
      ]),
  );
  box.appendChild(
    h('div', { class: 'qr-text' }, [
      h('p', { class: 'unter', text: 'Der Code enthält ausschließlich diese Adresse – keinen Namen, kein Level, keinen Status.' }),
      h('code', { class: 'token', text: produktivUrl(s) }),
      h('p', { class: 'unter', text: 'Im Prototyp erreichbar über:' }),
      h('a', { class: 'token-link', href: zielUrl(s, { absolut: false }), text: zielUrl(s, { absolut: false }) }),
      h('p', { class: 'hinweis', text: rendererVorhanden() ? '' : 'Die Adresse bleibt dauerhaft gleich – auch bei Level- oder Statuswechsel.' }),
    ]),
  );
  return box;
}
