/**
 * Fiktive Startdaten für den Prototyp.
 *
 * Alle Namen sind erfunden. Die Daten werden relativ zum heutigen Tag erzeugt,
 * damit laufende Verfahren, Fristen und die fällige Entscheidung immer
 * realistisch aussehen - egal, wann die App geöffnet wird.
 */

import { SCHEMA_VERSION, neueId, neuesToken, tageVersetzt, aufstiegsLevel, abstiegsLevel } from './model.js';
import { evVerfahrenStart, evRueckmeldung, evVerfahrenAbschluss } from './ereignis.js';

const zeitAm = (isoDatum, stunde = 10, minute = 15) =>
  new Date(`${isoDatum}T${String(stunde).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`).toISOString();

export function demoStand() {
  // Jede Lehrkraft hat pro Verfahren eine Stimme. Damit die Bilanzen im
  // Demobestand realistisch aussehen, braucht es ein Kollegium und nicht drei
  // Konten: eine Lerngruppe wird von sechs bis acht Personen unterrichtet.
  const benutzer = [
    { id: 'ben_ahrens', name: 'K. Ahrens', kuerzel: 'Ahr', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_7a'] },
    { id: 'ben_balzer', name: 'M. Balzer', kuerzel: 'Bal', rolle: 'lehrkraft', gruppen: ['gr_7b', 'gr_8a'] },
    { id: 'ben_cordes', name: 'S. Cordes', kuerzel: 'Cor', rolle: 'leitung', gruppen: ['gr_flex', 'gr_7a', 'gr_7b', 'gr_8a'] },
    { id: 'ben_dahl', name: 'T. Dahl', kuerzel: 'Dah', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_7a'] },
    { id: 'ben_eggers', name: 'R. Eggers', kuerzel: 'Egg', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_7b'] },
    { id: 'ben_fischer', name: 'P. Fischer', kuerzel: 'Fis', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_8a'] },
    { id: 'ben_goertz', name: 'H. Görtz', kuerzel: 'Gör', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_7a', 'gr_7b'] },
    { id: 'ben_huebner', name: 'A. Hübner', kuerzel: 'Hüb', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_8a'] },
    { id: 'ben_iversen', name: 'J. Iversen', kuerzel: 'Ive', rolle: 'lehrkraft', gruppen: ['gr_flex', 'gr_7a', 'gr_8a'] },
    { id: 'ben_juergens', name: 'L. Jürgens', kuerzel: 'Jür', rolle: 'lehrkraft', gruppen: ['gr_7a', 'gr_7b', 'gr_8a'] },
  ];
  const [ahrens, balzer, cordes, dahl, eggers, fischer, goertz, huebner, iversen, juergens] = benutzer;

  const gruppen = [
    { id: 'gr_flex', name: 'FLEX', beschreibung: 'Flexible Eingangsphase', archiviert: false },
    { id: 'gr_7a', name: '7a', beschreibung: 'Klassenstufe 7', archiviert: false },
    { id: 'gr_7b', name: '7b', beschreibung: 'Klassenstufe 7', archiviert: false },
    { id: 'gr_8a', name: '8a', beschreibung: 'Klassenstufe 8', archiviert: false },
  ];

  const schueler = [];
  const verfahren = [];
  const rueckmeldungen = [];
  const ereignisse = [];

  const neu = (vorname, nachname, level, gruppenIds) => {
    const s = {
      id: neueId('sch'),
      vorname,
      nachname,
      level,
      gruppen: gruppenIds,
      archiviert: false,
      token: neuesToken(),
      angelegtAm: tageVersetzt(-120),
      notiz: '',
    };
    schueler.push(s);
    return s;
  };

  /** Legt ein Verfahren samt Startereignis an. */
  const starte = (s, art, { kategorieId, zieltext, vorTagen, fristInTagen, von }) => {
    const beginn = tageVersetzt(-vorTagen);
    const v = {
      id: neueId('vf'),
      schuelerId: s.id,
      art,
      status: 'aktiv',
      startLevel: s.level,
      zielLevel: art === 'floss' ? abstiegsLevel(s.level) : aufstiegsLevel(s.level),
      kategorieId,
      zieltext,
      beginn,
      frist: tageVersetzt(fristInTagen),
      ergebnis: null,
      neuesLevel: null,
      abgeschlossenAm: null,
      abgeschlossenVon: null,
      gestartetVon: von.id,
    };
    verfahren.push(v);
    ereignisse.push(evVerfahrenStart(v, von, zeitAm(beginn, 8, 5)));
    return v;
  };

  /**
   * Stimmen zu einem Verfahren: Liste aus [TageZurück, Wert, Lehrkraft, Bemerkung].
   * Jede Lehrkraft kommt höchstens einmal vor; taucht sie zweimal auf, gilt die
   * spätere Stimme und die frühere erscheint in der Historie als geändert.
   */
  const melde = (v, eintraege) => {
    eintraege.forEach(([vorTagen, wert, von, bemerkung], i) => {
      const datum = tageVersetzt(-vorTagen);
      // Einträge von heute bekommen eine Uhrzeit, die schon vorbei ist.
      const zeit =
        vorTagen === 0
          ? new Date(Date.now() - (i + 1) * 40 * 60000).toISOString()
          : zeitAm(datum, 9 + (i % 4), 20);
      const r = {
        id: neueId('rm'),
        verfahrenId: v.id,
        schuelerId: v.schuelerId,
        wert,
        datum: zeit,
        benutzerId: von.id,
        benutzerName: von.name,
        bemerkung: bemerkung || '',
        storniert: false,
      };
      rueckmeldungen.push(r);
      ereignisse.push(evRueckmeldung(r, von, r.datum));
    });
  };

  /** Bereits abgeschlossenes Verfahren - füllt die Historie. */
  const abgeschlossen = (s, art, { kategorieId, zieltext, vonTagen, bisTagen, ergebnis, startLevel, von }) => {
    const v = {
      id: neueId('vf'),
      schuelerId: s.id,
      art,
      status: 'abgeschlossen',
      startLevel,
      zielLevel: art === 'floss' ? abstiegsLevel(startLevel) : aufstiegsLevel(startLevel),
      kategorieId,
      zieltext,
      beginn: tageVersetzt(-vonTagen),
      frist: tageVersetzt(-bisTagen),
      ergebnis: ergebnis.id,
      neuesLevel: ergebnis.neuesLevel,
      abgeschlossenAm: zeitAm(tageVersetzt(-bisTagen), 13, 40),
      abgeschlossenVon: von.id,
      gestartetVon: von.id,
    };
    verfahren.push(v);
    ereignisse.push(evVerfahrenStart(v, von, zeitAm(v.beginn, 8, 5)));
    return v;
  };

  /* ------------------------------------------------------------ FLEX --- */

  const amelie = neu('Amelie', 'Brandt', 3, ['gr_flex']);
  const ben = neu('Ben', 'Cakir', 2, ['gr_flex']);
  neu('Clara', 'Dörfler', 4, ['gr_flex']);
  const david = neu('David', 'Ehlers', 2, ['gr_flex', 'gr_7a']);
  const emilia = neu('Emilia', 'Fink', 1, ['gr_flex']);
  neu('Finn', 'Grabowski', 3, ['gr_flex']);
  const greta = neu('Greta', 'Hansen', 2, ['gr_flex']);
  neu('Hannes', 'Kruse', 1, ['gr_flex']);
  neu('Ida', 'Lorenzen', 3, ['gr_flex', 'gr_7a']);
  const jonas = neu('Jonas', 'Mielke', 2, ['gr_flex']);
  neu('Karla', 'Nowak', 4, ['gr_flex']);
  const leon = neu('Leon', 'Osterhoff', 2, ['gr_flex']);
  const mika = neu('Mika', 'Petersen', 3, ['gr_flex']);
  neu('Nele', 'Reimers', 2, ['gr_flex']);
  neu('Oskar', 'Stein', 3, ['gr_flex']);

  // Zwei laufende Floßverfahren.
  const vBen = starte(ben, 'floss', {
    kategorieId: 'selbststaendigkeit',
    zieltext: 'Ich beginne selbstständig mit meinen Aufgaben.',
    vorTagen: 8,
    fristInTagen: 4,
    von: ahrens,
  });
  melde(vBen, [
    [7, 'erfuellt', ahrens],
    [6, 'erfuellt', goertz],
    [5, 'teilweise', huebner, 'Start nach der Pause hat gedauert.'],
    [4, 'nicht', dahl, 'Heute gar nicht angefangen.'],
    [3, 'erfuellt', eggers],
    [2, 'teilweise', fischer],
    [1, 'erfuellt', iversen],
    // T. Dahl hat später anders eingeschätzt - die frühere Stimme bleibt in
    // der Historie stehen, gültig ist diese hier.
    [1, 'teilweise', dahl, 'Läuft seit dieser Woche besser.'],
  ]);

  const vLeon = starte(leon, 'floss', {
    kategorieId: 'material',
    zieltext: 'Ich habe mein Material vollständig dabei.',
    vorTagen: 3,
    fristInTagen: 8,
    von: ahrens,
  });
  melde(vLeon, [
    [2, 'teilweise', ahrens],
    [1, 'nicht', goertz, 'Mappe vergessen.'],
    [0, 'erfuellt', eggers],
  ]);

  // Drei laufende Brücken.
  const vDavid = starte(david, 'bruecke', {
    kategorieId: 'arbeitsverhalten',
    zieltext: 'Ich arbeite in der Lernzeit ruhig und konzentriert.',
    vorTagen: 6,
    fristInTagen: 5,
    von: ahrens,
  });
  melde(vDavid, [
    [5, 'erfuellt', ahrens],
    [4, 'erfuellt', cordes],
    [3, 'teilweise', dahl],
    [2, 'erfuellt', fischer],
    [0, 'erfuellt', iversen],
  ]);

  const vEmilia = starte(emilia, 'bruecke', {
    kategorieId: 'zuverlaessigkeit',
    zieltext: 'Ich erledige meine Hausaufgaben vollständig.',
    vorTagen: 12,
    fristInTagen: 2,
    von: cordes,
  });
  melde(vEmilia, [
    [11, 'erfuellt', cordes],
    [9, 'erfuellt', ahrens],
    [8, 'erfuellt', goertz],
    [7, 'teilweise', huebner],
    [4, 'erfuellt', eggers],
    [2, 'erfuellt', fischer],
  ]);

  const vJonas = starte(jonas, 'bruecke', {
    kategorieId: 'sozialverhalten',
    zieltext: 'Ich arbeite in der Gruppe freundlich mit.',
    vorTagen: 10,
    fristInTagen: 2,
    von: ahrens,
  });
  melde(vJonas, [
    [9, 'erfuellt', ahrens],
    [8, 'teilweise', dahl],
    [6, 'erfuellt', eggers],
    [5, 'erfuellt', goertz],
    [3, 'nicht', huebner, 'Streit in der Gruppenarbeit.'],
    [2, 'erfuellt', iversen],
    [1, 'erfuellt', cordes],
  ]);

  // Eine fällige Entscheidung: Frist gestern erreicht.
  const vGreta = starte(greta, 'floss', {
    kategorieId: 'arbeitsverhalten',
    zieltext: 'Ich erledige meine Aufgaben in der vorgesehenen Zeit.',
    vorTagen: 15,
    fristInTagen: -1,
    von: ahrens,
  });
  melde(vGreta, [
    [14, 'erfuellt', ahrens],
    [13, 'teilweise', dahl],
    [12, 'erfuellt', eggers],
    [10, 'nicht', fischer],
    [9, 'erfuellt', goertz],
    [6, 'teilweise', huebner],
    [3, 'teilweise', iversen],
    [2, 'nicht', cordes, 'Aufgaben nicht begonnen.'],
  ]);

  // Historie: bereits abgeschlossene Verfahren bei ansonsten normalen Schülern.
  const vAmelie = abgeschlossen(amelie, 'bruecke', {
    kategorieId: 'selbststaendigkeit',
    zieltext: 'Ich plane meine Woche selbstständig mit dem Lernplan.',
    vonTagen: 60,
    bisTagen: 40,
    startLevel: 2,
    ergebnis: { id: 'aufstieg', text: 'Levelaufstieg', ikone: '⬆️', neuesLevel: 3 },
    von: cordes,
  });
  melde(vAmelie, [
    [58, 'erfuellt', ahrens],
    [55, 'erfuellt', cordes],
    [52, 'teilweise', dahl],
    [48, 'erfuellt', goertz],
    [44, 'erfuellt', huebner],
    [41, 'erfuellt', iversen],
  ]);
  ereignisse.push(
    evVerfahrenAbschluss(
      vAmelie,
      { id: 'aufstieg', text: 'Levelaufstieg', ikone: '⬆️', neuesLevel: 3 },
      cordes,
      vAmelie.abgeschlossenAm,
    ),
  );

  const vMika = abgeschlossen(mika, 'floss', {
    kategorieId: 'material',
    zieltext: 'Meine Mappe ist geordnet und vollständig.',
    vonTagen: 90,
    bisTagen: 70,
    startLevel: 3,
    ergebnis: { id: 'gehalten', text: 'Level gehalten', ikone: '✅', neuesLevel: 3 },
    von: cordes,
  });
  melde(vMika, [
    [88, 'teilweise', ahrens],
    [85, 'erfuellt', eggers],
    [80, 'erfuellt', fischer],
    [76, 'erfuellt', goertz],
    [72, 'erfuellt', cordes],
  ]);
  ereignisse.push(
    evVerfahrenAbschluss(
      vMika,
      { id: 'gehalten', text: 'Level gehalten', ikone: '✅', neuesLevel: 3 },
      cordes,
      vMika.abgeschlossenAm,
    ),
  );

  /* -------------------------------------------------------------- 7a --- */

  neu('Alina', 'Timm', 3, ['gr_7a']);
  const paul = neu('Paul', 'Uhlig', 2, ['gr_7a']);
  neu('Romy', 'Vogt', 4, ['gr_7a']);
  const sami = neu('Sami', 'Wendt', 2, ['gr_7a']);
  neu('Tessa', 'Xylander', 3, ['gr_7a']);
  neu('Ugur', 'Yildiz', 1, ['gr_7a']);
  neu('Vera', 'Ziegler', 3, ['gr_7a']);
  neu('Wanda', 'Abel', 2, ['gr_7a']);
  neu('Xaver', 'Bruhn', 4, ['gr_7a']);
  neu('Yannis', 'Clausen', 2, ['gr_7a']);

  const vPaul = starte(paul, 'bruecke', {
    kategorieId: 'arbeitsverhalten',
    zieltext: 'Ich halte mich an die vereinbarte Arbeitsform.',
    vorTagen: 5,
    fristInTagen: 9,
    von: ahrens,
  });
  melde(vPaul, [
    [4, 'erfuellt', ahrens],
    [2, 'teilweise', juergens],
    [1, 'erfuellt', dahl],
  ]);

  const vSami = starte(sami, 'floss', {
    kategorieId: 'zuverlaessigkeit',
    zieltext: 'Ich halte Absprachen ein.',
    vorTagen: 9,
    fristInTagen: -2,
    von: ahrens,
  });
  melde(vSami, [
    [8, 'nicht', ahrens],
    [6, 'teilweise', juergens],
    [5, 'erfuellt', goertz],
    [3, 'nicht', iversen],
    [2, 'teilweise', cordes],
  ]);

  /* -------------------------------------------------------------- 7b --- */

  neu('Zoe', 'Dammann', 2, ['gr_7b']);
  const noah = neu('Noah', 'Engel', 3, ['gr_7b']);
  neu('Lina', 'Freitag', 4, ['gr_7b']);
  neu('Marek', 'Gerber', 1, ['gr_7b']);
  neu('Frieda', 'Holm', 2, ['gr_7b']);
  neu('Elias', 'Ivens', 3, ['gr_7b']);
  neu('Jette', 'Jansen', 2, ['gr_7b']);
  neu('Kian', 'Kluge', 3, ['gr_7b']);
  neu('Lea', 'Möller', 2, ['gr_7b']);
  neu('Mats', 'Neumann', 4, ['gr_7b']);
  neu('Nora', 'Öztürk', 3, ['gr_7b']);

  const vNoah = starte(noah, 'floss', {
    kategorieId: 'arbeitsverhalten',
    zieltext: 'Ich störe andere beim Arbeiten nicht.',
    vorTagen: 4,
    fristInTagen: 6,
    von: balzer,
  });
  melde(vNoah, [
    [3, 'teilweise', balzer],
    [2, 'erfuellt', eggers],
    [0, 'erfuellt', juergens],
  ]);

  /* -------------------------------------------------------------- 8a --- */

  neu('Ole', 'Petersen', 3, ['gr_8a']);
  const pia = neu('Pia', 'Quast', 3, ['gr_8a']);
  neu('Rafael', 'Rohde', 2, ['gr_8a']);
  neu('Selin', 'Sander', 4, ['gr_8a']);
  neu('Timo', 'Thiel', 2, ['gr_8a']);
  neu('Uta', 'Ulrich', 3, ['gr_8a']);
  neu('Vincent', 'Wagner', 1, ['gr_8a']);
  neu('Wilma', 'Weber', 4, ['gr_8a']);
  neu('Yara', 'Zimmer', 2, ['gr_8a']);
  neu('Bosse', 'Ahlers', 3, ['gr_8a']);

  const vPia = starte(pia, 'bruecke', {
    kategorieId: 'individuell',
    zieltext: 'Ich melde mich in jeder Stunde mindestens einmal.',
    vorTagen: 7,
    fristInTagen: 3,
    von: balzer,
  });
  melde(vPia, [
    [6, 'erfuellt', balzer],
    [5, 'erfuellt', fischer],
    [4, 'teilweise', huebner],
    [1, 'erfuellt', iversen],
  ]);

  ereignisse.sort((a, b) => a.zeit.localeCompare(b.zeit));

  return {
    schemaVersion: SCHEMA_VERSION,
    demo: true,
    gruppen,
    schueler,
    verfahren,
    rueckmeldungen,
    ereignisse,
    benutzer,
    aktiverBenutzer: 'ben_cordes',
    zuletztGeaendert: new Date().toISOString(),
  };
}
