#!/usr/bin/env python3
"""
Erzeugt die App-Symbole aus einer Zeichnung, damit sie sich jederzeit
nachziehen lassen: python3 werkzeug/icons-machen.py

Das Zeichen sind drei aufsteigende Balken - dieselbe Marke wie in der
Kopfzeile der App. Voraussetzung: pillow.
"""

from PIL import Image, ImageDraw
from pathlib import Path

BLAU = (45, 108, 212)
WEISS = (255, 255, 255)
ZIEL = Path(__file__).resolve().parent.parent / 'icons'


def zeichne(groesse, rand_anteil=0.0, radius_anteil=0.22, hintergrund=True):
    """rand_anteil: Sicherheitsabstand für maskierbare Symbole."""
    bild = Image.new('RGBA', (groesse, groesse), (0, 0, 0, 0))
    stift = ImageDraw.Draw(bild)

    if hintergrund:
        if rand_anteil:  # maskierbar: Fläche randlos, Motiv kleiner
            stift.rectangle([0, 0, groesse, groesse], fill=BLAU)
        else:
            r = int(groesse * radius_anteil)
            stift.rounded_rectangle([0, 0, groesse - 1, groesse - 1], radius=r, fill=BLAU)

    # Drei Balken, von links nach rechts höher.
    innen = groesse * (1 - 2 * max(rand_anteil, 0.22))
    links = (groesse - innen) / 2
    breite = innen * 0.19
    luecke = (innen - 3 * breite) / 2
    unten = links + innen
    for i, hoehe_anteil in enumerate((0.42, 0.70, 1.0)):
        x0 = links + i * (breite + luecke)
        y0 = unten - innen * hoehe_anteil
        stift.rounded_rectangle(
            [x0, y0, x0 + breite, unten], radius=breite * 0.32, fill=WEISS
        )
    return bild


def main():
    ZIEL.mkdir(exist_ok=True)
    zeichne(192).save(ZIEL / 'icon-192.png')
    zeichne(512).save(ZIEL / 'icon-512.png')
    zeichne(512, rand_anteil=0.30).save(ZIEL / 'icon-maskable-512.png')
    # Apple schneidet selbst zu und mag keine Transparenz.
    zeichne(180, radius_anteil=0.0).convert('RGB').save(ZIEL / 'apple-touch-icon.png')
    for f in sorted(ZIEL.iterdir()):
        print(f.name, f.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
