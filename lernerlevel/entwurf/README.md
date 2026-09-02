# Entwürfe für die Oberfläche

Hier liegen die Design-Entwürfe zur Politur der Oberfläche, nicht die App
selbst. Jede `.dc.html` ist ein Bildschirm, `canvas.json` legt fest, wie sie
auf der Leinwand nebeneinander liegen.

* `Start.dc.html` – Startseite mit den Lerngruppen
* `Main.dc.html` – Dashboard einer Lerngruppe
* `Profil.dc.html` – Schülerprofil mit laufendem Floß
* `Formular.dc.html` – Floß starten

Es sind statische Entwürfe: nichts ist anklickbar, sie zeigen nur, wie es
aussehen soll. Was übernommen wird, wandert von Hand in `css/app.css`.

Die Leinwand wird daraus zusammengebaut und als Artifact veröffentlicht; die
zusammengebaute Datei (rund 2,5 MB) steht nicht im Repository, weil sie sich
jederzeit aus diesen Dateien neu erzeugen lässt.
