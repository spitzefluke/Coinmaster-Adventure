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


def render(name, cfg):
    out = os.path.join(ROOT, 'assets', 'himmel', name)
    os.makedirs(out, exist_ok=True)
    seed = abs(hash(name)) % 10000 if 'seed' not in cfg else cfg['seed']

    # Seiten
    elev, u = side_dirs()
    img = gradient(elev, cfg['gradient'])
    for i, layer in enumerate(cfg.get('clouds', [])):
        clouds(img, elev, u, layer, seed + 101 * (i + 1))
    if cfg.get('stars'):
        st = stars(elev.shape, cfg['stars'] * 0.25, seed + 7) * smooth(5, 25, elev)
        img = np.clip(img + st[..., None], 0, 1)
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, 'seite.jpg'), quality=90)

    # Oben: nur Verlauf (und Sterne)
    e, _, _ = cap_dirs(True)
    top = gradient(e, cfg['gradient'])
    if cfg.get('stars'):
        top = np.clip(top + stars(e.shape, cfg['stars'] * 0.4, seed + 9)[..., None], 0, 1)
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
}

if __name__ == '__main__':
    names = list(HIMMEL) if sys.argv[1:] == ['alle'] else sys.argv[1:]
    for n in names:
        render(n, HIMMEL[n])
