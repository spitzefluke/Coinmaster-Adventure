"""Coinmaster Adventure · Farbvarianten des KayKit-Farbatlas (hexagons_medieval.png)

Der Atlas ist ein Raster aus 8 x 4 Farbverläufen (je 128 x 256 Pixel). Jedes Modell des Medieval-Pakets
holt seine Farben über UV-Koordinaten aus diesen Feldern. Eine Variante ersetzt einzelne Felder durch neue
Verläufe (oben -> unten); build.mjs legt die Modelle dann ein zweites Mal mit dem neuen Atlas in die
Bibliothek (Name „modell@variante“).

    python3 atlanten.py medieval <pfad/zu/hexagons_medieval.png>
    python3 atlanten.py space <pfad/zu/spacebits_texture.png>

schreibt atlanten/<variante>.png neben dieses Skript (Variantennamen sind über alle Pakete eindeutig).
Das Space-Paket hat dasselbe Raster; Felsen und Geländeblöcke nutzen nur Feld 7 (orange).

Felder (Zeile, Spalte -> Index z * 8 + s):
  0 dunkelgrau   1 weiß        2 Stein hell  3 Stein dunkel 4 schwarz    5 Ziegel      6 Holz rot    7 orange
  8 hellblau     9 blau       10 Holz       11 gelb        12 Gras      13 Sand       14 grau       15 graubraun
 16 Gras gelb   17 Laub       18 Stein      19/20 Haut     21 Creme     22 magenta    23 rosa
 24 blau        25 rot        26 gelb       27 Laub        28 orange    29 beige      30/31 taupe
"""

import os
import sys

from PIL import Image

MEDIEVAL = {
    # Schnee und Eis: Gras und Laub weiß bis eisblau, Stein bläulich hell
    'eis': {
        12: ('#ffffff', '#d4ecfa'), 16: ('#ffffff', '#cfe6f7'),
        17: ('#eef8ff', '#8fbcd6'), 27: ('#eef8ff', '#8fbcd6'),
        2: ('#e6f2fa', '#9db8cc'), 18: ('#e6f2fa', '#9db8cc'), 14: ('#d8e8f2', '#8aa4b8'),
    },
    # Asche und Glut: Gras grauschwarz, Laub verkohlt, Stein Basalt, Blau wird Lava
    'lava': {
        12: ('#5a4a44', '#2a201c'), 16: ('#6a5a50', '#2e2420'),
        17: ('#3a2c28', '#140e0c'), 27: ('#3a2c28', '#140e0c'),
        2: ('#5a504c', '#221c1a'), 18: ('#5a504c', '#221c1a'), 3: ('#3a3230', '#1a1412'), 14: ('#4a4240', '#1e1816'),
        8: ('#ffd24a', '#ff4a00'), 9: ('#ffb02e', '#e02a00'), 24: ('#ffb02e', '#e02a00'),
        1: ('#b0a8a4', '#6a625e'),
    },
    # Höhle: Stein dunkel violett, Gras wird Moos, Laub leuchtend türkis
    'hoehle': {
        12: ('#3e6a5a', '#1e3a34'), 16: ('#4a7060', '#22403a'),
        17: ('#6ae8d8', '#2a7a8a'), 27: ('#6ae8d8', '#2a7a8a'),
        2: ('#6a5e80', '#2e2840'), 18: ('#6a5e80', '#2e2840'), 3: ('#4a4258', '#1e1a28'), 14: ('#5a5270', '#262034'),
    },
    # Zuckerwelt: Gras rosa Zuckerguss, Laub Pastell, Stein Lavendel, Holz Schokolade, Blau Bonbon-Türkis
    'candy': {
        12: ('#ffe0f0', '#ff9ad0'), 16: ('#ffe8f4', '#ffa8d8'),
        17: ('#ffd0f0', '#c88aff'), 27: ('#d0fff0', '#7ad8c8'),
        2: ('#f2e8ff', '#bca8e8'), 18: ('#f2e8ff', '#bca8e8'), 14: ('#f0e0ff', '#b8a0e0'),
        10: ('#a8704a', '#5a3018'), 5: ('#b07850', '#6a3a20'), 6: ('#9a6040', '#4a2414'), 15: ('#8a6048', '#4a2a1a'),
        9: ('#7ae8ff', '#3aa8e8'), 24: ('#7ae8ff', '#3aa8e8'), 25: ('#ff7aa8', '#e03a7a'),
    },
}


# Space Base Bits: Feld 7 (Felsen, Gelände, Zierstreifen) je Planet umgefärbt; Mars bleibt orange
SPACE = {
    'mond': {7: ('#d8dbe2', '#6a6d76')},
    'neptun': {7: ('#bfe8ff', '#2a4fa0')},
    'saturn': {7: ('#f4e2b8', '#a07848')},
    'alien': {7: ('#c89aff', '#3a1a60')},
    'sonne': {7: ('#ffd24a', '#a02a08')},
}

SOURCES = {'medieval': MEDIEVAL, 'space': SPACE}


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def main(source, src):
    base = Image.open(src).convert('RGBA')
    w, h = base.size
    cw, ch = w // 8, h // 4
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'atlanten')
    os.makedirs(out_dir, exist_ok=True)
    for name, cells in SOURCES[source].items():
        im = base.copy()
        px = im.load()
        for idx, (top, bottom) in cells.items():
            r, c = divmod(idx, 8)
            a, b = hex_rgb(top), hex_rgb(bottom)
            for y in range(ch):
                t = y / (ch - 1)
                col = tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3)) + (255,)
                for x in range(cw):
                    px[c * cw + x, r * ch + y] = col
        im.save(os.path.join(out_dir, name + '.png'), optimize=True)
        print(name, os.path.getsize(os.path.join(out_dir, name + '.png')), 'Bytes')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
