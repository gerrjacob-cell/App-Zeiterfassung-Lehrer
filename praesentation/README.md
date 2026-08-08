# Präsentation

**[Lehrerzeit-Vorstellung.pptx](Lehrerzeit-Vorstellung.pptx)** – 16 Folien zur
Vorstellung der App in Dienstversammlung, Personalratssitzung oder
Schulkonferenz. Jede Folie hat Vortragsnotizen, die auch die Rückfragen
vorwegnehmen, die erfahrungsgemäß kommen.

Vortragsdauer etwa 15 Minuten plus Fragerunde.

## Aufbau

| # | Folie | Zweck |
|---|---|---|
| 1 | Titel | Einstieg |
| 2 | Das Problem | Warum überhaupt |
| 3 | Warum jetzt | GEW-Vorbild, Abgrenzung |
| 4 | Was die App ist | vier Kernpunkte |
| 5 | Ferien sind kein Urlaub | das Rechenmodell |
| 6 | Zwölf Wochen, sechs Wochen | Diagramm zur Zuspitzung |
| 7 | Drei Wege zu erfassen | gegen die Aufwandssorge |
| 8 | Neun Kategorien | Übersicht |
| 9 | Was herauskommt | Beispielauswertung, Exporte |
| 10 | Teilzeit | drei Eingabewege, Rechtslage |
| 11 | Anrechnungsstunden | Entlastung gegen Aufwand |
| 12 | Wer sieht meine Daten? | Datenschutz |
| 13 | Aus Einzelfällen ein Befund | anonyme Gesamtauswertung |
| 14 | Was wir davon haben | Nutzen |
| 15 | So fangen wir an | vier Schritte |
| 16 | Was offen bleibt | Grenzen, Fragerunde |

## Anpassen

Vor dem Vortrag anzupassen sind vor allem Folie 15 (**wo finden Kolleginnen und
Kollegen den Link?** – ein QR-Code an der Wand senkt die Hürde erheblich) und
Folie 16 (Kontakt). Die Beispielzahlen auf Folie 9 und 11 sind plausibel
gewählt, aber erfunden – das gehört im Vortrag gesagt.

## Neu erzeugen

Die Datei wird aus `erstelle-praesentation.js` erzeugt. Das ist ein Werkzeug,
kein Teil der App – diese kommt weiterhin ohne Abhängigkeiten und ohne
Build-Schritt aus.

```bash
npm install pptxgenjs
node erstelle-praesentation.js
```

Der Generator prüft sich selbst: Passt ein Text nicht in seine Karte, bricht er
ab und nennt die nötige Höhe, statt eine Folie mit überlaufendem Text
auszuliefern.
