/**
 * Klassenlisten einlesen.
 *
 * Die Listen kommen aus der Schulverwaltung, aus IServ oder schlicht aus einer
 * Excel-Spalte. Deshalb liest dieses Modul absichtlich großzügig: Semikolon,
 * Komma, Tabulator oder gar kein Trenner, mit oder ohne Kopfzeile, "Nachname,
 * Vorname" oder "Vorname Nachname". Was nicht sicher erkannt wird, wird nicht
 * geraten, sondern in der Vorschau als Fehler markiert.
 *
 * Reines Textmodul: kein DOM, kein Speicher. Damit ist es einzeln prüfbar und
 * später auch auf einem Server verwendbar.
 */

const TRENNER = [';', '\t', ','];

/** Häufigste Schreibweisen der Spaltenköpfe. */
const KOPF_MUSTER = {
  nachname: ['nachname', 'name', 'familienname', 'surname', 'last name', 'lastname'],
  vorname: ['vorname', 'rufname', 'first name', 'firstname'],
  gruppe: ['klasse', 'lerngruppe', 'gruppe', 'kurs', 'class'],
  level: ['level', 'lernerlevel', 'stufe'],
};

const saeubern = (wert) =>
  String(wert ?? '')
    .replace(/^﻿/, '')
    .replace(/^"(.*)"$/s, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Trenner raten: gezählt wird, welches Zeichen in den meisten Zeilen gleich
 * oft vorkommt. Ein Komma allein ist mehrdeutig ("Mustermann, Max"), deshalb
 * zählt es nur, wenn es in fast jeder Zeile gleich häufig auftaucht.
 */
export function trennerErkennen(zeilen) {
  for (const t of TRENNER) {
    const anzahlen = zeilen.map((z) => z.split(t).length - 1).filter((n) => n > 0);
    if (anzahlen.length < Math.max(2, zeilen.length * 0.8)) continue;
    const erste = anzahlen[0];
    if (anzahlen.every((n) => n === erste)) return t;
  }
  return null;
}

/** Ist die erste Zeile eine Kopfzeile? */
export function kopfzeileErkennen(felder) {
  const bekannt = Object.values(KOPF_MUSTER).flat();
  const treffer = felder.filter((f) => bekannt.includes(f.toLowerCase())).length;
  return treffer >= Math.min(2, felder.length);
}

/** Ordnet Spaltenköpfe den Feldern zu. Unbekannte Spalten bleiben ungenutzt. */
export function spaltenZuordnen(felder) {
  const zuordnung = {};
  felder.forEach((feld, i) => {
    const wert = feld.toLowerCase();
    for (const [ziel, muster] of Object.entries(KOPF_MUSTER)) {
      if (muster.includes(wert) && zuordnung[ziel] === undefined) zuordnung[ziel] = i;
    }
  });
  return zuordnung;
}

/**
 * Einen Namen in Vor- und Nachname zerlegen.
 * Mit Komma ist die Sache eindeutig: "Mustermann, Max".
 * Ohne Komma entscheidet die Reihenfolge, die der Nutzer wählt.
 */
export function namenTeilen(text, nachnameZuerst = false) {
  const wert = saeubern(text);
  if (!wert) return { vorname: '', nachname: '' };

  if (wert.includes(',')) {
    const [links, rechts] = wert.split(',');
    return { vorname: saeubern(rechts), nachname: saeubern(links) };
  }

  const teile = wert.split(' ');
  if (teile.length === 1) return { vorname: '', nachname: teile[0] };

  if (nachnameZuerst) {
    return { nachname: teile[0], vorname: teile.slice(1).join(' ') };
  }
  // Ohne weitere Angabe gilt das Übliche: alles bis zum letzten Wort ist der
  // Vorname. "Anna Maria von Buren" wird damit zu "Anna Maria von" + "Buren" -
  // deshalb steht die Zerlegung in der Vorschau und ist umschaltbar.
  return { vorname: teile.slice(0, -1).join(' '), nachname: teile[teile.length - 1] };
}

export function levelLesen(text, standard = 2) {
  const treffer = String(text ?? '').match(/[1-4]/);
  return treffer ? Number(treffer[0]) : standard;
}

/**
 * Liest den Text und liefert Zeilen mit Zustand. Nichts wird gespeichert -
 * das Ergebnis ist die Vorschau, die der Nutzer bestätigt.
 *
 * @param text        Inhalt der Datei oder des Einfügefelds
 * @param optionen    { nachnameZuerst, standardLevel, gruppenName }
 * @param bestand     { schueler: [...], gruppen: [...] } zum Abgleich
 */
export function vorschau(text, optionen = {}, bestand = { schueler: [], gruppen: [] }) {
  const { nachnameZuerst = false, standardLevel = 2, gruppenName = '' } = optionen;

  const zeilen = String(text || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean);

  if (!zeilen.length) return { zeilen: [], trenner: null, kopfzeile: false, gruppen: [] };

  const trenner = trennerErkennen(zeilen);
  const felder = (z) => (trenner ? z.split(trenner).map(saeubern) : [saeubern(z)]);

  const ersteFelder = felder(zeilen[0]);
  const hatKopf = trenner ? kopfzeileErkennen(ersteFelder) : false;
  const zuordnung = hatKopf ? spaltenZuordnen(ersteFelder) : {};
  const datenZeilen = hatKopf ? zeilen.slice(1) : zeilen;

  // Ohne Kopfzeile: zwei Spalten sind "Nachname; Vorname" - so liefern es die
  // meisten Schulverwaltungen.
  const ohneKopf = (f) => {
    if (f.length >= 2 && f[0] && f[1]) return { nachname: f[0], vorname: f[1] };
    return namenTeilen(f[0], nachnameZuerst);
  };

  const vorhanden = new Map(
    bestand.schueler.map((s) => [`${s.vorname}|${s.nachname}`.toLowerCase(), s]),
  );
  const gesehen = new Set();
  const ergebnis = [];

  for (const zeile of datenZeilen) {
    const f = felder(zeile);
    let vorname = '';
    let nachname = '';

    if (hatKopf && zuordnung.nachname !== undefined) {
      nachname = saeubern(f[zuordnung.nachname]);
      vorname =
        zuordnung.vorname !== undefined ? saeubern(f[zuordnung.vorname]) : '';
      if (!vorname && nachname.includes(',')) ({ vorname, nachname } = namenTeilen(nachname));
    } else if (hatKopf && zuordnung.vorname !== undefined) {
      vorname = saeubern(f[zuordnung.vorname]);
    } else {
      ({ vorname, nachname } = ohneKopf(f));
    }

    const gruppe =
      hatKopf && zuordnung.gruppe !== undefined && f[zuordnung.gruppe]
        ? saeubern(f[zuordnung.gruppe])
        : saeubern(gruppenName);

    const level =
      hatKopf && zuordnung.level !== undefined
        ? levelLesen(f[zuordnung.level], standardLevel)
        : standardLevel;

    const schluessel = `${vorname}|${nachname}`.toLowerCase();
    let zustand = 'neu';
    let hinweis = '';

    if (!vorname || !nachname) {
      zustand = 'fehler';
      hinweis = 'Vor- oder Nachname fehlt';
    } else if (gesehen.has(schluessel)) {
      zustand = 'doppelt';
      hinweis = 'steht mehrfach in der Liste';
    } else if (vorhanden.has(schluessel)) {
      zustand = 'ergaenzt';
      hinweis = 'gibt es schon, wird der Lerngruppe zugeordnet';
    }
    if (zustand !== 'fehler') gesehen.add(schluessel);

    ergebnis.push({ rohzeile: zeile, vorname, nachname, level, gruppe, zustand, hinweis });
  }

  const gruppen = [...new Set(ergebnis.filter((z) => z.gruppe).map((z) => z.gruppe))];
  return { zeilen: ergebnis, trenner, kopfzeile: hatKopf, gruppen };
}

/** Kurze Zusammenfassung für die Vorschau. */
export function zusammenfassung(zeilen) {
  const zaehle = (z) => zeilen.filter((x) => x.zustand === z).length;
  return {
    neu: zaehle('neu'),
    ergaenzt: zaehle('ergaenzt'),
    doppelt: zaehle('doppelt'),
    fehler: zaehle('fehler'),
    gesamt: zeilen.length,
  };
}
