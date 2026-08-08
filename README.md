# Lehrerzeit

Arbeitszeitdokumentation für Lehrkräfte an einer Gemeinschaftsschule in
Schleswig-Holstein. Web-App, läuft ohne Installation im Browser, funktioniert
offline und speichert **ausschließlich auf dem Gerät der Lehrkraft** – kein
Server, kein Konto, keine Übertragung an Dritte.

Die App orientiert sich an der „Lehrzeit-App“, die die GEW Hessen zum Schuljahr
2026/2027 für ihre Mitglieder bereitstellt: dieselbe Grundidee (Arbeitszeit
sichtbar und belegbar machen), dieselbe Kategorien-Systematik, dieselbe
Datenhaltung beim Nutzenden. Sie ist unabhängig davon entstanden, an
schleswig-holsteinisches Recht angepasst und in einigen Punkten erweitert.

---

## Was die App tut

**Erfassen – auf drei Wegen, weil im Schulalltag nicht jeder Weg passt:**

| Weg | Wofür |
|---|---|
| **Stundenplan mit einem Klick** | Der hinterlegte Unterricht eines Tages wird mit einem Tipp gebucht. Der größte Zeitsparhebel im Alltag. |
| **Timer** | Sekundengenau für Tätigkeiten, die man ohnehin am Rechner erledigt – Korrekturen, Elternmails, Vorbereitung. Läuft weiter, auch wenn die App geschlossen wird. |
| **Nachtragen** | Schnellknöpfe (+15/+30/+45/+60/+90 min) in der Tagesansicht und eine Wochenmatrix, in der sich eine ganze Woche in einer Minute nachpflegen lässt. Realistisch stoppt niemand jede Korrekturstunde mit. |

**Kategorien** (nach der Systematik, die die Rechtsprechung zur
Lehrkraft-Arbeitszeit zugrunde legt, ergänzt um zwei Positionen, die an
Gemeinschaftsschulen ins Gewicht fallen):

Unterricht · Vor- und Nachbereitung · Korrekturen und Leistungsbewertung ·
Kommunikation · Konferenzen und Arbeitsorganisation · **Aufsicht und
Vertretungsbereitschaft** · Fort- und Weiterbildung · Fahrten und
Schulveranstaltungen · **Funktions- und Sonderaufgaben**

**Auswerten:** Kennzahlen für jeden Zeitraum (Woche, Monat, Schuljahr bis heute,
ganzes Schuljahr, frei wählbar), Verteilung auf die Kategorien, Wochenverlauf
gegen die Soll-Arbeitszeit, Fortschritt gegen das Jahres-Soll.

**Exportieren:** Excel-Mappe (`.xlsx`, fünf Blätter), CSV, druckfertiger
PDF-Bericht mit Unterschriftszeile – verwendbar als Anlage zu einer
Überlastungsanzeige oder gegenüber der Dienststelle.

**Gemeinsam auswerten – freiwillig und anonym:** Wer möchte, exportiert eine
Kennzahlen-Datei ohne Namen, ohne Notizen und ohne Tagesdaten. Das separate
Werkzeug `auswertung.html` führt beliebig viele solcher Dateien zu einem
Gesamtbild zusammen – für Personalrat, Schulkonferenz oder eine gemeinsame
Überlastungsanzeige.

---

## Wie die Soll-Arbeitszeit berechnet wird

**Jahresarbeitszeitmodell.** Das ist die entscheidende Designentscheidung und
zugleich der inhaltliche Kern:

```
Tages-Soll = wöchentliche Arbeitszeit ÷ 5 × Beschäftigungsumfang
           = 41 h ÷ 5 = 8:12 h bei Vollzeit

Beschäftigungsumfang = eigene Pflichtstunden ÷ Pflichtstunden bei Vollzeit
```

Soll-Arbeitszeit besteht an **jedem Werktag**, der weder gesetzlicher Feiertag
noch Erholungsurlaub noch Krankheitstag ist – **auch in den Schulferien**.

Denn: Ferien sind kein Urlaub. Der Urlaubsanspruch beträgt 30 Werktage im Jahr;
die übrigen unterrichtsfreien Tage sind reguläre Arbeitstage. Für das Schuljahr
2026/2027 ergibt das bei Vollzeit rund **1837 Stunden an 224 Arbeitstagen,
darunter 30 Tage in der unterrichtsfreien Zeit**. Genau diese Rechnung macht
sichtbar, wie viel Arbeit tatsächlich in die Ferien verlagert wird.

Die App verteilt den Urlaub auf Wunsch automatisch (Sommerferien zuerst); jeder
einzelne Tag lässt sich in der Tagesansicht anders setzen.

**Altersermäßigung und Anrechnungsstunden** mindern die Unterrichts­verpflichtung,
nicht die Arbeitszeit. Sie werden deshalb nur nachrichtlich geführt und
verändern das Soll bewusst nicht.

---

## Vor dem Einsatz im Kollegium prüfen

Drei Dinge sollten einmalig geprüft und gegebenenfalls angepasst werden – alle
sind in der App editierbar, ohne Code anzufassen:

1. **Pflichtstundenzahl.** Voreingestellt ist 27 für die Gemeinschaftsschule
   (Sek I) und 25,5 mit Oberstufe. Bitte gegen die aktuelle Fassung der
   *Landesverordnung über die regelmäßige Pflichtstundenzahl der Lehrkräfte*
   abgleichen – die Werte in `js/model.js` sind Startwerte, keine Rechtsauskunft.
2. **Wöchentliche Arbeitszeit.** Voreingestellt sind 41 Stunden nach der
   Arbeitszeitverordnung für Beamtinnen und Beamte in Schleswig-Holstein.
   Tarifbeschäftigte nach TV-L tragen ihren eigenen Wert ein.
3. **Ferientermine.** Hinterlegt sind die Termine für das Festland,
   Schuljahre 2026/2027 und 2027/2028. Zu Schuljahresbeginn gegen die amtliche
   Bekanntmachung prüfen. Auf Sylt, Föhr, Amrum, Helgoland und den Halligen
   gelten abweichende Termine.

Und eine vierte, nicht-technische Empfehlung: **den Personalrat früh
einbeziehen.** Die individuelle Erfassung ist reine Privatsache und
mitbestimmungsfrei – sobald aber eine Gesamtauswertung des Kollegiums entsteht
und die Schule verlässt, ist das eine andere Sache. Freiwilligkeit und
Anonymität sind in der App technisch verankert; die politische Absprache
ersetzt sie nicht.

---

## Betrieb

Die App besteht aus statischen Dateien. Kein Build-Schritt, keine
Abhängigkeiten, kein npm.

**Auf GitHub Pages veröffentlichen:**

1. Repository-Einstellungen → *Pages* → Source: *Deploy from a branch*
2. Branch wählen, Ordner `/ (root)`, speichern
3. Die App ist unter `https://<benutzer>.github.io/<repo>/` erreichbar

**Auf einem eigenen Webspace:** alle Dateien in ein Verzeichnis hochladen. Es
wird nur HTTPS benötigt – ohne HTTPS funktionieren Service Worker und damit der
Offline-Betrieb nicht.

**Lokal ausprobieren:**

```bash
python3 -m http.server 8000
# http://localhost:8000
```

(Direktes Öffnen der `index.html` über `file://` funktioniert nicht, weil
ES-Module dabei blockiert werden.)

**Auf dem Telefon installieren:** Seite im Browser öffnen → „Zum Startbildschirm
hinzufügen“. Danach startet die App im Vollbild und läuft offline.

---

## Aufbau

```
index.html              Haupt-App
auswertung.html         Werkzeug zur Zusammenführung anonymer Kennzahlen
manifest.webmanifest    PWA-Manifest
sw.js                   Service Worker (Offline-Betrieb)
css/app.css             gesamtes Styling, hell und dunkel
icons/                  App-Symbole
js/
  app.js                Einstieg, Routing, Ersteinrichtung
  model.js              Kategorien, Voreinstellungen, Pflichtstunden SH
  kalender-sh.js        Feiertage (berechnet) und Ferien (Datensatz)
  soll.js               Soll-Zeit-Berechnung, Auswertung, Zeitformate
  store.js              Persistenz im localStorage, Backup
  charts.js             Diagramme als Inline-SVG
  export.js             xlsx-Erzeugung, CSV, anonyme Kennzahlen
  erinnerung.js         lokale Abenderinnerung
  kollegium.js          Logik von auswertung.html
  ui.js                 DOM-Helfer, Dialoge, Hinweise
  views/                Tagesansicht, Woche, Auswertung, Stundenplan, Einstellungen
```

Die Excel-Dateien werden ohne Fremdbibliothek erzeugt: Office-Open-XML-Teile in
einem selbst geschriebenen ZIP-Container (`js/export.js`). Das hält die App frei
von Abhängigkeiten – und damit auch in einigen Jahren noch wartbar.

---

## Unterschiede zur GEW-Vorlage

| | Lehrzeit-App (GEW Hessen) | diese App |
|---|---|---|
| Zugang | nur GEW-Mitglieder | offen, für das eigene Kollegium |
| Recht | Hessen | Schleswig-Holstein (41 h, SH-Ferien und -Feiertage) |
| Stundenplan | – | hinterlegbar, Unterricht mit einem Klick buchbar |
| Nachtragen | – | Wochenmatrix, ganze Woche in einer Minute |
| Kategorien | 7 | 9 (zusätzlich Aufsicht/Vertretung, Funktionsaufgaben) |
| Export | Excel | Excel, CSV, PDF-Bericht mit Unterschriftszeile |
| Kollegium | – | freiwilliger anonymer Beitrag + Auswertungswerkzeug |
| Ferien/Feiertage | – | automatisch, editierbar |
| Offline | Web-App | vollständige PWA, installierbar |

---

## Grenzen

- Die Zahlen sind **Selbstaufschreibung**. Sie sind so belastbar, wie sorgfältig
  erfasst wurde – Lücken machen den Saldo eher zu klein als zu groß. Die
  Auswertung weist ausdrücklich darauf hin, an wie vielen Arbeitstagen nichts
  erfasst ist.
- Die Daten liegen im `localStorage` des Browsers. Wer den Browser wechselt, das
  Gerät tauscht oder die Browserdaten löscht, verliert sie **ohne Backup**. Der
  Backup-Export sollte zur Gewohnheit werden – etwa zu jedem Halbjahr.
- Die Erinnerung ist rein lokal und funktioniert nur, solange die App geöffnet
  ist oder im Hintergrund läuft. Echte Push-Mitteilungen bräuchten einen Server –
  und damit genau das, was hier bewusst nicht existiert.
- Diese Datei ist keine Rechtsberatung. Ob und wie sich aus dokumentierter
  Mehrarbeit Ansprüche ableiten lassen, ist eine Frage für Personalrat,
  Gewerkschaft oder Rechtsberatung.

## Lizenz

MIT – siehe [LICENSE](LICENSE). Weitergabe an andere Schulen ausdrücklich
erwünscht.
