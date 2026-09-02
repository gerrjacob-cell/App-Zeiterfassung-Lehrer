# Architektur & Weg in den Produktivbetrieb

Der Prototyp ist absichtlich so gebaut, dass Datenbank, Konten, Rollen und eine
mögliche IServ-Anbindung später ergänzt werden können, ohne die Oberfläche neu
zu schreiben. Dieses Dokument beschreibt, wo die Nahtstellen liegen.

## 1. Schichten

```
views/ ──► store.js ──► quelle.js ──► localStorage        (heute)
                    └─► identitaet.js                     (Rollen, Rechte)
   │                                     └─► REST-API + Datenbank            (später)
   └──► model.js  (reine Fachlogik, kennt weder Speicher noch DOM)
```

* **model.js** enthält die Regeln: Welches Level folgt auf welches, wann ist
  eine Entscheidung fällig, wie wird eine Bilanz gebildet. Dieselben Regeln
  muss später der Server durchsetzen – die Datei ist bewusst frei von DOM- und
  Speicherbezug und kann in Node laufen.
* **store.js** ist die einzige Stelle, die Daten verändert. Jede Aktion ist so
  geschnitten, wie später ein API-Aufruf geschnitten wäre
  (`rueckmeldungGeben`, `verfahrenStarten`, `verfahrenAbschliessen`, …).
* **quelle.js** kapselt, *wo* die Daten liegen. `LokaleQuelle` heute,
  `ServerQuelle` später – das Interface (`laden`, `speichern`, `leeren`) ist
  bereits asynchron.
* **identitaet.js** kapselt, *wer* angemeldet ist und *was* er darf.

## 2. Datenmodell

| Objekt | Felder (gekürzt) |
| --- | --- |
| `schueler` | `id`, `vorname`, `nachname`, `level` (1–4), `gruppen[]`, `token`, `archiviert`, `angelegtAm` |
| `gruppen` | `id`, `name`, `beschreibung`, `archiviert` |
| `verfahren` | `id`, `schuelerId`, `art` (floss/bruecke), `status`, `startLevel`, `zielLevel`, `kategorieId`, `zieltext`, `beginn`, `frist`, `ergebnis`, `neuesLevel`, `abgeschlossenAm/Von`, `gestartetVon` |
| `rueckmeldungen` | `id`, `verfahrenId`, `schuelerId`, `wert`, `datum`, `benutzerId`, `bemerkung`, `storniert` |
| `ereignisse` | `id`, `typ`, `zeit`, `schuelerId`, `verfahrenId`, `benutzerId`, `titel`, `text` |

Zwei Festlegungen, die sich später auszahlen:

1. **Ein Schüler = ein Datensatz.** Die Lerngruppenzugehörigkeit ist eine Liste
   von IDs, keine Kopie. Ein Wechsel der Lerngruppe verliert keine Historie.
2. **Status wird nie gespeichert, sondern abgeleitet.** „Entscheidung fällig“
   ergibt sich aus offenem Verfahren + Frist + heutigem Datum. Damit kann keine
   Frist übersehen werden, weil niemand die App geöffnet hat.

Die Tabellen bilden 1:1 ein relationales Schema (PostgreSQL) ab; `ereignisse`
wird zur Audit-Tabelle, die ausschließlich `INSERT` kennt.

## 3. Historie und Korrekturen

Nichts wird überschrieben. Eine falsche Rückmeldung wird als `storniert`
markiert, und die Korrektur erzeugt zusätzlich ein eigenes Ereignis mit Grund,
Zeitpunkt und Person. Aus derselben Liste speisen sich Schülerhistorie und
Protokoll. Für den Produktivbetrieb heißt das: Audit-Log ohne `UPDATE`/`DELETE`,
Aufbewahrung nach Schuljahren, Löschung als Vorgang statt als stiller Eingriff.

## 4. Schritte zum Produktivbetrieb

1. **Server + Datenbank.** Node/PHP/Python mit PostgreSQL, gehostet in
   Deutschland/EU (Schulträger-Rechenzentrum, Hetzner, IONOS, dataport o. ä.).
   `ServerQuelle` implementieren, die Store-Aktionen auf Endpunkte legen:
   `POST /rueckmeldungen`, `POST /verfahren`, `POST /verfahren/:id/abschluss`,
   `PATCH /schueler/:id`.
2. **Anmeldung.** Kein Zugriff ohne angemeldetes Konto. Session-Cookie,
   `HttpOnly`, `Secure`, `SameSite=Lax`, kurze Laufzeit, Abmeldung möglich.
3. **Rechte serverseitig.** Die Matrix aus `identitaet.js` muss im Server
   gelten. Prüfungen im Browser sind Komfort, keine Sicherheit: eine Lehrkraft
   darf per API nur ihre Lerngruppen lesen.
4. **Protokollierung** aller schreibenden Zugriffe inklusive Konto und Zeit
   (im Prototyp bereits als Ereignisliste vorhanden).
5. **Export und Löschung** je Schüler und je Schuljahr, damit Auskunfts- und
   Löschansprüche erfüllbar sind.
6. **Verzeichnis von Verarbeitungstätigkeiten, Datenschutz-Folgenabschätzung
   und Freigabe** durch Schulleitung und behördliche Datenschutzbeauftragte vor
   dem ersten echten Datensatz. Personenbezogene Daten Minderjähriger,
   Verhaltensbewertungen: das ist nicht nebenbei zu klären.
7. **Betrieb**: verschlüsselte Backups, Wiederherstellung geübt, TLS,
   Zugriff auf die Datenbank nur über den Anwendungsserver.

## 5. Datensparsamkeit

Die App speichert bewusst nur, was sie braucht: Vorname, Nachname, Level,
Lerngruppen, Verfahren mit Ziel und Frist, Rückmeldungen. **Kein** Geburtsdatum,
keine Adresse, keine Noten, keine Fehlzeiten, keine Freitextprofile. Bemerkungen
sind optional und sollten knapp und sachlich bleiben – sie sind Teil der
Schülerakte, sobald die App produktiv läuft.

## 6. QR-Codes

Festlegungen, die im Prototyp bereits gelten (siehe `js/qr.js`):

* Jeder Schüler hat ein zufälliges, dauerhaftes Token (16 Byte).
* Der QR-Code enthält **nur** eine URL mit diesem Token:
  `https://lernerlevel.<schule>.de/student/<token>` – kein Name, kein Level,
  kein Floß-/Brückenstatus, keine Klasse.
* Das Token ändert sich nie. Ein gedruckter Code bleibt nach Level- oder
  Statuswechsel gültig.
* Die Route ist geschützt: Scannen → Anmeldung/Berechtigung prüfen → Profil →
  Rückmeldung. Der Code ist ein Wegweiser, kein Schlüssel. Im Prototyp lässt
  sich das über `#/s/<token>` bereits durchspielen, inklusive Abweisung, wenn
  das Konto den Schüler nicht sehen darf.
* Offen bleibt die Grafik: ein QR-Encoder gehört als geprüfte Bibliothek in die
  Anwendung, nicht als selbstgeschriebene Näherung. `rendererSetzen()` ist die
  vorgesehene Einhängestelle.
* Falls ein Code doch einmal kompromittiert wird: neues Token erzeugen, alten
  Code ungültig – das Datenmodell erlaubt es, der Ablauf ist noch zu ergänzen.

## 7. IServ

Unsere Schule nutzt IServ. Ob und wie sich Login, Benutzer-, Lehrkräfte- und
Lerngruppendaten anbinden lassen, ist **ohne Zugangsdaten und API-Dokumentation
der eigenen Instanz nicht seriös zu beantworten** – deshalb ist hier bewusst
keine erfundene Schnittstelle implementiert. Vorbereitet ist die Abstraktion:

* `identitaet.js` definiert das Anbieter-Interface (`anmelden`, `abmelden`,
  `benutzer`). `LokalerAnbieter` ist der Prototyp-Ersatz, `IServAnbieter` die
  leere, dokumentierte Einhängestelle.
* Ein Benutzer besteht aus `id`, `name`, `rolle`, `gruppen[]` – mehr braucht
  die App nicht. Eine Anbindung muss also nur diese vier Felder liefern.

Zu klären mit dem IServ-Administrator, bevor irgendetwas gebaut wird:

1. Steht ein OpenID-Connect-/OAuth2-Anbieter bereit (Issuer, Client-ID,
   Redirect-URI, Scopes)? Alternativ LDAP im Schulnetz?
2. Welche Gruppen liefert IServ, und wie werden sie auf unsere Lerngruppen
   abgebildet (Namenskonvention, Gruppen-IDs)?
3. Woran wird die Rolle Klassenleitung erkannt?
4. Dürfen Schülerstammdaten aus IServ übernommen werden, oder werden sie in der
   App gepflegt? (Übernahme spart Arbeit, erzeugt aber eine weitere
   Datenverarbeitung, die zu dokumentieren ist.)
5. Was passiert bei Schuljahreswechsel und Klassenwechsel?

Bis das geklärt ist, bleibt die App eigenständig: Konten und Lerngruppen werden
in der Verwaltung gepflegt. Eine spätere Umstellung betrifft nur
`identitaet.js` und den Anmeldeweg.

## 8. Bewusst offen

* Kein Login im Prototyp – ein nachgebautes Anmeldefenster ohne Server würde
  Sicherheit vortäuschen.
* Keine QR-Grafik (siehe oben).
* Keine Mehrgeräte-Synchronisierung: ohne Server gibt es nichts zu
  synchronisieren. Der JSON-Export ist der Umzugsweg.
* Keine Benachrichtigungen und keine E-Mail an Eltern – erst nach der
  datenschutzrechtlichen Klärung sinnvoll zu planen.
