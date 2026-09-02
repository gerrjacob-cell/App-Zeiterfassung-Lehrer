/**
 * Ereignisse - die Historie der App.
 *
 * Grundsatz: nichts wird überschrieben. Jede fachliche Änderung hängt einen
 * Eintrag an eine append-only Liste. Eine Korrektur löscht nichts, sondern
 * erzeugt ein weiteres Ereignis, das die Korrektur festhält. Aus derselben
 * Liste speisen sich die Schülerhistorie und das Protokoll der Leitung.
 */

import { ART, BEWERTUNG, neueId, datumLang } from './model.js';

function basis(typ, benutzer, zeit) {
  return {
    id: neueId('ev'),
    typ,
    zeit: zeit || new Date().toISOString(),
    benutzerId: benutzer ? benutzer.id : null,
    benutzerName: benutzer ? benutzer.name : 'System',
  };
}

export function evVerfahrenStart(verfahren, benutzer, zeit) {
  const art = ART[verfahren.art];
  const ziel =
    verfahren.art === ART.floss.id
      ? `gefährdet: Level ${verfahren.startLevel} → ${verfahren.startLevel - 1}`
      : `möglicher Aufstieg: Level ${verfahren.startLevel} → ${verfahren.startLevel + 1}`;
  return {
    ...basis('verfahren.start', benutzer, zeit),
    schuelerId: verfahren.schuelerId,
    verfahrenId: verfahren.id,
    ikone: art.ikone,
    titel: `${art.name} gestartet`,
    text: `${ziel}. Frist: ${datumLang(verfahren.frist)}. Ziel: „${verfahren.zieltext}“`,
  };
}

export function evRueckmeldung(rueckmeldung, benutzer, zeit) {
  const b = BEWERTUNG[rueckmeldung.wert];
  return {
    ...basis('rueckmeldung', benutzer, zeit),
    schuelerId: rueckmeldung.schuelerId,
    verfahrenId: rueckmeldung.verfahrenId,
    bezugId: rueckmeldung.id,
    ikone: b.ikone,
    titel: `Ziel ${b.name.toLowerCase()}`,
    text: rueckmeldung.bemerkung || '',
  };
}

export function evRueckmeldungStorniert(rueckmeldung, grund, benutzer, zeit) {
  const b = BEWERTUNG[rueckmeldung.wert];
  return {
    ...basis('rueckmeldung.storniert', benutzer, zeit),
    schuelerId: rueckmeldung.schuelerId,
    verfahrenId: rueckmeldung.verfahrenId,
    bezugId: rueckmeldung.id,
    ikone: '✏️',
    titel: 'Rückmeldung korrigiert',
    text: `Eintrag „${b.name}“ vom ${datumLang(rueckmeldung.datum.slice(0, 10))} zurückgenommen${
      grund ? `: ${grund}` : '.'
    }`,
  };
}

export function evVerfahrenAbschluss(verfahren, option, benutzer, zeit) {
  const art = ART[verfahren.art];
  const erfolg = option.id === 'aufstieg' || option.id === 'gehalten';
  const levelText =
    option.neuesLevel === verfahren.startLevel
      ? `Level ${verfahren.startLevel} ${verfahren.art === ART.floss.id ? 'gehalten' : 'beibehalten'}`
      : `Level ${verfahren.startLevel} → ${option.neuesLevel}`;
  return {
    ...basis('verfahren.abschluss', benutzer, zeit),
    schuelerId: verfahren.schuelerId,
    verfahrenId: verfahren.id,
    ikone: option.ikone,
    titel: `${art.name} abgeschlossen${erfolg ? ' – erfolgreich' : ''}`,
    text: levelText,
  };
}

export function evLevelGeaendert(schuelerId, altesLevel, neuesLevel, grund, benutzer, zeit) {
  return {
    ...basis('level.geaendert', benutzer, zeit),
    schuelerId,
    ikone: neuesLevel > altesLevel ? '⬆️' : '⬇️',
    titel: 'Level manuell geändert',
    text: `Level ${altesLevel} → ${neuesLevel}${grund ? ` (${grund})` : ''}`,
  };
}

export function evStammdaten(typ, schuelerId, titel, text, benutzer, zeit) {
  return { ...basis(typ, benutzer, zeit), schuelerId, ikone: '📋', titel, text };
}
