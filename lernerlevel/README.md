# Lernerlevel Manager

Web-App für die Lernerlevel unserer Schule: Level 1–4, Floßverfahren (drohender
Abstieg) und Brückenverfahren (möglicher Aufstieg). Sie ersetzt die physischen
Karten – zunächst als voll bedienbarer Prototyp mit **ausschließlich fiktiven
Daten**.

Optimiert für iPads im Unterricht. Die häufigste Handlung braucht zwei Tipps:

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

Für das Kollegium liegt eine Kurzanleitung bei: **[`anleitung.html`](anleitung.html)**
(in der App unten auf der Startseite verlinkt, im Browser lesbar und über den
Knopf „Anleitung drucken“ als Handout druckbar).

## Was funktioniert

| Bereich | Stand |
| --- | --- |
| Startseite mit Lerngruppen-Kacheln (Schüler, Brücken, Flöße, fällige Entscheidungen) | ✅ |
| Dashboard je Lerngruppe mit Zusammenfassung und allen Schülern | ✅ |
| 🟢 / 🟡 / 🔴 direkt aus der Klassenübersicht, mit Sofortquittung und „Rückgängig“ | ✅ |
| Filter (Alle / Normal / 🌉 / 🛟 / ⚠️), Levelfilter, Namenssuche | ✅ |
| Schülerdetail mit Ziel, Verlauf, großen Rückmeldeknöpfen, optionaler Bemerkung | ✅ |
| Floß und Brücke starten (Kategorien, Zielvorschläge, Beginn, Frist) | ✅ |
| Automatischer Status „⚠️ Entscheidung fällig“ ab der Frist | ✅ |
| Verfahren abschließen: Aufstieg / beibehalten bzw. gehalten / Abstieg, mit Levelwechsel | ✅ |
| Historie je Schüler, append-only, Korrekturen als eigener Eintrag | ✅ |
| Klassenstatistik (Levelverteilung, laufende Verfahren) | ✅ |
| Verwaltung: Schüler und Lerngruppen anlegen, bearbeiten, archivieren, zuordnen | ✅ |
| Rollen Lehrkraft / Klassenleitung mit unterschiedlichen Rechten | ✅ |
| Protokoll aller Änderungen | ✅ |
| Datenexport (JSON), Zurücksetzen, Löschen | ✅ |
| Dauerhafte, zufällige Schüler-IDs und geschützte QR-Route | ✅ (Grafik folgt) |
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
