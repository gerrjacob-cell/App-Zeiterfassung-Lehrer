/**
 * Feiertage und Schulferien für Schleswig-Holstein.
 *
 * Feiertage werden berechnet (Osterformel nach Gauss/Lichtenberg), Ferien sind
 * als Datensatz hinterlegt und in den Einstellungen editierbar, damit die App
 * über Schuljahre hinweg nutzbar bleibt, ohne dass Code angefasst werden muss.
 *
 * Quellenlage der voreingestellten Ferien: amtliche Ferientermine des Landes
 * Schleswig-Holstein (Festland). Auf Sylt, Föhr, Amrum, Helgoland und den
 * Halligen gelten abweichende Termine – dort bitte in den Einstellungen
 * anpassen.
 */

import { schuljahrZeitraum } from './model.js';

/** Ostersonntag eines Jahres als Date (lokale Zeit, 12:00 um DST-Effekte zu vermeiden). */
export function ostersonntag(jahr) {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, monat - 1, tag, 12, 0, 0);
}

function plusTage(datum, tage) {
  const d = new Date(datum.getTime());
  d.setDate(d.getDate() + tage);
  return d;
}

export function iso(datum) {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function ausIso(s) {
  const [j, m, t] = s.split('-').map(Number);
  return new Date(j, m - 1, t, 12, 0, 0);
}

/** Gesetzliche Feiertage in Schleswig-Holstein für ein Kalenderjahr. */
export function feiertageSH(jahr) {
  const o = ostersonntag(jahr);
  return {
    [`${jahr}-01-01`]: 'Neujahr',
    [iso(plusTage(o, -2))]: 'Karfreitag',
    [iso(plusTage(o, 1))]: 'Ostermontag',
    [`${jahr}-05-01`]: 'Tag der Arbeit',
    [iso(plusTage(o, 39))]: 'Christi Himmelfahrt',
    [iso(plusTage(o, 50))]: 'Pfingstmontag',
    [`${jahr}-10-03`]: 'Tag der Deutschen Einheit',
    [`${jahr}-10-31`]: 'Reformationstag',
    [`${jahr}-12-25`]: '1. Weihnachtstag',
    [`${jahr}-12-26`]: '2. Weihnachtstag',
  };
}

/** Feiertage für einen Datumsbereich (kann mehrere Kalenderjahre umfassen). */
export function feiertageBereich(vonIso, bisIso) {
  const von = Number(vonIso.slice(0, 4));
  const bis = Number(bisIso.slice(0, 4));
  let alle = {};
  for (let j = von; j <= bis; j += 1) alle = { ...alle, ...feiertageSH(j) };
  return alle;
}

/**
 * Voreingestellte Schulferien Schleswig-Holstein (Festland).
 * Bitte zu Schuljahresbeginn gegen die amtliche Bekanntmachung prüfen.
 */
export const FERIEN_SH_VOREINSTELLUNG = {
  '2026/2027': [
    { name: 'Sommerferien 2026', von: '2026-07-04', bis: '2026-08-15' },
    { name: 'Herbstferien', von: '2026-10-12', bis: '2026-10-24' },
    { name: 'Weihnachtsferien', von: '2026-12-21', bis: '2027-01-06' },
    { name: 'Osterferien', von: '2027-03-30', bis: '2027-04-10' },
    { name: 'Sommerferien 2027', von: '2027-07-05', bis: '2027-08-14' },
  ],
  '2027/2028': [
    { name: 'Sommerferien 2027', von: '2027-07-05', bis: '2027-08-14' },
    { name: 'Herbstferien', von: '2027-10-11', bis: '2027-10-23' },
    { name: 'Weihnachtsferien', von: '2027-12-23', bis: '2028-01-08' },
    { name: 'Osterferien', von: '2028-04-03', bis: '2028-04-15' },
    { name: 'Sommerferien 2028', von: '2028-06-24', bis: '2028-08-04' },
  ],
};

/**
 * Ferien für ein Schuljahr. Fällt auf einen leeren Datensatz zurück, wenn
 * für das Schuljahr nichts hinterlegt ist – die App bleibt dann benutzbar,
 * weist aber in den Einstellungen darauf hin.
 */
export function ferienFuerSchuljahr(schuljahr, eigene) {
  if (eigene && Array.isArray(eigene[schuljahr])) return eigene[schuljahr];
  return FERIEN_SH_VOREINSTELLUNG[schuljahr] || [];
}

/** Menge aller Ferientage (ISO-Strings) eines Schuljahres. */
export function ferientageSet(schuljahr, eigene) {
  const set = new Set();
  const { von: sjVon, bis: sjBis } = schuljahrZeitraum(schuljahr);
  for (const f of ferienFuerSchuljahr(schuljahr, eigene)) {
    let d = ausIso(f.von);
    const ende = ausIso(f.bis);
    let schutz = 0;
    while (d <= ende && schutz < 400) {
      const s = iso(d);
      if (s >= sjVon && s <= sjBis) set.add(s);
      d = plusTage(d, 1);
      schutz += 1;
    }
  }
  return set;
}

export function istWochenende(datumIso) {
  const tag = ausIso(datumIso).getDay();
  return tag === 0 || tag === 6;
}

/** Alle Tage eines Zeitraums als ISO-Strings. */
export function tageImBereich(vonIso, bisIso) {
  const out = [];
  let d = ausIso(vonIso);
  const ende = ausIso(bisIso);
  let schutz = 0;
  while (d <= ende && schutz < 4000) {
    out.push(iso(d));
    d = plusTage(d, 1);
    schutz += 1;
  }
  return out;
}

export const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Montag der Woche, in der das Datum liegt. */
export function wochenstart(datumIso) {
  const d = ausIso(datumIso);
  const tag = (d.getDay() + 6) % 7;
  return iso(plusTage(d, -tag));
}

/** ISO-Kalenderwoche. */
export function kalenderwoche(datumIso) {
  const d = ausIso(datumIso);
  const ziel = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  ziel.setDate(ziel.getDate() + 3 - ((ziel.getDay() + 6) % 7));
  const ersteWoche = new Date(ziel.getFullYear(), 0, 4);
  const diff = (ziel - ersteWoche) / 86400000;
  return 1 + Math.round((diff - 3 + ((ersteWoche.getDay() + 6) % 7)) / 7);
}

export { plusTage };
