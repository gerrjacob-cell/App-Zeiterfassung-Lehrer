/**
 * Datenmodell, Kategorien und Voreinstellungen.
 *
 * Die Kategorien orientieren sich an der Systematik, die die GEW ihrer
 * Arbeitszeiterfassung zugrunde legt (Rechtsprechung zur Lehrkraft-Arbeitszeit),
 * ergänzt um "Aufsicht & Vertretung" und "Funktionsaufgaben", weil beides an
 * Gemeinschaftsschulen einen relevanten Anteil ausmacht.
 */

export const SCHEMA_VERSION = 1;

export const KATEGORIEN = [
  {
    id: 'unterricht',
    name: 'Unterricht',
    kurz: 'Unterricht',
    beschreibung: 'Gehaltener Unterricht einschließlich Doppelsteckung und Vertretungsunterricht.',
  },
  {
    id: 'vorbereitung',
    name: 'Vor- und Nachbereitung',
    kurz: 'Vor/Nach',
    beschreibung: 'Planung von Stunden und Einheiten, Material erstellen, Raum und Medien vorbereiten.',
  },
  {
    id: 'korrektur',
    name: 'Korrekturen & Leistungsbewertung',
    kurz: 'Korrektur',
    beschreibung: 'Klassenarbeiten, Tests, Lernentwicklungsberichte, Zeugnisse, Gutachten.',
  },
  {
    id: 'kommunikation',
    name: 'Kommunikation',
    kurz: 'Kommunikation',
    beschreibung: 'Eltern, Schülerinnen und Schüler, Kolleginnen und Kollegen, Jugendamt, externe Partner.',
  },
  {
    id: 'konferenzen',
    name: 'Konferenzen & Arbeitsorganisation',
    kurz: 'Konferenzen',
    beschreibung: 'Dienstversammlungen, Fach- und Klassenkonferenzen, Teamsitzungen, Verwaltung, Dokumentation.',
  },
  {
    id: 'aufsicht',
    name: 'Aufsicht & Vertretungsbereitschaft',
    kurz: 'Aufsicht',
    beschreibung: 'Pausenaufsicht, Busaufsicht, Springstunden mit Bereitschaft, Klausuraufsicht.',
  },
  {
    id: 'fortbildung',
    name: 'Fort- und Weiterbildung',
    kurz: 'Fortbildung',
    beschreibung: 'Fortbildungen, Fachliteratur, Studientage, Einarbeitung in neue Vorgaben.',
  },
  {
    id: 'fahrten',
    name: 'Fahrten & Schulveranstaltungen',
    kurz: 'Fahrten',
    beschreibung: 'Klassenfahrten, Wandertage, Praktikumsbesuche, Schulfeste, Tage der offenen Tür.',
  },
  {
    id: 'funktion',
    name: 'Funktions- und Sonderaufgaben',
    kurz: 'Funktion',
    beschreibung: 'Fachleitung, Klassenleitung, Schulentwicklung, Projekte, Personalrat, Ausbildung von LiV.',
  },
];

export const KATEGORIE_MAP = Object.fromEntries(KATEGORIEN.map((k) => [k.id, k]));

/** Tagestypen, die das Tages-Soll auf 0 setzen bzw. verändern. */
export const TAGESTYPEN = {
  normal: { id: 'normal', name: 'Arbeitstag', sollFaktor: 1 },
  urlaub: { id: 'urlaub', name: 'Erholungsurlaub', sollFaktor: 0 },
  krank: { id: 'krank', name: 'Krank', sollFaktor: 0 },
  frei: { id: 'frei', name: 'Dienstbefreiung / frei', sollFaktor: 0 },
};

/**
 * Pflichtstunden-Voreinstellungen für Schleswig-Holstein.
 *
 * ACHTUNG: Diese Werte sind Voreinstellungen und können sich durch Änderung
 * der Pflichtstundenverordnung verschieben. Sie sind in den Einstellungen frei
 * editierbar. Bitte einmalig gegen die aktuelle Fassung der Landesverordnung
 * über die regelmäßige Pflichtstundenzahl der Lehrkräfte prüfen.
 */
export const PFLICHTSTUNDEN_SH = [
  { id: 'grundschule', name: 'Grundschule', stunden: 28 },
  { id: 'gemeinschaftsschule', name: 'Gemeinschaftsschule (Sek I)', stunden: 27 },
  { id: 'gemeinschaftsschule_oberstufe', name: 'Gemeinschaftsschule mit Oberstufe', stunden: 25.5 },
  { id: 'foerderzentrum', name: 'Förderzentrum', stunden: 26.5 },
  { id: 'gymnasium', name: 'Gymnasium', stunden: 25.5 },
  { id: 'berufsbildend', name: 'Berufsbildende Schule', stunden: 25.5 },
  { id: 'eigen', name: 'Eigener Wert', stunden: 27 },
];

export function defaultEinstellungen() {
  return {
    schemaVersion: SCHEMA_VERSION,
    // Anzeige-Name bleibt lokal auf dem Gerät; er wird nie exportiert, ausser
    // in das persönliche Backup und den persönlichen PDF-Bericht.
    name: '',
    schulform: 'gemeinschaftsschule',
    pflichtstundenSoll: 27,
    pflichtstundenIst: 27,
    // Regelmäßige wöchentliche Arbeitszeit der Beamtinnen und Beamten in SH.
    wochenarbeitszeit: 41,
    urlaubstage: 30,
    altersermaessigung: 0,
    anrechnungsstunden: 0,
    unterrichtsstundeMinuten: 45,
    // Ist-Erfassung des Unterrichts: 'stundenplan' rechnet mit der Netto-Dauer
    // der Unterrichtsstunde, 'real' erwartet echte Zeiten.
    unterrichtErfassung: 'stundenplan',
    schuljahr: aktuellesSchuljahr(),
    erinnerungAktiv: false,
    erinnerungUhrzeit: '18:30',
    theme: 'auto',
    // Erste Schritte abgeschlossen?
    setupFertig: false,
  };
}

/** Schuljahr als String "2026/2027" für ein Datum (Schuljahresbeginn 1. August). */
export function schuljahrFuer(datum) {
  const d = datum instanceof Date ? datum : new Date(datum);
  const jahr = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${jahr}/${jahr + 1}`;
}

export function aktuellesSchuljahr() {
  return schuljahrFuer(new Date());
}

/** Start- und Enddatum eines Schuljahres (1.8. bis 31.7.). */
export function schuljahrZeitraum(schuljahr) {
  const start = Number(schuljahr.slice(0, 4));
  return { von: `${start}-08-01`, bis: `${start + 1}-07-31` };
}

/** Teilzeitfaktor aus Pflichtstunden. */
export function beschaeftigungsfaktor(einst) {
  const soll = Number(einst.pflichtstundenSoll) || 0;
  const ist = Number(einst.pflichtstundenIst) || 0;
  if (soll <= 0) return 1;
  return Math.min(Math.max(ist / soll, 0), 2);
}

let idZaehler = 0;
export function neueId(prefix = 'e') {
  idZaehler += 1;
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${idZaehler.toString(36)}${rnd}`;
}

export function leererEintrag(datum, kategorieId) {
  return {
    id: neueId(),
    datum,
    kategorieId,
    minuten: 0,
    notiz: '',
    beginn: null,
    ende: null,
    quelle: 'manuell',
    erstellt: new Date().toISOString(),
  };
}
