/**
 * Datenmodell, Kategorien und Voreinstellungen.
 *
 * Die Kategorien orientieren sich an der Systematik, die die GEW ihrer
 * Arbeitszeiterfassung zugrunde legt (Rechtsprechung zur Lehrkraft-Arbeitszeit),
 * ergänzt um "Aufsicht & Vertretung" und "Funktionsaufgaben", weil beides an
 * Gemeinschaftsschulen einen relevanten Anteil ausmacht.
 */

export const SCHEMA_VERSION = 2;

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
 * Quelle: KMK, "Übersicht über die Pflichtstunden der Lehrkräfte an
 * allgemeinbildenden und beruflichen Schulen", Stand September 2019
 * (Schuljahr 2019/2020), Spalte Schleswig-Holstein.
 *
 * ACHTUNG: Die Quelle ist von 2019, die Pflichtstundenverordnung wurde seither
 * neu gefasst. Die Werte sind deshalb Startwerte und keine Rechtsauskunft - sie
 * sind in den Einstellungen frei editierbar und sollten einmal gegen die
 * aktuelle Fassung geprüft werden.
 */
export const PFLICHTSTUNDEN_SH = [
  { id: 'grundschule', name: 'Grundschule', stunden: 28 },
  {
    id: 'gemeinschaftsschule',
    name: 'Gemeinschaftsschule',
    stunden: 27,
    hinweis:
      'Gilt auch für Gemeinschaftsschulen mit gymnasialer Oberstufe. Wer in der Oberstufe in einem ' +
      'Kernfach, einem profilgebenden Fach, zwei profilergänzenden Fächern oder mit mindestens fünf ' +
      'Wochenstunden eingesetzt ist, trägt die Ermäßigung von 1,5 Stunden unten als Aufgabe ein.',
  },
  {
    id: 'foerderzentrum',
    name: 'Förderzentrum',
    stunden: 27,
  },
  {
    id: 'gymnasium',
    name: 'Gymnasium',
    stunden: 25.5,
    hinweis:
      'Für Lehrkräfte, die nicht in der Oberstufe eingesetzt werden, gelten stattdessen 27 Stunden.',
  },
  {
    id: 'berufsbildend',
    name: 'Berufsbildende Schule',
    stunden: 25.5,
    hinweis:
      'Wert für die Laufbahn der Studienrätinnen und Studienräte. Andere Lehrkräfte an ' +
      'berufsbildenden Schulen 27 Stunden, Lehrwerkmeisterinnen und Lehrwerkmeister 28 Stunden.',
  },
  { id: 'eigen', name: 'Eigener Wert', stunden: 27 },
];

/**
 * Vorlagen für Ermäßigungs- und Anrechnungsstunden.
 *
 * Die Liste ist ein Angebot zum Anklicken, keine Rechtsaussage: Welche Aufgabe
 * mit wie vielen Stunden entlastet wird, steht im jeweiligen Erlass und im
 * Bescheid der Schulleitung. Funktionsaufgaben starten deshalb mit einer
 * Stunde, weil die Verteilung von Schule zu Schule verschieden ist.
 *
 * Drei Vorlagen sind dagegen mit belegten Werten vorbelegt - Oberstufeneinsatz,
 * Alter und Schwerbehinderung folgen einer Landesregelung, nicht einem
 * Schulbeschluss. Der Zusatz `quelle` erscheint als Hinweis in der Oberfläche.
 *
 * `kategorieId` ordnet die Aufgabe der Erfassungskategorie zu, in der die
 * zugehörige Arbeit üblicherweise anfällt. Dadurch kann die Auswertung die
 * gewährte Entlastung dem tatsächlichen Aufwand gegenüberstellen.
 */
export const ERMAESSIGUNG_VORLAGEN = [
  {
    bezeichnung: 'Einsatz in der gymnasialen Oberstufe',
    stunden: 1.5,
    art: 'sonstige',
    kategorieId: null,
    quelle:
      'Schleswig-Holstein: 1,5 Stunden bei Einsatz in der Oberstufe in einem Kernfach, einem ' +
      'profilgebenden Fach, zwei profilergänzenden Fächern oder mit mindestens fünf Wochenstunden.',
  },
  { bezeichnung: 'Sicherheitsbeauftragte:r', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Fachkonferenzleitung', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Sammlungsleitung', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Medien- und IT-Beauftragte:r', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Personalrat', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Schwerbehindertenvertretung', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Beratungslehrkraft', art: 'funktion', kategorieId: 'kommunikation' },
  { bezeichnung: 'Verbindungslehrkraft', art: 'funktion', kategorieId: 'kommunikation' },
  { bezeichnung: 'Präventionsbeauftragte:r', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Ganztagskoordination', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Ausbildung von Lehrkräften im Vorbereitungsdienst', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Schulentwicklung / Projektarbeit', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Klassenleitung', art: 'funktion', kategorieId: 'funktion' },
  { bezeichnung: 'Korrekturfächer / Oberstufe', art: 'funktion', kategorieId: 'korrektur' },
  {
    bezeichnung: 'Altersermäßigung',
    stunden: 1,
    art: 'alter',
    kategorieId: null,
    quelle: 'Schleswig-Holstein: 1 Stunde ab dem 60. Lebensjahr.',
  },
  {
    bezeichnung: 'Ermäßigung wegen Schwerbehinderung',
    stunden: 1,
    art: 'schwerbehinderung',
    kategorieId: null,
    quelle:
      'Schleswig-Holstein: bei mindestens 50 Prozent 1 Stunde ab dem 55. Lebensjahr, ab dem ' +
      '63. Lebensjahr eine weitere Stunde. Zusätzlich sinkt die wöchentliche Arbeitszeit von 41 ' +
      'auf 40 Stunden - das gehört oben unter Arbeitszeitmodell eingetragen.',
  },
  { bezeichnung: 'Sonstige Ermäßigung', art: 'sonstige', kategorieId: null },
];

export const ERMAESSIGUNG_ARTEN = {
  funktion: {
    id: 'funktion',
    name: 'Funktions- oder Sonderaufgabe',
    // Für diese Stunden wird eine Gegenleistung erwartet - hier lohnt der
    // Vergleich zwischen gewährter Entlastung und tatsächlichem Aufwand.
    aufgabenbezogen: true,
  },
  alter: { id: 'alter', name: 'Altersermäßigung', aufgabenbezogen: false },
  schwerbehinderung: { id: 'schwerbehinderung', name: 'Schwerbehinderung', aufgabenbezogen: false },
  sonstige: { id: 'sonstige', name: 'Sonstige Ermäßigung', aufgabenbezogen: false },
};

export function defaultEinstellungen() {
  return {
    schemaVersion: SCHEMA_VERSION,
    // Anzeige-Name bleibt lokal auf dem Gerät; er wird nie exportiert, ausser
    // in das persönliche Backup und den persönlichen PDF-Bericht.
    name: '',
    schulform: 'gemeinschaftsschule',

    /* ---------------------------------------------------------------------
     * Beschäftigungsumfang und Unterrichtsverpflichtung sind zwei verschiedene
     * Dinge und werden hier bewusst getrennt geführt:
     *
     *   Beschäftigungsumfang  -> bestimmt die ARBEITSZEIT (Soll-Stunden)
     *   Unterrichtsverpflichtung -> bestimmt die UNTERRICHTSSTUNDEN
     *
     * Ermäßigungen mindern nur das Zweite. Wer wegen einer Funktionsaufgabe
     * zwei Stunden weniger unterrichtet, arbeitet keine Minute weniger - die
     * Zeit ist für die Aufgabe vorgesehen. Würde man Ermäßigungen in den
     * Beschäftigungsumfang einrechnen, käme ein zu niedriges Arbeitszeit-Soll
     * heraus und die Dokumentation würde Mehrarbeit verschleiern.
     * ------------------------------------------------------------------- */

    // Pflichtstundenzahl einer Vollzeitkraft an dieser Schulart.
    pflichtstundenVollzeit: 27,
    // 'vollzeit' | 'teilzeit'
    beschaeftigungsart: 'vollzeit',
    // Wie der Teilzeitumfang bewilligt wurde: als Unterrichtsstunden
    // ('stunden'), als Bruchteil/Prozent der Arbeitszeit ('prozent') oder als
    // Wochenstunden der Arbeitszeit ('wochenstunden', vor allem bei TV-L).
    teilzeitEingabe: 'stunden',
    teilzeitStunden: 27,
    teilzeitProzent: 100,
    teilzeitWochenstunden: 41,

    // Regelmäßige wöchentliche Arbeitszeit einer Vollzeitkraft.
    wochenarbeitszeit: 41,
    urlaubstage: 30,

    // Ermäßigungs- und Anrechnungsstunden, siehe ERMAESSIGUNG_VORLAGEN.
    ermaessigungen: [],

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

/**
 * Beschäftigungsumfang als Faktor (1 = Vollzeit).
 *
 * Teilzeit wird in Schleswig-Holstein je nach Statusgruppe unterschiedlich
 * bewilligt: bei verbeamteten Lehrkräften meist als Zahl der zu erteilenden
 * Unterrichtsstunden, bei Tarifbeschäftigten nach TV-L als Bruchteil der
 * regelmäßigen wöchentlichen Arbeitszeit. Beide Wege führen zum selben Faktor,
 * deshalb sind beide Eingabearten möglich - niemand soll seinen Bescheid
 * umrechnen müssen, bevor er die App benutzen kann.
 *
 * Ermäßigungsstunden gehen hier bewusst NICHT ein.
 */
export function beschaeftigungsfaktor(einst) {
  if (einst.beschaeftigungsart !== 'teilzeit') return 1;

  let faktor = 1;
  if (einst.teilzeitEingabe === 'prozent') {
    faktor = (Number(einst.teilzeitProzent) || 100) / 100;
  } else if (einst.teilzeitEingabe === 'wochenstunden') {
    const voll = Number(einst.wochenarbeitszeit) || 41;
    faktor = voll > 0 ? (Number(einst.teilzeitWochenstunden) || voll) / voll : 1;
  } else {
    const voll = Number(einst.pflichtstundenVollzeit) || 0;
    faktor = voll > 0 ? (Number(einst.teilzeitStunden) || voll) / voll : 1;
  }
  return Math.min(Math.max(faktor, 0), 1);
}

/** Beschäftigungsumfang als Prozentwert mit einer Nachkommastelle. */
export function beschaeftigungsprozent(einst) {
  return Math.round(beschaeftigungsfaktor(einst) * 1000) / 10;
}

/** Summe aller gewährten Ermäßigungs- und Anrechnungsstunden pro Woche. */
export function ermaessigungsstunden(einst, art = null) {
  const liste = Array.isArray(einst.ermaessigungen) ? einst.ermaessigungen : [];
  return liste
    .filter((e) => (art ? e.art === art : true))
    .reduce((summe, e) => summe + (Number(e.stunden) || 0), 0);
}

/**
 * Unterrichtsverpflichtung in Unterrichtsstunden pro Woche:
 * anteilige Pflichtstundenzahl abzüglich aller Ermäßigungen.
 */
export function unterrichtsverpflichtung(einst) {
  const anteilig = (Number(einst.pflichtstundenVollzeit) || 0) * beschaeftigungsfaktor(einst);
  return Math.max(0, anteilig - ermaessigungsstunden(einst));
}

/**
 * Wie viel Arbeitszeit steckt rechnerisch in einer Unterrichtsstunde des
 * Deputats? Eine Vollzeitkraft leistet ihre gesamte Wochenarbeitszeit für ihre
 * Pflichtstunden - also entspricht eine Deputatsstunde
 * (Wochenarbeitszeit / Pflichtstunden) Zeitstunden, bei 41 h und 27
 * Pflichtstunden rund 1:31 h.
 *
 * Genau dieser Wert macht Anrechnungsstunden vergleichbar: Wer eine Stunde
 * Ermäßigung für eine Aufgabe bekommt, hat dafür rechnerisch 1:31 h pro Woche
 * zur Verfügung - nicht 45 Minuten.
 */
export function minutenProDeputatsstunde(einst) {
  const pflicht = Number(einst.pflichtstundenVollzeit) || 0;
  if (pflicht <= 0) return 0;
  return ((Number(einst.wochenarbeitszeit) || 41) * 60) / pflicht;
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
    // Optionale Zuordnung zu einer Ermäßigung, damit sich gewährte Entlastung
    // und tatsächlicher Aufwand gegenüberstellen lassen.
    aufgabeId: null,
    quelle: 'manuell',
    erstellt: new Date().toISOString(),
  };
}

export function neueErmaessigung(vorlage = {}) {
  return {
    id: neueId('a'),
    bezeichnung: vorlage.bezeichnung || 'Neue Aufgabe',
    stunden: vorlage.stunden ?? 1,
    art: vorlage.art || 'funktion',
    kategorieId: vorlage.kategorieId ?? 'funktion',
    notiz: '',
  };
}
