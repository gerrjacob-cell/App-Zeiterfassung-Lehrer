/**
 * Fachliches Modell des Lernerlevel Managers.
 *
 * Hier steht ausschließlich Logik ohne Speicher- und ohne DOM-Bezug: Level,
 * Verfahren (Floß/Brücke), Rückmeldungen, abgeleitete Status. Alles, was die
 * App anzeigt, wird aus diesen Funktionen berechnet - damit später ein Server
 * dieselben Regeln übernehmen kann, ohne dass die Oberfläche sie neu erfindet.
 */

export const SCHEMA_VERSION = 1;

export const LEVEL = [1, 2, 3, 4];
export const HOECHSTES_LEVEL = 4;
export const NIEDRIGSTES_LEVEL = 1;

/** Verfahrensarten. Floß = drohender Abstieg, Brücke = möglicher Aufstieg. */
export const ART = {
  floss: {
    id: 'floss',
    name: 'Floß',
    ikone: '🛟',
    langname: 'Floßverfahren',
    aktivText: 'Floß aktiv',
    richtung: -1,
  },
  bruecke: {
    id: 'bruecke',
    name: 'Brücke',
    ikone: '🌉',
    langname: 'Brückenverfahren',
    aktivText: 'Brücke aktiv',
    richtung: +1,
  },
};

/** Rückmeldungen zu einem laufenden Verfahren. */
export const BEWERTUNG = {
  erfuellt: { id: 'erfuellt', name: 'Erfüllt', kurz: 'Erfüllt', ikone: '🟢', punkte: 1 },
  teilweise: { id: 'teilweise', name: 'Teilweise', kurz: 'Teilweise', ikone: '🟡', punkte: 0.5 },
  nicht: { id: 'nicht', name: 'Nicht erfüllt', kurz: 'Nicht erfüllt', ikone: '🔴', punkte: 0 },
};

/** Abgeleitete Status eines Schülers. */
export const STATUS = {
  normal: { id: 'normal', name: 'Normal', ikone: '🟢' },
  bruecke: { id: 'bruecke', name: 'Brücke aktiv', ikone: '🌉' },
  floss: { id: 'floss', name: 'Floß aktiv', ikone: '🛟' },
  entscheidung: { id: 'entscheidung', name: 'Entscheidung fällig', ikone: '⚠️' },
};

/**
 * Zielkategorien. Die Vorschläge sind bewusst als fertige Sätze hinterlegt:
 * ein Tipp statt einer Texteingabe spart im Unterricht die meiste Zeit.
 * Kategorien und Vorschläge sind Daten, keine Konstanten im Code - sie können
 * später aus der Datenbank kommen, ohne dass sich die Oberfläche ändert.
 */
export const ZIEL_KATEGORIEN = [
  {
    id: 'arbeitsverhalten',
    name: 'Arbeitsverhalten',
    vorschlaege: [
      'Ich arbeite in der Lernzeit ruhig und konzentriert.',
      'Ich erledige meine Aufgaben in der vorgesehenen Zeit.',
      'Ich halte mich an die vereinbarte Arbeitsform.',
    ],
  },
  {
    id: 'selbststaendigkeit',
    name: 'Selbstständigkeit',
    vorschlaege: [
      'Ich beginne selbstständig mit meinen Aufgaben.',
      'Ich hole mir Hilfe erst, wenn ich es allein versucht habe.',
      'Ich plane meine Woche selbstständig mit dem Lernplan.',
    ],
  },
  {
    id: 'zuverlaessigkeit',
    name: 'Zuverlässigkeit',
    vorschlaege: [
      'Ich erledige meine Hausaufgaben vollständig.',
      'Ich halte Absprachen ein.',
      'Ich gebe Rückläufe pünktlich ab.',
    ],
  },
  {
    id: 'sozialverhalten',
    name: 'Sozialverhalten',
    vorschlaege: [
      'Ich arbeite in der Gruppe freundlich mit.',
      'Ich löse Streit ohne Beleidigungen.',
      'Ich störe andere beim Arbeiten nicht.',
    ],
  },
  {
    id: 'material',
    name: 'Material/Organisation',
    vorschlaege: [
      'Ich habe mein Material vollständig dabei.',
      'Meine Mappe ist geordnet und vollständig.',
      'Ich bin pünktlich und startklar.',
    ],
  },
  {
    id: 'individuell',
    name: 'Individuelle Vereinbarung',
    vorschlaege: [],
  },
];

export function kategorie(id) {
  return ZIEL_KATEGORIEN.find((k) => k.id === id) || ZIEL_KATEGORIEN[ZIEL_KATEGORIEN.length - 1];
}

/* ------------------------------------------------------------------ IDs --- */

const zufallsHex = (bytes) => {
  const feld = new Uint8Array(bytes);
  (globalThis.crypto || {}).getRandomValues
    ? crypto.getRandomValues(feld)
    : feld.forEach((_, i) => (feld[i] = Math.floor(Math.random() * 256)));
  return Array.from(feld, (b) => b.toString(16).padStart(2, '0')).join('');
};

/** Interne ID. Fachlich bedeutungslos, damit sie gefahrlos in URLs auftaucht. */
export function neueId(praefix) {
  return `${praefix}_${zufallsHex(8)}`;
}

/**
 * Dauerhaftes Zugangstoken eines Schülers - Grundlage des späteren QR-Codes.
 * 16 Byte Zufall, nicht ratbar, ohne jeden Bezug zu Name, Level oder Status.
 * Das Token ändert sich nie, auch wenn der Schüler das Level wechselt.
 */
export function neuesToken() {
  return zufallsHex(16);
}

/* --------------------------------------------------------------- Level --- */

export function abstiegsLevel(level) {
  return level > NIEDRIGSTES_LEVEL ? level - 1 : null;
}

export function aufstiegsLevel(level) {
  return level < HOECHSTES_LEVEL ? level + 1 : null;
}

/** Kann für diesen Schüler ein Verfahren dieser Art überhaupt starten? */
export function artMoeglich(art, level) {
  return art === ART.floss.id ? abstiegsLevel(level) !== null : aufstiegsLevel(level) !== null;
}

/* ----------------------------------------------------------- Verfahren --- */

export function istOffen(verfahren) {
  return verfahren.status === 'aktiv';
}

/** Ist die Frist erreicht? Der Fristtag selbst zählt noch als Entscheidungstag. */
export function fristErreicht(verfahren, heute = heuteIso()) {
  return verfahren.frist <= heute;
}

/**
 * Der Status eines Schülers wird nie gespeichert, sondern immer aus dem
 * offenen Verfahren und dem Datum abgeleitet. Damit kann eine fällige
 * Entscheidung nicht "vergessen" werden, nur weil niemand die App geöffnet hat.
 */
export function statusVon(offenesVerfahren, heute = heuteIso()) {
  if (!offenesVerfahren) return STATUS.normal.id;
  if (fristErreicht(offenesVerfahren, heute)) return STATUS.entscheidung.id;
  return offenesVerfahren.art === ART.floss.id ? STATUS.floss.id : STATUS.bruecke.id;
}

/** Mögliche Abschlüsse eines Verfahrens - Beschriftung inklusive. */
export function abschlussOptionen(verfahren) {
  if (verfahren.art === ART.bruecke.id) {
    return [
      {
        id: 'aufstieg',
        text: 'Levelaufstieg',
        ikone: '⬆️',
        ton: 'gut',
        neuesLevel: aufstiegsLevel(verfahren.startLevel),
      },
      { id: 'beibehalten', text: 'Level beibehalten', ikone: '↩️', ton: 'neutral', neuesLevel: verfahren.startLevel },
    ];
  }
  return [
    { id: 'gehalten', text: 'Level gehalten', ikone: '✅', ton: 'gut', neuesLevel: verfahren.startLevel },
    {
      id: 'abstieg',
      text: 'Levelabstieg',
      ikone: '⬇️',
      ton: 'kritisch',
      neuesLevel: abstiegsLevel(verfahren.startLevel),
    },
  ];
}

/* ------------------------------------------------------- Rückmeldungen --- */

/**
 * Die gültige Stimme jeder Lehrkraft in einem Verfahren.
 *
 * Jede Lehrkraft hat pro Verfahren genau eine Stimme. Ändert sie ihre
 * Einschätzung, wird die frühere nicht gelöscht, sondern von der neueren
 * abgelöst: gültig ist die jeweils letzte nicht stornierte Rückmeldung einer
 * Person. Die Liste bleibt damit vollständig und die Historie nachvollziehbar.
 */
export function stimmen(rueckmeldungen) {
  const je = new Map();
  for (const r of rueckmeldungen) {
    if (r.storniert) continue;
    const schluessel = r.benutzerId || r.benutzerName;
    const bisher = je.get(schluessel);
    if (!bisher || r.datum > bisher.datum) je.set(schluessel, r);
  }
  return [...je.values()];
}

/** Die aktuelle Stimme einer bestimmten Lehrkraft, falls vorhanden. */
export function stimmeVon(rueckmeldungen, benutzerId) {
  return stimmen(rueckmeldungen).find((r) => r.benutzerId === benutzerId) || null;
}

/** Zählt die gültigen Stimmen eines Verfahrens - eine je Lehrkraft. */
export function bilanz(rueckmeldungen) {
  const gueltig = stimmen(rueckmeldungen);
  const zaehle = (wert) => gueltig.filter((r) => r.wert === wert).length;
  const erfuellt = zaehle('erfuellt');
  const teilweise = zaehle('teilweise');
  const nicht = zaehle('nicht');
  const gesamt = erfuellt + teilweise + nicht;
  const punkte = erfuellt + teilweise * 0.5;
  return {
    erfuellt,
    teilweise,
    nicht,
    gesamt,
    quote: gesamt ? punkte / gesamt : null,
  };
}

/* ----------------------------------------------------------- Datum ------- */

export function heuteIso() {
  return iso(new Date());
}

export function iso(datum) {
  const d = datum instanceof Date ? datum : new Date(datum);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function tageVersetzt(tage, ab = new Date()) {
  const d = new Date(ab);
  d.setDate(d.getDate() + tage);
  return iso(d);
}

export function datumLang(isoDatum) {
  if (!isoDatum) return '';
  const [j, m, t] = isoDatum.split('-');
  return `${t}.${m}.${j}`;
}

export function zeitpunktLang(isoZeit) {
  if (!isoZeit) return '';
  const d = new Date(isoZeit);
  return `${datumLang(iso(d))}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} Uhr`;
}

/** Ganze Tage zwischen zwei ISO-Daten (b - a). */
export function tageZwischen(a, b) {
  const ms = new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`);
  return Math.round(ms / 86400000);
}

/** "seit 8 Tagen", "noch 3 Tage", "Frist heute" - kurz und ohne Datumsrechnen. */
export function fristText(verfahren, heute = heuteIso()) {
  const rest = tageZwischen(heute, verfahren.frist);
  if (rest < 0) return `Frist seit ${Math.abs(rest)} ${Math.abs(rest) === 1 ? 'Tag' : 'Tagen'} erreicht`;
  if (rest === 0) return 'Frist heute';
  return `noch ${rest} ${rest === 1 ? 'Tag' : 'Tage'}`;
}

export function name(schueler) {
  return `${schueler.vorname} ${schueler.nachname}`;
}

export function sortierName(a, b) {
  return (
    a.nachname.localeCompare(b.nachname, 'de') || a.vorname.localeCompare(b.vorname, 'de')
  );
}
