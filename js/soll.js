/**
 * Berechnung der Soll-Arbeitszeit nach dem Jahresarbeitszeitmodell.
 *
 * Modell (Schleswig-Holstein, Beamtinnen und Beamte):
 *   Tages-Soll (Vollzeit) = wöchentliche Arbeitszeit / 5
 *   Soll besteht an jedem Werktag, der weder gesetzlicher Feiertag noch
 *   Erholungsurlaub noch Krankheitstag ist – auch in den Schulferien.
 *   Teilzeit reduziert das Tages-Soll anteilig (Pflichtstunden ist / soll).
 *
 * Genau hier liegt der Punkt, den die Erfassung sichtbar machen soll: Die
 * Schulferien sind kein Urlaub. Urlaubsanspruch sind 30 Werktage im Jahr; die
 * übrigen unterrichtsfreien Tage sind reguläre Arbeitstage mit Soll-Zeit.
 * Wer in den Ferien nichts erfasst, baut deshalb sichtbar Minusstunden auf -
 * wer wie üblich Unterricht vorbereitet und korrigiert, sieht wo die Zeit
 * tatsächlich hingeht.
 */

import { TAGESTYPEN, beschaeftigungsfaktor, schuljahrZeitraum } from './model.js';
import {
  feiertageBereich,
  ferientageSet,
  istWochenende,
  tageImBereich,
  ausIso,
  iso,
  plusTage,
} from './kalender-sh.js';

/**
 * Baut den Kalender eines Schuljahres: für jeden Tag Typ, Soll-Minuten und
 * Kontext (Ferien, Feiertag).
 *
 * @param {object} einst Einstellungen
 * @param {object} tagesTypen Map datumIso -> tagestypId (vom Nutzer gesetzt)
 * @param {object} eigeneFerien Map schuljahr -> Ferienliste
 */
export function baueJahreskalender(einst, tagesTypen = {}, eigeneFerien = null) {
  const schuljahr = einst.schuljahr;
  const { von, bis } = schuljahrZeitraum(schuljahr);
  const feiertage = feiertageBereich(von, bis);
  const ferien = ferientageSet(schuljahr, eigeneFerien);
  const faktor = beschaeftigungsfaktor(einst);
  const tagesSollVollMin = (Number(einst.wochenarbeitszeit) || 41) * 60 / 5;

  const tage = new Map();
  for (const datum of tageImBereich(von, bis)) {
    const we = istWochenende(datum);
    const feiertag = feiertage[datum] || null;
    const inFerien = ferien.has(datum);
    let typ = tagesTypen[datum] || 'normal';
    if (we || feiertag) typ = 'frei';

    const typDef = TAGESTYPEN[typ] || TAGESTYPEN.normal;
    const sollMinuten = we || feiertag ? 0 : Math.round(tagesSollVollMin * faktor * typDef.sollFaktor);

    tage.set(datum, {
      datum,
      wochenende: we,
      feiertag,
      ferien: inFerien,
      typ,
      sollMinuten,
    });
  }
  return { schuljahr, von, bis, tage, faktor, tagesSollVollMin };
}

/**
 * Verteilt den Erholungsurlaub automatisch auf Ferientage: zuerst Sommerferien,
 * dann Herbst-, Weihnachts- und Osterferien. Liefert eine Map datumIso ->
 * 'urlaub' für alle Tage, die als Urlaub gelten sollen.
 *
 * Der Vorschlag ist bewusst nur ein Vorschlag – er ist im Kalender einzeln
 * überschreibbar, weil die tatsächliche Urlaubslage individuell ist.
 */
export function urlaubsvorschlag(einst, eigeneFerien = null) {
  const schuljahr = einst.schuljahr;
  const { von, bis } = schuljahrZeitraum(schuljahr);
  const feiertage = feiertageBereich(von, bis);
  const ferien = ferientageSet(schuljahr, eigeneFerien);
  const anzahl = Math.round((Number(einst.urlaubstage) || 30) * beschaeftigungsfaktorTage(einst));

  // Ferientage nach Priorität: Sommerferien am Ende des Schuljahres zuerst,
  // damit der längste zusammenhängende Block zuerst als Urlaub gilt.
  const kandidaten = [...ferien]
    .filter((d) => !istWochenende(d) && !feiertage[d])
    .sort();

  const sommer = kandidaten.filter((d) => {
    const m = Number(d.slice(5, 7));
    return m === 6 || m === 7 || m === 8;
  });
  const rest = kandidaten.filter((d) => !sommer.includes(d));
  const reihenfolge = [...sommer, ...rest];

  const out = {};
  for (const d of reihenfolge.slice(0, anzahl)) out[d] = 'urlaub';
  return out;
}

/** Urlaubsanspruch wird bei Teilzeit in Wochentagen nicht gekürzt (5-Tage-Woche). */
function beschaeftigungsfaktorTage(einst) {
  return einst.teilzeitTageProWoche && einst.teilzeitTageProWoche < 5
    ? einst.teilzeitTageProWoche / 5
    : 1;
}

/**
 * Aggregiert Ist- und Soll-Zeiten für einen Zeitraum.
 *
 * @returns {{istMinuten:number, sollMinuten:number, saldoMinuten:number,
 *            proKategorie:object, proTag:Map, proWoche:Array, arbeitstage:number}}
 */
export function auswerten(kalender, eintraege, vonIso, bisIso) {
  const proKategorie = {};
  const proTag = new Map();
  let istMinuten = 0;
  let sollMinuten = 0;
  let arbeitstage = 0;
  let tageMitErfassung = 0;

  for (const datum of tageImBereich(vonIso, bisIso)) {
    const info = kalender.tage.get(datum);
    const soll = info ? info.sollMinuten : 0;
    sollMinuten += soll;
    if (soll > 0) arbeitstage += 1;
    proTag.set(datum, { datum, soll, ist: 0, info });
  }

  for (const e of eintraege) {
    if (e.datum < vonIso || e.datum > bisIso) continue;
    const min = Number(e.minuten) || 0;
    istMinuten += min;
    proKategorie[e.kategorieId] = (proKategorie[e.kategorieId] || 0) + min;
    const t = proTag.get(e.datum);
    if (t) t.ist += min;
  }

  for (const t of proTag.values()) if (t.ist > 0) tageMitErfassung += 1;

  return {
    von: vonIso,
    bis: bisIso,
    istMinuten,
    sollMinuten,
    saldoMinuten: istMinuten - sollMinuten,
    proKategorie,
    proTag,
    proWoche: wochenReihe(proTag),
    arbeitstage,
    tageMitErfassung,
  };
}

/** Fasst die Tagesdaten zu Wochen (Montag-Sonntag) zusammen. */
function wochenReihe(proTag) {
  const wochen = new Map();
  for (const t of proTag.values()) {
    const d = ausIso(t.datum);
    const montag = iso(plusTage(d, -((d.getDay() + 6) % 7)));
    if (!wochen.has(montag)) wochen.set(montag, { start: montag, ist: 0, soll: 0, tage: 0 });
    const w = wochen.get(montag);
    w.ist += t.ist;
    w.soll += t.soll;
    w.tage += 1;
  }
  return [...wochen.values()].sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Soll-Kennzahlen des ganzen Schuljahres – für die Kopfzeile der Auswertung.
 */
export function jahresKennzahlen(kalender) {
  let sollMinuten = 0;
  let arbeitstage = 0;
  let urlaubstage = 0;
  let ferienArbeitstage = 0;
  for (const t of kalender.tage.values()) {
    sollMinuten += t.sollMinuten;
    if (t.sollMinuten > 0) {
      arbeitstage += 1;
      if (t.ferien) ferienArbeitstage += 1;
    }
    if (t.typ === 'urlaub') urlaubstage += 1;
  }
  return { sollMinuten, arbeitstage, urlaubstage, ferienArbeitstage };
}

/** Minuten als "12:34 h". */
export function minutenAlsStunden(minuten, mitVorzeichen = false) {
  const neg = minuten < 0;
  const abs = Math.abs(Math.round(minuten));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const vz = neg ? '-' : mitVorzeichen ? '+' : '';
  return `${vz}${h}:${String(m).padStart(2, '0')} h`;
}

/** Minuten als Dezimalstunden mit zwei Nachkommastellen (für Excel). */
export function minutenDezimal(minuten) {
  return Math.round((minuten / 60) * 100) / 100;
}

/** "1:30", "1,5", "90m", "90" -> Minuten. */
export function parseDauer(text) {
  if (text == null) return 0;
  const s = String(text).trim().replace(',', '.').toLowerCase();
  if (!s) return 0;
  let m = s.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(\d+(?:\.\d+)?)\s*(h|std|stunden)$/);
  if (m) return Math.round(Number(m[1]) * 60);
  m = s.match(/^(\d+)\s*(m|min|minuten)$/);
  if (m) return Number(m[1]);
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const zahl = Number(m[1]);
    // Ganze Zahlen bis 12 werden als Stunden gelesen, alles andere als Minuten.
    if (Number.isInteger(zahl) && zahl > 12) return zahl;
    return Math.round(zahl * 60);
  }
  return 0;
}
