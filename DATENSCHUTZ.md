# Datenschutz

Kurzfassung: **Diese App sammelt nichts.** Es gibt keinen Server, kein
Benutzerkonto, keine Anmeldung, kein Tracking, keine Cookies und keine
Verbindung zu Dritten. Die Schulleitung hat keinen Zugriff auf die Erfassung.

## Wo die Daten liegen

Alle Eingaben – Zeiteinträge, Notizen, Stundenplan, Einstellungen – werden
ausschließlich im `localStorage` des verwendeten Browsers gespeichert, also auf
dem eigenen Gerät. Sie werden zu keinem Zeitpunkt an einen Server übertragen.
Auch die Excel- und PDF-Dateien entstehen im Browser selbst; nichts wird
hochgeladen.

Wer die App auf einem Schulrechner mit gemeinsamem Benutzerkonto verwendet,
sollte das wissen: Dort läge die Erfassung im Browserprofil, das andere
mitbenutzen. Für persönliche Arbeitszeitdaten ist das eigene Gerät oder ein
persönliches Browserprofil die richtige Wahl.

## Was beim Aufruf der Seite passiert

Wird die App über GitHub Pages oder einen anderen Webspace ausgeliefert,
protokolliert der Server – wie jeder Webserver – den Abruf der Dateien
(IP-Adresse, Zeitpunkt, angeforderte Datei). Das betrifft nur das Laden der App
selbst und niemals die erfassten Arbeitszeiten. Nach dem ersten Aufruf lässt
sich die App dank Service Worker vollständig offline nutzen; dann entstehen auch
diese Server-Protokolle nicht mehr.

Es werden keine externen Schriftarten, Skripte, Bibliotheken oder Analysedienste
eingebunden. Die App lädt ausschließlich eigene Dateien.

## Der anonyme Kollegiums-Export

Der Export für die gemeinsame Auswertung ist **freiwillig** und ein bewusster,
ausdrücklich zu bestätigender Schritt. Die Datei enthält:

- Beschäftigungsumfang in Prozent, Schulform, Schuljahr, Zeitraum
- Summe der Soll- und Ist-Stunden sowie den Saldo
- Summen je Kategorie und Summen je Kalenderwoche
- ein bei jedem Export neu gewürfeltes Pseudonym

Sie enthält **nicht**: Name, Fächer, Klassen, Notizen, einzelne Einträge,
einzelne Tage, Uhrzeiten, Gerätekennungen.

Das Pseudonym wird bei jedem Export neu erzeugt. Zwei Exporte derselben Person
lassen sich dadurch nicht miteinander verknüpfen.

Auch das Auswertungswerkzeug (`auswertung.html`) verarbeitet die Dateien
ausschließlich im Browser. Es lädt nichts hoch und speichert nichts; ein
Neuladen der Seite verwirft alles.

**Grenze der Anonymität:** Bei sehr kleinen Gruppen kann schon der
Beschäftigungsumfang eine Person erkennbar machen – in einem Kollegium mit einer
einzigen Kollegin mit 62,5 % Deputat ist „62,5 %“ ein Name. Das Werkzeug warnt
deshalb ausdrücklich, solange weniger als fünf Beiträge vorliegen, und sollte
erst darüber hinaus in Konferenzen gezeigt werden.

## Rollen und Verantwortlichkeiten

Solange jede Lehrkraft nur für sich erfasst, ist das eine private Aufzeichnung –
keine Verarbeitung durch die Schule und kein Fall für ein
Verarbeitungsverzeichnis.

Sobald anonyme Beiträge eingesammelt und zu einer Gesamtauswertung
zusammengeführt werden, entsteht eine gemeinsame Auswertung. Auch wenn sie
anonymisiert ist, gilt: Die Teilnahme muss freiwillig bleiben, niemand darf zur
Abgabe gedrängt werden, und die Abstimmung mit dem Personalrat vor der
Veröffentlichung ist der richtige Weg. Wer die Sammlung organisiert, sollte
vorher festlegen, wer die Dateien erhält, wie lange sie aufbewahrt werden und
wann sie gelöscht werden.

## Löschen

In den Einstellungen unter „Daten“ löscht *Alle Daten löschen* sämtliche
Einträge, den Stundenplan und alle Einstellungen unwiderruflich. Dasselbe
bewirkt das Löschen der Websitedaten im Browser. Vorher lohnt sich ein
Backup-Export.

## Verantwortlich

Verantwortlich für den Betrieb ist die Person oder Schule, die diese Dateien
veröffentlicht. Der Quelltext liegt offen und lässt sich prüfen – die Aussagen
auf dieser Seite sind nachlesbar in `js/store.js` (Speicherung) und
`js/export.js` (Exporte).
