/**
 * Erzeugt die Vorstellungspräsentation zur App "Lehrerzeit".
 *
 * Dies ist ein Werkzeug, kein Teil der App - die App selbst kommt weiterhin
 * ohne Abhängigkeiten und ohne Build-Schritt aus.
 *
 *   npm install pptxgenjs
 *   node erstelle-praesentation.js
 */

const PptxGenJS = require('pptxgenjs');

/* ----------------------------- Gestaltung ------------------------------- */

const NAVY = '21295C';
const BLAU = '065A82';
const TEAL = '1C7293';
const AKZENT = 'C05621'; // warmes Gegengewicht, nur für Zahlen, die weh tun
const HELL = 'F3F6F8';
const WEISS = 'FFFFFF';
const TEXT = '1B2430';
const LEISE = '5A6B7A';
const LEISE_HELL = 'B8C4D0';

const KOPF = 'Cambria';
const FLIESS = 'Calibri';

const RAND = 0.62;
const BREITE = 13.33;
const HOEHE = 7.5;
const INHALT_B = BREITE - 2 * RAND;

/** pptxgenjs verändert Optionsobjekte in place - deshalb jedes Mal ein neues. */
const schatten = () => ({ type: 'outer', angle: 90, blur: 12, offset: 2, color: '0B1B2B', opacity: 0.13 });

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';
pres.author = 'Lehrerzeit';
pres.title = 'Lehrerzeit – Arbeitszeit dokumentieren';

/* ------------------------------ Bausteine -------------------------------- */

function folie(dunkel = false) {
  const s = pres.addSlide();
  s.background = { color: dunkel ? NAVY : WEISS };
  return s;
}

/** Titelzeile einer Inhaltsfolie. Ohne Zierlinie - Weißraum trennt. */
function ueberschrift(s, titel, unterzeile) {
  s.addText(titel, {
    x: RAND,
    y: 0.45,
    w: INHALT_B,
    h: 0.72,
    fontFace: KOPF,
    fontSize: 34,
    bold: true,
    color: NAVY,
    margin: 0,
    valign: 'middle',
  });
  if (unterzeile) {
    s.addText(unterzeile, {
      x: RAND,
      y: 1.18,
      w: INHALT_B,
      h: 0.4,
      fontFace: FLIESS,
      fontSize: 15,
      color: LEISE,
      margin: 0,
    });
  }
}

/**
 * Das durchgehende Gestaltungsmotiv: eine abgerundete Karte mit einem
 * gefüllten Kreis als Marke. Der Kreis trägt eine Ziffer oder ein kurzes
 * Zeichen und wiederholt sich auf jeder Folie mit Inhaltsblöcken.
 */
function karte(s, opt) {
  const { x, y, w, h, marke, titel, text, ton = 'hell' } = opt;
  const dunkel = ton === 'dunkel';

  s.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: dunkel ? BLAU : HELL },
    line: { color: dunkel ? BLAU : 'E2E9EF', width: 1 },
    shadow: schatten(),
  });

  if (marke) {
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.28,
      y: y + 0.26,
      w: 0.52,
      h: 0.52,
      fill: { color: dunkel ? WEISS : BLAU },
      line: { color: dunkel ? WEISS : BLAU, width: 1 },
    });
    s.addText(marke, {
      x: x + 0.28,
      y: y + 0.26,
      w: 0.52,
      h: 0.52,
      fontFace: FLIESS,
      fontSize: 16,
      bold: true,
      color: dunkel ? BLAU : WEISS,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  }

  const textX = x + 0.28;
  const textB = w - 0.56;
  const titelY = marke ? y + 0.92 : y + 0.3;
  const textH = h - (titelY - y) - 0.54;

  // Selbstprüfung: PowerPoint beschneidet überlaufenden Text nicht, er läuft
  // einfach über den Kartenrand hinaus. Statt das später auf einem Screenshot
  // zu entdecken, bricht der Aufbau hier ab und nennt die nötige Höhe.
  const zeichenProZeile = Math.max(1, Math.floor((textB * 96) / (13 * 0.5)));
  const zeilen = String(text)
    .split('\n')
    .reduce((n, absatz) => n + Math.max(1, Math.ceil(absatz.length / zeichenProZeile)), 0);
  const noetig = (zeilen * 13 * 1.3) / 72;
  if (textH < noetig - 0.02) {
    throw new Error(
      `Karte "${titel}" ist zu niedrig: ${zeilen} Zeilen brauchen ${noetig.toFixed(2)}", ` +
        `vorhanden sind ${textH.toFixed(2)}". Kartenhöhe auf mindestens ` +
        `${(noetig + (titelY - y) + 0.54).toFixed(2)}" setzen.`,
    );
  }

  s.addText(titel, {
    x: textX,
    y: titelY,
    w: textB,
    h: 0.4,
    fontFace: FLIESS,
    fontSize: 16,
    bold: true,
    color: dunkel ? WEISS : NAVY,
    margin: 0,
    valign: 'top',
  });

  s.addText(text, {
    x: textX,
    y: titelY + 0.42,
    w: textB,
    h: textH,
    fontFace: FLIESS,
    fontSize: 13,
    color: dunkel ? LEISE_HELL : LEISE,
    margin: 0,
    lineSpacingMultiple: 1.18,
    valign: 'top',
  });
}

/** Große Zahl mit kleiner Beschriftung - für Kernaussagen ohne Diagramm. */
function kennzahl(s, opt) {
  const { x, y, w, zahl, label, farbe = BLAU, groesse = 54 } = opt;
  s.addText(zahl, {
    x,
    y,
    w,
    h: 0.95,
    fontFace: KOPF,
    fontSize: groesse,
    bold: true,
    color: farbe,
    align: 'left',
    margin: 0,
    valign: 'middle',
  });
  s.addText(label, {
    x,
    y: y + 0.95,
    w,
    h: 0.72,
    fontFace: FLIESS,
    fontSize: 13,
    color: LEISE,
    align: 'left',
    margin: 0,
    valign: 'top',
    lineSpacingMultiple: 1.15,
  });
}

function liste(s, opt) {
  const { x, y, w, h, punkte, farbe = TEXT, groesse = 15 } = opt;
  s.addText(
    punkte.map((p, i) => ({
      text: p,
      options: { bullet: true, breakLine: i < punkte.length - 1 },
    })),
    {
      x,
      y,
      w,
      h,
      fontFace: FLIESS,
      fontSize: groesse,
      color: farbe,
      margin: 0,
      paraSpaceAfter: 8,
      valign: 'top',
    },
  );
}

/* ================================ Folien ================================= */

/* 1 — Titel ---------------------------------------------------------------- */
{
  const s = folie(true);
  s.addShape(pres.ShapeType.ellipse, {
    x: 9.9, y: -1.5, w: 5.6, h: 5.6,
    fill: { color: BLAU, transparency: 55 }, line: { color: BLAU, transparency: 100 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 11.4, y: 4.4, w: 3.4, h: 3.4,
    fill: { color: TEAL, transparency: 65 }, line: { color: TEAL, transparency: 100 },
  });

  s.addText('Lehrerzeit', {
    x: RAND, y: 2.15, w: 8.6, h: 1.2,
    fontFace: KOPF, fontSize: 60, bold: true, color: WEISS, margin: 0, valign: 'middle',
  });
  s.addText('Die eigene Arbeitszeit dokumentieren – einfach, freiwillig, auf dem eigenen Gerät', {
    x: RAND, y: 3.35, w: 8.6, h: 1.0,
    fontFace: FLIESS, fontSize: 19, color: LEISE_HELL, margin: 0, lineSpacingMultiple: 1.2,
  });
  s.addText('Vorstellung im Kollegium', {
    x: RAND, y: 5.6, w: 8.6, h: 0.4,
    fontFace: FLIESS, fontSize: 14, bold: true, color: WEISS, margin: 0,
  });
  s.addText('Gemeinschaftsschule · Schleswig-Holstein · Schuljahr 2026/2027', {
    x: RAND, y: 6.0, w: 8.6, h: 0.4,
    fontFace: FLIESS, fontSize: 13, color: LEISE_HELL, margin: 0,
  });
  s.addNotes(
    'Begrüßung. In einem Satz worum es geht: Wir haben ein Werkzeug, mit dem jede und jeder ' +
      'für sich die eigene Arbeitszeit dokumentieren kann. Freiwillig, ohne Server, ohne dass ' +
      'die Schulleitung etwas sieht.\n\n' +
      'Zeitrahmen ansagen: etwa 15 Minuten Vortrag, danach Fragen.',
  );
}

/* 2 — Das Problem ---------------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Das Problem: Die Arbeit ist da, die Zahlen fehlen');

  s.addText(
    'Über die Arbeitszeit von Lehrkräften wird seit Jahren diskutiert – meist ohne Zahlen. ' +
      'Wer sagt, es sei zu viel, bekommt zu hören, das sei ein Gefühl.',
    { x: RAND, y: 1.35, w: 11.6, h: 0.7, fontFace: FLIESS, fontSize: 16, color: TEXT, margin: 0, lineSpacingMultiple: 1.25 },
  );

  const kacheln = [
    { marke: '?', titel: 'Unsichtbar', text: 'Vorbereitung am Sonntagabend, Korrekturstapel in den Herbstferien, das Elterngespräch nach der sechsten Stunde – nichts davon taucht in einer Statistik auf.' },
    { marke: '!', titel: 'Unbelegt', text: 'Ohne Aufzeichnung bleibt jede Überlastungsanzeige eine Behauptung. Auch das Gespräch über Anrechnungsstunden endet dann bei „gefühlt".' },
    { marke: '=', titel: 'Ungleich verteilt', text: 'Korrekturfächer, Klassenleitung, Funktionsaufgaben: Der Aufwand unterscheidet sich erheblich – sichtbar wird das nirgends.' },
  ];
  kacheln.forEach((k, i) => {
    karte(s, { x: RAND + i * 3.98, y: 2.35, w: 3.72, h: 3.15, ...k });
  });

  s.addText(
    'Was nicht gemessen wird, existiert in der Debatte nicht.',
    { x: RAND, y: 5.85, w: 11.6, h: 0.5, fontFace: KOPF, fontSize: 19, italic: true, bold: true, color: BLAU, margin: 0 },
  );

  s.addNotes(
    'Kurz aus dem eigenen Alltag erzählen – ein konkretes Beispiel wirkt hier stärker als jede Zahl.\n\n' +
      'Wichtig ist der Schlusssatz: Es geht nicht darum, mehr zu arbeiten oder sich zu rechtfertigen. ' +
      'Es geht darum, dass die geleistete Arbeit überhaupt erst in Zahlen auftaucht.',
  );
}

/* 3 — Warum jetzt ---------------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Warum jetzt', 'Die Idee ist nicht neu – aber sie kommt gerade in Bewegung');

  karte(s, {
    x: RAND, y: 1.88, w: 5.75, h: 2.28, marke: '1',
    titel: 'Die GEW macht es vor',
    text: 'Die GEW Hessen stellt ihren Mitgliedern seit dem Schuljahr 2026/2027 die „Lehrzeit-App" bereit. Berlin zieht nach und bereitet damit Musterverfahren vor.',
  });
  karte(s, {
    x: RAND + 6.09, y: 1.88, w: 5.75, h: 2.28, marke: '2',
    titel: 'Nur für Mitglieder',
    text: 'Diese Apps sind an eine Mitgliedschaft und an das jeweilige Landesrecht gebunden. Für unser Kollegium in Schleswig-Holstein passt beides nicht.',
  });
  karte(s, {
    x: RAND, y: 4.35, w: 5.75, h: 2.28, marke: '3',
    titel: 'Also selbst gebaut',
    text: 'Dieselbe Idee, dieselbe Kategorien-Systematik – aber an schleswig-holsteinisches Recht angepasst, offen für alle und um einige Funktionen erweitert.',
  });
  karte(s, {
    x: RAND + 6.09, y: 4.35, w: 5.75, h: 2.28, marke: '4', ton: 'dunkel',
    titel: 'Was daraus folgt, entscheiden wir',
    text: 'Die App liefert Zahlen. Ob daraus ein Gespräch mit der Schulleitung wird, eine Überlastungsanzeige oder gar nichts, bleibt jeder und jedem selbst überlassen.',
  });

  s.addNotes(
    'Den Bezug zur GEW-App erwähnen, aber nicht überhöhen: Wir übernehmen die Idee, nicht die ' +
      'Software. Der Unterschied ist wichtig – unsere Fassung rechnet mit 41 Wochenstunden nach ' +
      'der Arbeitszeitverordnung Schleswig-Holstein und kennt unsere Ferientermine.\n\n' +
      'Punkt 4 betonen: Niemand wird zu irgendetwas verpflichtet.',
  );
}

/* 4 — Was die App ist ------------------------------------------------------ */
{
  const s = folie();
  ueberschrift(s, 'Was die App ist', 'Eine Web-App, die ohne Installation im Browser läuft');

  const punkte = [
    { marke: 'A', titel: 'Kein Server, kein Konto', text: 'Alle Daten bleiben im Browser auf dem eigenen Gerät. Es gibt nichts, worauf jemand zugreifen könnte.' },
    { marke: 'B', titel: 'Offline nutzbar', text: 'Einmal geöffnet, funktioniert sie ohne Netz – im Klassenraum, im Zug, im Funkloch.' },
    { marke: 'C', titel: 'Auf dem Telefon wie eine App', text: 'Zum Startbildschirm hinzufügen, fertig. Android und iPhone, hell und dunkel.' },
    { marke: 'D', titel: 'Für Schleswig-Holstein gerechnet', text: '41 Wochenstunden, Pflichtstunden nach Schulart, Ferien und Feiertage bereits hinterlegt.' },
  ];
  punkte.forEach((p, i) => {
    karte(s, { x: RAND + (i % 2) * 6.09, y: 2.0 + Math.floor(i / 2) * 2.35, w: 5.75, h: 2.1, ...p });
  });

  s.addNotes(
    'Hier lohnt sich eine kurze Live-Demo, falls Beamer und Netz mitspielen: App öffnen, ' +
      'Tagesansicht zeigen, einmal auf „+30 min" tippen. Das nimmt mehr Berührungsangst als jede Folie.\n\n' +
      'Falls keine Demo möglich ist: auf die nächsten Folien verweisen.',
  );
}

/* 5 — Das Rechenmodell ----------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Der Kern: Ferien sind kein Urlaub', 'Das überrascht beim ersten Blick – und ist genau der Punkt');

  s.addText(
    'Der Erholungsurlaub beträgt 30 Werktage im Jahr, also sechs Wochen. Die Schulferien umfassen ' +
      'rund zwölf Wochen. Die übrigen Tage sind reguläre Arbeitstage, an denen Arbeitszeit zu ' +
      'leisten ist – und an denen erfahrungsgemäß auch gearbeitet wird.',
    { x: RAND, y: 1.85, w: 7.1, h: 1.3, fontFace: FLIESS, fontSize: 15, color: TEXT, margin: 0, lineSpacingMultiple: 1.3 },
  );

  kennzahl(s, { x: RAND, y: 3.35, w: 2.3, zahl: '1 837', label: 'Stunden Jahresarbeitszeit\nbei Vollzeit, 2026/2027' });
  kennzahl(s, { x: RAND + 2.45, y: 3.35, w: 2.3, zahl: '224', label: 'Arbeitstage mit\nSoll-Arbeitszeit' });
  kennzahl(s, { x: RAND + 4.9, y: 3.35, w: 2.3, zahl: '30', label: 'davon in der\nunterrichtsfreien Zeit', farbe: AKZENT });

  karte(s, {
    x: 8.25, y: 1.85, w: 4.45, h: 3.55, ton: 'dunkel', marke: '÷',
    titel: 'So wird gerechnet',
    text:
      'Tages-Soll = Wochenarbeitszeit ÷ 5\n= 41 h ÷ 5 = 8:12 h bei Vollzeit\n\n' +
      'Soll besteht an jedem Werktag, der weder Feiertag noch Urlaub noch Krankheitstag ist – ' +
      'auch in den Ferien.\n\nBei Teilzeit anteilig.',
  });

  s.addText(
    'Deshalb trägt man in der App seine 30 Urlaubstage ein – sonst rechnet sie mit vollem Soll ' +
      'über alle zwölf Ferienwochen, und der Saldo stimmt nicht.',
    { x: RAND, y: 5.75, w: 11.6, h: 0.7, fontFace: FLIESS, fontSize: 14, italic: true, color: BLAU, margin: 0, lineSpacingMultiple: 1.2 },
  );

  s.addNotes(
    'Das ist die Folie, an der die meisten Rückfragen kommen. Ruhig Zeit lassen.\n\n' +
      'Der häufigste Einwand: „Dann habe ich ja in den Ferien Minusstunden." Antwort: Ja, wenn ' +
      'man in den Ferien tatsächlich nicht arbeitet – dann stimmt die Zahl auch. Interessant ist ' +
      'der Jahresverlauf, nicht die einzelne Woche. Und die meisten stellen genau hier fest, wie ' +
      'viel sie in den Ferien doch erledigen.\n\n' +
      'Zweiter Einwand: „Ist das nicht rechtlich strittig?" Antwort: Die Rechnung folgt der ' +
      'Arbeitszeitverordnung. Was daraus an Ansprüchen folgt, ist eine andere Frage – dafür sind ' +
      'Personalrat und Gewerkschaft zuständig, nicht diese App.',
  );
}

/* 6 — Diagramm Ferien ------------------------------------------------------ */
{
  const s = folie();
  ueberschrift(s, 'Zwölf Wochen Ferien, sechs Wochen Urlaub', 'Die Differenz ist Arbeitszeit – sie ist nur bisher unsichtbar');

  s.addChart(
    pres.ChartType.bar,
    [
      {
        name: 'Wochen',
        labels: ['Schulferien im Schuljahr', 'Erholungsurlaub', 'Differenz: Arbeitszeit\nin der unterrichtsfreien Zeit'],
        values: [12, 6, 6],
      },
    ],
    {
      x: RAND, y: 1.9, w: 7.6, h: 4.3,
      barDir: 'bar',
      chartColors: [BLAU, TEAL, AKZENT],
      varyColors: true,
      showTitle: false,
      showLegend: false,
      showValue: true,
      dataLabelPosition: 'outEnd',
      dataLabelColor: TEXT,
      dataLabelFontFace: FLIESS,
      dataLabelFontSize: 14,
      dataLabelFontBold: true,
      catAxisLabelColor: TEXT,
      catAxisLabelFontFace: FLIESS,
      catAxisLabelFontSize: 12,
      valAxisLabelColor: LEISE,
      valAxisLabelFontFace: FLIESS,
      valAxisLabelFontSize: 11,
      valAxisMaxVal: 14,
      valGridLine: { color: 'E2E9EF', size: 1 },
      catGridLine: { style: 'none' },
      barGapWidthPct: 55,
    },
  );

  karte(s, {
    x: 8.6, y: 1.9, w: 4.1, h: 4.3, marke: '≠',
    titel: 'Was das im Alltag heißt',
    text:
      'Rund sechs Wochen im Jahr sind unterrichtsfreie Arbeitszeit – kein Urlaub.\n\n' +
      'Wer in diesen Wochen Zeugnisse schreibt, Unterricht plant oder eine Klassenfahrt ' +
      'vorbereitet, leistet regulären Dienst.\n\n' +
      'Bisher stand das nirgends. Jetzt schon.',
  });

  s.addNotes(
    'Diese Folie ist die Zuspitzung der vorigen. Wenn die Zeit knapp ist, kann man eine von ' +
      'beiden überspringen – aber nicht beide.\n\n' +
      'Anekdote anbieten: Wer erinnert sich, wann er zuletzt sechs zusammenhängende Wochen ' +
      'wirklich frei hatte?',
  );
}

/* 7 — Drei Wege ------------------------------------------------------------ */
{
  const s = folie();
  ueberschrift(s, 'Erfassen: drei Wege, damit es nicht lästig wird', 'Man muss sich nicht entscheiden – alle drei lassen sich mischen');

  const wege = [
    { marke: '1', titel: 'Stundenplan-Klick', text: 'Der Stundenplan wird einmal hinterlegt. Danach bucht ein Tipp den gesamten Unterricht eines Tages.\n\nAufwand: zwei Sekunden.' },
    { marke: '2', titel: 'Timer', text: 'Für alles am Schreibtisch: starten, arbeiten, stoppen. Läuft weiter, auch wenn die App geschlossen wird.\n\nIdeal für Korrekturblöcke.' },
    { marke: '3', titel: 'Nachtragen', text: 'Schnellknöpfe für +30 min oder +1 h – oder freitags die ganze Woche in einer Tabelle nachpflegen.\n\nAufwand: fünf Minuten pro Woche.' },
  ];
  wege.forEach((w, i) => {
    karte(s, { x: RAND + i * 3.98, y: 2.0, w: 3.72, h: 3.35, ...w });
  });

  s.addText(
    'Eine Schätzung, die es in die Dokumentation schafft, ist mehr wert als eine sekundengenaue ' +
      'Messung, die nach zwei Wochen aufgegeben wird.',
    { x: RAND, y: 5.7, w: 11.6, h: 0.8, fontFace: KOPF, fontSize: 17, italic: true, color: BLAU, margin: 0, lineSpacingMultiple: 1.2 },
  );

  s.addNotes(
    'Das ist die Folie gegen die häufigste Sorge: „Dafür habe ich keine Zeit."\n\n' +
      'Konkret werden: Der einmalige Einstieg dauert etwa eine Viertelstunde, danach sind es zwei ' +
      'bis drei Minuten am Tag oder fünf Minuten am Freitag.\n\n' +
      'Den Merksatz unten wirklich vorlesen – er nimmt den Perfektionsdruck raus, und der ist der ' +
      'eigentliche Grund, warum Zeiterfassung scheitert.',
  );
}

/* 8 — Kategorien ----------------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Neun Kategorien', 'Nach der Systematik, die die Rechtsprechung zur Lehrkraft-Arbeitszeit zugrunde legt');

  const kats = [
    ['Unterricht', 'auch Vertretung und Doppelsteckung'],
    ['Vor- und Nachbereitung', 'Planung, Material, Differenzierung'],
    ['Korrekturen', 'Arbeiten, Zeugnisse, Gutachten'],
    ['Kommunikation', 'Eltern, Schüler, Kollegium, Ämter'],
    ['Konferenzen & Organisation', 'Sitzungen, Dokumentation, Verwaltung'],
    ['Aufsicht & Vertretungsbereitschaft', 'Pause, Bus, Klausur, Springstunden'],
    ['Fort- und Weiterbildung', 'Fortbildungen, Fachliteratur'],
    ['Fahrten & Veranstaltungen', 'Klassenfahrt, Wandertag, Schulfest'],
    ['Funktions- und Sonderaufgaben', 'Fachleitung, Personalrat, Projekte'],
  ];

  kats.forEach(([name, bsp], i) => {
    const spalte = i % 3;
    const zeile = Math.floor(i / 3);
    const x = RAND + spalte * 4.04;
    const y = 2.0 + zeile * 1.42;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 3.78, h: 1.22, rectRadius: 0.1,
      fill: { color: HELL }, line: { color: 'E2E9EF', width: 1 },
    });
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.22, y: y + 0.33, w: 0.42, h: 0.42,
      fill: { color: i === 8 || i === 5 ? AKZENT : BLAU }, line: { color: WEISS, width: 1 },
    });
    s.addText(String(i + 1), {
      x: x + 0.22, y: y + 0.33, w: 0.42, h: 0.42,
      fontFace: FLIESS, fontSize: 12, bold: true, color: WEISS, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(name, {
      x: x + 0.76, y: y + 0.22, w: 2.85, h: 0.48,
      fontFace: FLIESS, fontSize: 13, bold: true, color: NAVY, margin: 0, valign: 'middle',
    });
    s.addText(bsp, {
      x: x + 0.76, y: y + 0.66, w: 2.85, h: 0.38,
      fontFace: FLIESS, fontSize: 10.5, color: LEISE, margin: 0, valign: 'top',
    });
  });

  s.addText(
    'Orange hervorgehoben: Aufsicht und Funktionsaufgaben – zwei Positionen, die an ' +
      'Gemeinschaftsschulen besonders ins Gewicht fallen und in der GEW-Vorlage fehlen.',
    { x: RAND, y: 6.4, w: 11.6, h: 0.5, fontFace: FLIESS, fontSize: 12, color: LEISE, margin: 0 },
  );

  s.addNotes(
    'Nicht alle neun vorlesen – die Folie spricht für sich. Zwei, drei herausgreifen, bei denen ' +
      'im Kollegium erfahrungsgemäß viel Zeit hängenbleibt.\n\n' +
      'Auf die Frage „Wo trage ich X ein?": Im Zweifel grob richtig einordnen. Die Gesamtsumme ' +
      'zählt mehr als die perfekte Zuordnung. Der Leitfaden hat zu jeder Kategorie Beispiele.',
  );
}

/* 9 — Auswertung ----------------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Was am Ende herauskommt', 'Beispielauswertung einer Vollzeitkraft über sechs Wochen');

  s.addChart(
    pres.ChartType.bar,
    [
      {
        name: 'Stunden',
        labels: ['Unterricht', 'Vor- und Nachbereitung', 'Korrekturen', 'Konferenzen', 'Kommunikation', 'Aufsicht', 'Übrige'],
        values: [188, 84, 65, 38, 29, 19, 37],
      },
    ],
    {
      x: RAND, y: 1.95, w: 7.5, h: 4.3,
      barDir: 'bar',
      chartColors: [BLAU],
      showTitle: false,
      showLegend: false,
      showValue: true,
      dataLabelPosition: 'outEnd',
      dataLabelColor: TEXT,
      dataLabelFontFace: FLIESS,
      dataLabelFontSize: 11,
      dataLabelFontBold: true,
      catAxisLabelColor: TEXT,
      catAxisLabelFontFace: FLIESS,
      catAxisLabelFontSize: 11,
      valAxisLabelColor: LEISE,
      valAxisLabelFontFace: FLIESS,
      valAxisLabelFontSize: 10,
      valAxisTitle: 'Stunden',
      showValAxisTitle: true,
      valAxisTitleColor: LEISE,
      valAxisTitleFontFace: FLIESS,
      valAxisTitleFontSize: 10,
      valGridLine: { color: 'E2E9EF', size: 1 },
      catGridLine: { style: 'none' },
      barGapWidthPct: 45,
    },
  );

  karte(s, {
    x: 8.5, y: 1.95, w: 4.2, h: 2.0, marke: '↗',
    titel: 'Kennzahlen',
    text: 'Soll- und Ist-Zeit, Saldo, Wochenverlauf – für jeden Zeitraum von einer Woche bis zum ganzen Schuljahr.',
  });
  karte(s, {
    x: 8.5, y: 4.15, w: 4.2, h: 2.1, marke: '↓', ton: 'dunkel',
    titel: 'Drei Exporte',
    text: 'Excel, CSV und ein druckfertiger Bericht mit Unterschriftszeile – als Anlage zu einer Überlastungsanzeige.',
  });

  s.addNotes(
    'Die Zahlen sind ein plausibles Beispiel, keine Messung – das ehrlich sagen.\n\n' +
      'Was hier auffällt und im Publikum meist ein Nicken auslöst: Der Unterricht selbst ist ' +
      'weniger als die Hälfte. Vorbereitung und Korrektur zusammen kommen nah an die reine ' +
      'Unterrichtszeit heran.\n\n' +
      'Den Druckbericht hochhalten, falls ausgedruckt vorhanden – das macht es greifbar.',
  );
}

/* 10 — Teilzeit ------------------------------------------------------------ */
{
  const s = folie();
  ueberschrift(s, 'Teilzeit', 'Der Bescheid wird eingetragen, nicht umgerechnet');

  const wege = [
    { marke: '½', titel: 'Als Unterrichtsstunden', text: '„21 von 27 Stunden"\n\nÜblich bei verbeamteten Lehrkräften.' },
    { marke: '%', titel: 'Als Bruchteil', text: '„drei Viertel" = 75 %\n\nBei Bruchteilsbewilligungen.' },
    { marke: 'h', titel: 'Als Wochenstunden', text: '„30,75 von 41 Stunden"\n\nÜblich bei Tarifbeschäftigten nach TV-L.' },
  ];
  wege.forEach((w, i) => {
    karte(s, { x: RAND + i * 3.98, y: 1.95, w: 3.72, h: 2.15, ...w });
  });

  karte(s, {
    x: RAND, y: 4.35, w: 11.6, h: 1.95, ton: 'dunkel', marke: '!',
    titel: 'Teilzeit gilt auch außerhalb des Unterrichts',
    text:
      'Konferenzen, Aufsichten, Korrekturen und Elterngespräche dürfen nur im Umfang der bewilligten ' +
      'Teilzeit verlangt werden – nicht in vollem Umfang. Das steht auf dem Papier und sieht in der ' +
      'Praxis oft anders aus. Die Erfassung ist der Beleg: Der Saldo vergleicht immer mit dem ' +
      'anteiligen Soll, nie mit dem einer Vollzeitkraft.',
  });

  s.addNotes(
    'Diese Folie ist für die Teilzeitkräfte im Raum die wichtigste – und die Gruppe ist an einer ' +
      'Gemeinschaftsschule meist größer, als man denkt.\n\n' +
      'Der dunkle Kasten ist der eigentliche Punkt: Teilzeitkräfte übernehmen erfahrungsgemäß ' +
      'Konferenzen und Aufsichten in vollem Umfang. Genau das wird hier messbar.\n\n' +
      'Kurz erwähnen: Bei Teilzeit unter drei Vierteln werden Alters- und ' +
      'Schwerbehindertenermäßigung nur hälftig gewährt. Die App rechnet das nicht automatisch, ' +
      'sie weist darauf hin – eingetragen wird, was im Bescheid steht.',
  );
}

/* 11 — Ermäßigungsstunden -------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Anrechnungsstunden: reicht die Entlastung?', 'Zum ersten Mal eine Zahl statt eines Gefühls');

  s.addText(
    'Wer eine Funktionsaufgabe hat – Sicherheitsbeauftragung, Fachkonferenzleitung, ' +
      'Medienbetreuung, Personalrat –, bekommt dafür Stunden vom Unterricht erlassen. Die App ' +
      'rechnet aus, was eine solche Stunde an Arbeitszeit wert ist, und hält den tatsächlichen ' +
      'Aufwand dagegen.',
    { x: RAND, y: 1.8, w: 11.6, h: 0.95, fontFace: FLIESS, fontSize: 15, color: TEXT, margin: 0, lineSpacingMultiple: 1.25 },
  );

  kennzahl(s, { x: RAND, y: 3.0, w: 3.3, zahl: '1:31 h', label: 'Arbeitszeit entspricht einer\nAnrechnungsstunde\n(41 h ÷ 27 Pflichtstunden)', groesse: 44 });

  s.addShape(pres.ShapeType.roundRect, {
    x: 4.3, y: 2.9, w: 8.4, h: 2.0, rectRadius: 0.12,
    fill: { color: HELL }, line: { color: 'E2E9EF', width: 1 }, shadow: schatten(),
  });
  const spalten = [
    ['Aufgabe', 'Sicherheitsbeauftragte:r', 4.55, 2.9],
    ['gewährt', '1 Std./Woche', 7.6, 1.4],
    ['entspricht', '1:31 h', 9.15, 1.3],
    ['erfasst', '3:00 h', 10.5, 1.2],
    ['Differenz', '+1:29 h', 11.75, 0.85],
  ];
  spalten.forEach(([kopf, wert, x, w], i) => {
    s.addText(kopf, {
      x, y: 3.15, w, h: 0.35, fontFace: FLIESS, fontSize: 11, color: LEISE, margin: 0, valign: 'middle',
    });
    s.addText(wert, {
      x, y: 3.57, w, h: 0.55,
      fontFace: FLIESS, fontSize: i === 4 ? 20 : 15, bold: true,
      color: i === 4 ? AKZENT : NAVY, margin: 0, valign: 'middle',
    });
  });
  s.addText(
    'Die gewährte Stunde deckt gut die Hälfte des tatsächlichen Aufwands.',
    { x: 4.55, y: 4.25, w: 8.0, h: 0.4, fontFace: FLIESS, fontSize: 12.5, italic: true, color: LEISE, margin: 0 },
  );

  karte(s, {
    x: RAND, y: 5.15, w: 11.6, h: 1.85, marke: '=',
    titel: 'Wichtig: Ermäßigungsstunden senken die Unterrichtsverpflichtung, nicht die Arbeitszeit',
    text: 'Wer zwei Stunden weniger unterrichtet, arbeitet keine Minute weniger – die Zeit ist für die Aufgabe vorgesehen. Das Arbeitszeit-Soll bleibt deshalb unverändert.',
  });

  s.addNotes(
    'Das ist die Funktion, die es in keiner anderen Arbeitszeit-App gibt – ruhig als solche benennen.\n\n' +
      'Der Rechenweg in einem Satz: Eine Vollzeitkraft leistet 41 Wochenstunden für 27 ' +
      'Pflichtstunden. Also steckt in jeder Deputatsstunde rund eineinhalb Zeitstunden. Wer eine ' +
      'Stunde Ermäßigung bekommt, hat dafür 1:31 h pro Woche – nicht 45 Minuten.\n\n' +
      'Das Beispiel ist erfunden, aber realistisch. Wer eine Funktionsaufgabe hat, wird an dieser ' +
      'Stelle wahrscheinlich nicken.\n\n' +
      'Der untere Kasten klingt technisch, ist aber der Grund, warum die Zahlen stimmen: Hätten ' +
      'wir Ermäßigungen in den Beschäftigungsumfang eingerechnet, käme ein zu niedriges Soll ' +
      'heraus und die App würde die Mehrarbeit kleinrechnen.',
  );
}

/* 12 — Datenschutz --------------------------------------------------------- */
{
  const s = folie(true);
  s.addText('Wer sieht meine Daten?', {
    x: RAND, y: 0.75, w: 11.6, h: 0.8,
    fontFace: KOPF, fontSize: 36, bold: true, color: WEISS, margin: 0, valign: 'middle',
  });
  s.addText('Niemand.', {
    x: RAND, y: 1.6, w: 11.6, h: 0.9,
    fontFace: KOPF, fontSize: 46, bold: true, color: WEISS, margin: 0, valign: 'middle',
  });

  const fakten = [
    ['Kein Server', 'Es gibt keine Datenbank, in der etwas landen könnte.'],
    ['Kein Konto', 'Keine Anmeldung, kein Passwort, kein Tracking, keine Cookies.'],
    ['Nur dein Gerät', 'Alles liegt im Speicher deines Browsers.'],
    ['Keine Einsicht', 'Die Schulleitung hat keinen Zugriff – es gibt nichts zuzugreifen.'],
  ];
  fakten.forEach(([titel, text], i) => {
    const x = RAND + (i % 2) * 6.09;
    const y = 2.85 + Math.floor(i / 2) * 1.5;
    s.addShape(pres.ShapeType.ellipse, {
      x, y: y + 0.1, w: 0.44, h: 0.44,
      fill: { color: WEISS }, line: { color: WEISS, width: 1 },
    });
    s.addText('✓', {
      x, y: y + 0.1, w: 0.44, h: 0.44,
      fontFace: FLIESS, fontSize: 15, bold: true, color: NAVY, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(titel, {
      x: x + 0.62, y, w: 5.0, h: 0.42,
      fontFace: FLIESS, fontSize: 17, bold: true, color: WEISS, margin: 0, valign: 'middle',
    });
    s.addText(text, {
      x: x + 0.62, y: y + 0.44, w: 5.0, h: 0.72,
      fontFace: FLIESS, fontSize: 12.5, color: LEISE_HELL, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
    });
  });

  s.addText(
    'Der Preis dafür: Es gibt auch keine automatische Sicherung. Ein Backup pro Halbjahr ist Pflicht.',
    { x: RAND, y: 6.15, w: 11.6, h: 0.5, fontFace: FLIESS, fontSize: 13.5, italic: true, color: LEISE_HELL, margin: 0 },
  );

  s.addNotes(
    'Diese Folie entscheidet mit darüber, ob Leute mitmachen. Deutlich und ohne Einschränkung ' +
      'vortragen – die Sorge, dass hier eine Leistungskontrolle entsteht, ist real und berechtigt.\n\n' +
      'Wer technisch nachfragt: Der Quelltext ist offen und einsehbar, jeder kann prüfen, dass ' +
      'nichts übertragen wird.\n\n' +
      'Den Backup-Hinweis nicht unterschlagen – das ist die ehrliche Kehrseite. Auf dem iPhone ' +
      'zusätzlich: App zum Startbildschirm hinzufügen, sonst löscht Safari die Daten nach sieben ' +
      'Tagen ohne Nutzung.',
  );
}

/* 13 — Gemeinsame Auswertung ----------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Aus vielen Einzelfällen wird ein Befund', 'Freiwillig, anonym – und nur, wenn genug mitmachen');

  s.addText(
    'Eine einzelne Dokumentation ist ein Einzelfall. Zwanzig sind ein Befund. Wer möchte, kann ' +
      'deshalb zusätzlich eine anonyme Kennzahlen-Datei abgeben.',
    { x: RAND, y: 1.85, w: 11.6, h: 0.7, fontFace: FLIESS, fontSize: 15, color: TEXT, margin: 0, lineSpacingMultiple: 1.25 },
  );

  s.addShape(pres.ShapeType.roundRect, {
    x: RAND, y: 2.7, w: 5.75, h: 1.95, rectRadius: 0.12,
    fill: { color: HELL }, line: { color: 'E2E9EF', width: 1 }, shadow: schatten(),
  });
  s.addText('In der Datei stehen', {
    x: RAND + 0.28, y: 2.93, w: 5.2, h: 0.4, fontFace: FLIESS, fontSize: 15, bold: true, color: NAVY, margin: 0,
  });
  liste(s, {
    x: RAND + 0.28, y: 3.37, w: 5.2, h: 1.2, groesse: 12.5, farbe: LEISE,
    punkte: [
      'Beschäftigungsumfang in Prozent',
      'Soll- und Ist-Stunden, Saldo',
      'Summen je Kategorie und Woche',
      'ein jedes Mal neu gewürfeltes Pseudonym',
    ],
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: RAND + 6.09, y: 2.7, w: 5.75, h: 1.95, rectRadius: 0.12,
    fill: { color: BLAU }, line: { color: BLAU, width: 1 }, shadow: schatten(),
  });
  s.addText('Nicht in der Datei', {
    x: RAND + 6.37, y: 2.93, w: 5.2, h: 0.4, fontFace: FLIESS, fontSize: 15, bold: true, color: WEISS, margin: 0,
  });
  liste(s, {
    x: RAND + 6.37, y: 3.37, w: 5.2, h: 1.2, groesse: 12.5, farbe: LEISE_HELL,
    punkte: [
      'Name, Fächer, Klassen',
      'Notizen und einzelne Einträge',
      'einzelne Tage und Uhrzeiten',
      'die Liste der Funktionsaufgaben',
    ],
  });

  karte(s, {
    x: RAND, y: 4.95, w: 11.6, h: 1.95, marke: '5',
    titel: 'Erst ab etwa fünf Beiträgen zeigen',
    text: 'Bei kleinen Gruppen kann schon der Beschäftigungsumfang jemanden erkennbar machen. Das Werkzeug warnt darunter ausdrücklich. Vor einer Gesamtauswertung: mit dem Personalrat sprechen.',
  });

  s.addNotes(
    'Hier kommt erfahrungsgemäß die Frage: „Kann man mich zurückverfolgen?"\n\n' +
      'Antwort: Das Pseudonym wird bei jedem Export neu gewürfelt, zwei Exporte derselben Person ' +
      'lassen sich nicht verknüpfen. Was bleibt, ist die theoretische Möglichkeit, jemanden über ' +
      'einen ungewöhnlichen Beschäftigungsumfang zu erkennen – deshalb die Fünf-Personen-Schwelle, ' +
      'und deshalb ist die Abgabe strikt freiwillig.\n\n' +
      'Personalrat ansprechen: Am besten ist es, wenn die Sammlung von dort ausgeht oder ' +
      'zumindest dort abgestimmt ist.',
  );
}

/* 14 — Nutzen -------------------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'Was wir davon haben', '');

  const nutzen = [
    { marke: 'I', titel: 'Klarheit für sich selbst', text: 'Die meisten unterschätzen, wie viel Zeit Korrekturen und Kommunikation tatsächlich fressen. Das zu wissen hilft bei der eigenen Planung – und beim Nein-Sagen.' },
    { marke: 'II', titel: 'Belege, wenn es darauf ankommt', text: 'Für das Gespräch über Anrechnungsstunden, für die Klassenzuteilung im nächsten Jahr, für eine Überlastungsanzeige. Mit Zahlen argumentiert es sich anders.' },
    { marke: 'III', titel: 'Gewicht für das Kollegium', text: 'Wenn viele mitmachen, entsteht ein Bild der Schule statt einzelner Wortmeldungen – für Personalrat und Schulkonferenz.' },
    { marke: 'IV', titel: 'Ein Beitrag zur Debatte', text: 'Die Frage, wie lange Lehrkräfte arbeiten, wird seit Jahren ohne belastbare Daten diskutiert. Jede Dokumentation ist ein Datenpunkt mehr.' },
  ];
  nutzen.forEach((n, i) => {
    karte(s, { x: RAND + (i % 2) * 6.09, y: 1.75 + Math.floor(i / 2) * 2.45, w: 5.75, h: 2.2, ...n, ton: i === 1 ? 'dunkel' : 'hell' });
  });

  s.addNotes(
    'Hier den Bogen zurück zum Anfang schlagen: Es geht nicht um Kontrolle, sondern um Sichtbarkeit.\n\n' +
      'Punkt II ist für die meisten der konkreteste – Beispiele aus dem eigenen Kollegium nennen, ' +
      'falls vorhanden.\n\n' +
      'Punkt I nicht unterschätzen: Viele erleben die Erfassung als entlastend, weil sie zeigt, ' +
      'dass das Gefühl der Überlastung berechtigt ist.',
  );
}

/* 15 — So fangen wir an ----------------------------------------------------- */
{
  const s = folie();
  ueberschrift(s, 'So fangen wir an', 'Vier Schritte, der erste dauert eine Viertelstunde');

  const schritte = [
    ['1', 'Ausprobieren', 'Link öffnen, App zum Startbildschirm hinzufügen, Einrichtung durchklicken. Etwa 15 Minuten – am besten gleich mit dem Stundenplan.'],
    ['2', 'Vier Wochen testen', 'Wer mag, erfasst probeweise vier Wochen. Danach weiß man, ob es in den eigenen Alltag passt. Aussteigen ist jederzeit möglich.'],
    ['3', 'Rückmeldung sammeln', 'Was fehlt, was nervt, was ist unklar? Die App lässt sich anpassen – Kategorien, Voreinstellungen, Ferientermine.'],
    ['4', 'Gemeinsam auswerten', 'Wenn genug mitmachen und der Personalrat einverstanden ist: anonyme Dateien zusammenführen und das Ergebnis in der Schulkonferenz vorstellen.'],
  ];

  schritte.forEach(([nr, titel, text], i) => {
    const y = 1.9 + i * 1.17;
    s.addShape(pres.ShapeType.ellipse, {
      x: RAND, y: y + 0.1, w: 0.62, h: 0.62,
      fill: { color: i === 3 ? AKZENT : BLAU }, line: { color: WEISS, width: 1 },
    });
    s.addText(nr, {
      x: RAND, y: y + 0.1, w: 0.62, h: 0.62,
      fontFace: FLIESS, fontSize: 18, bold: true, color: WEISS, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(titel, {
      x: RAND + 0.85, y, w: 2.9, h: 0.5,
      fontFace: FLIESS, fontSize: 17, bold: true, color: NAVY, margin: 0, valign: 'middle',
    });
    s.addText(text, {
      x: RAND + 3.85, y, w: 8.05, h: 0.92,
      fontFace: FLIESS, fontSize: 13, color: LEISE, margin: 0, valign: 'middle', lineSpacingMultiple: 1.18,
    });
  });

  s.addText(
    'Der Leitfaden in der App beantwortet die meisten Fragen – und lässt sich ausdrucken.',
    { x: RAND, y: 6.5, w: 11.6, h: 0.45, fontFace: FLIESS, fontSize: 13.5, italic: true, color: BLAU, margin: 0 },
  );

  s.addNotes(
    'Konkret werden: Wo finden die Kolleginnen und Kollegen den Link? QR-Code an die Wand ' +
      'projizieren oder als Handzettel verteilen, das senkt die Hürde erheblich.\n\n' +
      'Einen Termin nennen, wann man wieder zusammenkommt – ohne festen Punkt versandet es.\n\n' +
      'Anbieten, in der Freistunde bei der Einrichtung zu helfen. Die meisten Abbrüche passieren ' +
      'in den ersten fünf Minuten.',
  );
}

/* 16 — Ehrliche Grenzen und Schluss ---------------------------------------- */
{
  const s = folie(true);
  s.addShape(pres.ShapeType.ellipse, {
    x: -1.4, y: 4.6, w: 4.6, h: 4.6,
    fill: { color: BLAU, transparency: 60 }, line: { color: BLAU, transparency: 100 },
  });

  s.addText('Was wir offen sagen sollten', {
    x: RAND, y: 0.7, w: 11.6, h: 0.8,
    fontFace: KOPF, fontSize: 34, bold: true, color: WEISS, margin: 0, valign: 'middle',
  });

  const grenzen = [
    ['Es sind Selbstaufschreibungen.', 'Sie sind so belastbar, wie sorgfältig erfasst wird. Lücken machen den Saldo eher zu klein als zu groß – die App weist ausdrücklich darauf hin.'],
    ['Einige Werte müssen geprüft werden.', 'Die Pflichtstunden und Ermäßigungen stammen aus der KMK-Übersicht von 2019, die Verordnung wurde seither neu gefasst. Alles ist in der App änderbar, ohne Programmierkenntnisse.'],
    ['Das ist keine Rechtsberatung.', 'Ob und wie sich aus dokumentierter Mehrarbeit Ansprüche ableiten lassen, beantworten Personalrat, Gewerkschaft oder Rechtsberatung – nicht diese App.'],
  ];
  grenzen.forEach(([titel, text], i) => {
    const y = 1.75 + i * 1.35;
    s.addText(titel, {
      x: RAND, y, w: 11.6, h: 0.42,
      fontFace: FLIESS, fontSize: 17, bold: true, color: WEISS, margin: 0, valign: 'middle',
    });
    s.addText(text, {
      x: RAND, y: y + 0.44, w: 11.0, h: 0.74,
      fontFace: FLIESS, fontSize: 13.5, color: LEISE_HELL, margin: 0, valign: 'top', lineSpacingMultiple: 1.2,
    });
  });

  s.addText('Fragen?', {
    x: RAND, y: 5.85, w: 5.0, h: 0.7,
    fontFace: KOPF, fontSize: 34, bold: true, color: WEISS, margin: 0, valign: 'middle',
  });
  s.addText('Leitfaden und App: in der Einladung verlinkt', {
    x: RAND, y: 6.55, w: 8.0, h: 0.4,
    fontFace: FLIESS, fontSize: 13, color: LEISE_HELL, margin: 0,
  });

  s.addNotes(
    'Bewusst mit den Grenzen schließen, nicht mit einem Werbeversprechen. Wer die Schwächen ' +
      'selbst benennt, wird bei den Stärken eher geglaubt.\n\n' +
      'Letzter Satz vor der Fragerunde: Niemand muss mitmachen. Aber wer möchte, hat ab heute ' +
      'ein Werkzeug dafür.\n\n' +
      'Für die Fragerunde bereithalten: die Ferien-Frage (Folie 5), die Datenschutz-Frage ' +
      '(Folie 12) und die Aufwandsfrage (Folie 7). Das sind die drei, die immer kommen.',
  );
}

/* -------------------------------- Ausgabe -------------------------------- */

pres
  .writeFile({ fileName: 'Lehrerzeit-Vorstellung.pptx' })
  .then((name) => console.log(`Erstellt: ${name}`));
