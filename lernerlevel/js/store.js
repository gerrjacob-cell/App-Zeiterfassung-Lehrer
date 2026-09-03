/**
 * Zustand und Aktionen.
 *
 * Der Store hält den gesamten Datenstand im Speicher, beantwortet alle Fragen
 * der Oberfläche (Selektoren) und ist die einzige Stelle, die Daten verändert
 * (Aktionen). Jede Aktion schreibt zusätzlich ein Ereignis in die Historie.
 *
 * Die Aktionen sind absichtlich so geschnitten, wie später auch API-Aufrufe
 * geschnitten wären (eine Rückmeldung, ein Verfahrensstart, ein Abschluss).
 * Für den Produktivbetrieb wird in jeder Aktion aus "Stand ändern + speichern"
 * ein "POST an den Server + Antwort übernehmen".
 */

import {
  ART,
  SCHEMA_VERSION,
  STATUS,
  bilanz,
  heuteIso,
  stimmeVon,
  istOffen,
  neueId,
  neuesToken,
  sortierName,
  statusVon,
} from './model.js';
import {
  evLevelGeaendert,
  evRueckmeldung,
  evRueckmeldungStorniert,
  evStammdaten,
  evVerfahrenAbschluss,
  evVerfahrenStart,
} from './ereignis.js';
import { demoStand } from './demodaten.js';

let stand = null;
let quelle = null;
const hoerer = new Set();

export function abonnieren(fn) {
  hoerer.add(fn);
  return () => hoerer.delete(fn);
}

function melden() {
  for (const fn of hoerer) fn(stand);
}

async function sichern() {
  stand.zuletztGeaendert = new Date().toISOString();
  melden();
  try {
    await quelle.speichern(stand);
  } catch {
    /* Fehler wurde bereits in der Quelle protokolliert. */
  }
}

export async function starten(datenquelle) {
  quelle = datenquelle;
  const gespeichert = await quelle.laden();
  stand = gespeichert && gespeichert.schueler ? migriere(gespeichert) : demoStand();
  if (!gespeichert) await quelle.speichern(stand);
  melden();
  return stand;
}

function migriere(daten) {
  // Noch keine Schemaänderung nötig; der Haken ist bewusst schon vorhanden.
  return { ...daten, schemaVersion: SCHEMA_VERSION };
}

export function getStand() {
  return stand;
}

/* ------------------------------------------------------------ Benutzer --- */

export function aktiverBenutzer() {
  return stand.benutzer.find((b) => b.id === stand.aktiverBenutzer) || null;
}

export function benutzerWechseln(id) {
  stand.aktiverBenutzer = id;
  return sichern();
}

/* ---------------------------------------------------------- Selektoren --- */

export function gruppe(id) {
  return stand.gruppen.find((g) => g.id === id) || null;
}

export function schueler(id) {
  return stand.schueler.find((s) => s.id === id) || null;
}

export function schuelerNachToken(token) {
  return stand.schueler.find((s) => s.token === token) || null;
}

export function schuelerDerGruppe(gruppenId, { mitArchivierten = false } = {}) {
  return stand.schueler
    .filter((s) => s.gruppen.includes(gruppenId) && (mitArchivierten || !s.archiviert))
    .sort(sortierName);
}

export function offenesVerfahren(schuelerId) {
  return stand.verfahren.find((v) => v.schuelerId === schuelerId && istOffen(v)) || null;
}

export function verfahrenVon(schuelerId) {
  return stand.verfahren
    .filter((v) => v.schuelerId === schuelerId)
    .sort((a, b) => b.beginn.localeCompare(a.beginn));
}

export function verfahren(id) {
  return stand.verfahren.find((v) => v.id === id) || null;
}

export function rueckmeldungenZu(verfahrenId) {
  return stand.rueckmeldungen
    .filter((r) => r.verfahrenId === verfahrenId)
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function bilanzVon(verfahrenId) {
  return bilanz(rueckmeldungenZu(verfahrenId));
}

/** Die eigene, aktuell gültige Stimme im laufenden Verfahren eines Schülers. */
export function eigeneStimme(schuelerId) {
  const v = offenesVerfahren(schuelerId);
  const benutzer = aktiverBenutzer();
  if (!v || !benutzer) return null;
  return stimmeVon(rueckmeldungenZu(v.id), benutzer.id);
}

export function historieVon(schuelerId) {
  return stand.ereignisse
    .filter((e) => e.schuelerId === schuelerId)
    .sort((a, b) => b.zeit.localeCompare(a.zeit));
}

export function protokoll(grenze = 300) {
  return [...stand.ereignisse].sort((a, b) => b.zeit.localeCompare(a.zeit)).slice(0, grenze);
}

/** Status eines Schülers - immer abgeleitet, nie gespeichert. */
export function statusDesSchuelers(schuelerId, heute = heuteIso()) {
  return statusVon(offenesVerfahren(schuelerId), heute);
}

/** Kennzahlen einer Lerngruppe für Kacheln, Kopfzeile und Statistik. */
export function statistik(gruppenId, heute = heuteIso()) {
  const liste = schuelerDerGruppe(gruppenId);
  const werte = {
    anzahl: liste.length,
    normal: 0,
    bruecke: 0,
    floss: 0,
    entscheidung: 0,
    level: { 1: 0, 2: 0, 3: 0, 4: 0 },
  };
  for (const s of liste) {
    werte.level[s.level] = (werte.level[s.level] || 0) + 1;
    werte[statusDesSchuelers(s.id, heute)] += 1;
  }
  return werte;
}

/* ------------------------------------------------------------- Aktionen --- */

/**
 * Die häufigste Aktion der App. Bewusst ohne Rückfrage, ohne Pflichtfeld und
 * ohne Seitenwechsel - ein Tipp genügt. Rückgabe: die neue Rückmeldung, damit
 * die Oberfläche ein "Rückgängig" anbieten kann.
 *
 * Jede Lehrkraft hat pro Verfahren eine Stimme. Ein zweiter Tipp ersetzt die
 * eigene frühere Einschätzung: der neue Eintrag wird angehängt und gilt, der
 * alte bleibt in der Historie stehen. Derselbe Wert noch einmal ändert nichts.
 */
export function rueckmeldungGeben(schuelerId, wert, bemerkung = '') {
  const v = offenesVerfahren(schuelerId);
  if (!v) return null;
  const benutzer = aktiverBenutzer();
  const bisher = eigeneStimme(schuelerId);
  if (bisher && bisher.wert === wert && !bemerkung.trim()) return { unveraendert: true, ...bisher };
  const r = {
    id: neueId('rm'),
    verfahrenId: v.id,
    schuelerId,
    wert,
    datum: new Date().toISOString(),
    benutzerId: benutzer ? benutzer.id : null,
    benutzerName: benutzer ? benutzer.name : '',
    bemerkung: bemerkung.trim(),
    storniert: false,
  };
  stand.rueckmeldungen.push(r);
  stand.ereignisse.push(evRueckmeldung(r, benutzer, r.datum));
  sichern();
  return r;
}

/**
 * Korrektur statt Löschung: die Rückmeldung bleibt erhalten und wird als
 * storniert markiert, die Korrektur selbst wird zusätzlich protokolliert.
 */
export function rueckmeldungStornieren(rueckmeldungId, grund = '') {
  const r = stand.rueckmeldungen.find((x) => x.id === rueckmeldungId);
  if (!r || r.storniert) return false;
  const benutzer = aktiverBenutzer();
  r.storniert = true;
  r.storniertAm = new Date().toISOString();
  r.storniertVon = benutzer ? benutzer.id : null;
  r.stornoGrund = grund;
  stand.ereignisse.push(evRueckmeldungStorniert(r, grund, benutzer, r.storniertAm));
  sichern();
  return true;
}

export function verfahrenStarten({ schuelerId, art, kategorieId, zieltext, beginn, frist }) {
  const s = schueler(schuelerId);
  if (!s || offenesVerfahren(schuelerId)) return null;
  const benutzer = aktiverBenutzer();
  const v = {
    id: neueId('vf'),
    schuelerId,
    art,
    status: 'aktiv',
    startLevel: s.level,
    zielLevel: art === ART.floss.id ? s.level - 1 : s.level + 1,
    kategorieId,
    zieltext: zieltext.trim(),
    beginn,
    frist,
    ergebnis: null,
    neuesLevel: null,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
    gestartetVon: benutzer ? benutzer.id : null,
  };
  stand.verfahren.push(v);
  stand.ereignisse.push(evVerfahrenStart(v, benutzer, new Date().toISOString()));
  sichern();
  return v;
}

/** Schließt ein Verfahren ab und setzt gegebenenfalls das neue Level. */
export function verfahrenAbschliessen(verfahrenId, option) {
  const v = verfahren(verfahrenId);
  if (!v || !istOffen(v)) return null;
  const s = schueler(v.schuelerId);
  const benutzer = aktiverBenutzer();
  const jetzt = new Date().toISOString();
  v.status = 'abgeschlossen';
  v.ergebnis = option.id;
  v.neuesLevel = option.neuesLevel;
  v.abgeschlossenAm = jetzt;
  v.abgeschlossenVon = benutzer ? benutzer.id : null;
  if (s && option.neuesLevel && option.neuesLevel !== s.level) s.level = option.neuesLevel;
  stand.ereignisse.push(evVerfahrenAbschluss(v, option, benutzer, jetzt));
  sichern();
  return v;
}

export function levelSetzen(schuelerId, neuesLevel, grund = '') {
  const s = schueler(schuelerId);
  if (!s || s.level === neuesLevel) return false;
  const alt = s.level;
  s.level = neuesLevel;
  stand.ereignisse.push(
    evLevelGeaendert(schuelerId, alt, neuesLevel, grund, aktiverBenutzer(), new Date().toISOString()),
  );
  sichern();
  return true;
}

/* --------------------------------------------------------- Stammdaten --- */

export function schuelerAnlegen({ vorname, nachname, level, gruppen }) {
  const s = {
    id: neueId('sch'),
    vorname: vorname.trim(),
    nachname: nachname.trim(),
    level,
    gruppen: [...gruppen],
    archiviert: false,
    token: neuesToken(),
    angelegtAm: heuteIso(),
    notiz: '',
  };
  stand.schueler.push(s);
  stand.ereignisse.push(
    evStammdaten(
      'schueler.angelegt',
      s.id,
      'Schüler angelegt',
      `${s.vorname} ${s.nachname}, Level ${s.level}`,
      aktiverBenutzer(),
    ),
  );
  sichern();
  return s;
}

/**
 * Übernimmt eine geprüfte Klassenliste (die Vorschau aus import.js).
 *
 * Regeln:
 * - Fehlerhafte und doppelte Zeilen werden übersprungen, nicht geraten.
 * - Eine Lerngruppe, die es noch nicht gibt, wird angelegt.
 * - Ein Schüler, den es schon gibt, bekommt die Lerngruppe dazu. Es entsteht
 *   kein zweiter Datensatz, und sein Level bleibt, wie es ist: eine Liste aus
 *   der Verwaltung weiß nichts über laufende Verfahren.
 */
export function listeImportieren(zeilen) {
  const benutzer = aktiverBenutzer();
  const nachName = new Map(stand.gruppen.map((g) => [g.name.toLowerCase(), g]));
  const bericht = { angelegt: 0, ergaenzt: 0, uebersprungen: 0, gruppen: [] };

  for (const z of zeilen) {
    if (z.zustand !== 'neu' && z.zustand !== 'ergaenzt') {
      bericht.uebersprungen += 1;
      continue;
    }

    let gruppe = null;
    if (z.gruppe) {
      gruppe = nachName.get(z.gruppe.toLowerCase());
      if (!gruppe) {
        gruppe = { id: neueId('gr'), name: z.gruppe, beschreibung: '', archiviert: false };
        stand.gruppen.push(gruppe);
        nachName.set(gruppe.name.toLowerCase(), gruppe);
        bericht.gruppen.push(gruppe.name);
        if (benutzer && !benutzer.gruppen.includes(gruppe.id)) benutzer.gruppen.push(gruppe.id);
        stand.ereignisse.push(
          evStammdaten('gruppe.angelegt', null, 'Lerngruppe angelegt', `${gruppe.name} (aus Liste)`, benutzer),
        );
      }
    }

    const vorhanden = stand.schueler.find(
      (s) =>
        s.vorname.toLowerCase() === z.vorname.toLowerCase() &&
        s.nachname.toLowerCase() === z.nachname.toLowerCase(),
    );

    if (vorhanden) {
      if (gruppe && !vorhanden.gruppen.includes(gruppe.id)) {
        vorhanden.gruppen.push(gruppe.id);
        stand.ereignisse.push(
          evStammdaten(
            'schueler.bearbeitet',
            vorhanden.id,
            'Lerngruppe zugeordnet',
            `${gruppe.name} (aus Liste)`,
            benutzer,
          ),
        );
        bericht.ergaenzt += 1;
      } else {
        bericht.uebersprungen += 1;
      }
      continue;
    }

    const s = {
      id: neueId('sch'),
      vorname: z.vorname,
      nachname: z.nachname,
      level: z.level,
      gruppen: gruppe ? [gruppe.id] : [],
      archiviert: false,
      token: neuesToken(),
      angelegtAm: heuteIso(),
      notiz: '',
    };
    stand.schueler.push(s);
    stand.ereignisse.push(
      evStammdaten(
        'schueler.angelegt',
        s.id,
        'Schüler aus Liste angelegt',
        `${s.vorname} ${s.nachname}, Level ${s.level}${gruppe ? `, ${gruppe.name}` : ''}`,
        benutzer,
      ),
    );
    bericht.angelegt += 1;
  }

  // Eine Millisekunde später, damit die Zusammenfassung im Protokoll über den
  // Einzeleinträgen des Imports steht.
  stand.ereignisse.push(
    evStammdaten(
      'import',
      null,
      'Klassenliste importiert',
      `${bericht.angelegt} angelegt, ${bericht.ergaenzt} zugeordnet, ${bericht.uebersprungen} übersprungen` +
        (bericht.gruppen.length ? ` · neue Lerngruppen: ${bericht.gruppen.join(', ')}` : ''),
      benutzer,
      new Date(Date.now() + 1).toISOString(),
    ),
  );
  sichern();
  return bericht;
}

export function schuelerBearbeiten(id, aenderungen) {
  const s = schueler(id);
  if (!s) return null;
  const vorher = { vorname: s.vorname, nachname: s.nachname, gruppen: [...s.gruppen] };
  Object.assign(s, aenderungen);
  const teile = [];
  if (vorher.vorname !== s.vorname || vorher.nachname !== s.nachname) {
    teile.push(`Name: ${vorher.vorname} ${vorher.nachname} → ${s.vorname} ${s.nachname}`);
  }
  if (vorher.gruppen.join() !== s.gruppen.join()) {
    const namen = (ids) => ids.map((g) => (gruppe(g) ? gruppe(g).name : g)).join(', ') || '–';
    teile.push(`Lerngruppen: ${namen(vorher.gruppen)} → ${namen(s.gruppen)}`);
  }
  if (teile.length) {
    stand.ereignisse.push(
      evStammdaten('schueler.bearbeitet', s.id, 'Stammdaten geändert', teile.join(' · '), aktiverBenutzer()),
    );
  }
  sichern();
  return s;
}

export function schuelerArchivieren(id, archivieren = true) {
  const s = schueler(id);
  if (!s) return null;
  s.archiviert = archivieren;
  stand.ereignisse.push(
    evStammdaten(
      'schueler.archiviert',
      s.id,
      archivieren ? 'Schüler archiviert' : 'Archivierung aufgehoben',
      archivieren ? 'Erscheint nicht mehr in den Lerngruppen.' : 'Erscheint wieder in den Lerngruppen.',
      aktiverBenutzer(),
    ),
  );
  sichern();
  return s;
}

export function gruppeAnlegen({ name, beschreibung }) {
  const g = { id: neueId('gr'), name: name.trim(), beschreibung: (beschreibung || '').trim(), archiviert: false };
  stand.gruppen.push(g);
  const benutzer = aktiverBenutzer();
  if (benutzer && !benutzer.gruppen.includes(g.id)) benutzer.gruppen.push(g.id);
  stand.ereignisse.push(evStammdaten('gruppe.angelegt', null, 'Lerngruppe angelegt', g.name, benutzer));
  sichern();
  return g;
}

export function gruppeBearbeiten(id, aenderungen) {
  const g = gruppe(id);
  if (!g) return null;
  Object.assign(g, aenderungen);
  stand.ereignisse.push(evStammdaten('gruppe.bearbeitet', null, 'Lerngruppe geändert', g.name, aktiverBenutzer()));
  sichern();
  return g;
}

/* -------------------------------------------------------------- Daten --- */

export function exportieren() {
  return JSON.stringify(stand, null, 2);
}

export async function zuruecksetzen() {
  stand = demoStand();
  await quelle.speichern(stand);
  melden();
}

export async function alleDatenLoeschen() {
  await quelle.leeren();
  stand = demoStand();
  await quelle.speichern(stand);
  melden();
}

export { STATUS, ART };
