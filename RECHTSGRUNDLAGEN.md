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

Grundlage: **41 Stunden regelmäßige wöchentliche Arbeitszeit.** Die KMK-Übersicht
weist für Schleswig-Holstein 41 Stunden sowohl für Beamtinnen und Beamte als auch
für Angestellte aus – anders als in den meisten Ländern gibt es hier also keinen
Unterschied zwischen den Statusgruppen. **Bei anerkannter Schwerbehinderung sind
es 40 Stunden.** Das Feld ist frei änderbar.

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

### Ermäßigungen bei Teilzeit

Nach den vorliegenden Darstellungen werden Alters- und Schwerbehinderten­ermäßigung
bei einer Teilzeit unterhalb von drei Vierteln nur zur Hälfte gewährt. Die
KMK-Übersicht enthält zu diesem Punkt eine eigene Tabelle, deren Spaltenzuordnung
sich aus dem PDF nicht zuverlässig auslesen ließ – die Angabe ist deshalb **nicht
gesichert**. Die App rechnet hier ohnehin nichts automatisch, sondern weist bei
einer Teilzeit unter drei Vierteln nur hin. Eingetragen wird, was im Bescheid steht.

### Zwei Punkte, die bei Teilzeit regelmäßig strittig sind

**Teilzeit gilt auch außerhalb des Unterrichts.** Konferenzen, Aufsichten,
Korrekturen und Elterngespräche dürfen nur im Umfang der bewilligten Teilzeit
verlangt werden, nicht in vollem Umfang. In Schleswig-Holstein gibt es dazu
einen eigenen Erlass zur Verbesserung der Bedingungen teilzeitbeschäftigter
Lehrkräfte. Genau das lässt sich mit der Erfassung belegen – der Saldo
vergleicht mit dem anteiligen Soll, nie mit dem einer Vollzeitkraft.

**Die Bezugsgröße bleibt die volle Pflichtstundenzahl.** Wer 21 von 27 Stunden
bewilligt bekommen hat und zusätzlich zwei Stunden Ermäßigung erhält, trägt als
Teilzeitumfang 21 ein – nicht 19. Sonst sänke das Arbeitszeit-Soll doppelt.

---

## Belegte Ermäßigungen in Schleswig-Holstein

Drei Ermäßigungen folgen einer Landesregelung, nicht einem Schulbeschluss – sie
sind deshalb mit konkreten Werten vorbelegt (Quelle: KMK-Übersicht 2019):

| Ermäßigung | Stunden | Regelung |
|---|---|---|
| **Einsatz in der gymnasialen Oberstufe** | 1,5 | bei Einsatz in einem Kernfach, einem profilgebenden Fach, zwei profilergänzenden Fächern oder mit mindestens fünf Wochenstunden |
| **Altersermäßigung** | 1 | ab dem 60. Lebensjahr |
| **Schwerbehinderung** (mind. 50 %) | 1, ab 63 weitere 1 | ab dem 55. Lebensjahr |

Die Oberstufen-Ermäßigung ist der Grund, warum es in der App **keine eigene
Schulform „Gemeinschaftsschule mit Oberstufe“ mehr gibt**: Die Pflichtstundenzahl
ist dieselbe wie in der Sekundarstufe I, nämlich 27. Der Unterschied entsteht
erst durch den tatsächlichen Einsatz in der Oberstufe – und wer an einer
Gemeinschaftsschule mit Oberstufe arbeitet, dort aber nicht unterrichtet, hat
weiterhin 27 Pflichtstunden. Als feste Schulform-Voreinstellung wäre 25,5 also
für einen Teil des Kollegiums schlicht falsch gewesen.

Bei anerkannter Schwerbehinderung sinkt zusätzlich die **wöchentliche Arbeitszeit
von 41 auf 40 Stunden**. Das ist keine Ermäßigung der Unterrichtsverpflichtung,
sondern verringert die Soll-Arbeitszeit wirklich – es gehört deshalb in das Feld
„Wöchentliche Arbeitszeit“, nicht in die Ermäßigungsliste.

## Weitere Ermäßigungs- und Anrechnungsstunden

Die App bringt eine Liste anklickbarer Vorlagen mit – Sicherheitsbeauftragung,
Fachkonferenzleitung, Sammlungsleitung, Medien- und IT-Beauftragung,
Personalrat, Schwerbehindertenvertretung, Beratungs- und Verbindungslehrkraft,
Prävention, Ganztagskoordination, Ausbildung von Lehrkräften im
Vorbereitungsdienst, Schulentwicklung, Klassenleitung, Korrekturfächer,
Altersermäßigung, Schwerbehinderung, freie Position.

**Die Funktionsaufgaben starten mit einer Stunde.** Das ist Absicht: Wie viele Stunden für welche
Aufgabe gewährt werden, steht im jeweiligen Erlass und im Verteilungsbeschluss
der Schule und ist von Schule zu Schule verschieden. Ein erfundener
„typischer" Wert wäre bequemer und falsch.

Jede Aufgabe lässt sich einer Erfassungskategorie zuordnen; Einträge können im
Dialog „Genau erfassen" direkt einer Aufgabe zugewiesen werden. Erst dann kann
die Auswertung gewährte Entlastung und tatsächlichen Aufwand gegenüberstellen.

Alters- und Schwerbehindertenermäßigung bleiben aus diesem Vergleich heraus –
sie sind ein Ausgleich, keine Gegenleistung für eine Aufgabe.

---

## Andere Bundesländer

Die App ist für Schleswig-Holstein gebaut, lässt sich aber anderswo einsetzen.
Unter *Mehr → Person und Schulform* wird das Bundesland gewählt; daran hängen
zwei Dinge, die sich sonst leicht übersehen lassen.

**Die wöchentliche Arbeitszeit.** Sie ist wichtiger als die Pflichtstundenzahl,
weil sie die Soll-Arbeitszeit direkt bestimmt. Wer nur die Pflichtstunden
anpasst, rechnet mit einem falschen Soll – bei einem Wechsel von 41 auf 40
Stunden sind das **44:48 Stunden Unterschied im Schuljahr**. Die Pflichtstunden
allein verändern das Arbeitszeit-Soll dagegen überhaupt nicht; sie bestimmen die
Unterrichtsverpflichtung und den Wert einer Anrechnungsstunde.

| Land | Beamte | Tarifbeschäftigte | | Land | Beamte | Tarifbeschäftigte |
|---|---|---|---|---|---|---|
| Baden-Württemberg | 41 | 41 | | Niedersachsen | 40 | 40 |
| Bayern | 40 | 40 | | Nordrhein-Westfalen | 41 | 41 |
| Berlin | 40 | 39,4 | | Rheinland-Pfalz | 40 | 40 |
| Brandenburg | 40 | 40 | | Saarland | 40 | 39,5 |
| Bremen | 40 | 40 | | Sachsen | 40 | 40 |
| Hamburg | 40 | 40 | | Sachsen-Anhalt | 40 | 40 |
| Hessen | 41 | 41 | | Schleswig-Holstein | 41 | 41 |
| Mecklenburg-Vorpommern | 40 | 40 | | Thüringen | 40 | 40 |

**Die gesetzlichen Feiertage.** Neun gelten bundesweit, alles Weitere ist
Landesrecht – Fronleichnam, Allerheiligen, Heilige Drei Könige, Reformationstag,
Buß- und Bettag, Frauentag, Weltkindertag, Mariä Himmelfahrt. Ein Feiertag zu
viel oder zu wenig verschiebt das Soll um gut acht Stunden im Jahr. Die App
stellt sie je Land zusammen und berechnet den Buß- und Bettag (Mittwoch vor dem
23. November) sowie alle beweglichen Feiertage über die Osterformel.

Zwei bewusste Vereinfachungen: In Bayern gilt Mariä Himmelfahrt nur in Gemeinden
mit überwiegend katholischer Bevölkerung – die App nimmt ihn an. In Sachsen und
Thüringen gilt Fronleichnam nur in einzelnen Gemeinden – die App nimmt ihn nicht
an. Wen das betrifft, setzt den Tag in der Tagesansicht auf *dienstfrei*.

**Was nicht mitkommt:** Ferientermine und Pflichtstundenzahlen. Für die
Ferien gibt es die Eingabemaske unter *Mehr → Schuljahr und Ferien*; bei den
Pflichtstunden bleibt das freie Feld. Beides bewusst ohne geratene Werte –
eine falsche Voreinstellung wäre schlimmer als gar keine, weil sie niemandem
auffällt.

---

## Vor dem Einsatz prüfen

Diese Werte sind **Startwerte**, keine Rechtsauskunft, und alle in der App
änderbar:

| Wert | Voreinstellung | Quelle | Prüfen gegen |
|---|---|---|---|
| Gemeinschaftsschule (auch mit Oberstufe) | 27 | KMK 2019 | PflStdVO SH |
| Grundschule | 28 | KMK 2019 | dieselbe |
| Förderzentrum | 27 | KMK 2019 | dieselbe |
| Gymnasium | 25,5 | KMK 2019 | dieselbe |
| Berufsbildende Schule (Studienräte) | 25,5 | KMK 2019 | dieselbe |
| Ermäßigung Oberstufeneinsatz | 1,5 | KMK 2019 | dieselbe |
| Altersermäßigung ab 60 | 1 | KMK 2019 | dieselbe |
| Schwerbehinderung ab 55 / ab 63 | 1 / +1 | KMK 2019 | dieselbe |
| Wöchentliche Arbeitszeit | 41 h (40 h bei Schwerbehinderung) | KMK 2019 | AZVO SH |
| Erholungsurlaub | 30 Werktage | – | Erholungsurlaubsverordnung |
| Ferientermine 2026/27, 2027/28 | Festland SH | Websuche | amtliche Bekanntmachung |
| Dauer einer Unterrichtsstunde | 45 min | – | eigener Schulrhythmus |

**Offenlegung zur Quellenlage:** Die mit „KMK 2019“ gekennzeichneten Werte
stammen aus der KMK-Übersicht mit **Stand September 2019 (Schuljahr
2019/2020)**. Das ist eine amtliche Primärzusammenstellung und damit deutlich
belastbarer als die zuvor verwendeten Sekundärquellen – aber sie ist mehrere
Jahre alt, und die Pflichtstundenverordnung Schleswig-Holstein wurde seither neu
gefasst. Jeder dieser Werte ist deshalb in der Oberfläche editierbar und mit
einem Prüfhinweis versehen, statt fest im Code zu stehen.

Nicht aus dieser Quelle belegbar waren: die Ferientermine, der Urlaubsanspruch
und die Staffelung der Ermäßigungen bei Teilzeit.

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
- **Hauptquelle der Voreinstellungen:** KMK, „Übersicht über die Pflichtstunden
  der Lehrkräfte an allgemeinbildenden und beruflichen Schulen“, Stand September
  2019 – enthält Pflichtstunden je Schulart, Altersermäßigungen, Regelungen für
  Teilzeit und die wöchentliche Arbeitszeit je Land
- Aktuellere Fassung derselben Übersicht:
  [KMK-Übersicht 2025/2026 (PDF)](https://www.kmk.org/fileadmin/Dateien/pdf/Statistik/Dokumentationen/Pflichtstunden_der_LehrerInnen_2025_2026.pdf)
- Gewerkschaftliche Einordnung:
  [GEW Schleswig-Holstein – Rund um Teilzeit](https://www.gew-sh.de/aktuelles/detailseite/rund-um-teilzeit) ·
  [GEW Hessen – Lehrzeit-App](https://www.gew-hessen.de/details/lehrzeit-app)
