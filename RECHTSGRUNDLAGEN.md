# Rechtsgrundlagen und Rechenmodell

Diese Datei sammelt, worauf die Berechnungen der App beruhen, wo die Werte
herkommen und was vor dem Einsatz geprüft werden muss.

**Wichtig vorweg:** Das ist keine Rechtsberatung. Die App bildet ein
nachvollziehbares Rechenmodell ab; welche Norm im Einzelfall gilt, entscheidet
nicht die Software. Verbindlich sind Verordnung, Erlass und der eigene
Bescheid – und in Zweifelsfragen Personalrat, GEW oder Rechtsberatung.

---

## Die drei Größen und warum sie getrennt bleiben

Der häufigste Denkfehler bei Arbeitszeiterfassung für Lehrkräfte ist, alles in
eine Zahl zu werfen. Die App führt deshalb drei Größen getrennt:

| Größe | Bestimmt | Beispiel |
|---|---|---|
| **Beschäftigungsumfang** | die **Arbeitszeit** (Soll-Stunden) | 21 von 27 Stunden = 77,8 % |
| **Unterrichtsverpflichtung** | die **Unterrichtsstunden** | 21 anteilig − 3 Ermäßigung = 18 |
| **Ermäßigungs-/Anrechnungsstunden** | nur die zweite Größe | 1 Std. Sicherheitsbeauftragung |

Daraus folgt der Satz, der in der App an mehreren Stellen steht und für die
Auswertung entscheidend ist:

> **Ermäßigungsstunden senken die Arbeitszeit nicht.**

Wer wegen einer Funktionsaufgabe zwei Stunden weniger unterrichtet, arbeitet
keine Minute weniger. Die Zeit ist für die Aufgabe vorgesehen. Würde man
Ermäßigungen in den Beschäftigungsumfang einrechnen, käme ein zu niedriges
Arbeitszeit-Soll heraus – und die Dokumentation würde ausgerechnet die
Mehrarbeit verschleiern, die sie sichtbar machen soll.

### Was eine Anrechnungsstunde an Zeit wert ist

```
Arbeitszeit je Deputatsstunde = wöchentliche Arbeitszeit ÷ Pflichtstunden Vollzeit
                              = 41 h ÷ 27 = 1:31 h
```

Eine Stunde Ermäßigung für die Sicherheitsbeauftragung entspricht also rund
**1:31 h Arbeitszeit pro Woche** – nicht 45 Minuten. Die App rechnet mit diesem
Wert und stellt ihn in der Auswertung dem tatsächlich erfassten Aufwand
gegenüber. Das macht aus dem Gefühl „die eine Stunde reicht hinten und vorne
nicht" eine Zahl, mit der man in ein Gespräch gehen kann.

---

## Soll-Arbeitszeit (Jahresarbeitszeitmodell)

```
Tages-Soll = wöchentliche Arbeitszeit ÷ 5 × Beschäftigungsumfang
           = 41 h ÷ 5 = 8:12 h bei Vollzeit
```

Soll-Arbeitszeit besteht an **jedem Werktag**, der weder gesetzlicher Feiertag
noch Erholungsurlaub noch Krankheitstag ist – **auch in den Schulferien**. Der
Urlaubsanspruch beträgt 30 Werktage; die übrigen unterrichtsfreien Tage sind
reguläre Arbeitstage.

Schuljahr 2026/2027, Vollzeit, 30 Urlaubstage:
**1836:48 h an 224 Arbeitstagen, davon 30 in der unterrichtsfreien Zeit.**

Grundlage: **Arbeitszeitverordnung Schleswig-Holstein (AZVO SH)** – 41 Stunden
regelmäßige wöchentliche Arbeitszeit für Beamtinnen und Beamte. Tarifbeschäftigte
nach TV-L tragen ihren eigenen Wert ein; das Feld ist frei änderbar.

---

## Teilzeit

Teilzeit wird je nach Statusgruppe unterschiedlich bewilligt. Die App nimmt
deshalb alle drei üblichen Formen entgegen, damit niemand seinen Bescheid
umrechnen muss:

| Eingabeart | Typisch für | Beispiel |
|---|---|---|
| Zahl der Unterrichtsstunden | verbeamtete Lehrkräfte | 21 von 27 → 77,8 % |
| Bruchteil / Prozent | Bruchteilsbewilligungen | 3/4 → 75 % |
| Wochenstunden der Arbeitszeit | Tarifbeschäftigte nach TV-L | 30,75 von 41 → 75 % |

Alle drei führen zum selben Faktor und damit zur selben Soll-Arbeitszeit.

### Zwei Punkte, die bei Teilzeit regelmäßig strittig sind

**Teilzeit gilt auch außerhalb des Unterrichts.** Konferenzen, Aufsichten,
Korrekturen und Elterngespräche dürfen nur im Umfang der bewilligten Teilzeit
verlangt werden, nicht in vollem Umfang. In Schleswig-Holstein gibt es dazu
einen eigenen Erlass zur Verbesserung der Bedingungen teilzeitbeschäftigter
Lehrkräfte. Genau das lässt sich mit der Erfassung belegen – der Saldo
vergleicht mit dem anteiligen Soll, nie mit dem einer Vollzeitkraft.

**Ermäßigungen werden bei Teilzeit gestaffelt.** Nach den vorliegenden
Darstellungen der Regelung in Schleswig-Holstein gilt:

- Teilzeit **ab drei Vierteln**: Alters- und Schwerbehindertenermäßigung in
  voller Höhe
- Teilzeit **unter drei Vierteln**: beide nur zur Hälfte
- Teilzeit **unter der Hälfte**: keine Altersermäßigung

Die App rechnet das **nicht automatisch**, sondern weist bei einer Teilzeit
unter drei Vierteln darauf hin. Eingetragen werden die tatsächlich bewilligten
Stunden – die stehen im Bescheid und sind belastbarer als jede Faustregel in
einer Software.

---

## Ermäßigungs- und Anrechnungsstunden

Die App bringt eine Liste anklickbarer Vorlagen mit – Sicherheitsbeauftragung,
Fachkonferenzleitung, Sammlungsleitung, Medien- und IT-Beauftragung,
Personalrat, Schwerbehindertenvertretung, Beratungs- und Verbindungslehrkraft,
Prävention, Ganztagskoordination, Ausbildung von Lehrkräften im
Vorbereitungsdienst, Schulentwicklung, Klassenleitung, Korrekturfächer,
Altersermäßigung, Schwerbehinderung, freie Position.

**Alle starten mit einer Stunde.** Das ist Absicht: Wie viele Stunden für welche
Aufgabe gewährt werden, steht im jeweiligen Erlass und im Verteilungsbeschluss
der Schule und ist von Schule zu Schule verschieden. Ein erfundener
„typischer" Wert wäre bequemer und falsch.

Jede Aufgabe lässt sich einer Erfassungskategorie zuordnen; Einträge können im
Dialog „Genau erfassen" direkt einer Aufgabe zugewiesen werden. Erst dann kann
die Auswertung gewährte Entlastung und tatsächlichen Aufwand gegenüberstellen.

Alters- und Schwerbehindertenermäßigung bleiben aus diesem Vergleich heraus –
sie sind ein Ausgleich, keine Gegenleistung für eine Aufgabe.

---

## Vor dem Einsatz prüfen

Diese Werte sind **Startwerte**, keine Rechtsauskunft, und alle in der App
änderbar:

| Wert | Voreinstellung | Prüfen gegen |
|---|---|---|
| Pflichtstunden Gemeinschaftsschule Sek I | 27 | Pflichtstundenverordnung SH |
| … mit Oberstufe | 25,5 | dieselbe |
| Grundschule / Förderzentrum / Gymnasium | 28 / 26,5 / 25,5 | dieselbe |
| Wöchentliche Arbeitszeit | 41 h | AZVO SH bzw. TV-L |
| Erholungsurlaub | 30 Werktage | Erholungsurlaubsverordnung |
| Ferientermine 2026/27, 2027/28 | Festland SH | amtliche Bekanntmachung |
| Dauer einer Unterrichtsstunde | 45 min | eigener Schulrhythmus |

**Offenlegung zur Quellenlage:** Die Pflichtstundenzahlen und die Staffelung der
Ermäßigungen bei Teilzeit stammen aus Sekundärquellen, nicht aus dem
Verordnungstext selbst – die amtlichen Seiten des Landes waren bei der
Erstellung nicht abrufbar. Deshalb ist jeder dieser Werte in der Oberfläche
editierbar und mit einem Prüfhinweis versehen, statt fest im Code zu stehen.

---

## Quellen und weiterführende Seiten

- Pflichtstundenverordnung SH:
  [schleswig-holstein.de – Schulrecht von A bis Z](https://www.schleswig-holstein.de/DE/fachinhalte/S/schulrecht/Glossareintraege/P/pflichtstundenverordnung.html)
- Landesnorm im Volltext:
  [gesetze-rechtsprechung.sh.juris.de – PflStdV SH](https://www.gesetze-rechtsprechung.sh.juris.de/jportal/?quelle=jlink&query=PflStdV+SH&psml=bsshoprod.psml&max=true&aiz=true)
- Arbeitszeit der Beamtinnen und Beamten:
  [schleswig-holstein.de – Beamtenrecht, Arbeitszeit](https://www.schleswig-holstein.de/DE/fachinhalte/B/beamtenrecht/arbeitszeit.html)
- Teilzeit für Lehrkräfte im Beamtenverhältnis:
  [Merkblatt des Ministeriums (PDF)](https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/III/Service/Formulare/Downloads/Beamte_Teilzeit.pdf)
- Ferientermine:
  [schleswig-holstein.de – Ferientermine](https://www.schleswig-holstein.de/DE/landesregierung/themen/bildung-hochschulen/ferientermine)
- Pflichtstunden im Ländervergleich:
  [KMK-Übersicht 2025/2026 (PDF)](https://www.kmk.org/fileadmin/Dateien/pdf/Statistik/Dokumentationen/Pflichtstunden_der_LehrerInnen_2025_2026.pdf)
- Gewerkschaftliche Einordnung:
  [GEW Schleswig-Holstein – Rund um Teilzeit](https://www.gew-sh.de/aktuelles/detailseite/rund-um-teilzeit) ·
  [GEW Hessen – Lehrzeit-App](https://www.gew-hessen.de/details/lehrzeit-app)
