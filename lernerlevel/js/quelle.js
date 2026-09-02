/**
 * Datenquelle - die einzige Stelle, an der der Prototyp weiß, WO die Daten
 * liegen. Der übrige Code kennt nur dieses Interface:
 *
 *   laden()          -> Promise<Datenstand|null>
 *   speichern(stand) -> Promise<void>
 *   leeren()         -> Promise<void>
 *
 * Heute: LokaleQuelle (localStorage, Gerät der Lehrkraft, fiktive Daten).
 * Später: ServerQuelle gegen eine REST-API mit Datenbank, Konten und Rollen -
 * ohne dass Views oder Modell angefasst werden müssen. Deshalb ist das
 * Interface bereits asynchron, obwohl localStorage synchron wäre.
 */

const KEY = 'lernerlevel.v1';

export class LokaleQuelle {
  constructor(schluessel = KEY) {
    this.schluessel = schluessel;
    this.name = 'Lokal (localStorage)';
  }

  async laden() {
    try {
      const roh = localStorage.getItem(this.schluessel);
      return roh ? JSON.parse(roh) : null;
    } catch (err) {
      console.error('Gespeicherter Stand konnte nicht gelesen werden:', err);
      return null;
    }
  }

  async speichern(stand) {
    try {
      localStorage.setItem(this.schluessel, JSON.stringify(stand));
    } catch (err) {
      console.error('Stand konnte nicht gespeichert werden:', err);
      throw err;
    }
  }

  async leeren() {
    localStorage.removeItem(this.schluessel);
  }
}

/**
 * Vorbereitete Server-Quelle. Absichtlich NICHT aktiv: es gibt noch keinen
 * Server. Die Klasse zeigt, welche Endpunkte eine spätere Umsetzung braucht,
 * damit die Umstellung eine Zeile in app.js ist:
 *
 *   const quelle = new ServerQuelle('/api');
 *
 * Für den Produktivbetrieb wird laden()/speichern() durch feinere Aufrufe
 * ersetzt (POST /rueckmeldungen statt "ganzen Stand schreiben"); der Store
 * ruft dafür bereits einzelne Aktionen auf, die sich 1:1 abbilden lassen.
 */
export class ServerQuelle {
  constructor(basis) {
    this.basis = basis;
    this.name = 'Server';
  }

  async laden() {
    throw new Error('ServerQuelle ist noch nicht angebunden.');
  }

  async speichern() {
    throw new Error('ServerQuelle ist noch nicht angebunden.');
  }

  async leeren() {
    throw new Error('ServerQuelle ist noch nicht angebunden.');
  }
}
