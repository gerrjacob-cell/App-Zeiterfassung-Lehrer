/**
 * Persistenz. Bewusst ausschließlich lokal: localStorage im Browser der
 * Lehrkraft. Kein Server, kein Konto, keine Übertragung. Wer die Daten auf ein
 * zweites Gerät holen will, nutzt Backup exportieren / importieren.
 */

import { SCHEMA_VERSION, defaultEinstellungen } from './model.js';

const KEY = 'lehrerzeit.v1';

const leererStand = () => ({
  schemaVersion: SCHEMA_VERSION,
  einstellungen: defaultEinstellungen(),
  eintraege: [],
  tagesTypen: {},
  notizenProTag: {},
  stundenplan: { wochen: 1, raster: [], stunden: [] },
  eigeneFerien: {},
  laufenderTimer: null,
  zuletztGeaendert: new Date().toISOString(),
});

let stand = leererStand();
const hoerer = new Set();
let speicherFehler = null;

export function laden() {
  try {
    const roh = localStorage.getItem(KEY);
    if (roh) {
      const daten = JSON.parse(roh);
      stand = migriere({ ...leererStand(), ...daten });
    }
  } catch (err) {
    console.error('Gespeicherte Daten konnten nicht gelesen werden:', err);
    speicherFehler = 'Die gespeicherten Daten konnten nicht gelesen werden.';
  }
  return stand;
}

function migriere(daten) {
  // Platzhalter für künftige Schema-Änderungen. Einstellungen werden mit den
  // Voreinstellungen aufgefüllt, damit neue Felder nicht undefined sind.
  daten.einstellungen = { ...defaultEinstellungen(), ...(daten.einstellungen || {}) };
  daten.schemaVersion = SCHEMA_VERSION;
  if (!Array.isArray(daten.eintraege)) daten.eintraege = [];
  if (!daten.stundenplan || !Array.isArray(daten.stundenplan.stunden)) {
    daten.stundenplan = { wochen: 1, raster: [], stunden: [] };
  }
  return daten;
}

export function get() {
  return stand;
}

export function speichern() {
  stand.zuletztGeaendert = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(stand));
    speicherFehler = null;
  } catch (err) {
    console.error('Speichern fehlgeschlagen:', err);
    speicherFehler =
      'Speichern fehlgeschlagen – der lokale Speicher ist voll oder gesperrt. ' +
      'Bitte ein Backup exportieren und alte Schuljahre archivieren.';
  }
  melden();
}

export function speicherProblem() {
  return speicherFehler;
}

/** Aendert den Stand und speichert. */
export function aendern(fn) {
  fn(stand);
  speichern();
}

export function abonnieren(fn) {
  hoerer.add(fn);
  return () => hoerer.delete(fn);
}

function melden() {
  for (const fn of hoerer) {
    try {
      fn(stand);
    } catch (err) {
      console.error(err);
    }
  }
}

/* ------------------------------ Einträge ------------------------------ */

export function eintraegeFuerTag(datum) {
  return stand.eintraege
    .filter((e) => e.datum === datum)
    .sort((a, b) => (a.beginn || '').localeCompare(b.beginn || '') || a.erstellt.localeCompare(b.erstellt));
}

export function eintragHinzufuegen(eintrag) {
  aendern((s) => {
    s.eintraege.push(eintrag);
  });
  return eintrag;
}

export function eintragAendern(id, patch) {
  aendern((s) => {
    const i = s.eintraege.findIndex((e) => e.id === id);
    if (i >= 0) s.eintraege[i] = { ...s.eintraege[i], ...patch };
  });
}

export function eintragLoeschen(id) {
  aendern((s) => {
    s.eintraege = s.eintraege.filter((e) => e.id !== id);
  });
}

export function tagestypSetzen(datum, typ) {
  aendern((s) => {
    if (!typ || typ === 'normal') delete s.tagesTypen[datum];
    else s.tagesTypen[datum] = typ;
  });
}

export function einstellungenSetzen(patch) {
  aendern((s) => {
    s.einstellungen = { ...s.einstellungen, ...patch };
  });
}

/* -------------------------------- Backup ------------------------------- */

export function backupErzeugen() {
  return JSON.stringify(
    {
      app: 'Lehrerzeit',
      schemaVersion: SCHEMA_VERSION,
      exportiert: new Date().toISOString(),
      daten: stand,
    },
    null,
    2,
  );
}

/** @returns {{ok:boolean, meldung:string}} */
export function backupEinspielen(text, modus = 'ersetzen') {
  let paket;
  try {
    paket = JSON.parse(text);
  } catch {
    return { ok: false, meldung: 'Die Datei ist keine gültige Backup-Datei.' };
  }
  const daten = paket && paket.daten ? paket.daten : paket;
  if (!daten || !Array.isArray(daten.eintraege)) {
    return { ok: false, meldung: 'In der Datei sind keine Zeiteinträge enthalten.' };
  }
  if (modus === 'zusammenführen') {
    const vorhandene = new Set(stand.eintraege.map((e) => e.id));
    const neue = daten.eintraege.filter((e) => !vorhandene.has(e.id));
    aendern((s) => {
      s.eintraege = [...s.eintraege, ...neue];
      s.tagesTypen = { ...daten.tagesTypen, ...s.tagesTypen };
      s.eigeneFerien = { ...(daten.eigeneFerien || {}), ...(s.eigeneFerien || {}) };
    });
    return { ok: true, meldung: `${neue.length} neue Einträge übernommen.` };
  }
  stand = migriere({ ...leererStand(), ...daten });
  speichern();
  return { ok: true, meldung: `${stand.eintraege.length} Einträge wiederhergestellt.` };
}

export function allesLoeschen() {
  stand = leererStand();
  speichern();
}
