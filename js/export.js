/**
 * Export: Excel (.xlsx), CSV und anonymisierte Kennzahlen für die gemeinsame
 * Auswertung im Kollegium.
 *
 * Die xlsx-Datei wird ohne Fremdbibliothek erzeugt: Office-Open-XML-Teile in
 * einem ZIP-Container (unkomprimiert gespeichert). Das hält die App frei von
 * Abhängigkeiten und damit offline- und langzeittauglich.
 */

import {
  KATEGORIEN,
  KATEGORIE_MAP,
  beschaeftigungsprozent,
  ermaessigungsstunden,
  unterrichtsverpflichtung,
} from './model.js';
import { minutenDezimal, minutenAlsStunden } from './soll.js';
import { WOCHENTAGE_KURZ, ausIso, kalenderwoche } from './kalender-sh.js';

/* ------------------------------- ZIP-Teil ------------------------------ */

const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABELLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosZeit(datum) {
  const zeit =
    (datum.getHours() << 11) | (datum.getMinutes() << 5) | Math.floor(datum.getSeconds() / 2);
  const tag =
    ((datum.getFullYear() - 1980) << 9) | ((datum.getMonth() + 1) << 5) | datum.getDate();
  return { zeit, tag };
}

/** Baut ein ZIP-Archiv (Methode 0 = gespeichert) aus {name, text}-Einträgen. */
function zipBauen(dateien) {
  const enc = new TextEncoder();
  const jetzt = new Date();
  const { zeit, tag } = dosZeit(jetzt);
  const lokale = [];
  const zentrale = [];
  let offset = 0;

  for (const datei of dateien) {
    const nameBytes = enc.encode(datei.name);
    const inhalt = enc.encode(datei.text);
    const crc = crc32(inhalt);

    const lfh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lfh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8-Flag
    lv.setUint16(8, 0, true); // gespeichert
    lv.setUint16(10, zeit, true);
    lv.setUint16(12, tag, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, inhalt.length, true);
    lv.setUint32(22, inhalt.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);

    lokale.push(lfh, inhalt);

    const cdh = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdh.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, zeit, true);
    cv.setUint16(14, tag, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, inhalt.length, true);
    cv.setUint32(24, inhalt.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cdh.set(nameBytes, 46);
    zentrale.push(cdh);

    offset += lfh.length + inhalt.length;
  }

  const zentralGroesse = zentrale.reduce((s, a) => s + a.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, dateien.length, true);
  ev.setUint16(10, dateien.length, true);
  ev.setUint32(12, zentralGroesse, true);
  ev.setUint32(16, offset, true);

  return new Blob([...lokale, ...zentrale, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/* ------------------------------ XLSX-Teil ------------------------------ */

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function spaltenName(index) {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const rest = (n - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

/** @param {Array<Array<string|number|null>>} zeilen */
function blattXml(zeilen, breiten = []) {
  const cols = breiten.length
    ? `<cols>${breiten
        .map((b, i) => `<col min="${i + 1}" max="${i + 1}" width="${b}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';
  const zeilenXml = zeilen
    .map((zeile, r) => {
      const zellen = zeile
        .map((wert, c) => {
          if (wert === null || wert === undefined || wert === '') return '';
          const ref = `${spaltenName(c)}${r + 1}`;
          const stil = r === 0 ? ' s="1"' : '';
          if (typeof wert === 'number' && Number.isFinite(wert)) {
            return `<c r="${ref}"${stil}><v>${wert}</v></c>`;
          }
          return `<c r="${ref}"${stil} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
            wert,
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${zellen}</row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${zeilenXml}</sheetData></worksheet>`;
}

/** @param {Array<{name:string, zeilen:Array, breiten?:Array}>} blaetter */
export function xlsxBlob(blaetter) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${blaetter
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join('\n')}
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${blaetter
    .map(
      (b, i) =>
        `<sheet name="${xmlEscape(b.name).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('')}</sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${blaetter
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  )
  .join('\n')}
<Relationship Id="rId${blaetter.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
</styleSheet>`;

  const dateien = [
    { name: '[Content_Types].xml', text: contentTypes },
    { name: '_rels/.rels', text: rels },
    { name: 'xl/workbook.xml', text: workbook },
    { name: 'xl/_rels/workbook.xml.rels', text: workbookRels },
    { name: 'xl/styles.xml', text: styles },
    ...blaetter.map((b, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      text: blattXml(b.zeilen, b.breiten),
    })),
  ];
  return zipBauen(dateien);
}

/* --------------------------- Fachliche Exporte -------------------------- */

function kopfzeilen(einst, ergebnis) {
  return [
    ['Arbeitszeitdokumentation'],
    ['Name', einst.name || '(nicht angegeben)'],
    ['Schuljahr', einst.schuljahr],
    ['Zeitraum', `${deutschesDatum(ergebnis.von)} bis ${deutschesDatum(ergebnis.bis)}`],
    ['Beschäftigungsumfang', `${beschaeftigungsprozent(einst)} %`],
    ['Wöchentliche Arbeitszeit (Vollzeit)', `${einst.wochenarbeitszeit} Stunden`],
    ['Pflichtstunden einer Vollzeitkraft', einst.pflichtstundenVollzeit],
    ['Unterrichtsverpflichtung', `${unterrichtsverpflichtung(einst)} Unterrichtsstunden`],
    ['davon Ermäßigung', `${ermaessigungsstunden(einst)} Unterrichtsstunden`],
    ['Erstellt am', deutschesDatum(new Date().toISOString().slice(0, 10))],
    [],
  ];
}

export function deutschesDatum(iso) {
  if (!iso) return '';
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

/**
 * Vollständige Arbeitszeitdokumentation als Excel-Mappe.
 * Blätter: Zusammenfassung, Kategorien, Tage, Wochen, Einzeleinträge.
 */
export function arbeitszeitXlsx(einst, ergebnis, eintraege) {
  const zusammenfassung = [
    ...kopfzeilen(einst, ergebnis),
    ['Kennzahl', 'Stunden', 'Anzeige'],
    ['Soll-Arbeitszeit', minutenDezimal(ergebnis.sollMinuten), minutenAlsStunden(ergebnis.sollMinuten)],
    ['Tatsächlich geleistet', minutenDezimal(ergebnis.istMinuten), minutenAlsStunden(ergebnis.istMinuten)],
    [
      'Saldo (Mehrarbeit +/-)',
      minutenDezimal(ergebnis.saldoMinuten),
      minutenAlsStunden(ergebnis.saldoMinuten, true),
    ],
    ['Arbeitstage mit Soll-Zeit im Zeitraum', ergebnis.arbeitstage, ''],
    ['Tage mit Erfassung', ergebnis.tageMitErfassung, ''],
  ];

  const kategorien = [
    ['Kategorie', 'Stunden', 'Anteil in Prozent', 'Anzeige'],
    ...KATEGORIEN.map((k) => {
      const min = ergebnis.proKategorie[k.id] || 0;
      const anteil = ergebnis.istMinuten > 0 ? Math.round((min / ergebnis.istMinuten) * 1000) / 10 : 0;
      return [k.name, minutenDezimal(min), anteil, minutenAlsStunden(min)];
    }),
    ['Summe', minutenDezimal(ergebnis.istMinuten), 100, minutenAlsStunden(ergebnis.istMinuten)],
  ];

  const tage = [
    ['Datum', 'Wochentag', 'KW', 'Tagesart', 'Soll (Std.)', 'Ist (Std.)', 'Saldo (Std.)'],
    ...[...ergebnis.proTag.values()]
      .filter((t) => t.soll > 0 || t.ist > 0)
      .map((t) => {
        const art = t.info?.feiertag
          ? t.info.feiertag
          : t.info?.typ === 'urlaub'
            ? 'Erholungsurlaub'
            : t.info?.typ === 'krank'
              ? 'Krank'
              : t.info?.ferien
                ? 'unterrichtsfreie Zeit'
                : 'Schultag';
        return [
          deutschesDatum(t.datum),
          WOCHENTAGE_KURZ[ausIso(t.datum).getDay()],
          kalenderwoche(t.datum),
          art,
          minutenDezimal(t.soll),
          minutenDezimal(t.ist),
          minutenDezimal(t.ist - t.soll),
        ];
      }),
  ];

  const wochen = [
    ['Woche ab', 'KW', 'Soll (Std.)', 'Ist (Std.)', 'Saldo (Std.)'],
    ...ergebnis.proWoche.map((w) => [
      deutschesDatum(w.start),
      kalenderwoche(w.start),
      minutenDezimal(w.soll),
      minutenDezimal(w.ist),
      minutenDezimal(w.ist - w.soll),
    ]),
  ];

  const einzel = [
    ['Datum', 'Wochentag', 'Beginn', 'Ende', 'Kategorie', 'Dauer (Std.)', 'Dauer', 'Notiz', 'Erfasst per'],
    ...eintraege
      .filter((e) => e.datum >= ergebnis.von && e.datum <= ergebnis.bis)
      .sort((a, b) => a.datum.localeCompare(b.datum) || (a.beginn || '').localeCompare(b.beginn || ''))
      .map((e) => [
        deutschesDatum(e.datum),
        WOCHENTAGE_KURZ[ausIso(e.datum).getDay()],
        e.beginn || '',
        e.ende || '',
        KATEGORIE_MAP[e.kategorieId]?.name || e.kategorieId,
        minutenDezimal(e.minuten),
        minutenAlsStunden(e.minuten),
        e.notiz || '',
        e.quelle === 'timer' ? 'Timer' : e.quelle === 'stundenplan' ? 'Stundenplan' : 'manuell',
      ]),
  ];

  return xlsxBlob([
    { name: 'Zusammenfassung', zeilen: zusammenfassung, breiten: [38, 14, 16] },
    { name: 'Kategorien', zeilen: kategorien, breiten: [36, 12, 18, 12] },
    { name: 'Tage', zeilen: tage, breiten: [12, 10, 6, 22, 12, 12, 12] },
    { name: 'Wochen', zeilen: wochen, breiten: [12, 6, 12, 12, 12] },
    { name: 'Einzeleinträge', zeilen: einzel, breiten: [12, 10, 8, 8, 30, 12, 10, 44, 12] },
  ]);
}

/** CSV mit BOM und Semikolon – öffnet in deutschem Excel ohne Nachfragen. */
export function arbeitszeitCsv(einst, ergebnis, eintraege) {
  const zeilen = [
    ['Datum', 'Wochentag', 'Beginn', 'Ende', 'Kategorie', 'Dauer (Std.)', 'Notiz', 'Erfasst per'],
    ...eintraege
      .filter((e) => e.datum >= ergebnis.von && e.datum <= ergebnis.bis)
      .sort((a, b) => a.datum.localeCompare(b.datum) || (a.beginn || '').localeCompare(b.beginn || ''))
      .map((e) => [
        deutschesDatum(e.datum),
        WOCHENTAGE_KURZ[ausIso(e.datum).getDay()],
        e.beginn || '',
        e.ende || '',
        KATEGORIE_MAP[e.kategorieId]?.name || e.kategorieId,
        String(minutenDezimal(e.minuten)).replace('.', ','),
        e.notiz || '',
        e.quelle || 'manuell',
      ]),
  ];
  const text = zeilen
    .map((z) => z.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  return new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
}

/**
 * Anonymisierte Kennzahlen für die gemeinsame Auswertung im Kollegium.
 *
 * Enthalten sind ausschließlich Aggregate: Beschäftigungsumfang, Summen je
 * Kategorie und Wochensummen. Kein Name, kein Fach, keine Klasse, keine Notiz,
 * keine Tagesdaten. Das Pseudonym wird bei jedem Export neu gewürfelt, damit
 * sich zwei Exporte derselben Person nicht verknüpfen lassen.
 */
export function anonymeKennzahlen(einst, ergebnis) {
  const pseudonym = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return {
    format: 'lehrerzeit-anonym',
    version: 1,
    pseudonym,
    schuljahr: einst.schuljahr,
    schulform: einst.schulform,
    zeitraumVon: ergebnis.von,
    zeitraumBis: ergebnis.bis,
    beschaeftigungsumfangProzent: beschaeftigungsprozent(einst),
    // Nur die Summe, nicht die einzelnen Aufgaben - eine Aufgabenliste wäre in
    // einem kleinen Kollegium ein Name.
    ermaessigungsstundenGesamt: ermaessigungsstunden(einst),
    unterrichtsverpflichtung: unterrichtsverpflichtung(einst),
    wochenarbeitszeitStunden: Number(einst.wochenarbeitszeit) || 41,
    sollStunden: minutenDezimal(ergebnis.sollMinuten),
    istStunden: minutenDezimal(ergebnis.istMinuten),
    saldoStunden: minutenDezimal(ergebnis.saldoMinuten),
    arbeitstage: ergebnis.arbeitstage,
    tageMitErfassung: ergebnis.tageMitErfassung,
    kategorienStunden: Object.fromEntries(
      KATEGORIEN.map((k) => [k.id, minutenDezimal(ergebnis.proKategorie[k.id] || 0)]),
    ),
    wochen: ergebnis.proWoche
      .filter((w) => w.ist > 0 || w.soll > 0)
      .map((w) => ({
        kw: kalenderwoche(w.start),
        start: w.start,
        soll: minutenDezimal(w.soll),
        ist: minutenDezimal(w.ist),
      })),
  };
}

/* -------------------------------- Download ------------------------------ */

export function herunterladen(blobOderText, dateiname, typ = 'application/json') {
  const blob =
    blobOderText instanceof Blob ? blobOderText : new Blob([blobOderText], { type: `${typ};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function dateinameStempel(prefix, einst, ergebnis, endung) {
  const teil = einst.name ? `_${einst.name.replace(/[^\p{L}\p{N}]+/gu, '-')}` : '';
  return `${prefix}${teil}_${ergebnis.von}_bis_${ergebnis.bis}.${endung}`;
}
