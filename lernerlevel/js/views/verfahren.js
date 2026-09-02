/**
 * Dialoge zum Starten und Abschließen eines Verfahrens.
 *
 * Beide sind bewusst kurz: Ziel antippen, Frist antippen, starten. Freitext
 * ist möglich, aber nie nötig - die Vorschläge decken den Regelfall ab.
 */

import { h, dialog, bestaetigen, toast, feld } from '../ui.js';
import * as store from '../store.js';
import {
  ART,
  ZIEL_KATEGORIEN,
  abschlussOptionen,
  abstiegsLevel,
  artMoeglich,
  aufstiegsLevel,
  datumLang,
  heuteIso,
  kategorie,
  name as vollerName,
  tageVersetzt,
} from '../model.js';

export function verfahrenStartenDialog(schueler, artId) {
  const art = ART[artId];
  if (!artMoeglich(artId, schueler.level)) {
    const grund =
      artId === ART.floss.id
        ? 'Level 1 ist das niedrigste Level - ein Abstieg ist nicht möglich.'
        : 'Level 4 ist das höchste Level - ein Aufstieg ist nicht möglich.';
    toast(grund);
    return Promise.resolve(null);
  }

  const zielLevel = artId === ART.floss.id ? abstiegsLevel(schueler.level) : aufstiegsLevel(schueler.level);
  const zustand = {
    kategorieId: 'arbeitsverhalten',
    zieltext: '',
    beginn: heuteIso(),
    frist: tageVersetzt(14),
  };

  return dialog(`${art.ikone} ${art.langname} starten`, (schliessen) => {
    const zieltextFeld = h('textarea', {
      class: 'eingabe',
      rows: '2',
      placeholder: 'Ziel in einem Satz - oder oben einen Vorschlag antippen',
      oninput: (e) => {
        zustand.zieltext = e.target.value;
        pruefen();
      },
    });

    const vorschlagsBox = h('div', { class: 'vorschlaege' });
    const vorschlaegeZeichnen = () => {
      vorschlagsBox.replaceChildren();
      const k = kategorie(zustand.kategorieId);
      if (!k.vorschlaege.length) {
        vorschlagsBox.appendChild(
          h('p', { class: 'hinweis', text: 'Individuelle Vereinbarung: Ziel bitte unten eintragen.' }),
        );
        return;
      }
      for (const v of k.vorschlaege) {
        vorschlagsBox.appendChild(
          h('button', {
            class: `vorschlag${zustand.zieltext === v ? ' aktiv' : ''}`,
            type: 'button',
            text: v,
            onclick: () => {
              zustand.zieltext = v;
              zieltextFeld.value = v;
              vorschlaegeZeichnen();
              pruefen();
            },
          }),
        );
      }
    };

    const kategorieWahl = h('div', { class: 'kategorien' });
    const kategorienZeichnen = () => {
      kategorieWahl.replaceChildren();
      for (const k of ZIEL_KATEGORIEN) {
        kategorieWahl.appendChild(
          h('button', {
            class: `chip${k.id === zustand.kategorieId ? ' aktiv' : ''}`,
            type: 'button',
            text: k.name,
            onclick: () => {
              zustand.kategorieId = k.id;
              kategorienZeichnen();
              vorschlaegeZeichnen();
            },
          }),
        );
      }
    };

    const beginnFeld = h('input', {
      class: 'eingabe',
      type: 'date',
      value: zustand.beginn,
      oninput: (e) => {
        zustand.beginn = e.target.value;
        pruefen();
      },
    });
    const fristFeld = h('input', {
      class: 'eingabe',
      type: 'date',
      value: zustand.frist,
      oninput: (e) => {
        zustand.frist = e.target.value;
        fristSchnellZeichnen();
        pruefen();
      },
    });

    const fristSchnell = h('div', { class: 'kategorien' });
    const fristSchnellZeichnen = () => {
      fristSchnell.replaceChildren();
      for (const [text, tage] of [
        ['1 Woche', 7],
        ['2 Wochen', 14],
        ['3 Wochen', 21],
        ['4 Wochen', 28],
      ]) {
        const datum = tageVersetzt(tage, new Date(`${zustand.beginn}T12:00:00`));
        fristSchnell.appendChild(
          h('button', {
            class: `chip${zustand.frist === datum ? ' aktiv' : ''}`,
            type: 'button',
            text,
            onclick: () => {
              zustand.frist = datum;
              fristFeld.value = datum;
              fristSchnellZeichnen();
              pruefen();
            },
          }),
        );
      }
    };

    const fehler = h('p', { class: 'fehler', hidden: true });
    const startKnopf = h('button', {
      class: `knopf gross ${artId === ART.floss.id ? 'floss' : 'bruecke'}`,
      type: 'button',
      text: `${art.ikone} ${art.name.toUpperCase()} STARTEN`,
      onclick: () => {
        if (!pruefen(true)) return;
        const v = store.verfahrenStarten({
          schuelerId: schueler.id,
          art: artId,
          kategorieId: zustand.kategorieId,
          zieltext: zustand.zieltext,
          beginn: zustand.beginn,
          frist: zustand.frist,
        });
        if (!v) {
          toast('Es läuft bereits ein Verfahren für diesen Schüler.');
          return;
        }
        toast(`${art.ikone} ${art.name} gestartet · ${vollerName(schueler)}`);
        schliessen(v);
      },
    });

    function pruefen(zeigen = false) {
      const probleme = [];
      if (!zustand.zieltext.trim()) probleme.push('Bitte ein Ziel auswählen oder eintragen.');
      if (zustand.frist <= zustand.beginn) probleme.push('Die Frist muss nach dem Beginn liegen.');
      const ok = probleme.length === 0;
      // Der Startknopf bleibt bedienbar: ein grauer Knopf ohne Begründung
      // ist eine Sackgasse. Beim Antippen erscheint stattdessen der Hinweis.
      // Vorher bleibt das Formular ruhig.
      if (ok) {
        fehler.hidden = true;
      } else if (zeigen) {
        fehler.textContent = probleme[0];
        fehler.hidden = false;
      }
      return ok;
    }

    kategorienZeichnen();
    vorschlaegeZeichnen();
    fristSchnellZeichnen();
    pruefen();

    return [
      h('div', { class: 'dialog-kopfzeile' }, [
        h('strong', { text: vollerName(schueler) }),
        h('span', { class: `level level-${schueler.level}`, text: `Level ${schueler.level}` }),
        h('span', {
          class: `richtung ${artId === ART.floss.id ? 'ab' : 'auf'}`,
          text:
            artId === ART.floss.id
              ? `gefährdet: Level ${schueler.level} → ${zielLevel}`
              : `möglicher Aufstieg: Level ${schueler.level} → ${zielLevel}`,
        }),
      ]),
      h('h3', { class: 'unter', text: 'Ziel / Grund' }),
      kategorieWahl,
      vorschlagsBox,
      feld('Zieltext', zieltextFeld),
      h('div', { class: 'zwei-spalten' }, [
        feld('Beginn', beginnFeld),
        feld('Frist', fristFeld),
      ]),
      fristSchnell,
      fehler,
      h('div', { class: 'dialog-fuss' }, [
        h('button', { class: 'knopf', type: 'button', text: 'Abbrechen', onclick: () => schliessen(null) }),
        startKnopf,
      ]),
    ];
  });
}

/**
 * Abschluss eines Verfahrens. Hier ist eine Rückfrage ausdrücklich erwünscht:
 * ein Levelwechsel ist die folgenreichste Aktion der App.
 */
export async function abschlussDialog(schueler, verfahren) {
  const art = ART[verfahren.art];
  const optionen = abschlussOptionen(verfahren);
  const bilanz = store.bilanzVon(verfahren.id);

  const wahl = await dialog(`${art.ikone} ${art.langname} abschließen`, (schliessen) => [
    h('div', { class: 'dialog-kopfzeile' }, [
      h('strong', { text: vollerName(schueler) }),
      h('span', { class: `level level-${schueler.level}`, text: `Level ${schueler.level}` }),
      h('span', { class: 'zeile-dauer', text: `${datumLang(verfahren.beginn)} – ${datumLang(verfahren.frist)}` }),
    ]),
    h('p', { class: 'ziel-satz', text: `„${verfahren.zieltext}“` }),
    h('p', { class: 'bilanz-satz' }, [
      h('span', { text: `Rückmeldungen: 🟢 ${bilanz.erfuellt} · 🟡 ${bilanz.teilweise} · 🔴 ${bilanz.nicht}` }),
      bilanz.quote !== null
        ? h('span', { class: 'quote', text: ` · Zielerreichung ${Math.round(bilanz.quote * 100)} %` })
        : null,
    ]),
    h(
      'div',
      { class: 'abschluss-knoepfe' },
      optionen.map((o) =>
        h('button', {
          class: `knopf gross ton-${o.ton}`,
          type: 'button',
          text: `${o.ikone} ${o.text.toUpperCase()}`,
          onclick: () => schliessen(o),
        }),
      ),
    ),
    h('div', { class: 'dialog-fuss' }, [
      h('button', { class: 'knopf', type: 'button', text: 'Später entscheiden', onclick: () => schliessen(null) }),
    ]),
  ]);

  if (!wahl) return null;

  const wechsel = wahl.neuesLevel !== schueler.level;
  const ok = await bestaetigen(
    wechsel ? 'Levelwechsel bestätigen' : 'Abschluss bestätigen',
    wechsel
      ? `${vollerName(schueler)} wechselt von Level ${schueler.level} auf Level ${wahl.neuesLevel}. Der Vorgang bleibt in der Historie nachvollziehbar.`
      : `${vollerName(schueler)} behält Level ${schueler.level}. Das Verfahren wird abgeschlossen.`,
    wechsel ? `Level ${wahl.neuesLevel} setzen` : 'Abschließen',
    wahl.id === 'abstieg',
  );
  if (!ok) return null;

  store.verfahrenAbschliessen(verfahren.id, wahl);
  toast(`${wahl.ikone} ${wahl.text} · ${vollerName(schueler)}`);
  return wahl;
}

/** Auswahl Floß/Brücke, wenn ein Verfahren aus der Übersicht gestartet wird. */
export function artWahlDialog(schueler) {
  return dialog('Verfahren starten', (schliessen) => [
    h('div', { class: 'dialog-kopfzeile' }, [
      h('strong', { text: vollerName(schueler) }),
      h('span', { class: `level level-${schueler.level}`, text: `Level ${schueler.level}` }),
    ]),
    h('div', { class: 'abschluss-knoepfe' }, [
      h('button', {
        class: 'knopf gross floss',
        type: 'button',
        disabled: !artMoeglich(ART.floss.id, schueler.level),
        text: '🛟 FLOSS STARTEN',
        onclick: () => schliessen(ART.floss.id),
      }),
      h('button', {
        class: 'knopf gross bruecke',
        type: 'button',
        disabled: !artMoeglich(ART.bruecke.id, schueler.level),
        text: '🌉 BRÜCKE STARTEN',
        onclick: () => schliessen(ART.bruecke.id),
      }),
    ]),
  ]).then((artId) => (artId ? verfahrenStartenDialog(schueler, artId) : null));
}
