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

> **Zweite App in diesem Repository:** der
> [**Lernerlevel Manager**](lernerlevel/) im Ordner `lernerlevel/` – Level 1–4,
> Floß- und Brückenverfahren für Lerngruppen, für den Einsatz auf iPads.
> Eigenständig, gleiche Technik (statische Dateien, kein Build), derzeit
> Prototyp mit fiktiven Daten.

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

### Teilzeit

Teilzeit wird je nach Statusgruppe unterschiedlich bewilligt. Die App nimmt alle
drei üblichen Formen entgegen, damit niemand seinen Bescheid umrechnen muss:
als **Zahl der Unterrichtsstunden** (21 von 27), als **Bruchteil in Prozent**
(3/4 = 75 %) oder als **Wochenstunden der Arbeitszeit** (30,75 von 41, üblich
nach TV-L). Alle drei führen zum selben Faktor.

Bei Teilzeit weist die App auf zwei Punkte hin, die regelmäßig strittig sind:
dass Teilzeit auch für Konferenzen, Aufsichten und Elterngespräche gilt – und
dass Alters- und Schwerbehindertenermäßigung unterhalb von drei Vierteln nur
noch anteilig gewährt werden.

### Ermäßigungs- und Anrechnungsstunden

Funktionsaufgaben wie Sicherheitsbeauftragung, Fachkonferenzleitung, Personalrat
oder Medienbetreuung werden mit Stunden entlastet. Diese Stunden lassen sich
einzeln eintragen – und hier liegt eine bewusste Designentscheidung:

> **Ermäßigungsstunden senken die Unterrichtsverpflichtung, nicht die Arbeitszeit.**

Wer wegen einer Funktionsaufgabe zwei Stunden weniger unterrichtet, arbeitet
keine Minute weniger. Würde man Ermäßigungen in den Beschäftigungsumfang
einrechnen, käme ein zu niedriges Arbeitszeit-Soll heraus – und die
Dokumentation würde ausgerechnet die Mehrarbeit verschleiern, die sie sichtbar
machen soll.

Stattdessen rechnet die App um, was eine Anrechnungsstunde an Zeit wert ist
(41 h ÷ 27 Pflichtstunden = **1:31 h pro Woche**), und stellt in der Auswertung
**gewährte Entlastung und tatsächlich erfassten Aufwand gegenüber**. Aus „die
eine Stunde für die Sicherheitsbeauftragung reicht hinten und vorne nicht" wird
so eine Zahl, mit der man in ein Gespräch gehen kann.

Ausführlich: [RECHTSGRUNDLAGEN.md](RECHTSGRUNDLAGEN.md).

---

## Vor dem Einsatz im Kollegium prüfen

Drei Dinge sollten einmalig geprüft und gegebenenfalls angepasst werden – alle
sind in der App editierbar, ohne Code anzufassen:

1. **Pflichtstundenzahl.** Voreingestellt ist 27 für die Gemeinschaftsschule –
   auch mit gymnasialer Oberstufe, denn der Unterschied entsteht erst durch die
   Ermäßigung für den Oberstufeneinsatz. Grundlage ist die KMK-Übersicht mit
   Stand 2019; bitte gegen die aktuelle Fassung der *Landesverordnung über die
   regelmäßige Pflichtstundenzahl der Lehrkräfte* abgleichen. Die Stundenzahl je
   Funktionsaufgabe steht ohnehin im Bescheid der Schulleitung – diese Vorlagen
   starten mit einer Stunde.
2. **Wöchentliche Arbeitszeit.** Voreingestellt sind 41 Stunden – in
   Schleswig-Holstein gilt dieser Wert für verbeamtete und tarifbeschäftigte
   Lehrkräfte gleichermaßen. Bei anerkannter Schwerbehinderung sind es 40.
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

1. **Repository auf öffentlich stellen** – Einstellungen → ganz unten
   *Danger Zone* → *Change visibility*. GitHub Pages ist für private
   Repositories nur in kostenpflichtigen Tarifen verfügbar; mit einem
   Free-Konto bleibt die Seite sonst auf 404. Bedenkenlos möglich, weil im
   Repository nur Programmcode liegt – die Arbeitszeitdaten entstehen erst im
   Browser der Lehrkraft und werden nie hochgeladen.
2. Einstellungen → *Pages* → Source: *Deploy from a branch*
3. Branch wählen, Ordner `/ (root)`, speichern
4. Nach ein bis zwei Minuten ist die App unter
   `https://<benutzer>.github.io/<repo>/` erreichbar

Die App ist darauf ausgelegt, in einem Unterverzeichnis zu laufen: Alle Pfade
sind relativ, der Service Worker registriert sich auf den Unterpfad, und das
Manifest nutzt `start_url: "."`.

**Auf einem eigenen Webspace oder Schulserver:** alle Dateien in ein Verzeichnis
hochladen, fertig. Zwingend ist **HTTPS** – ohne verschlüsselte Verbindung
verweigern Browser den Service Worker, und damit entfällt der Offline-Betrieb
und die Installation auf dem Startbildschirm. Eine Ausnahme gilt nur für
`localhost` beim Ausprobieren.

**Andere kostenlose Möglichkeiten:** Netlify Drop (Ordner auf die Website
ziehen, sofort online, auch ohne Konto) oder Cloudflare Pages. Beide liefern
HTTPS automatisch.

**Lokal ausprobieren:**

```bash
python3 -m http.server 8000
# http://localhost:8000
```

(Direktes Öffnen der `index.html` über `file://` funktioniert nicht, weil
ES-Module dabei blockiert werden.)

**Auf dem Telefon installieren:** Es gibt sie bewusst nicht im App Store oder
bei Google Play – sie wird direkt von der Adresse installiert: Seite im Browser
öffnen, dann *Teilen → Zum Home-Bildschirm* (iPhone) bzw. *Menü → App
installieren* (Android). Danach hat sie ein eigenes Symbol, startet im Vollbild
und läuft offline.

Für die Stores wäre ein Entwicklerkonto nötig (Apple 99 US-Dollar im Jahr,
Google einmalig 25), dazu ein Verpackungsschritt und ein Freigabeverfahren pro
Aktualisierung – für eine App, die ohnehin nur im eigenen Kollegium läuft, wäre
das viel Aufwand ohne Gegenwert. Der einzige praktische Unterschied: Ein Link
muss verteilt werden, gefunden wird die App nicht von allein.

### Android und iPhone

Die App ist für das Telefon gebaut, nicht nur dafür verkleinert:

- **Eigenes Diagramm-Layout für schmale Displays** – Kategorienamen stehen über
  dem Balken statt daneben, damit nichts abgeschnitten wird; beim Drehen des
  Geräts wird neu gezeichnet.
- **Touch-Ziele durchgehend mindestens 44 px**, auch in der dichten Wochenmatrix.
- **Dezimaltastatur** beim Nachtragen, Zeitfelder mit nativen Datums- und
  Uhrzeitwählern.
- **Sticky statt fixierter Leisten**: Die Navigation belegt echten Platz und kann
  den Inhalt nicht verdecken; Safe-Area-Ränder für Geräte mit Notch und
  Home-Indikator werden berücksichtigt.
- **Dark Mode** nach Systemeinstellung, umschaltbar.
- **iPhone-Besonderheit**: Safari löscht Daten von Websites nach sieben Tagen
  ohne Nutzung. Die App weist beim ersten Start darauf hin, fordert dauerhaften
  Speicher an und zeigt in den Einstellungen, ob der Browser ihn gewährt hat.
- **Mitteilungen** funktionieren auf iOS nur bei installierter App; die
  Erinnerung ist rein lokal und wird bei fehlender Erlaubnis sauber deaktiviert.

Geprüft mit Chromium in Telefon- und Desktop-Auflösung (iPhone-13-Profil,
Touch-Emulation). Ein Test in echtem Safari auf einem iPhone steht aus – wer
eines zur Hand hat, sollte vor dem Rollout einmal durchklicken.

---

## Aufbau

```
index.html              Haupt-App
leitfaden.html          Anleitung für das Kollegium, druckbar
auswertung.html         Werkzeug zur Zusammenführung anonymer Kennzahlen
manifest.webmanifest    PWA-Manifest
sw.js                   Service Worker (Offline-Betrieb)
css/app.css             gesamtes Styling, hell und dunkel
icons/                  App-Symbole
js/
  app.js                Einstieg, Routing, Ersteinrichtung
  model.js              Kategorien, Voreinstellungen, Pflichtstunden SH
  kalender.js           Feiertage je Bundesland (berechnet), Ferien (Datensatz)
  soll.js               Soll-Zeit-Berechnung, Auswertung, Zeitformate
  store.js              Persistenz im localStorage, Backup
  charts.js             Diagramme als Inline-SVG
  export.js             xlsx-Erzeugung, CSV, anonyme Kennzahlen
  erinnerung.js         lokale Abenderinnerung
  kollegium.js          Logik von auswertung.html
  geraet.js             dauerhafter Speicher, iOS-Hinweis
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
| Teilzeit | Deputat | drei Eingabewege, Hinweise zur Rechtslage |
| Ermäßigungsstunden | – | einzeln verwaltet, Entlastung gegen Aufwand |
| Offline | Web-App | vollständige PWA, installierbar |

---

## Material für das Kollegium

- **[Leitfaden](leitfaden.html)** – Anleitung für Lehrkräfte: Einstieg in fünf
  Schritten, die drei Erfassungswege, Kategorien mit Beispielen, die Ferienfrage,
  Teilzeit, Ermäßigungsstunden, häufige Fragen. In der App unter *Mehr → Hilfe*
  erreichbar und über den Druckdialog als PDF ausgebbar.
- **[Präsentation](praesentation/Lehrerzeit-Vorstellung.pptx)** – 16 Folien zur
  Vorstellung in Dienstversammlung, Personalratssitzung oder Schulkonferenz,
  mit Notizen für den Vortrag.

## Einsatz in anderen Bundesländern

Die App ist für Schleswig-Holstein gebaut, funktioniert aber anderswo. Unter
*Mehr → Person und Schulform* wird das Bundesland gewählt; das setzt die
wöchentliche Arbeitszeit und stellt die gesetzlichen Feiertage des Landes
zusammen.

Beides ist wichtiger, als es klingt. Die **Wochenarbeitszeit** bestimmt die
Soll-Arbeitszeit direkt: Zwischen 41 und 40 Stunden liegen **44:48 Stunden im
Schuljahr**. Die Pflichtstundenzahl verändert das Arbeitszeit-Soll dagegen gar
nicht – sie bestimmt die Unterrichtsverpflichtung und den Wert einer
Anrechnungsstunde. Wer also von Schleswig-Holstein nach Niedersachsen wechselt
und nur die Pflichtstunden von 27 auf 24,5 ändert, hat noch nichts am Soll
geändert.

Nicht mitgeliefert werden Ferientermine und Pflichtstundenzahlen anderer Länder.
Die Ferien lassen sich in den Einstellungen eintragen, die Pflichtstunden stehen
im eigenen Bescheid. Bewusst keine geratenen Werte: Eine falsche Voreinstellung
wäre schlimmer als gar keine, weil sie niemandem auffällt.

Details und die Ländertabelle: [RECHTSGRUNDLAGEN.md](RECHTSGRUNDLAGEN.md).

## Grenzen

- Die Zahlen sind **Selbstaufschreibung**. Sie sind so belastbar, wie sorgfältig
  erfasst wurde – Lücken machen den Saldo eher zu klein als zu groß. Die
  Auswertung weist ausdrücklich darauf hin, an wie vielen Arbeitstagen nichts
  erfasst ist.
- Die Daten liegen im `localStorage` des Browsers. Wer den Browser wechselt, das
  Gerät tauscht oder die Browserdaten löscht, verliert sie **ohne Backup**. Der
  Backup-Export sollte zur Gewohnheit werden – etwa zu jedem Halbjahr.
- **Auf dem iPhone gilt das besonders:** Safari löscht Daten von Websites, die
  sieben Tage lang nicht geöffnet wurden – in den Ferien schnell erreicht. Wird
  die App zum Startbildschirm hinzugefügt, gilt diese Löschung nicht. Die App
  weist beim ersten Start darauf hin und fordert zusätzlich dauerhaften Speicher
  an; in den Einstellungen steht, ob der Browser ihn gewährt hat.
- Die Erinnerung ist rein lokal und funktioniert nur, solange die App geöffnet
  ist oder im Hintergrund läuft. Echte Push-Mitteilungen bräuchten einen Server –
  und damit genau das, was hier bewusst nicht existiert.
- Diese Datei ist keine Rechtsberatung. Ob und wie sich aus dokumentierter
  Mehrarbeit Ansprüche ableiten lassen, ist eine Frage für Personalrat,
  Gewerkschaft oder Rechtsberatung.

## Lizenz

MIT – siehe [LICENSE](LICENSE). Weitergabe an andere Schulen ausdrücklich
erwünscht.
