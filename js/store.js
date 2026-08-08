/**
 * Persistenz. Bewusst ausschließlich lokal: localStorage im Browser der
 * Lehrkraft. Kein Server, kein Konto, keine Übertragung. Wer die Daten auf ein
 * zweites Gerät holen will, nutzt Backup exportieren / importieren.
 */

import { SCHEMA_VERSION, defaultEinstellungen, neueErmaessigung } from './model.js';

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
      const alteVersion = daten.schemaVersion || 1;
      stand = migriere({ ...leererStand(), ...daten });
      // Eine Migration wird sofort festgeschrieben. Sonst liegt im Speicher
      // weiterhin das alte Format, und ein Backup-Export vor der ersten
      // Änderung würde den veralteten Stand sichern.
      if (alteVersion !== SCHEMA_VERSION) speichern();
    }
  } catch (err) {
    console.error('Gespeicherte Daten konnten nicht gelesen werden:', err);
    speicherFehler = 'Die gespeicherten Daten konnten nicht gelesen werden.';
  }
  return stand;
}

function migriere(daten) {
  const alt = daten.einstellungen || {};
  daten.einstellungen = { ...defaultEinstellungen(), ...alt };

  // Version 1 -> 2: Beschäftigungsumfang und Unterrichtsverpflichtung wurden
  // getrennt. Vorher gab es nur "meine Pflichtstunden", in denen Teilzeit und
  // Ermäßigungen vermischt waren. Die Stundenzahl wird als Teilzeitumfang
  // übernommen, Altersermäßigung und Anrechnungsstunden werden zu Einträgen in
  // der neuen Ermäßigungsliste.
  if ((daten.schemaVersion || 1) < 2 && alt.pflichtstundenSoll !== undefined) {
    const voll = Number(alt.pflichtstundenSoll) || 27;
    const meine = Number(alt.pflichtstundenIst) || voll;
    daten.einstellungen.pflichtstundenVollzeit = voll;
    daten.einstellungen.beschaeftigungsart = meine < voll ? 'teilzeit' : 'vollzeit';
    daten.einstellungen.teilzeitEingabe = 'stunden';
    daten.einstellungen.teilzeitStunden = meine;

    const uebernommen = [];
    if (Number(alt.altersermaessigung) > 0) {
      uebernommen.push(
        neueErmaessigung({
          bezeichnung: 'Altersermäßigung',
          stunden: Number(alt.altersermaessigung),
          art: 'alter',
          kategorieId: null,
        }),
      );
    }
    if (Number(alt.anrechnungsstunden) > 0) {
      uebernommen.push(
        neueErmaessigung({
          bezeichnung: 'Anrechnungsstunden',
          stunden: Number(alt.anrechnungsstunden),
          art: 'funktion',
          kategorieId: 'funktion',
        }),
      );
    }
    if (uebernommen.length) daten.einstellungen.ermaessigungen = uebernommen;

    delete daten.einstellungen.pflichtstundenSoll;
    delete daten.einstellungen.pflichtstundenIst;
    delete daten.einstellungen.altersermaessigung;
    delete daten.einstellungen.anrechnungsstunden;
  }

  // Die Schulform "Gemeinschaftsschule mit Oberstufe" ist entfallen: Die
  // Pflichtstundenzahl ist dieselbe wie in der Sekundarstufe I, der Unterschied
  // entsteht erst durch die Ermäßigung für den Oberstufeneinsatz. Die eingetragene
  // Stundenzahl bleibt bewusst unangetastet - sie ist die Bezugsgröße einer
  // womöglich eingetragenen Teilzeit, und die darf eine Migration nicht verschieben.
  if (daten.einstellungen.schulform === 'gemeinschaftsschule_oberstufe') {
    daten.einstellungen.schulform = 'gemeinschaftsschule';
  }

  if (!Array.isArray(daten.einstellungen.ermaessigungen)) daten.einstellungen.ermaessigungen = [];
  daten.schemaVersion = SCHEMA_VERSION;
  daten.einstellungen.schemaVersion = SCHEMA_VERSION;
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
