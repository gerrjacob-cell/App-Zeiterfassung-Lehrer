/**
 * Verwaltung: Schüler, Lerngruppen, Daten.
 *
 * Nur für Klassenleitung/Administration. Ein Schüler hat genau EINEN
 * Datensatz und kann mehreren Lerngruppen zugeordnet sein - deshalb wird hier
 * die Zuordnung bearbeitet, nicht der Schüler kopiert.
 */

import { h, dialog, bestaetigen, toast, feld } from '../ui.js';
import * as store from '../store.js';
import { darf } from '../identitaet.js';
import { LEVEL, name as vollerName, sortierName } from '../model.js';
import { vorschau, zusammenfassung } from '../import.js';
import { levelAbzeichen } from './bausteine.js';

const zustand = { reiter: 'schueler', suche: '', mitArchiv: false };

export function verwaltungView(ctx, abfrage) {
  const benutzer = store.aktiverBenutzer();
  if (!darf(benutzer, 'schueler.verwalten')) {
    return h('div', { class: 'seite' }, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('p', { class: 'leer-hinweis', text: 'Die Verwaltung ist der Klassenleitung vorbehalten.' }),
    ]);
  }

  if (abfrage && abfrage.schueler) {
    const s = store.schueler(abfrage.schueler);
    if (s) {
      zustand.reiter = 'schueler';
      queueMicrotask(() => schuelerDialog(s).then(() => ctx.gehe('/verwaltung')));
    }
  }

  const kopf = h('div', { class: 'seiten-kopf' }, [
    h('div', {}, [
      h('button', { class: 'zurueck', text: '‹ Lerngruppen', onclick: () => ctx.gehe('/') }),
      h('h1', { text: 'Verwaltung' }),
      h('p', { class: 'unter', text: 'Schülerdatensätze, Lerngruppen und Daten des Prototyps' }),
    ]),
    h('button', { class: 'knopf', text: '📜 Protokoll', onclick: () => ctx.gehe('/protokoll') }),
  ]);

  const reiterLeiste = h('div', { class: 'filter-reihe' });
  for (const [id, text] of [
    ['schueler', 'Schüler'],
    ['gruppen', 'Lerngruppen'],
    ['daten', 'Daten'],
  ]) {
    reiterLeiste.appendChild(
      h('button', {
        class: `chip gross${zustand.reiter === id ? ' aktiv' : ''}`,
        type: 'button',
        text,
        onclick: () => {
          zustand.reiter = id;
          ctx.neuZeichnen();
        },
      }),
    );
  }

  const inhalt =
    zustand.reiter === 'schueler'
      ? schuelerBereich(ctx)
      : zustand.reiter === 'gruppen'
        ? gruppenBereich(ctx)
        : datenBereich(ctx);

  return h('div', { class: 'seite' }, [kopf, reiterLeiste, inhalt]);
}

/* ---------------------------------------------------------- Schüler ----- */

function schuelerBereich(ctx) {
  const stand = store.getStand();
  const suche = zustand.suche.trim().toLowerCase();
  const liste = stand.schueler
    .filter((s) => (zustand.mitArchiv || !s.archiviert) && (!suche || vollerName(s).toLowerCase().includes(suche)))
    .sort(sortierName);

  const tabelle = h('div', { class: 'verwaltungs-liste' });
  for (const s of liste) {
    const gruppenNamen = s.gruppen.map((id) => (store.gruppe(id) ? store.gruppe(id).name : '?')).join(', ');
    tabelle.appendChild(
      h('article', { class: `verwaltungs-zeile${s.archiviert ? ' archiviert' : ''}` }, [
        h('div', { class: 'zeile-text' }, [
          h('div', { class: 'zeile-kopf' }, [
            h('span', { class: 'zeile-name', text: vollerName(s) }),
            levelAbzeichen(s.level),
            s.archiviert ? h('span', { class: 'status status-archiv', text: 'archiviert' }) : null,
          ]),
          h('span', { class: 'unter', text: gruppenNamen || 'keine Lerngruppe' }),
        ]),
        h('div', { class: 'knopf-reihe' }, [
          h('button', { class: 'knopf', text: 'Bearbeiten', onclick: () => schuelerDialog(s) }),
          h('button', {
            class: 'knopf',
            text: s.archiviert ? 'Aktivieren' : 'Archivieren',
            onclick: async () => {
              const ok = await bestaetigen(
                s.archiviert ? 'Archivierung aufheben' : 'Schüler archivieren',
                s.archiviert
                  ? `${vollerName(s)} erscheint wieder in den Lerngruppen.`
                  : `${vollerName(s)} erscheint nicht mehr in den Lerngruppen. Historie und Verfahren bleiben erhalten.`,
                s.archiviert ? 'Aufheben' : 'Archivieren',
                !s.archiviert,
              );
              if (ok) store.schuelerArchivieren(s.id, !s.archiviert);
            },
          }),
        ]),
      ]),
    );
  }
  if (!liste.length) tabelle.appendChild(h('p', { class: 'leer-hinweis', text: 'Kein Treffer.' }));

  return h('section', { class: 'tafel' }, [
    h('div', { class: 'tafel-kopf' }, [
      h('h2', { text: `Schüler (${liste.length})` }),
      h('div', { class: 'knopf-reihe' }, [
        h('button', { class: 'knopf', text: '⇪ Klassenliste importieren', onclick: () => importDialog() }),
        h('button', { class: 'knopf primaer', text: '+ Schüler hinzufügen', onclick: () => schuelerDialog(null) }),
      ]),
    ]),
    h('div', { class: 'werkzeugleiste' }, [
      h('input', {
        class: 'suche',
        type: 'search',
        placeholder: 'Namen suchen…',
        value: zustand.suche,
        oninput: (e) => {
          zustand.suche = e.target.value;
          ctx.neuZeichnen();
        },
      }),
      h('label', { class: 'schalter' }, [
        h('input', {
          type: 'checkbox',
          checked: zustand.mitArchiv,
          onchange: (e) => {
            zustand.mitArchiv = e.target.checked;
            ctx.neuZeichnen();
          },
        }),
        h('span', { text: 'Archivierte anzeigen' }),
      ]),
    ]),
    tabelle,
  ]);
}

function schuelerDialog(vorhanden) {
  const stand = store.getStand();
  const titel = vorhanden ? 'Schüler bearbeiten' : 'Schüler hinzufügen';
  const gewaehlt = new Set(vorhanden ? vorhanden.gruppen : []);
  let level = vorhanden ? vorhanden.level : 2;

  return dialog(titel, (schliessen) => {
    const vorname = h('input', { class: 'eingabe', type: 'text', value: vorhanden ? vorhanden.vorname : '', autocomplete: 'off' });
    const nachname = h('input', { class: 'eingabe', type: 'text', value: vorhanden ? vorhanden.nachname : '', autocomplete: 'off' });

    const levelWahl = h('div', { class: 'kategorien' });
    const levelZeichnen = () => {
      levelWahl.replaceChildren();
      for (const l of LEVEL) {
        levelWahl.appendChild(
          h('button', {
            class: `chip level-chip level-${l}${level === l ? ' aktiv' : ''}`,
            type: 'button',
            text: `Level ${l}`,
            onclick: () => {
              level = l;
              levelZeichnen();
            },
          }),
        );
      }
    };
    levelZeichnen();

    const gruppenWahl = h('div', { class: 'kategorien' });
    const gruppenZeichnen = () => {
      gruppenWahl.replaceChildren();
      for (const g of stand.gruppen) {
        gruppenWahl.appendChild(
          h('button', {
            class: `chip${gewaehlt.has(g.id) ? ' aktiv' : ''}`,
            type: 'button',
            text: g.name,
            onclick: () => {
              gewaehlt.has(g.id) ? gewaehlt.delete(g.id) : gewaehlt.add(g.id);
              gruppenZeichnen();
            },
          }),
        );
      }
    };
    gruppenZeichnen();

    const fehler = h('p', { class: 'fehler', hidden: true });

    return [
      h('div', { class: 'zwei-spalten' }, [feld('Vorname', vorname), feld('Nachname', nachname)]),
      h('h3', { class: 'unter', text: 'Aktuelles Level' }),
      levelWahl,
      h('h3', { class: 'unter', text: 'Lerngruppen' }),
      gruppenWahl,
      h('p', { class: 'hinweis', text: 'Ein Schüler kann in mehreren Lerngruppen sein und behält trotzdem einen einzigen Datensatz.' }),
      vorhanden
        ? h('p', { class: 'hinweis', text: `Interne ID: ${vorhanden.id} · angelegt am ${vorhanden.angelegtAm}` })
        : null,
      fehler,
      h('div', { class: 'dialog-fuss' }, [
        h('button', { class: 'knopf', text: 'Abbrechen', onclick: () => schliessen(null) }),
        h('button', {
          class: 'knopf primaer',
          text: vorhanden ? 'Speichern' : 'Anlegen',
          onclick: () => {
            if (!vorname.value.trim() || !nachname.value.trim()) {
              fehler.textContent = 'Vorname und Nachname werden benötigt.';
              fehler.hidden = false;
              return;
            }
            if (vorhanden) {
              const altesLevel = vorhanden.level;
              store.schuelerBearbeiten(vorhanden.id, {
                vorname: vorname.value.trim(),
                nachname: nachname.value.trim(),
                gruppen: [...gewaehlt],
              });
              if (altesLevel !== level) store.levelSetzen(vorhanden.id, level, 'Korrektur in der Verwaltung');
              toast('Gespeichert.');
            } else {
              store.schuelerAnlegen({
                vorname: vorname.value.trim(),
                nachname: nachname.value.trim(),
                level,
                gruppen: [...gewaehlt],
              });
              toast('Schüler angelegt.');
            }
            schliessen(true);
          },
        }),
      ]),
    ];
  });
}

/* ------------------------------------------------------------- Import --- */

/**
 * Klassenliste einlesen: einfügen oder Datei wählen, Vorschau prüfen,
 * übernehmen. Kein Name muss abgetippt werden.
 *
 * Die Vorschau ist der eigentliche Kern: sie zeigt vor dem Speichern, was
 * ankommt, was schon da ist und was nicht gelesen werden konnte.
 */
function importDialog() {
  const stand = store.getStand();
  const zustand = {
    text: '',
    gruppenName: '',
    standardLevel: 2,
    nachnameZuerst: false,
    ergebnis: { zeilen: [], trenner: null, kopfzeile: false, gruppen: [] },
  };

  return dialog('Klassenliste importieren', (schliessen) => {
    const feldText = h('textarea', {
      class: 'eingabe',
      rows: '3',
      placeholder: 'Liste hier einfügen – eine Zeile je Schüler.\nZum Beispiel: Mustermann, Max',
      oninput: (e) => {
        zustand.text = e.target.value;
        neuLesen();
      },
    });

    const datei = h('input', {
      type: 'file',
      accept: '.csv,.txt,.tsv,text/plain,text/csv',
      class: 'eingabe',
      onchange: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const leser = new FileReader();
        leser.onload = () => {
          zustand.text = String(leser.result || '');
          feldText.value = zustand.text;
          neuLesen();
        };
        leser.readAsText(f, 'utf-8');
      },
    });

    const gruppenFeld = h('input', {
      class: 'eingabe',
      type: 'text',
      list: 'gruppen-liste',
      placeholder: 'z. B. 7a – neue Lerngruppe wird angelegt',
      oninput: (e) => {
        zustand.gruppenName = e.target.value;
        neuLesen();
      },
    });
    const gruppenListe = h(
      'datalist',
      { id: 'gruppen-liste' },
      stand.gruppen.map((g) => h('option', { value: g.name })),
    );

    const levelWahl = h('div', { class: 'kategorien' });
    const levelZeichnen = () => {
      levelWahl.replaceChildren();
      for (const l of LEVEL) {
        levelWahl.appendChild(
          h('button', {
            class: `chip level-chip level-${l}${zustand.standardLevel === l ? ' aktiv' : ''}`,
            type: 'button',
            text: `Level ${l}`,
            onclick: () => {
              zustand.standardLevel = l;
              levelZeichnen();
              neuLesen();
            },
          }),
        );
      }
    };
    levelZeichnen();

    const reihenfolge = h('label', { class: 'schalter' }, [
      h('input', {
        type: 'checkbox',
        onchange: (e) => {
          zustand.nachnameZuerst = e.target.checked;
          neuLesen();
        },
      }),
      h('span', { text: 'Ohne Trennzeichen: Nachname steht vorn' }),
    ]);

    const bilanzZeile = h('p', { class: 'unter' });
    const tabelle = h('div', { class: 'import-vorschau' });
    const uebernehmen = h('button', {
      class: 'knopf primaer gross',
      type: 'button',
      text: 'Übernehmen',
      onclick: () => {
        const bericht = store.listeImportieren(zustand.ergebnis.zeilen);
        toast(
          `${bericht.angelegt} angelegt, ${bericht.ergaenzt} zugeordnet` +
            (bericht.gruppen.length ? ` · neu: ${bericht.gruppen.join(', ')}` : ''),
        );
        schliessen(bericht);
      },
    });

    function neuLesen() {
      zustand.ergebnis = vorschau(
        zustand.text,
        {
          nachnameZuerst: zustand.nachnameZuerst,
          standardLevel: zustand.standardLevel,
          gruppenName: zustand.gruppenName,
        },
        stand,
      );
      const z = zusammenfassung(zustand.ergebnis.zeilen);
      const uebernehmbar = z.neu + z.ergaenzt;

      const erkannt = zustand.ergebnis.trenner
        ? { ';': 'Semikolon', '\t': 'Tabulator', ',': 'Komma' }[zustand.ergebnis.trenner]
        : 'kein Trennzeichen';
      bilanzZeile.textContent = z.gesamt
        ? `${z.gesamt} Zeilen gelesen (${erkannt}${zustand.ergebnis.kopfzeile ? ', mit Kopfzeile' : ''}) · ` +
          `${z.neu} neu, ${z.ergaenzt} schon vorhanden, ${z.doppelt} doppelt, ${z.fehler} unklar`
        : 'Noch nichts eingelesen.';

      tabelle.replaceChildren();
      for (const zeile of zustand.ergebnis.zeilen.slice(0, 60)) {
        tabelle.appendChild(
          h('div', { class: `import-zeile zustand-${zeile.zustand}` }, [
            h('span', { class: 'import-name', text: `${zeile.vorname} ${zeile.nachname}`.trim() || zeile.rohzeile }),
            h('span', { class: `level level-${zeile.level}`, text: `Level ${zeile.level}` }),
            h('span', { class: 'import-gruppe', text: zeile.gruppe || '—' }),
            h('span', { class: 'import-hinweis', text: zeile.hinweis }),
          ]),
        );
      }
      if (zustand.ergebnis.zeilen.length > 60) {
        tabelle.appendChild(
          h('p', { class: 'hinweis', text: `… und ${zustand.ergebnis.zeilen.length - 60} weitere Zeilen` }),
        );
      }

      uebernehmen.disabled = uebernehmbar === 0;
      uebernehmen.textContent = uebernehmbar
        ? `${uebernehmbar} Schüler übernehmen`
        : 'Übernehmen';
    }

    neuLesen();

    return [
      h('p', { class: 'hinweis', text: 'Liste aus der Schulverwaltung, aus IServ oder aus einer Excel-Spalte. Die Datei wird im Browser gelesen und nicht hochgeladen.' }),
      feld('Liste einfügen', feldText),
      feld('… oder Datei wählen', datei, 'CSV oder Textdatei, Semikolon, Komma oder Tabulator'),
      gruppenListe,
      h('div', { class: 'zwei-spalten' }, [
        feld('Lerngruppe', gruppenFeld, 'Leer lassen, wenn die Liste eine Spalte „Klasse“ hat'),
        h('div', { class: 'feld' }, [
          h('span', { class: 'feld-beschriftung', text: 'Level für neue Schüler' }),
          levelWahl,
        ]),
      ]),
      reihenfolge,
      h('h3', { class: 'unter', text: 'Vorschau' }),
      bilanzZeile,
      tabelle,
      h('p', { class: 'hinweis', text: 'Schüler, die es schon gibt, werden der Lerngruppe zugeordnet statt doppelt angelegt. Ihr Level bleibt unverändert.' }),
      h('div', { class: 'dialog-fuss' }, [
        h('button', { class: 'knopf', type: 'button', text: 'Abbrechen', onclick: () => schliessen(null) }),
        uebernehmen,
      ]),
    ];
  }, { breit: true });
}

/* -------------------------------------------------------- Lerngruppen --- */

function gruppenBereich(ctx) {
  const stand = store.getStand();
  const liste = h('div', { class: 'verwaltungs-liste' });
  for (const g of stand.gruppen) {
    const stat = store.statistik(g.id);
    liste.appendChild(
      h('article', { class: 'verwaltungs-zeile' }, [
        h('div', { class: 'zeile-text' }, [
          h('div', { class: 'zeile-kopf' }, [h('span', { class: 'zeile-name', text: g.name })]),
          h('span', { class: 'unter', text: `${stat.anzahl} Schüler · 🌉 ${stat.bruecke} · 🛟 ${stat.floss} · ⚠️ ${stat.entscheidung}${g.beschreibung ? ` · ${g.beschreibung}` : ''}` }),
        ]),
        h('div', { class: 'knopf-reihe' }, [
          h('button', { class: 'knopf', text: 'Öffnen', onclick: () => ctx.gehe(`/g/${g.id}`) }),
          h('button', { class: 'knopf', text: 'Bearbeiten', onclick: () => gruppenDialog(g) }),
        ]),
      ]),
    );
  }

  return h('section', { class: 'tafel' }, [
    h('div', { class: 'tafel-kopf' }, [
      h('h2', { text: `Lerngruppen (${stand.gruppen.length})` }),
      h('div', { class: 'knopf-reihe' }, [
        h('button', { class: 'knopf', text: '⇪ Aus Klassenliste anlegen', onclick: () => importDialog() }),
        h('button', { class: 'knopf primaer', text: '+ Lerngruppe anlegen', onclick: () => gruppenDialog(null) }),
      ]),
    ]),
    liste,
  ]);
}

function gruppenDialog(vorhanden) {
  return dialog(vorhanden ? 'Lerngruppe bearbeiten' : 'Lerngruppe anlegen', (schliessen) => {
    const name = h('input', { class: 'eingabe', type: 'text', value: vorhanden ? vorhanden.name : '' });
    const beschreibung = h('input', { class: 'eingabe', type: 'text', value: vorhanden ? vorhanden.beschreibung : '' });
    const fehler = h('p', { class: 'fehler', hidden: true });
    return [
      feld('Name', name, 'z. B. 7a oder FLEX'),
      feld('Beschreibung (optional)', beschreibung),
      fehler,
      h('div', { class: 'dialog-fuss' }, [
        h('button', { class: 'knopf', text: 'Abbrechen', onclick: () => schliessen(null) }),
        h('button', {
          class: 'knopf primaer',
          text: vorhanden ? 'Speichern' : 'Anlegen',
          onclick: () => {
            if (!name.value.trim()) {
              fehler.textContent = 'Ein Name wird benötigt.';
              fehler.hidden = false;
              return;
            }
            if (vorhanden) {
              store.gruppeBearbeiten(vorhanden.id, { name: name.value.trim(), beschreibung: beschreibung.value.trim() });
              toast('Gespeichert.');
            } else {
              store.gruppeAnlegen({ name: name.value, beschreibung: beschreibung.value });
              toast('Lerngruppe angelegt.');
            }
            schliessen(true);
          },
        }),
      ]),
    ];
  });
}

/* --------------------------------------------------------------- Daten --- */

function datenBereich(ctx) {
  const stand = store.getStand();
  return h('section', { class: 'tafel' }, [
    h('div', { class: 'tafel-kopf' }, [h('h2', { text: 'Daten des Prototyps' })]),
    h('p', { class: 'unter', text: `Speicherort: localStorage dieses Browsers · zuletzt geändert ${new Date(stand.zuletztGeaendert).toLocaleString('de-DE')}` }),
    h('p', { class: 'hinweis', text: 'Alle Namen sind frei erfunden. Es werden keine Daten an einen Server übertragen.' }),
    h('div', { class: 'knopf-reihe' }, [
      h('button', { class: 'knopf', text: '⬇︎ Daten exportieren (JSON)', onclick: exportieren }),
      h('button', {
        class: 'knopf',
        text: '↺ Demodaten zurücksetzen',
        onclick: async () => {
          const ok = await bestaetigen(
            'Demodaten zurücksetzen',
            'Alle Änderungen dieses Prototyps gehen verloren und der Ausgangsstand wird neu erzeugt.',
            'Zurücksetzen',
            true,
          );
          if (!ok) return;
          await store.zuruecksetzen();
          toast('Demodaten neu erzeugt.');
          ctx.gehe('/');
        },
      }),
      h('button', {
        class: 'knopf gefahr',
        text: '🗑 Alle Daten löschen',
        onclick: async () => {
          const ok = await bestaetigen(
            'Alle Daten löschen',
            'Der lokale Speicher wird geleert. Danach startet der Prototyp wieder mit dem Ausgangsstand.',
            'Endgültig löschen',
            true,
          );
          if (!ok) return;
          await store.alleDatenLoeschen();
          toast('Lokaler Speicher geleert.');
          ctx.gehe('/');
        },
      }),
    ]),
    h('h3', { class: 'unter', text: 'Konten des Prototyps' }),
    h(
      'div',
      { class: 'verwaltungs-liste' },
      stand.benutzer.map((b) =>
        h('article', { class: 'verwaltungs-zeile' }, [
          h('div', { class: 'zeile-text' }, [
            h('div', { class: 'zeile-kopf' }, [h('span', { class: 'zeile-name', text: b.name })]),
            h('span', {
              class: 'unter',
              text: `${b.rolle === 'leitung' ? 'Klassenleitung / Administration' : 'Lehrkraft'} · ${b.gruppen
                .map((id) => (store.gruppe(id) ? store.gruppe(id).name : '?'))
                .join(', ')}`,
            }),
          ]),
          b.id === stand.aktiverBenutzer
            ? h('span', { class: 'status status-normal', text: 'aktiv' })
            : h('button', {
                class: 'knopf',
                text: 'Konto wechseln',
                onclick: () => store.benutzerWechseln(b.id),
              }),
        ]),
      ),
    ),
    h('p', { class: 'hinweis', text: 'Der Prototyp hat bewusst kein Login. Für den Produktivbetrieb tritt hier eine echte Anmeldung an – siehe ARCHITEKTUR.md.' }),
  ]);
}

function exportieren() {
  const inhalt = store.exportieren();
  const blob = new Blob([inhalt], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lernerlevel-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Export erzeugt.');
}
