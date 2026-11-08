"""Coinmaster Adventure · Himmelsbilder (Skybox) je Welt malen

Schreibt assets/himmel/<welt>/seite.jpg, oben.jpg und unten.jpg (je 1024 x 1024). In Roblox ist das ein
Sky-Objekt: SkyboxBk, SkyboxFt, SkyboxLf und SkyboxRt bekommen alle dasselbe Bild „seite“, SkyboxUp „oben“,
SkyboxDn „unten“. Darum muss man je Welt nur drei Bilder hochladen.

Damit an den Kanten keine Nähte entstehen, egal wie Roblox die Seiten dreht oder spiegelt:
  - die Seitenbilder hängen nur von Höhe und Richtung ab, und alles, was sich mit der Richtung ändert (Wolken),
    wiederholt sich genau alle 90 Grad: linke und rechte Kante eines Bildes sind gleich;
  - Wolken und Bänder reichen nur bis etwa 33 Grad Höhe, darüber ist der Himmel nur noch ein Verlauf;
  - „oben“ und „unten“ sind rund um die Mitte gleich (nur Verlauf und Sterne).

    python3 himmel.py normal          eine Welt
    python3 himmel.py alle            alle Welten aus HIMMEL

Braucht numpy und Pillow.
"""

import os
import sys

import numpy as np
from PIL import Image

N = 1024
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))


def rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255.0


# ── Rauschen, in Richtung (u) alle 90 Grad wiederholt ──
def _lattice(seed, nu, nv):
    return np.random.default_rng(seed).random((nv + 1, nu), dtype=np.float32)


def value_noise(u, v, nu, nv, seed):
    """u in [0, 1) über 90 Grad (wiederholt sich), v frei; nu Zellen in u, nv in v"""
    g = _lattice(seed, nu, nv + 2)
    x, y = u * nu, v
    x0 = np.floor(x).astype(int)
    y0 = np.clip(np.floor(y).astype(int), 0, nv)
    fx, fy = x - np.floor(x), np.clip(y - y0, 0, 1)
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    x1 = (x0 + 1) % nu
    x0 = x0 % nu
    a, b = g[y0, x0], g[y0, x1]
    c, d = g[y0 + 1, x0], g[y0 + 1, x1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(u, v, base, octaves, seed, rough=0.5):
    out, amp, total = 0.0, 1.0, 0.0
    for o in range(octaves):
        cells = max(1, int(round(base * (2 ** o))))
        out = out + value_noise(u, v * cells / 4.0, cells, cells * 2 + 4, seed + o * 17) * amp
        total += amp
        amp *= rough
    return out / total


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ── Richtungen der Pixel einer Würfelseite ──
def side_dirs():
    s = (np.arange(N, dtype=np.float32) + 0.5) / N * 2 - 1
    x, y = np.meshgrid(s, -s)  # Bild oben = oben
    elev = np.degrees(np.arctan2(y, np.sqrt(x * x + 1)))
    az = np.degrees(np.arctan(x))  # -45 .. 45
    u = (az + 45) / 90.0  # 0 .. 1, linke Kante = rechte Kante (mod 1)
    return elev, u


def cap_dirs(up=True):
    s = (np.arange(N, dtype=np.float32) + 0.5) / N * 2 - 1
    x, z = np.meshgrid(s, s)
    elev = np.degrees(np.arctan2(1, np.sqrt(x * x + z * z)))
    return elev if up else -elev, x, z


def gradient(elev, stops):
    """stops: [(Höhe in Grad, Farbe), ...] aufsteigend"""
    out = np.zeros(elev.shape + (3,), np.float32)
    hs = [h for h, _ in stops]
    cs = [rgb(c) for _, c in stops]
    out[:] = cs[0]
    for i in range(len(stops) - 1):
        t = np.clip((elev - hs[i]) / (hs[i + 1] - hs[i]), 0, 1)[..., None]
        m = ((elev >= hs[i]) & (elev <= hs[i + 1]) if i < len(stops) - 2 else elev >= hs[i])[..., None]
        out = np.where(m, cs[i] * (1 - t) + cs[i + 1] * t, out)
    out = np.where((elev >= hs[-1])[..., None], cs[-1], out)
    return out


def stars(shape, count, seed, bright=1.0):
    rng = np.random.default_rng(seed)
    img = np.zeros(shape, np.float32)
    n = int(count)
    ys, xs = rng.integers(0, shape[0], n), rng.integers(0, shape[1], n)
    v = rng.random(n) ** 3 * bright
    img[ys, xs] = np.maximum(img[ys, xs], v)
    # ein paar größere, weichere Sterne
    big = rng.random(n) > 0.97
    for dy in (-1, 1):
        img[np.clip(ys[big] + dy, 0, shape[0] - 1), xs[big]] = np.maximum(img[np.clip(ys[big] + dy, 0, shape[0] - 1), xs[big]], v[big] * 0.5)
        img[ys[big], np.clip(xs[big] + dy, 0, shape[1] - 1)] = np.maximum(img[ys[big], np.clip(xs[big] + dy, 0, shape[1] - 1)], v[big] * 0.5)
    return img


# ── Wolkenschichten auf den Seitenbildern ──
def blur_wrap(a, radius):
    """Weichzeichnen; links und rechts wird umgebrochen, damit die Kanten gleich bleiben"""
    from PIL import ImageFilter
    pad = int(radius * 3) + 2
    w = np.concatenate([a[:, -pad:], a, a[:, :pad]], axis=1)
    im = Image.fromarray(np.clip(w * 255, 0, 255).astype(np.uint8))
    im = im.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(im, np.float32)[:, pad:-pad] / 255.0


def clouds(img, elev, u, layer, seed):
    lo, hi = layer['band']
    k = layer.get('contrast', 2.4)
    stretch = layer.get('stretch', 1.0)
    cover = layer['cover']
    if layer.get('streaks'):
        # Schleierwolken: dünne, lang gezogene Bänder
        n = fbm(u, elev / 40.0 * 6.0, max(1, layer['scale'] // 2), 4, seed, 0.6)
        n = np.clip((n - 0.5) * k + 0.5, 0, 1)
        band = smooth(lo - 2, lo + 3, elev) * (1 - smooth(hi - 5, hi, elev))
        a = smooth(1 - cover, 1 - cover + layer.get('soft', 0.3), n) * band
        lit = np.ones_like(a)
    else:
        # Haufenwolken: flache Unterseite bei lo, nach oben quellend bis hi
        H = hi - lo
        n = fbm(u, elev / 40.0 * stretch, layer['scale'], 5, seed, layer.get('rough', 0.5))
        n = np.clip((n - 0.5) * k + 0.5, 0, 1)
        clump = np.clip((fbm(u, np.zeros_like(elev), max(1, layer['scale'] // 2), 2, seed + 3, 0.5) - 0.5) * 3 + 0.5, 0, 1)
        h = np.clip((elev - lo) / H, 0, 1)
        d = n * (0.55 + 0.6 * clump) - h * 0.85
        a = smooth(1 - cover - 0.35, 1 - cover - 0.35 + layer.get('soft', 0.08), d) * smooth(lo - 0.3, lo + 1.2, elev) * (1 - smooth(hi - 2, hi, elev))
        # unten Schatten, oben Licht, dazu etwas Wölbung aus dem Rauschen
        lit = np.clip(smooth(lo, lo + H * 0.55, elev) * 0.8 + (n - 0.5) * 0.6 + 0.15, 0, 1)
    a = blur_wrap(a, layer.get('blur', 2.0)) * layer.get('alpha', 1.0)
    lit = blur_wrap(lit, 3)[..., None]
    col = rgb(layer['shadow']) * (1 - lit) + rgb(layer['light']) * lit
    img[:] = img * (1 - a[..., None]) + col * a[..., None]


# Polarlicht: senkrechte Vorhänge (in Richtung fein gestreift), die sich als Bänder über den Himmel ziehen
def aurora(img, elev, u, cfg, seed):
    lo, hi = cfg['band']
    # Unterkante wellt sich mit der Richtung
    wave = fbm(u, np.zeros_like(elev), 3, 3, seed, 0.5)
    base = lo + (wave - 0.5) * cfg.get('wave', 10)
    h = (elev - base) / (hi - lo)
    vert = smooth(-0.02, 0.06, h) * (1 - smooth(0.25, 1.0, h))
    streak = fbm(u, np.zeros_like(elev), cfg.get('streaks', 24), 3, seed + 1, 0.6)
    streak = np.clip((streak - 0.35) * 2.2, 0, 1)
    patches = np.clip((fbm(u, np.zeros_like(elev), 2, 2, seed + 2, 0.5) - 0.3) * 2.5, 0, 1)
    k = (vert * streak * patches * cfg.get('strength', 0.7))[..., None]
    # unten grün, oben violett
    c0, c1 = rgb(cfg['colors'][0]), rgb(cfg['colors'][1])
    t = np.clip(h, 0, 1)[..., None]
    col = c0 * (1 - t) + c1 * t
    # mischen statt addieren, sonst wird Grün auf Blau zu Türkis
    a = np.clip(blur_wrap(k[..., 0], 2), 0, 1)[..., None]
    img[:] = np.clip(img * (1 - a) + col * a * 1.15, 0, 1)


# Höhlendecke: oben dunkler Fels mit Struktur und leuchtenden Kristalladern, dazu Tropfstein-Silhouetten, die
# von oben bis tief herabhängen; am Horizont leuchtet violetter Nebel
def cave(img, elev, u, cfg, seed):
    rock = fbm(u, elev / 40.0, 6, 5, seed, 0.55)
    base = rgb(cfg['rock'])
    rock_col = base[None, None, :] * (0.7 + 0.6 * rock[..., None])
    # Tropfsteine: Unterkante hängt je nach Richtung verschieden tief (spitze Zacken)
    spikes = fbm(u, np.zeros_like(elev), cfg.get('spikes', 22), 2, seed + 3, 0.7)
    spikes = np.clip((spikes - 0.45) * 3, 0, 1) ** 2
    edge = cfg['ceiling'] - spikes * cfg.get('reach', 30)
    a = smooth(edge - 1.5, edge + 1.5, elev)
    # Kristalladern: schmale, helle Linien im Fels
    vein = fbm(u, elev / 40.0 * 2, 6, 3, seed + 9, 0.5)
    patch = np.clip((fbm(u, elev / 40.0, 3, 2, seed + 11, 0.5) - 0.42) * 4, 0, 1)  # Adern nur stellenweise
    vein = np.clip(1 - np.abs(vein - 0.5) * 30, 0, 1) * patch * smooth(edge + 2, edge + 10, elev)
    col = rock_col * (1 - vein[..., None]) + rgb(cfg['vein'])[None, None, :] * vein[..., None]
    img[:] = img * (1 - a[..., None]) + col * a[..., None]


# Regenbogenband rundherum (nur von der Höhe abhängig, darum ohne Naht), weich und durchscheinend
def rainbow(img, elev, cfg):
    lo, hi = cfg['band']
    t = (elev - lo) / (hi - lo)
    cols = [rgb(c) for c in ['#ff6a8a', '#ffb05a', '#ffe86a', '#7ae88a', '#6ac8ff', '#a88aff']]
    out = np.zeros(elev.shape + (3,), np.float32)
    n = len(cols)
    for i, c in enumerate(cols):
        w = np.clip(1 - np.abs(t * n - (i + 0.5)), 0, 1)
        out += c[None, None, :] * w[..., None]
    a = (smooth(-0.05, 0.1, t) * (1 - smooth(0.9, 1.05, t)) * cfg.get('alpha', 0.4))[..., None]
    img[:] = img * (1 - a) + out * a


# Milchstraße: ein Band aus Sternenstaub rund um den Himmel, mit dunklen Staubwolken darin und dichten Sternen
def milky(img, elev, u, cfg, seed):
    lo, hi = cfg['band']
    mid = (lo + hi) / 2 + (fbm(u, np.zeros_like(elev), 2, 2, seed, 0.5) - 0.5) * cfg.get('wave', 8)
    d = np.abs(elev - mid) / ((hi - lo) / 2)
    core = np.clip(1 - d, 0, 1) ** 1.5
    dust = fbm(u, elev / 40.0 * 3, 8, 5, seed + 1, 0.6)
    glow = core * np.clip(dust * 1.6 - 0.35, 0, 1) * cfg.get('strength', 0.5)
    lanes = np.clip((fbm(u, elev / 40.0 * 4, 10, 3, seed + 2, 0.5) - 0.55) * 4, 0, 1) * core  # dunkle Staubbahnen
    col = rgb(cfg['color'])[None, None, :]
    img[:] = np.clip(img + col * blur_wrap(glow, 2)[..., None] - lanes[..., None] * 0.08, 0, 1)
    dense = stars(elev.shape, cfg.get('stars', 4000), seed + 3) * core
    img[:] = np.clip(img + dense[..., None], 0, 1)


def render(name, cfg):
    out = os.path.join(ROOT, 'assets', 'himmel', name)
    os.makedirs(out, exist_ok=True)
    seed = abs(hash(name)) % 10000 if 'seed' not in cfg else cfg['seed']

    # Seiten
    elev, u = side_dirs()
    img = gradient(elev, cfg['gradient'])
    if cfg.get('aurora'):
        aurora(img, elev, u, cfg['aurora'], seed + 55)
    if cfg.get('rainbow'):
        rainbow(img, elev, cfg['rainbow'])
    if cfg.get('milky'):
        milky(img, elev, u, cfg['milky'], seed + 91)
    if cfg.get('cave'):
        cave(img, elev, u, cfg['cave'], seed + 77)
    for i, layer in enumerate(cfg.get('clouds', [])):
        clouds(img, elev, u, layer, seed + 101 * (i + 1))
    if cfg.get('stars'):
        st = stars(elev.shape, cfg['stars'] * 0.25, seed + 7, cfg.get('starBright', 1.0)) * smooth(cfg.get('starsFrom', 5), cfg.get('starsFrom', 5) + 20, elev)
        img = np.clip(img + st[..., None], 0, 1)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'seite.jpg'), quality=90)

    # Oben: nur Verlauf (und Sterne)
    e, cx, cz = cap_dirs(True)
    top = gradient(e, cfg['gradient'])
    if cfg.get('cave'):
        # Decke von oben: Fels mit Adern (rundum gleich, von der Mitte nach außen)
        # nur rundum gleich (keine Naht): Felsfarbe, zur Mitte etwas dunkler
        rr = np.sqrt(cx * cx + cz * cz)
        top = rgb(cfg['cave']['rock'])[None, None, :] * (0.8 + 0.2 * np.clip(rr, 0, 1)[..., None])
    if cfg.get('stars'):
        top = np.clip(top + stars(e.shape, cfg['stars'] * 0.4, seed + 9, cfg.get('starBright', 1.0))[..., None], 0, 1)
    Image.fromarray((np.clip(top, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'oben.jpg'), quality=90)

    # Unten: Horizontfarbe zur Tiefe hin dunkler (liegt hinter dem Meer, sieht man kaum)
    e, _, _ = cap_dirs(False)
    bottom = gradient(e, cfg.get('below', [(-90, cfg['gradient'][0][1]), (0, cfg['gradient'][0][1])]))
    Image.fromarray((np.clip(bottom, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'unten.jpg'), quality=90)
    print(name, 'fertig:', out)


# ── Himmel je Welt ──
HIMMEL = {
    # Startwelt: klarer Sommerhimmel, Haufenwolken über dem Horizont, darüber zarte Schleierwolken
    'normal': {
        'seed': 11,
        'gradient': [(-5, '#d6eefa'), (8, '#bfe3fa'), (22, '#86c4f2'), (45, '#4a98e6'), (90, '#2f78d6')],
        'below': [(-90, '#9fcbe8'), (0, '#d6eefa')],
        'clouds': [
            {'band': (11, 28), 'scale': 6, 'cover': 0.58, 'soft': 0.08, 'light': '#ffffff', 'shadow': '#9fb6d6', 'stretch': 2.2, 'blur': 1.6},
            {'band': (20, 35), 'scale': 8, 'cover': 0.5, 'soft': 0.35, 'light': '#ffffff', 'shadow': '#e2ecf8', 'streaks': True, 'alpha': 0.45, 'blur': 4},
        ],
    },
    # Wald: Morgenhimmel, grünlich-golden am Horizont, Nebelbänder tief über den Wipfeln, lockere Wolken
    'wald': {
        'seed': 23,
        'gradient': [(-5, '#d8ecd2'), (6, '#e6f2d6'), (16, '#b8dccb'), (38, '#6fae9e'), (90, '#3f7a6c')],
        'below': [(-90, '#9cc8a8'), (0, '#d8ecd2')],
        'clouds': [
            {'band': (2, 13), 'scale': 4, 'cover': 0.7, 'soft': 0.4, 'light': '#f4fbef', 'shadow': '#cfe4cc', 'streaks': True, 'alpha': 0.75, 'blur': 5},
            {'band': (12, 27), 'scale': 7, 'cover': 0.5, 'soft': 0.08, 'light': '#fffdf0', 'shadow': '#a9c8b4', 'stretch': 2.0, 'blur': 1.8},
            {'band': (22, 35), 'scale': 8, 'cover': 0.42, 'soft': 0.35, 'light': '#fffbe8', 'shadow': '#e2efe0', 'streaks': True, 'alpha': 0.4, 'blur': 4},
        ],
    },
    # Stadt: Abendhimmel, Sonnenuntergang (Gelb-Orange am Horizont, Rosa, oben Violett), Wolken von unten
    # orange angestrahlt, oben die ersten Sterne. Die Sonne selbst zeigt Roblox (sie darf nicht viermal im Bild sein).
    'stadt': {
        'seed': 37,
        'gradient': [(-5, '#ffd9a8'), (4, '#ffc184'), (12, '#ff9c7a'), (24, '#e8789a'), (45, '#8a5aa8'), (90, '#3a2a6a')],
        'below': [(-90, '#e8a07a'), (0, '#ffd9a8')],
        'clouds': [
            {'band': (3, 12), 'scale': 4, 'cover': 0.6, 'soft': 0.4, 'light': '#ffe0b8', 'shadow': '#f4b090', 'streaks': True, 'alpha': 0.7, 'blur': 5},
            {'band': (10, 26), 'scale': 6, 'cover': 0.55, 'soft': 0.08, 'light': '#ffd090', 'shadow': '#b06a8a', 'stretch': 2.2, 'blur': 1.6},
            {'band': (22, 35), 'scale': 8, 'cover': 0.45, 'soft': 0.35, 'light': '#ffb8a0', 'shadow': '#c88aa8', 'streaks': True, 'alpha': 0.45, 'blur': 4},
        ],
        'stars': 900,
    },
    # Eis: kalter Winterhimmel zur blauen Stunde, tief ein Schneedunst-Band, darüber Polarlicht und erste Sterne
    'eis': {
        'seed': 41,
        'gradient': [(-5, '#eaf4ff'), (5, '#cde3f8'), (14, '#7fa8de'), (30, '#34559e'), (55, '#1c2a62'), (90, '#111a42')],
        'below': [(-90, '#a8c4e6'), (0, '#eaf4ff')],
        'aurora': {'band': (13, 38), 'colors': ['#4affa8', '#a86aff'], 'strength': 0.85, 'streaks': 28, 'wave': 12},
        'stars': 700,
        'clouds': [
            {'band': (2, 11), 'scale': 4, 'cover': 0.7, 'soft': 0.4, 'light': '#ffffff', 'shadow': '#dcecf8', 'streaks': True, 'alpha': 0.8, 'blur': 5},
            {'band': (24, 36), 'scale': 8, 'cover': 0.4, 'soft': 0.35, 'light': '#ffffff', 'shadow': '#e8f2fc', 'streaks': True, 'alpha': 0.35, 'blur': 4},
        ],
    },
    # Lava: rauchiger Glutnachthimmel; am Horizont orange Glut, darüber dunkle Aschewolken, von unten
    # rot angestrahlt, oben fast schwarz mit ein paar Funken (Sterne in Glutfarbe)
    'lava': {
        'seed': 53,
        'gradient': [(-5, '#d8582a'), (4, '#b8401e'), (12, '#6a1e14'), (26, '#3a0e0c'), (55, '#200808'), (90, '#140505')],
        'below': [(-90, '#7a2414'), (0, '#d8582a')],
        'clouds': [
            {'band': (1, 12), 'scale': 4, 'cover': 0.7, 'soft': 0.45, 'light': '#ff9a5a', 'shadow': '#8a3018', 'streaks': True, 'alpha': 0.65, 'blur': 5},
            {'band': (8, 26), 'scale': 6, 'cover': 0.6, 'soft': 0.1, 'light': '#3a1610', 'shadow': '#e8683a', 'stretch': 2.0, 'blur': 2},  # von unten angestrahlt: unten hell, oben dunkel
            {'band': (20, 36), 'scale': 8, 'cover': 0.5, 'soft': 0.35, 'light': '#6a2a20', 'shadow': '#2a1010', 'streaks': True, 'alpha': 0.55, 'blur': 4},
        ],
        'stars': 500,
    },
    # Höhle: riesige Kristallhöhle; dunkle Felsdecke mit Tropfsteinen und Kristalladern, am Horizont violetter
    # Leuchtnebel, darunter Glimmer (Sterne in Kristallfarben)
    'hoehle': {
        'seed': 61,
        'gradient': [(-5, '#5a3a8a'), (4, '#4a2e7a'), (12, '#2c1e4a'), (30, '#181228'), (90, '#0e0a18')],
        'below': [(-90, '#2a1e44'), (0, '#5a3a8a')],
        'clouds': [
            {'band': (1, 12), 'scale': 4, 'cover': 0.65, 'soft': 0.45, 'light': '#a070f0', 'shadow': '#4a2e7a', 'streaks': True, 'alpha': 0.35, 'blur': 8},
        ],
        'stars': 600,
        'cave': {'rock': '#2a2238', 'vein': '#7ae8ff', 'ceiling': 34, 'reach': 24, 'spikes': 26},
    },
    # Candy: Zuckerwattehimmel in Pastell, rosa Horizont, Regenbogenband, dicke Zuckerwattewolken in Rosa und Hellblau
    'candy': {
        'seed': 71,
        'gradient': [(-5, '#ffe6f4'), (8, '#ffd0ea'), (20, '#f4b8e8'), (40, '#c8a8f4'), (90, '#9ab8f4')],
        'below': [(-90, '#ffc2e2'), (0, '#ffe6f4')],
        'rainbow': {'band': (16, 26), 'alpha': 0.35},
        'clouds': [
            {'band': (4, 20), 'scale': 6, 'cover': 0.62, 'soft': 0.1, 'light': '#fff4fb', 'shadow': '#f4a8d8', 'stretch': 2.0, 'blur': 1.8},
            {'band': (12, 30), 'scale': 7, 'cover': 0.45, 'soft': 0.1, 'light': '#f0faff', 'shadow': '#a8c8f4', 'stretch': 2.2, 'blur': 1.8},
        ],
    },
    # Mond: schwarzer Weltraum, Milchstraße als Band über dem Horizont, viele Sterne, ein Hauch Blau am Horizont
    # (die Erde zeigt die Kulisse als Himmelskörper)
    'mond': {
        'seed': 83,
        'gradient': [(-5, '#1a2036'), (6, '#10142a'), (20, '#080a18'), (90, '#04050c')],
        'below': [(-90, '#0a0c18'), (0, '#1a2036')],
        'milky': {'band': (6, 34), 'color': '#c8d0ff', 'strength': 0.45, 'wave': 10, 'stars': 5000},
        'stars': 2400,
        'starBright': 2.5,
        'starsFrom': -2,
    },
    # Neptun: tiefblauer Sturmhimmel; lange Wolkenbänder in Blau und Türkis jagen um den Horizont, oben dunkel mit Sternen
    'neptun': {
        'seed': 97,
        'gradient': [(-5, '#3a6ad8'), (6, '#2a52b8'), (18, '#183888'), (40, '#0c1e52'), (90, '#050b24')],
        'below': [(-90, '#1a3a8a'), (0, '#3a6ad8')],
        'clouds': [
            {'band': (0, 12), 'scale': 4, 'cover': 0.75, 'soft': 0.4, 'light': '#7ad0ff', 'shadow': '#2a4fa0', 'streaks': True, 'alpha': 0.8, 'blur': 4},
            {'band': (8, 24), 'scale': 6, 'cover': 0.65, 'soft': 0.35, 'light': '#a8e8ff', 'shadow': '#3a6ad8', 'streaks': True, 'alpha': 0.6, 'blur': 3},
            {'band': (18, 34), 'scale': 8, 'cover': 0.5, 'soft': 0.4, 'light': '#5aa8ff', 'shadow': '#1a3a8a', 'streaks': True, 'alpha': 0.45, 'blur': 4},
        ],
        'stars': 1400,
        'starBright': 1.8,
    },
    # Mars: rostroter Staubhimmel; am Horizont orange Staubdunst, darüber lange Staubschleier, oben dunkel mit Sternen
    'mars': {
        'seed': 109,
        'gradient': [(-5, '#e8905a'), (6, '#d0703e'), (18, '#9a4424'), (40, '#4a1c10'), (90, '#1c0806')],
        'below': [(-90, '#a84a24'), (0, '#e8905a')],
        'clouds': [
            {'band': (0, 12), 'scale': 4, 'cover': 0.7, 'soft': 0.45, 'light': '#ffb07a', 'shadow': '#c4602e', 'streaks': True, 'alpha': 0.7, 'blur': 5},
            {'band': (10, 28), 'scale': 7, 'cover': 0.5, 'soft': 0.4, 'light': '#e88a5a', 'shadow': '#8a3a1e', 'streaks': True, 'alpha': 0.45, 'blur': 4},
        ],
        'stars': 1200,
        'starBright': 1.6,
    },
}

if __name__ == '__main__':
    names = list(HIMMEL) if sys.argv[1:] == ['alle'] else sys.argv[1:]
    for n in names:
        render(n, HIMMEL[n])
