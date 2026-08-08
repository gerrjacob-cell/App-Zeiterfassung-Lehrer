/**
 * Einstellungen: Deputat, Arbeitszeitmodell, Ferien, Urlaub, Erinnerung und
 * die Datenverwaltung (Backup, Import, Löschen).
 */

import { h, toast, bestaetigen } from '../ui.js';
import * as store from '../store.js';
import { PFLICHTSTUNDEN_SH, schuljahrFuer } from '../model.js';
import { urlaubsvorschlag } from '../soll.js';
import { FERIEN_SH_VOREINSTELLUNG, ferienFuerSchuljahr } from '../kalender-sh.js';
import { deutschesDatum } from '../export.js';
import { erinnerungEinrichten } from '../erinnerung.js';

export function einstellungenView(ctx) {
  const stand = store.get();
  const einst = stand.einstellungen;
  const wurzel = h('div');

  /* ---------------------- Person und Deputat ------------------------ */

  const schulformFeld = h(
    'select',
    {
      id: 'e-schulform',
      onchange: (e) => {
        const gewaehlt = PFLICHTSTUNDEN_SH.find((s) => s.id === e.target.value);
        const patch = { schulform: e.target.value };
        if (gewaehlt && gewaehlt.id !== 'eigen') {
          // Wer Vollzeit arbeitet, soll nach dem Wechsel nicht plötzlich Teilzeit sein.
          const warVollzeit = Number(einst.pflichtstundenIst) === Number(einst.pflichtstundenSoll);
          patch.pflichtstundenSoll = gewaehlt.stunden;
          if (warVollzeit) patch.pflichtstundenIst = gewaehlt.stunden;
        }
        store.einstellungenSetzen(patch);
        ctx.neuZeichnen();
      },
    },
    PFLICHTSTUNDEN_SH.map((s) => h('option', { value: s.id, text: s.name })),
  );
  schulformFeld.value = einst.schulform;

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Person und Deputat' }),
      h('div', { class: 'feld' }, [
        h('label', { for: 'e-name', text: 'Name (nur für Ausdruck und Excel-Datei)' }),
        h('input', {
          id: 'e-name',
          type: 'text',
          value: einst.name,
          placeholder: 'optional',
          onchange: (e) => store.einstellungenSetzen({ name: e.target.value.trim() }),
        }),
        h('p', { class: 'feld-hinweis', text: 'Bleibt auf diesem Gerät. Geht nie in den anonymen Export ein.' }),
      ]),
      h('div', { class: 'feld' }, [
        h('label', { for: 'e-schulform', text: 'Schulform' }),
        schulformFeld,
      ]),
      h('div', { class: 'feld-reihe' }, [
        zahlFeld('e-pf-soll', 'Pflichtstunden bei Vollzeit', einst.pflichtstundenSoll, {
          min: 10,
          max: 35,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ pflichtstundenSoll: v }),
          ctx,
        }),
        zahlFeld('e-pf-ist', 'Meine Pflichtstunden', einst.pflichtstundenIst, {
          min: 0,
          max: 35,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ pflichtstundenIst: v }),
          ctx,
        }),
      ]),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Aus dem Verhältnis beider Werte ergibt sich der Beschäftigungsumfang und damit die ' +
          'Soll-Arbeitszeit. Bitte die Pflichtstundenzahl gegen die aktuelle Fassung der ' +
          'Pflichtstundenverordnung Schleswig-Holstein prüfen – die Voreinstellung ist nur ein Startwert.',
      }),
      h('div', { class: 'feld-reihe' }, [
        zahlFeld('e-alters', 'Altersermäßigung (Unterrichtsstunden)', einst.altersermaessigung, {
          min: 0,
          max: 6,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ altersermaessigung: v }),
          ctx,
        }),
        zahlFeld('e-anrechnung', 'Anrechnungsstunden', einst.anrechnungsstunden, {
          min: 0,
          max: 20,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ anrechnungsstunden: v }),
          ctx,
        }),
      ]),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Altersermäßigung und Anrechnungsstunden mindern die Unterrichtsverpflichtung, nicht die ' +
          'Arbeitszeit. Sie werden deshalb hier nur nachrichtlich geführt und verändern das Soll nicht.',
      }),
    ]),
  );

  /* ------------------------ Arbeitszeitmodell ----------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Arbeitszeitmodell' }),
      h('div', { class: 'feld-reihe' }, [
        zahlFeld('e-woche', 'Wöchentliche Arbeitszeit bei Vollzeit (Std.)', einst.wochenarbeitszeit, {
          min: 30,
          max: 48,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ wochenarbeitszeit: v }),
          ctx,
        }),
        zahlFeld('e-urlaub', 'Erholungsurlaub (Werktage im Jahr)', einst.urlaubstage, {
          min: 20,
          max: 40,
          step: 1,
          onSet: (v) => store.einstellungenSetzen({ urlaubstage: v }),
          ctx,
        }),
      ]),
      h('div', { class: 'hinweis' }, [
        h('strong', { text: 'Jahresarbeitszeitmodell. ' }),
        document.createTextNode(
          'Soll-Arbeitszeit besteht an jedem Werktag, der weder gesetzlicher Feiertag noch ' +
            'Erholungsurlaub noch Krankheitstag ist – auch in den Schulferien. Die Ferien sind kein ' +
            'Urlaub; Urlaub ist der oben eingetragene Anspruch. Genau diese Rechnung macht sichtbar, ' +
            'wie viel Arbeit in der unterrichtsfreien Zeit tatsächlich anfällt.',
        ),
      ]),
    ]),
  );

  /* -------------------------- Schuljahr ----------------------------- */

  const schuljahre = schuljahrAuswahl(einst.schuljahr);
  const sjFeld = h(
    'select',
    {
      id: 'e-schuljahr',
      onchange: (e) => {
        store.einstellungenSetzen({ schuljahr: e.target.value });
        ctx.neuZeichnen();
      },
    },
    schuljahre.map((s) => h('option', { value: s, text: s })),
  );
  sjFeld.value = einst.schuljahr;

  const ferien = ferienFuerSchuljahr(einst.schuljahr, stand.eigeneFerien);
  const ferienListe = h('table');
  ferienListe.append(
    h('thead', {}, [
      h('tr', {}, [
        h('th', { text: 'Ferien' }),
        h('th', { text: 'von' }),
        h('th', { text: 'bis' }),
        h('th', { text: '' }),
      ]),
    ]),
    h(
      'tbody',
      {},
      ferien.length
        ? ferien.map((f, i) =>
            h('tr', {}, [
              h('td', { text: f.name }),
              h('td', {}, [
                h('input', {
                  type: 'date',
                  value: f.von,
                  'aria-label': `${f.name} Beginn`,
                  onchange: (e) => ferienSetzen(einst.schuljahr, i, { von: e.target.value }, ctx),
                }),
              ]),
              h('td', {}, [
                h('input', {
                  type: 'date',
                  value: f.bis,
                  'aria-label': `${f.name} Ende`,
                  onchange: (e) => ferienSetzen(einst.schuljahr, i, { bis: e.target.value }, ctx),
                }),
              ]),
              h('td', {}, [
                h('button', {
                  class: 'btn klein gefahr',
                  text: 'Entfernen',
                  onclick: () => ferienEntfernen(einst.schuljahr, i, ctx),
                }),
              ]),
            ]),
          )
        : [h('tr', {}, [h('td', { colspan: '4', class: 'leer', text: 'Für dieses Schuljahr sind keine Ferien hinterlegt.' })])],
    ),
  );

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Schuljahr und Ferien' }),
      h('div', { class: 'feld' }, [h('label', { for: 'e-schuljahr', text: 'Schuljahr' }), sjFeld]),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Ferientermine bitte zu Schuljahresbeginn gegen die amtliche Bekanntmachung prüfen. Auf Sylt, ' +
          'Föhr, Amrum, Helgoland und den Halligen gelten abweichende Termine.',
      }),
      h('div', { class: 'tabelle-wrap' }, [ferienListe]),
      h('div', { class: 'btn-reihe', style: 'margin-top:0.75rem' }, [
        h('button', {
          class: 'btn klein',
          text: 'Ferienzeitraum hinzufuegen',
          onclick: () => ferienHinzufuegen(einst.schuljahr, ctx),
        }),
        FERIEN_SH_VOREINSTELLUNG[einst.schuljahr]
          ? h('button', {
              class: 'btn klein',
              text: 'Auf Voreinstellung zurücksetzen',
              onclick: () => {
                store.aendern((s) => {
                  delete s.eigeneFerien[einst.schuljahr];
                });
                toast('Ferien zurückgesetzt.');
                ctx.neuZeichnen();
              },
            })
          : null,
      ]),
    ]),
  );

  /* --------------------------- Urlaub ------------------------------- */

  const urlaubstageGesetzt = Object.entries(stand.tagesTypen).filter(
    ([datum, typ]) => typ === 'urlaub' && schuljahrFuer(datum) === einst.schuljahr,
  ).length;

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Erholungsurlaub eintragen' }),
      h('p', {
        text:
          `Aktuell sind ${urlaubstageGesetzt} von ${einst.urlaubstage} Urlaubstagen im Schuljahr ` +
          `${einst.schuljahr} eingetragen. An Urlaubstagen entsteht keine Soll-Arbeitszeit.`,
      }),
      h('div', { class: 'btn-reihe' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Urlaub automatisch in die Ferien legen',
          onclick: async () => {
            const ok = await bestaetigen(
              'Urlaub verteilen',
              `Es werden ${einst.urlaubstage} Werktage als Urlaub eingetragen – zuerst in den ` +
                'Sommerferien, danach in den übrigen Ferien. Bereits gesetzte Tagesarten in diesem ' +
                'Schuljahr werden überschrieben.',
              'Verteilen',
            );
            if (!ok) return;
            const vorschlag = urlaubsvorschlag(einst, stand.eigeneFerien);
            store.aendern((s) => {
              for (const [datum, typ] of Object.entries(s.tagesTypen)) {
                if (typ === 'urlaub' && schuljahrFuer(datum) === einst.schuljahr) delete s.tagesTypen[datum];
              }
              Object.assign(s.tagesTypen, vorschlag);
            });
            toast(`${Object.keys(vorschlag).length} Urlaubstage eingetragen.`);
            ctx.neuZeichnen();
          },
        }),
        h('button', {
          class: 'btn klein',
          text: 'Urlaubstage entfernen',
          onclick: () => {
            store.aendern((s) => {
              for (const [datum, typ] of Object.entries(s.tagesTypen)) {
                if (typ === 'urlaub' && schuljahrFuer(datum) === einst.schuljahr) delete s.tagesTypen[datum];
              }
            });
            toast('Urlaubstage entfernt.');
            ctx.neuZeichnen();
          },
        }),
      ]),
      h('p', {
        class: 'feld-hinweis',
        text: 'Einzelne Tage lassen sich in der Tagesansicht jederzeit anders setzen.',
      }),
    ]),
  );

  /* ------------------------- Erinnerung ----------------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Erinnerung' }),
      h('div', { class: 'feld-reihe' }, [
        h('div', { class: 'feld' }, [
          h('label', { for: 'e-erinnerung', text: 'Tägliche Erinnerung' }),
          (() => {
            const s = h(
              'select',
              {
                id: 'e-erinnerung',
                onchange: async (e) => {
                  const an = e.target.value === 'an';
                  if (an && 'Notification' in window && Notification.permission !== 'granted') {
                    const antwort = await Notification.requestPermission();
                    if (antwort !== 'granted') {
                      toast('Ohne Erlaubnis für Mitteilungen kann nicht erinnert werden.');
                      ctx.neuZeichnen();
                      return;
                    }
                  }
                  store.einstellungenSetzen({ erinnerungAktiv: an });
                  erinnerungEinrichten();
                  ctx.neuZeichnen();
                },
              },
              [h('option', { value: 'aus', text: 'aus' }), h('option', { value: 'an', text: 'an' })],
            );
            s.value = einst.erinnerungAktiv ? 'an' : 'aus';
            return s;
          })(),
        ]),
        h('div', { class: 'feld' }, [
          h('label', { for: 'e-erinnerung-zeit', text: 'Uhrzeit' }),
          h('input', {
            id: 'e-erinnerung-zeit',
            type: 'time',
            value: einst.erinnerungUhrzeit,
            onchange: (e) => {
              store.einstellungenSetzen({ erinnerungUhrzeit: e.target.value });
              erinnerungEinrichten();
            },
          }),
        ]),
      ]),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Die Erinnerung ist rein lokal und funktioniert nur, solange die App im Browser geöffnet ist ' +
          'oder als App auf dem Startbildschirm im Hintergrund läuft. Ohne Server gibt es keine ' +
          'echten Push-Mitteilungen – dafür verlassen auch keine Daten das Gerät.',
      }),
    ]),
  );

  /* -------------------------- Darstellung --------------------------- */

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Darstellung' }),
      h('div', { class: 'feld' }, [
        h('label', { for: 'e-theme', text: 'Farbschema' }),
        (() => {
          const s = h(
            'select',
            {
              id: 'e-theme',
              onchange: (e) => {
                store.einstellungenSetzen({ theme: e.target.value });
                themaAnwenden(e.target.value);
              },
            },
            [
              h('option', { value: 'auto', text: 'wie im System' }),
              h('option', { value: 'light', text: 'hell' }),
              h('option', { value: 'dark', text: 'dunkel' }),
            ],
          );
          s.value = einst.theme;
          return s;
        })(),
      ]),
    ]),
  );

  /* ---------------------------- Daten ------------------------------- */

  const importFeld = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    style: 'display:none',
    onchange: async (e) => {
      const datei = e.target.files[0];
      if (!datei) return;
      const text = await datei.text();
      const modus = (await bestaetigen(
        'Backup einspielen',
        'Sollen die vorhandenen Daten ersetzt werden? "Abbrechen" führt die Daten stattdessen zusammen.',
        'Ersetzen',
        true,
      ))
        ? 'ersetzen'
        : 'zusammenführen';
      const ergebnis = store.backupEinspielen(text, modus);
      toast(ergebnis.meldung);
      e.target.value = '';
      ctx.neuZeichnen();
    },
  });

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Daten' }),
      h('p', {
        text:
          'Alle Daten liegen ausschließlich in diesem Browser auf diesem Gerät. Wer den Browser ' +
          'wechselt, das Gerät tauscht oder die Browserdaten löscht, verliert sie ohne Backup.',
      }),
      h('div', { class: 'btn-reihe' }, [
        h('button', {
          class: 'btn primaer',
          text: 'Backup exportieren',
          onclick: () => {
            const text = store.backupErzeugen();
            const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
            const a = h('a', { href: url, download: `lehrerzeit-backup-${new Date().toISOString().slice(0, 10)}.json` });
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            toast('Backup gespeichert.');
          },
        }),
        h('button', { class: 'btn', text: 'Backup einspielen', onclick: () => importFeld.click() }),
        importFeld,
        h('button', {
          class: 'btn gefahr',
          text: 'Alle Daten löschen',
          onclick: async () => {
            const ok = await bestaetigen(
              'Wirklich alles löschen?',
              'Sämtliche Zeiteinträge, der Stundenplan und alle Einstellungen werden entfernt. ' +
                'Das lässt sich nur über ein Backup rückgängig machen.',
              'Endgültig löschen',
              true,
            );
            if (!ok) return;
            store.allesLoeschen();
            toast('Alle Daten gelöscht.');
            ctx.neuZeichnen();
          },
        }),
      ]),
    ]),
  );

  wurzel.appendChild(
    h('div', { class: 'hinweis' }, [
      h('strong', { text: 'Datenschutz. ' }),
      document.createTextNode(
        'Diese App speichert nichts auf einem Server, hat kein Benutzerkonto und sendet keine Daten an ' +
          'Dritte. Die Schulleitung hat keinen Zugriff auf die Erfassung. Eine Weitergabe geschieht nur ' +
          'dann, wenn eine Datei bewusst exportiert und selbst weitergegeben wird. ',
      ),
      h('a', { href: 'DATENSCHUTZ.md', target: '_blank', rel: 'noopener', text: 'Ausführliche Hinweise' }),
    ]),
  );

  return wurzel;
}

/* ------------------------------- Hilfen ---------------------------------- */

function zahlFeld(id, beschriftung, wert, { min, max, step, onSet, ctx }) {
  return h('div', { class: 'feld' }, [
    h('label', { for: id, text: beschriftung }),
    h('input', {
      id,
      type: 'number',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(wert),
      onchange: (e) => {
        const zahl = Number(String(e.target.value).replace(',', '.'));
        if (!Number.isFinite(zahl)) return;
        onSet(Math.min(Math.max(zahl, min), max));
        ctx.neuZeichnen();
      },
    }),
  ]);
}

function schuljahrAuswahl(aktuelles) {
  const start = Number(aktuelles.slice(0, 4));
  const jahre = new Set([...Object.keys(FERIEN_SH_VOREINSTELLUNG), aktuelles]);
  for (let j = start - 2; j <= start + 2; j += 1) jahre.add(`${j}/${j + 1}`);
  return [...jahre].sort();
}

function eigeneFerienSichern(schuljahr, liste) {
  store.aendern((s) => {
    s.eigeneFerien[schuljahr] = liste;
  });
}

function ferienSetzen(schuljahr, index, patch, ctx) {
  const liste = ferienFuerSchuljahr(schuljahr, store.get().eigeneFerien).map((f) => ({ ...f }));
  liste[index] = { ...liste[index], ...patch };
  if (liste[index].bis < liste[index].von) liste[index].bis = liste[index].von;
  eigeneFerienSichern(schuljahr, liste);
  ctx.neuZeichnen();
}

function ferienEntfernen(schuljahr, index, ctx) {
  const liste = ferienFuerSchuljahr(schuljahr, store.get().eigeneFerien).map((f) => ({ ...f }));
  liste.splice(index, 1);
  eigeneFerienSichern(schuljahr, liste);
  toast('Ferienzeitraum entfernt.');
  ctx.neuZeichnen();
}

function ferienHinzufuegen(schuljahr, ctx) {
  const liste = ferienFuerSchuljahr(schuljahr, store.get().eigeneFerien).map((f) => ({ ...f }));
  const start = `${schuljahr.slice(0, 4)}-10-12`;
  liste.push({ name: 'Neuer Zeitraum', von: start, bis: start });
  eigeneFerienSichern(schuljahr, liste);
  ctx.neuZeichnen();
}

export function themaAnwenden(theme) {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

export { deutschesDatum };
