/**
 * Identität und Rechte.
 *
 * Der Prototyp hat bewusst KEIN Login: er läuft mit fiktiven Daten, und ein
 * gefaktes Anmeldeformular würde nur Sicherheit vortäuschen. Stattdessen gibt
 * es hier die Abstraktion, gegen die später ein echter Anbieter gesetzt wird -
 * IServ (OpenID Connect / SSO), ein eigenes Konto-System oder beides.
 *
 * Wichtig: Rechteprüfungen im Browser sind Komfort, keine Sicherheit. Im
 * Produktivbetrieb muss dieselbe darf()-Matrix serverseitig gelten.
 */

export const ROLLEN = {
  lehrkraft: {
    id: 'lehrkraft',
    name: 'Lehrkraft',
    rechte: [
      'gruppen.eigene.sehen',
      'schueler.sehen',
      'rueckmeldung.geben',
      'verfahren.starten',
      'historie.sehen',
    ],
  },
  leitung: {
    id: 'leitung',
    name: 'Klassenleitung / Administration',
    rechte: [
      'gruppen.eigene.sehen',
      'gruppen.alle.sehen',
      'gruppen.verwalten',
      'schueler.sehen',
      'schueler.verwalten',
      'rueckmeldung.geben',
      'rueckmeldung.korrigieren',
      'verfahren.starten',
      'verfahren.abschliessen',
      'level.aendern',
      'historie.sehen',
      'protokoll.sehen',
      'daten.exportieren',
      'daten.loeschen',
    ],
  },
};

export function darf(benutzer, recht) {
  if (!benutzer) return false;
  const rolle = ROLLEN[benutzer.rolle];
  return Boolean(rolle && rolle.rechte.includes(recht));
}

/** Sieht dieser Benutzer die Lerngruppe? Leitung sieht alle. */
export function siehtGruppe(benutzer, gruppe) {
  if (!benutzer || !gruppe) return false;
  if (darf(benutzer, 'gruppen.alle.sehen')) return true;
  return (benutzer.gruppen || []).includes(gruppe.id);
}

/**
 * Anbieter-Interface für die spätere Anmeldung. Ein Anbieter liefert den
 * angemeldeten Benutzer inklusive Rolle und Lerngruppen.
 *
 *   anmelden()  -> Promise<Benutzer>
 *   abmelden()  -> Promise<void>
 *   benutzer()  -> Benutzer|null
 */
export class LokalerAnbieter {
  /** Prototyp: der "angemeldete" Benutzer wird schlicht aus dem Stand gewählt. */
  constructor(stand) {
    this.stand = stand;
    this.name = 'Prototyp (kein Login)';
  }

  async anmelden() {
    return this.benutzer();
  }

  async abmelden() {}

  benutzer() {
    return this.stand.benutzer.find((b) => b.id === this.stand.aktiverBenutzer) || null;
  }
}

/**
 * Platzhalter für IServ. Bewusst NICHT implementiert: die konkreten Endpunkte,
 * Scopes und Gruppen-Bezeichner unserer Instanz sind ohne Zugangsdaten und
 * ohne API-Dokumentation nicht seriös zu erraten. Was die Anbindung später
 * braucht, steht in ARCHITEKTUR.md; hier ist nur die Stelle, an der sie
 * eingehängt wird.
 */
export class IServAnbieter {
  constructor(konfiguration) {
    this.konfiguration = konfiguration; // { issuer, clientId, redirectUri, scopes }
    this.name = 'IServ (nicht angebunden)';
  }

  async anmelden() {
    throw new Error(
      'IServ ist nicht angebunden. Erforderlich: OIDC-Zugangsdaten der Schulinstanz und die ' +
        'Zuordnung IServ-Gruppen -> Lerngruppen. Siehe ARCHITEKTUR.md.',
    );
  }

  async abmelden() {}

  benutzer() {
    return null;
  }
}
