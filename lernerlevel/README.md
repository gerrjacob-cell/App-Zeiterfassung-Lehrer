# Lernerlevel Manager

Web-App für die Lernerlevel unserer Schule: Level 1–4, Floßverfahren (drohender
Abstieg) und Brückenverfahren (möglicher Aufstieg). Sie ersetzt die physischen
Karten – zunächst als voll bedienbarer Prototyp mit **ausschließlich fiktiven
Daten**.

Optimiert für iPads im Unterricht, bedienbar auch auf dem Handy. Geprüft auf
iPhone SE, iPhone 15 (hoch und quer), iPad mini, iPad Air (hoch und quer) und
im Split View: keine Tippfläche unter 44 px, kein Querscrollen, die Hauptaktion
im Formular immer sichtbar. Die häufigste Handlung braucht zwei Tipps:

> Lerngruppe öffnen → Schüler in der Liste finden → 🟢 / 🟡 / 🔴 antippen

## Starten

Keine Installation, kein Build-Schritt. Die App besteht aus statischen Dateien.

```bash
cd lernerlevel
python3 -m http.server 8123
# danach im Browser: http://localhost:8123
```

Alternativ auf jeden Webspace oder GitHub Pages legen und den Ordner aufrufen.
Auf dem iPad über Safari → Teilen → „Zum Home-Bildschirm“ ablegen.

Wie eine Klassenliste aussehen kann, zeigt
[`beispiel-klassenliste.csv`](beispiel-klassenliste.csv). Nötig ist dieses
Format nicht: der Import erkennt Semikolon, Komma und Tabulator, kommt mit und
ohne Kopfzeile zurecht und liest auch eine schlichte Namensspalte.

Für das Kollegium liegt eine Kurzanleitung bei, als Seite und als Handout:

* **[`anleitung.html`](anleitung.html)** – im Browser lesbar, in der App unten
  auf der Startseite verlinkt, über den Knopf „Anleitung drucken“ druckbar.
* **[`anleitung.pdf`](anleitung.pdf)** – 9 Seiten A4 mit Bildschirmfotos,
  Seitenzahlen und Spickzettel, zum Weitergeben und Ausdrucken.

Beides hat dieselbe Quelle. Nach einer Änderung an `anleitung.html`:

```bash
npm install playwright          # einmalig
python3 -m http.server 8123     # für die Bildschirmfotos
node werkzeug/bilder-machen.mjs # Bilder in bilder/ neu erzeugen
node werkzeug/pdf-bauen.mjs     # anleitung.pdf neu setzen
```

## Auf dem Handy oder iPad testen

Die App ist eine Sammlung statischer Dateien, es gibt nichts zu installieren.
Drei Wege, je nachdem wie dauerhaft es sein soll.

**Über GitHub Pages (dauerhafter Link, auch für Kollegen):**

1. Im Repository: *Settings* → *Pages*
2. Source: *Deploy from a branch*, Branch `claude/lernerlevel-manager-app-ja7ebq`,
   Ordner `/ (root)`, speichern
3. Nach ein bis zwei Minuten erreichbar unter
   `https://gerrjacob-cell.github.io/App-Zeiterfassung-Lehrer/lernerlevel/`
4. Auf dem Gerät im Browser öffnen → Teilen → *Zum Home-Bildschirm*

Danach liegt die App mit eigenem Symbol auf dem Startbildschirm, startet ohne
Browserleiste und läuft auch ohne Netz.

**Im eigenen WLAN, ohne etwas zu veröffentlichen:** auf dem Rechner
`python3 -m http.server 8123` im Ordner `lernerlevel/` starten und am Handy
`http://<IP-des-Rechners>:8123` aufrufen. Praktisch zum schnellen
Ausprobieren, aber ohne HTTPS und nur solange der Rechner läuft.

**Ohne GitHub:** den Ordner `lernerlevel/` bei Netlify Drop auf die Seite
ziehen. Sofort online mit HTTPS, kein Konto nötig.

## Was funktioniert

| Bereich | Stand |
| --- | --- |
| Startseite mit Lerngruppen-Kacheln (Schüler, Brücken, Flöße, fällige Entscheidungen) | ✅ |
| Dashboard je Lerngruppe mit Zusammenfassung und allen Schülern | ✅ |
| 🟢 / 🟡 / 🔴 direkt aus der Klassenübersicht, mit Sofortquittung und „Rückgängig“ | ✅ |
| Eine Stimme je Lehrkraft und Verfahren, ein zweiter Tipp ersetzt die eigene | ✅ |
| Filter (Alle / Normal / 🌉 / 🛟 / ⚠️), Levelfilter, Namenssuche | ✅ |
| Schülerdetail mit Ziel, Verlauf, großen Rückmeldeknöpfen, optionaler Bemerkung | ✅ |
| Floß und Brücke starten (Kategorien, Zielvorschläge, Beginn, Frist) | ✅ |
| Automatischer Status „⚠️ Entscheidung fällig“ ab der Frist | ✅ |
| Verfahren abschließen: Aufstieg / beibehalten bzw. gehalten / Abstieg, mit Levelwechsel | ✅ |
| Historie je Schüler, append-only, Korrekturen als eigener Eintrag | ✅ |
| Klassenstatistik (Levelverteilung, laufende Verfahren) | ✅ |
| Verwaltung: Schüler und Lerngruppen anlegen, bearbeiten, archivieren, zuordnen | ✅ |
| Klassenlisten importieren (einfügen oder CSV), mit Vorschau und Dublettenabgleich | ✅ |
| Rollen Lehrkraft / Klassenleitung mit unterschiedlichen Rechten | ✅ |
| Protokoll aller Änderungen | ✅ |
| Datenexport (JSON), Zurücksetzen, Löschen | ✅ |
| Dauerhafte, zufällige Schüler-IDs und geschützte QR-Route | ✅ (Grafik folgt) |
| Installierbar auf dem Startbildschirm, läuft offline | ✅ |
| Anmeldung, Server, Datenbank, IServ | ⬜ siehe [ARCHITEKTUR.md](ARCHITEKTUR.md) |

## Daten

Der Prototyp speichert **ausschließlich lokal** im `localStorage` des Browsers,
in dem er geöffnet wird. Es gibt keinen Server, keine Übertragung, keine Konten.
Alle enthaltenen Namen sind erfunden. Beim ersten Start wird der Demostand
erzeugt: 4 Lerngruppen, 46 Schüler, davon 15 in FLEX mit 2 laufenden Flößen,
3 laufenden Brücken, einer fälligen Entscheidung und vorhandenen Rückmeldungen.

Zum Aufräumen: Verwaltung → Daten → „Alle Daten löschen“.

## Rollen im Prototyp

Oben rechts lässt sich das Konto wechseln – das ersetzt die spätere Anmeldung:

* **K. Ahrens** (Lehrkraft, FLEX + 7a): sieht nur die eigenen Lerngruppen, gibt
  Rückmeldungen, startet Verfahren.
* **M. Balzer** (Lehrkraft, 7b + 8a): dito für die anderen Gruppen.
* **S. Cordes** (Klassenleitung): zusätzlich Verwaltung, Levelwechsel,
  Verfahrensabschluss, Korrekturen, Protokoll.

## Aufbau

```
lernerlevel/
  index.html
  css/app.css
  js/
    app.js          Router, Kopfzeile, Zeichnen
    model.js        Fachlogik: Level, Verfahren, Status, Bilanz
    store.js        Zustand, Selektoren, Aktionen
    quelle.js       Datenquelle (lokal | später Server)
    identitaet.js   Rollen, Rechte, Anbieter-Schnittstelle (später IServ)
    ereignis.js     Historie (append-only)
    qr.js           QR-Route und -Regeln
    demodaten.js    fiktiver Startbestand
    ui.js           DOM-Helfer, Dialoge, Hinweise
    views/          Lerngruppen, Dashboard, Schüler, Verfahren, Verwaltung, Protokoll
```

Kein Framework, keine Abhängigkeiten, kein Build – damit die App auch in
einigen Jahren noch wartbar und auf einem Schulserver lauffähig ist.

Technische Details, Datenschutz und der Weg in den Produktivbetrieb:
[ARCHITEKTUR.md](ARCHITEKTUR.md).
