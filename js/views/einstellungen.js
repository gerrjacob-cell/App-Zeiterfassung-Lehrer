/**
 * Einstellungen: Deputat, Arbeitszeitmodell, Ferien, Urlaub, Erinnerung und
 * die Datenverwaltung (Backup, Import, Löschen).
 */

import { h, toast, bestaetigen } from '../ui.js';
import * as store from '../store.js';
import {
  BUNDESLAENDER,
  bundesland,
  schulformenFuer,
  PFLICHTSTUNDEN_SH,
  ERMAESSIGUNG_VORLAGEN,
  ERMAESSIGUNG_ARTEN,
  KATEGORIEN,
  schuljahrFuer,
  beschaeftigungsfaktor,
  beschaeftigungsprozent,
  ermaessigungsstunden,
  unterrichtsverpflichtung,
  minutenProDeputatsstunde,
  neueErmaessigung,
} from '../model.js';
import { urlaubsvorschlag, minutenAlsStunden } from '../soll.js';
import { FERIEN_SH_VOREINSTELLUNG, ferienFuerSchuljahr } from '../kalender.js';
import { deutschesDatum } from '../export.js';
import { erinnerungEinrichten } from '../erinnerung.js';
import { speicherBericht, istIOS, alsAppInstalliert } from '../geraet.js';

export function einstellungenView(ctx) {
  const stand = store.get();
  const einst = stand.einstellungen;
  const wurzel = h('div');

  /* ---------------------- Person und Deputat ------------------------ */

  const land = bundesland(einst.bundesland);
  const schulformen = schulformenFuer(einst.bundesland);

  const landFeld = h(
    'select',
    {
      id: 'e-bundesland',
      onchange: (e) => {
        const neu = bundesland(e.target.value);
        // Die Wochenarbeitszeit wird mitgezogen - sie ist der Wert, der bei
        // einem Landeswechsel am ehesten vergessen wird und das Soll direkt
        // verändert. Die Pflichtstunden bleiben stehen, weil es für andere
        // Länder keine geprüften Voreinstellungen gibt.
        const patch = { bundesland: neu.id, wochenarbeitszeit: neu.wochenarbeitszeit };
        if (!schulformenFuer(neu.id).some((f) => f.id === einst.schulform)) patch.schulform = 'eigen';
        store.einstellungenSetzen(patch);
        toast(`${neu.name}: Wochenarbeitszeit auf ${zahl(neu.wochenarbeitszeit)} Stunden gesetzt.`);
        ctx.neuZeichnen();
      },
    },
    BUNDESLAENDER.map((l) => h('option', { value: l.id, text: l.name })),
  );
  landFeld.value = einst.bundesland;

  const schulformFeld = h(
    'select',
    {
      id: 'e-schulform',
      onchange: (e) => {
        const gewaehlt = schulformen.find((s) => s.id === e.target.value);
        const patch = { schulform: e.target.value };
        if (gewaehlt && gewaehlt.id !== 'eigen') {
          // Wer Vollzeit arbeitet, soll nach dem Wechsel nicht plötzlich Teilzeit sein.
          const warVollzeit = Number(einst.teilzeitStunden) === Number(einst.pflichtstundenVollzeit);
          patch.pflichtstundenVollzeit = gewaehlt.stunden;
          if (warVollzeit) patch.teilzeitStunden = gewaehlt.stunden;
        }
        store.einstellungenSetzen(patch);
        ctx.neuZeichnen();
      },
    },
    schulformen.map((s) => h('option', { value: s.id, text: s.name })),
  );
  schulformFeld.value = einst.schulform;
  const gewaehlteSchulform = schulformen.find((f) => f.id === einst.schulform);

  wurzel.appendChild(
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Person und Schulform' }),
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
        h('label', { for: 'e-bundesland', text: 'Bundesland' }),
        landFeld,
        h('p', {
          class: 'feld-hinweis',
          text:
            'Bestimmt die wöchentliche Arbeitszeit und die gesetzlichen Feiertage. Geprüfte ' +
            'Pflichtstundenzahlen je Schulform liegen nur für Schleswig-Holstein vor – in anderen ' +
            'Ländern wird die Zahl aus dem eigenen Bescheid eingetragen.',
        }),
      ]),
      h('div', { class: 'feld' }, [h('label', { for: 'e-schulform', text: 'Schulform' }), schulformFeld]),
      gewaehlteSchulform && gewaehlteSchulform.hinweis
        ? h('p', { class: 'feld-hinweis', text: gewaehlteSchulform.hinweis })
        : null,
      zahlFeld('e-pf-voll', 'Pflichtstunden einer Vollzeitkraft', einst.pflichtstundenVollzeit, {
        min: 10,
        max: 35,
        step: 0.5,
        onSet: (v) => store.einstellungenSetzen({ pflichtstundenVollzeit: v }),
        ctx,
      }),
      // Weicht der eingetragene Wert von der Voreinstellung der Schulform ab,
      // ist das meistens Absicht - manchmal aber ein Überbleibsel aus einer
      // früheren Fassung der App. Beides sichtbar zu machen kostet nichts.
      gewaehlteSchulform &&
      gewaehlteSchulform.id !== 'eigen' &&
      Number(einst.pflichtstundenVollzeit) !== gewaehlteSchulform.stunden
        ? h('p', {
            class: 'feld-hinweis',
            text:
              `Abweichung: Für ${gewaehlteSchulform.name} sind ${zahl(gewaehlteSchulform.stunden)} ` +
              `Stunden hinterlegt, eingetragen sind ${zahl(einst.pflichtstundenVollzeit)}. ` +
              'Falls das nicht beabsichtigt ist, bitte korrigieren – dieser Wert ist die Bezugsgröße ' +
              'für Teilzeit und für die Umrechnung der Ermäßigungsstunden.',
          })
        : null,
      h('p', {
        class: 'feld-hinweis',
        text:
          'Grundlage der Voreinstellungen ist die KMK-Übersicht der Pflichtstunden, Stand 2019. ' +
          'Bitte gegen die aktuelle Fassung der Pflichtstundenverordnung Schleswig-Holstein prüfen – ' +
          'es sind Startwerte, keine Rechtsauskunft.',
      }),
    ]),
  );

  wurzel.appendChild(beschaeftigungsKarte(ctx, einst));
  wurzel.appendChild(ermaessigungsKarte(ctx, einst));

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
      arbeitszeitHinweis(einst),
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
          einst.bundesland === 'SH'
            ? 'Ferientermine bitte zu Schuljahresbeginn gegen die amtliche Bekanntmachung prüfen. ' +
              'Auf Sylt, Föhr, Amrum, Helgoland und den Halligen gelten abweichende Termine.'
            : `Für ${bundesland(einst.bundesland).name} sind keine Ferientermine hinterlegt – bitte ` +
              'einmalig eintragen. Ohne sie rechnet die App die Ferienwochen wie normale Schulwochen, ' +
              'was am Soll nichts ändert, aber die Auswertung weniger aussagekräftig macht.',
      }),
      h('div', { class: 'tabelle-wrap' }, [ferienListe]),
      h('div', { class: 'btn-reihe', style: 'margin-top:0.75rem' }, [
        h('button', {
          class: 'btn klein',
          text: 'Ferienzeitraum hinzufügen',
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
      speicherStatus(),
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
    h('div', { class: 'karte' }, [
      h('h2', { text: 'Hilfe' }),
      h('p', {
        text:
          'Der Leitfaden erklärt in zwanzig Minuten Lesezeit, wie sich die Erfassung in den ' +
          'Schulalltag einfügt, was in welche Kategorie gehört und warum in den Ferien Soll-Zeit ' +
          'steht. Er lässt sich auch ausdrucken.',
      }),
      h('div', { class: 'btn-reihe' }, [
        h('a', { class: 'btn primaer', href: 'leitfaden.html', text: 'Leitfaden öffnen' }),
        h('a', {
          class: 'btn',
          href: 'auswertung.html',
          target: '_blank',
          rel: 'noopener',
          text: 'Auswertungswerkzeug',
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

/* -------------------------- Beschäftigungsumfang ------------------------- */

/**
 * Der Beschäftigungsumfang bestimmt allein die Soll-Arbeitszeit. Er wird je
 * nach Statusgruppe unterschiedlich bewilligt, deshalb drei Eingabewege - so
 * kann jede Lehrkraft die Zahl aus ihrem Bescheid direkt übernehmen, ohne
 * vorher umzurechnen.
 */
function beschaeftigungsKarte(ctx, einst) {
  const teilzeit = einst.beschaeftigungsart === 'teilzeit';
  const faktor = beschaeftigungsfaktor(einst);
  const wochenSollMinuten = (Number(einst.wochenarbeitszeit) || 41) * 60 * faktor;

  const karte = h('div', { class: 'karte' }, [
    h('h2', { text: 'Beschäftigungsumfang' }),
    h('p', {
      class: 'feld-hinweis',
      text: 'Diese Angabe bestimmt die Soll-Arbeitszeit. Ermäßigungsstunden gehören nicht hierher.',
    }),
    h('div', { class: 'chip-reihe' }, [
      h('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(!teilzeit),
        text: 'Vollzeit',
        onclick: () => {
          store.einstellungenSetzen({ beschaeftigungsart: 'vollzeit' });
          ctx.neuZeichnen();
        },
      }),
      h('button', {
        class: 'chip',
        type: 'button',
        'aria-pressed': String(teilzeit),
        text: 'Teilzeit',
        onclick: () => {
          store.einstellungenSetzen({
            beschaeftigungsart: 'teilzeit',
            teilzeitStunden: einst.teilzeitStunden || einst.pflichtstundenVollzeit,
          });
          ctx.neuZeichnen();
        },
      }),
    ]),
  ]);

  if (teilzeit) {
    const artFeld = h(
      'select',
      {
        id: 'e-tz-art',
        onchange: (e) => {
          store.einstellungenSetzen({ teilzeitEingabe: e.target.value });
          ctx.neuZeichnen();
        },
      },
      [
        h('option', { value: 'stunden', text: 'als Zahl der Unterrichtsstunden' }),
        h('option', { value: 'prozent', text: 'als Bruchteil / Prozent' }),
        h('option', { value: 'wochenstunden', text: 'als Wochenstunden der Arbeitszeit' }),
      ],
    );
    artFeld.value = einst.teilzeitEingabe;

    karte.appendChild(
      h('div', { class: 'feld', style: 'margin-top:0.85rem' }, [
        h('label', { for: 'e-tz-art', text: 'Wie wurde die Teilzeit bewilligt?' }),
        artFeld,
      ]),
    );

    if (einst.teilzeitEingabe === 'prozent') {
      karte.appendChild(
        zahlFeld('e-tz-prozent', 'Bewilligter Umfang in Prozent', einst.teilzeitProzent, {
          min: 1,
          max: 100,
          step: 0.1,
          onSet: (v) => store.einstellungenSetzen({ teilzeitProzent: v }),
          ctx,
        }),
      );
      karte.appendChild(
        h('p', {
          class: 'feld-hinweis',
          text: 'Bruchteile umrechnen: 1/2 = 50, 3/4 = 75, 2/3 = 66,7 Prozent.',
        }),
      );
    } else if (einst.teilzeitEingabe === 'wochenstunden') {
      karte.appendChild(
        zahlFeld('e-tz-wstd', 'Bewilligte Wochenarbeitszeit (Std.)', einst.teilzeitWochenstunden, {
          min: 1,
          max: Number(einst.wochenarbeitszeit) || 41,
          step: 0.25,
          onSet: (v) => store.einstellungenSetzen({ teilzeitWochenstunden: v }),
          ctx,
        }),
      );
      karte.appendChild(
        h('p', {
          class: 'feld-hinweis',
          text: 'Üblich bei Tarifbeschäftigten nach TV-L, deren Teilzeit in Arbeitsstunden bemessen wird.',
        }),
      );
    } else {
      karte.appendChild(
        zahlFeld('e-tz-stunden', 'Bewilligte Unterrichtsstunden pro Woche', einst.teilzeitStunden, {
          min: 0.5,
          max: Number(einst.pflichtstundenVollzeit) || 27,
          step: 0.5,
          onSet: (v) => store.einstellungenSetzen({ teilzeitStunden: v }),
          ctx,
        }),
      );
      karte.appendChild(
        h('p', {
          class: 'feld-hinweis',
          text:
            'Die Zahl aus dem Teilzeitbescheid – ohne Abzug von Ermäßigungsstunden. Wer 21 von 27 ' +
            'Stunden bewilligt bekommen hat und zusätzlich 2 Stunden Ermäßigung erhält, trägt hier 21 ein.',
        }),
      );
    }
  }

  karte.appendChild(
    h('dl', { class: 'kennzahlen', style: 'margin-top:0.85rem' }, [
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Beschäftigungsumfang' }),
        h('dd', {}, [
          document.createTextNode(`${beschaeftigungsprozent(einst)} %`),
          h('span', { class: 'zusatz', text: teilzeit ? 'Teilzeit' : 'Vollzeit' }),
        ]),
      ]),
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Soll-Arbeitszeit pro Woche' }),
        h('dd', {}, [
          document.createTextNode(minutenAlsStunden(wochenSollMinuten)),
          h('span', { class: 'zusatz', text: `${minutenAlsStunden(wochenSollMinuten / 5)} pro Arbeitstag` }),
        ]),
      ]),
    ]),
  );

  if (teilzeit) {
    karte.appendChild(
      h('div', { class: 'hinweis' }, [
        h('strong', { text: 'Teilzeit heißt Teilzeit – auch außerhalb des Unterrichts. ' }),
        document.createTextNode(
          'Konferenzen, Aufsichten, Korrekturen und Elterngespräche dürfen nur im Umfang der ' +
            'bewilligten Teilzeit verlangt werden, nicht in vollem Umfang. Genau das lässt sich mit ' +
            'dieser Erfassung belegen: Der Saldo vergleicht mit dem anteiligen Soll, nicht mit dem einer ' +
            'Vollzeitkraft.',
        ),
      ]),
    );
    if (faktor < 0.75) {
      karte.appendChild(
        h('p', {
          class: 'feld-hinweis',
          text:
            'Hinweis zur Rechtslage: Bei einer Teilzeit unter drei Vierteln werden Alters- und ' +
            'Schwerbehindertenermäßigung in Schleswig-Holstein nur zur Hälfte gewährt, unterhalb der ' +
            'Hälfte entfällt die Altersermäßigung ganz. Die App rechnet das nicht automatisch – bitte ' +
            'unten die tatsächlich bewilligten Stunden eintragen.',
        }),
      );
    }
  }

  return karte;
}

/* --------------------------- Ermäßigungsstunden -------------------------- */

/**
 * Ermäßigungs- und Anrechnungsstunden. Der zentrale Satz steht auch in der
 * Oberfläche, weil er häufig missverstanden wird: Diese Stunden verkürzen die
 * Arbeitszeit nicht. Sie nehmen Unterricht weg, um Zeit für eine andere
 * Aufgabe zu schaffen - und ob diese Zeit reicht, zeigt erst die Erfassung.
 */
function ermaessigungsKarte(ctx, einst) {
  const liste = Array.isArray(einst.ermaessigungen) ? einst.ermaessigungen : [];
  const summe = ermaessigungsstunden(einst);
  const proStunde = minutenProDeputatsstunde(einst);

  const karte = h('div', { class: 'karte' }, [
    h('h2', { text: 'Ermäßigungs- und Anrechnungsstunden' }),
    h('p', {
      class: 'feld-hinweis',
      text:
        'Stunden, die für Funktionsaufgaben, Alter oder Schwerbehinderung vom Unterricht abgezogen ' +
        'werden. Sie mindern die Unterrichtsverpflichtung, nicht die Arbeitszeit.',
    }),
  ]);

  if (liste.length) {
    const tabelle = h('table', { class: 'ermaessigungen' });
    tabelle.append(
      h('thead', {}, [
        h('tr', {}, [
          h('th', { text: 'Aufgabe' }),
          h('th', { class: 'zahl', text: 'Std.' }),
          h('th', { text: 'Art' }),
          h('th', { text: 'erfasst unter' }),
          h('th', { text: '' }),
        ]),
      ]),
      h(
        'tbody',
        {},
        liste.map((e, i) =>
          h('tr', {}, [
            h('td', {}, [
              h('input', {
                type: 'text',
                value: e.bezeichnung,
                'aria-label': `Bezeichnung der ${i + 1}. Ermäßigung`,
                maxlength: '60',
                onchange: (ev) => ermaessigungSetzen(i, { bezeichnung: ev.target.value.trim() }, ctx),
              }),
            ]),
            h('td', { class: 'zahl' }, [
              h('input', {
                type: 'number',
                min: '0',
                max: '20',
                step: '0.5',
                inputmode: 'decimal',
                value: String(e.stunden),
                'aria-label': `Stunden für ${e.bezeichnung}`,
                style: 'width:5.5rem;text-align:right',
                onchange: (ev) =>
                  ermaessigungSetzen(i, { stunden: Number(ev.target.value) || 0 }, ctx),
              }),
            ]),
            h('td', {}, [
              (() => {
                const s = h(
                  'select',
                  {
                    'aria-label': `Art der Ermäßigung für ${e.bezeichnung}`,
                    onchange: (ev) => ermaessigungSetzen(i, { art: ev.target.value }, ctx),
                  },
                  Object.values(ERMAESSIGUNG_ARTEN).map((a) =>
                    h('option', { value: a.id, text: a.name }),
                  ),
                );
                s.value = e.art;
                return s;
              })(),
            ]),
            h('td', {}, [
              (() => {
                const s = h(
                  'select',
                  {
                    'aria-label': `Erfassungskategorie für ${e.bezeichnung}`,
                    onchange: (ev) =>
                      ermaessigungSetzen(i, { kategorieId: ev.target.value || null }, ctx),
                  },
                  [
                    h('option', { value: '', text: '– keine –' }),
                    ...KATEGORIEN.map((k) => h('option', { value: k.id, text: k.name })),
                  ],
                );
                s.value = e.kategorieId || '';
                return s;
              })(),
            ]),
            h('td', {}, [
              h('button', {
                class: 'btn klein gefahr',
                text: 'Entfernen',
                'aria-label': `${e.bezeichnung} entfernen`,
                onclick: () => {
                  store.aendern((st) => {
                    st.einstellungen.ermaessigungen.splice(i, 1);
                  });
                  toast('Ermäßigung entfernt.');
                  ctx.neuZeichnen();
                },
              }),
            ]),
          ]),
        ),
      ),
    );
    karte.appendChild(h('div', { class: 'tabelle-wrap' }, [tabelle]));
  } else {
    karte.appendChild(h('p', { class: 'leer', text: 'Noch keine Ermäßigung eingetragen.' }));
  }

  /* Vorlagen zum Anklicken */
  const nochNichtGenutzt = ERMAESSIGUNG_VORLAGEN.filter(
    (v) => !liste.some((e) => e.bezeichnung === v.bezeichnung),
  );
  karte.appendChild(
    h('details', { style: 'margin-top:0.85rem' }, [
      h('summary', { text: 'Aufgabe hinzufügen' }),
      h('p', {
        class: 'feld-hinweis',
        text:
          'Funktionsaufgaben starten mit einer Stunde – wie viele tatsächlich gewährt werden, steht ' +
          'im Bescheid der Schulleitung und ist von Schule zu Schule verschieden. Oberstufeneinsatz, ' +
          'Alter und Schwerbehinderung sind dagegen mit den Werten für Schleswig-Holstein vorbelegt; ' +
          'der Grund steht jeweils im Tooltip.',
      }),
      h(
        'div',
        { class: 'chip-reihe' },
        nochNichtGenutzt.map((v) =>
          h('button', {
            class: 'chip',
            type: 'button',
            text: `+ ${v.bezeichnung}${v.stunden ? ` (${zahl(v.stunden)})` : ''}`,
            title: v.quelle || 'Stundenzahl nach dem Bescheid der Schulleitung eintragen.',
            onclick: () => {
              store.aendern((st) => {
                st.einstellungen.ermaessigungen.push(neueErmaessigung(v));
              });
              ctx.neuZeichnen();
            },
          }),
        ),
      ),
      h('div', { class: 'btn-reihe', style: 'margin-top:0.6rem' }, [
        h('button', {
          class: 'btn klein',
          text: 'Freie Aufgabe anlegen',
          onclick: () => {
            store.aendern((st) => {
              st.einstellungen.ermaessigungen.push(neueErmaessigung());
            });
            ctx.neuZeichnen();
          },
        }),
      ]),
    ]),
  );

  karte.appendChild(
    h('dl', { class: 'kennzahlen', style: 'margin-top:0.85rem' }, [
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Ermäßigung gesamt' }),
        h('dd', {}, [
          document.createTextNode(`${zahl(summe)} Std.`),
          h('span', { class: 'zusatz', text: `≙ ${minutenAlsStunden(summe * proStunde)} Arbeitszeit je Woche` }),
        ]),
      ]),
      h('div', { class: 'kennzahl' }, [
        h('dt', { text: 'Unterrichtsverpflichtung' }),
        h('dd', {}, [
          document.createTextNode(`${zahl(unterrichtsverpflichtung(einst))} Std.`),
          h('span', {
            class: 'zusatz',
            text: `von ${zahl((Number(einst.pflichtstundenVollzeit) || 0) * beschaeftigungsfaktor(einst))} anteilig`,
          }),
        ]),
      ]),
    ]),
  );

  karte.appendChild(
    h('div', { class: 'hinweis' }, [
      h('strong', { text: 'Warum das die Arbeitszeit nicht senkt: ' }),
      document.createTextNode(
        `Eine Deputatsstunde entspricht rechnerisch ${minutenAlsStunden(proStunde)} Arbeitszeit ` +
          `(${einst.wochenarbeitszeit} Wochenstunden geteilt durch ${einst.pflichtstundenVollzeit} ` +
          'Pflichtstunden). Wer eine Stunde Ermäßigung für eine Aufgabe erhält, hat dafür also rund ' +
          `${minutenAlsStunden(proStunde)} pro Woche zur Verfügung – nicht 45 Minuten. Ob das reicht, ` +
          'zeigt die Auswertung: Dort werden gewährte Entlastung und tatsächlich erfasster Aufwand ' +
          'gegenübergestellt.',
      ),
    ]),
  );

  return karte;
}

/**
 * Zeigt, ob der Browser den Speicher als dauerhaft markiert hat. Bei einer App
 * ohne Server ist das die einzige Zusage, die es überhaupt gibt - man sollte
 * nachsehen können, statt hoffen zu müssen.
 */
function speicherStatus() {
  const knoten = h('p', { class: 'feld-hinweis', text: 'Speicherzustand wird geprüft …' });
  speicherBericht().then((b) => {
    const teile = [];
    if (b.dauerhaft === true) {
      teile.push('Der Browser hat den Speicher als dauerhaft markiert – die Daten werden nicht bei Platzmangel geräumt.');
    } else if (b.dauerhaft === false) {
      teile.push(
        'Der Browser hat den Speicher nicht als dauerhaft markiert. Bei Platzmangel könnten die Daten ' +
          'geräumt werden – dagegen hilft, die App zum Startbildschirm hinzuzufügen, und regelmäßige Backups.',
      );
    } else {
      teile.push('Dieser Browser gibt über den Speicherzustand keine Auskunft.');
    }
    if (b.belegt != null) {
      teile.push(`Belegt: ${Math.max(1, Math.round(b.belegt / 1024))} KB.`);
    }
    if (istIOS() && !alsAppInstalliert()) {
      teile.push(
        'Auf dem iPhone gilt zusätzlich: Safari löscht Daten von Websites, die sieben Tage nicht ' +
          'geöffnet wurden. Zum Startbildschirm hinzugefügt, gilt das nicht.',
      );
    }
    knoten.textContent = teile.join(' ');
  });
  return knoten;
}

/**
 * Der Hinweis zur Wochenarbeitszeit hängt am Bundesland: 40 oder 41 Stunden,
 * teils abweichende Werte für Tarifbeschäftigte, und die Absenkung bei
 * Schwerbehinderung.
 */
function arbeitszeitHinweis(einst) {
  const land = bundesland(einst.bundesland);
  const teile = [
    `In ${land.name} gelten ${zahl(land.wochenarbeitszeit)} Stunden für verbeamtete Lehrkräfte.`,
  ];
  teile.push(
    land.angestellte
      ? `Für Tarifbeschäftigte sind es ${zahl(land.angestellte)} Stunden.`
      : 'Für Tarifbeschäftigte gilt derselbe Wert.',
  );
  if (einst.bundesland === 'SH') {
    teile.push(
      'Bei anerkannter Schwerbehinderung sind es 40 Stunden; dann bitte hier 40 eintragen, denn ' +
        'das verringert die Soll-Arbeitszeit tatsächlich.',
    );
  }
  teile.push('Grundlage: KMK-Übersicht, Stand 2019.');
  return h('p', { class: 'feld-hinweis', text: teile.join(' ') });
}

function ermaessigungSetzen(index, patch, ctx) {
  store.aendern((st) => {
    const liste = st.einstellungen.ermaessigungen;
    if (liste[index]) liste[index] = { ...liste[index], ...patch };
  });
  ctx.neuZeichnen();
}

function zahl(x) {
  return String(Math.round(x * 100) / 100).replace('.', ',');
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
