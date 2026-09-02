/**
 * QR-Codes - vorbereitet, bewusst noch nicht gerendert.
 *
 * Fachliche Festlegung (gilt schon jetzt):
 *   - Jeder Schüler hat ein dauerhaftes Zugangstoken (16 Byte Zufall).
 *   - Das Token ändert sich nie, auch nicht bei Level- oder Statuswechsel.
 *     Ein einmal gedruckter Code bleibt also gültig.
 *   - Im Code steht ausschließlich eine URL mit diesem Token: kein Name,
 *     kein Level, kein Floß-/Brückenstatus, keine Klasse, kein Geburtsdatum.
 *   - Die Ziel-Route ist geschützt. Der Scan öffnet die App; wer nicht
 *     angemeldet und berechtigt ist, sieht kein Profil, sondern die Anmeldung.
 *     Der QR-Code ist damit ein Wegweiser, kein Schlüssel.
 *
 * Was fehlt: die Grafik. Ein QR-Encoder gehört als geprüfte Bibliothek in die
 * Anwendung (z. B. `qrcode`), nicht als selbstgeschriebene Näherung. Sobald
 * eine Bibliothek eingebunden ist, wird sie hier über rendererSetzen()
 * registriert - der Rest der App bleibt unverändert.
 */

const ROUTE = '/student/';

let renderer = null;

/** Erwartete Signatur: (zielUrl, groesse) => HTMLElement (svg/canvas/img). */
export function rendererSetzen(fn) {
  renderer = fn;
}

export function rendererVorhanden() {
  return typeof renderer === 'function';
}

/**
 * Ziel-URL des QR-Codes. Im Prototyp ohne Server als Hash-Route, damit der
 * Scan-Weg bereits vollständig durchgespielt werden kann; produktiv wird
 * daraus die echte Route /student/<token>.
 */
export function zielUrl(schueler, { absolut = true } = {}) {
  const pfad = `#/s/${schueler.token}`;
  if (!absolut) return pfad;
  const basis = `${location.origin}${location.pathname}`;
  return `${basis}${pfad}`;
}

/** So sieht die Route im Produktivbetrieb aus - für Doku und Vorschau. */
export function produktivUrl(schueler, basis = 'https://lernerlevel.schule.de') {
  return `${basis}${ROUTE}${schueler.token}`;
}

export function qrElement(schueler, groesse = 180) {
  if (!renderer) return null;
  return renderer(zielUrl(schueler), groesse);
}
