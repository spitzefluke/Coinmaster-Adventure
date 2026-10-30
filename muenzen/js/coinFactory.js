// Baut aus einem Münz-Datensatz ein animierbares 3D-Objekt.
//
// Aufbau einer Münze:
//   root
//   ├─ spinner   dreht sich: Körper (extrudierte Kontur), Vorder-/Rückseite, Edelsteine, Flügel
//   └─ fx        bleibt aufrecht: Glühen, Strahlen, Partikel, Ringe, Planeten, Heiligenschein
//
// Die Prägung (Motiv, Schrift, Perlkreis) wird pro Münze auf ein Canvas gezeichnet und
// als Farb- und Relieftextur (bumpMap) verwendet. Das Motiv ist ein Emoji, das in
// Metallfarben umgefärbt wird, damit es wie geprägt aussieht.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { tierById } from './coins.js';

const DEPTH = 0.12;
const LEGEND_FONT = '"Marcellus SC", "Cinzel", Georgia, serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

// ── Konturen ─────────────────────────────────────────────────────────────────
// Radius (max. 1) in Abhängigkeit vom Winkel – bestimmt die Silhouette der Münze.

const tri = (x) => 1 - Math.abs(2 * (x - Math.floor(x)) - 1); // Dreieckswelle 0..1..0

const SHAPES = {
  circle: () => 1,
  octagon: (a) => {
    const seg = (Math.PI * 2) / 8;
    const local = ((a % seg) + seg) % seg - seg / 2;
    return 0.45 + 0.55 * (Math.cos(seg / 2) / Math.cos(local));
  },
  scallop: (a) => 0.93 + 0.07 * Math.sqrt(Math.abs(Math.cos(6 * a))),
  reuleaux: (a) => 0.965 + 0.035 * Math.cos(7 * a),
  flower: (a) => 0.88 + 0.12 * Math.pow(Math.abs(Math.cos(5 * a)), 0.55),
  sun: (a) => 0.86 + 0.14 * Math.pow(tri((a * 16) / (Math.PI * 2) + 0.5), 1.6),
  gear: (a) => 0.93 + 0.07 * (0.5 + 0.5 * Math.tanh(5 * Math.cos(12 * a))),
  star: (a) => 0.82 + 0.18 * Math.pow(0.5 + 0.5 * Math.cos(8 * a), 1.8),
};

function contourPoints(shapeId, reeded) {
  const f = SHAPES[shapeId];
  const n = reeded ? 240 : 256;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let r = f(a);
    if (reeded) r *= i % 2 ? 0.988 : 1;
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  return pts;
}

// Kontur als Canvas-Pfad, skaliert um `scale` (für Rand und Feld auf der Prägung).
function tracePath(ctx, shapeId, c, u, scale) {
  const f = SHAPES[shapeId];
  ctx.beginPath();
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    const r = f(a) * scale * u;
    // Canvas-y zeigt nach unten, Textur wird beim Hochladen gespiegelt -> -sin
    const x = c + Math.cos(a) * r;
    const y = c - Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// ── Prägung ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function arcText(ctx, str, c, radius, top, maxAngle) {
  const chars = [...str];
  const gap = ctx.measureText('M').width * 0.12;
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((s, w) => s + w, 0) + gap * (chars.length - 1);
  const span = total / radius;
  const squeeze = span > maxAngle ? maxAngle / span : 1;
  let angle = top ? -Math.PI / 2 - (span * squeeze) / 2 : Math.PI / 2 + (span * squeeze) / 2;
  chars.forEach((ch, i) => {
    const step = (widths[i] * squeeze) / radius;
    const a = top ? angle + step / 2 : angle - step / 2;
    ctx.save();
    ctx.translate(c + Math.cos(a) * radius, c + Math.sin(a) * radius);
    ctx.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    ctx.scale(squeeze, 1);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += (top ? 1 : -1) * (step + (gap * squeeze) / radius);
  });
}

// Zeichnet ein Emoji und färbt es nach Helligkeit in die Metallpalette um.
// Liefert Farb- und Höhen-Canvas des Motivs.
function emblemLayers(emoji, size, pal) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(size * 0.78)}px ${EMOJI_FONT}`;
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);

  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  let lo = 1, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 40) continue;
    const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    lo = Math.min(lo, l);
    hi = Math.max(hi, l);
  }
  const range = Math.max(0.15, hi - lo);
  const [cHi, cMid, cLo] = pal.map(hexToRgb);
  const color = new ImageData(size, size);
  const height = new ImageData(size, size);
  const cd = color.data, hd = height.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    if (a === 0) continue;
    const l = ((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255 - lo) / range;
    const t = Math.min(1, Math.max(0, 0.15 + l * 0.85));
    for (let k = 0; k < 3; k++) {
      cd[i + k] = t < 0.5 ? cLo[k] + (cMid[k] - cLo[k]) * t * 2 : cMid[k] + (cHi[k] - cMid[k]) * (t - 0.5) * 2;
    }
    cd[i + 3] = d[i + 3];
    const h = Math.round(255 * (0.55 + 0.45 * t));
    hd[i] = hd[i + 1] = hd[i + 2] = h;
    hd[i + 3] = d[i + 3];
  }
  const colorCv = document.createElement('canvas');
  colorCv.width = colorCv.height = size;
  colorCv.getContext('2d').putImageData(color, 0, 0);
  const heightCv = document.createElement('canvas');
  heightCv.width = heightCv.height = size;
  heightCv.getContext('2d').putImageData(height, 0, 0);
  return { colorCv, heightCv };
}

// Erzeugt Farbe, Relief und (optional) Leuchtmaske einer Münzseite.
function paintFace(coin, tier, side, S) {
  const pal = coin.metal;
  const c = S / 2, u = S / 2;
  const mk = () => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    return [cv, cv.getContext('2d')];
  };
  const [colorCv, col] = mk();
  const [bumpCv, bump] = mk();
  const glowing = tier.id === 'mystisch';
  const [emCv, em] = glowing ? mk() : [null, null];

  const dark = tier.id === 'galaktisch' || tier.id === 'mystisch';

  // Grund: ganzes Canvas (ragt über die Kontur hinaus)
  let g = col.createRadialGradient(c * 0.8, c * 0.7, 0, c, c, u);
  g.addColorStop(0, dark ? pal[1] : pal[0]);
  g.addColorStop(0.6, dark ? pal[2] : pal[1]);
  g.addColorStop(1, pal[2]);
  col.fillStyle = g;
  col.fillRect(0, 0, S, S);
  bump.fillStyle = '#5a5a5a';
  bump.fillRect(0, 0, S, S);

  // Erhöhter Rand, folgt der Kontur
  tracePath(col, tier.shape, c, u, 1.0);
  col.fillStyle = pal[1];
  col.fill();
  tracePath(col, tier.shape, c, u, 0.9);
  g = col.createRadialGradient(c * 0.85, c * 0.75, 0, c, c, u * 0.9);
  if (dark) {
    g.addColorStop(0, pal[2]);
    g.addColorStop(1, '#000000');
  } else {
    g.addColorStop(0, pal[1]);
    g.addColorStop(1, pal[2]);
  }
  col.fillStyle = g;
  col.fill();
  col.lineWidth = u * 0.012;
  col.strokeStyle = pal[0];
  col.stroke();

  tracePath(bump, tier.shape, c, u, 1.0);
  bump.fillStyle = '#e8e8e8';
  bump.fill();
  tracePath(bump, tier.shape, c, u, 0.9);
  bump.fillStyle = '#4a4a4a';
  bump.fill();

  // Perlkreis
  const beads = 56;
  for (let i = 0; i < beads; i++) {
    const a = (i / beads) * Math.PI * 2;
    const x = c + Math.cos(a) * u * 0.83, y = c + Math.sin(a) * u * 0.83;
    for (const [ctx, fill] of [[col, pal[0]], [bump, '#c8c8c8'], [em, coin.glow]]) {
      if (!ctx) continue;
      ctx.beginPath();
      ctx.arc(x, y, u * 0.014, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }

  // Umschrift
  const legendTop = side === 'front' ? coin.name.toUpperCase() : 'COINMASTER';
  const legendBottom = side === 'front' ? `· ${tier.name.toUpperCase()} ·` : 'ADVENTURE';
  for (const [ctx, fill] of [[col, pal[0]], [bump, '#d0d0d0'], [em, coin.glow]]) {
    if (!ctx) continue;
    ctx.font = `${Math.round(u * 0.105)}px ${LEGEND_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (ctx === col) {
      ctx.fillStyle = pal[2];
      ctx.save();
      ctx.translate(u * 0.006, u * 0.008);
      arcText(ctx, legendTop, c, u * 0.72, true, Math.PI * 0.95);
      arcText(ctx, legendBottom, c, u * 0.72, false, Math.PI * 0.7);
      ctx.restore();
    }
    ctx.fillStyle = fill;
    arcText(ctx, legendTop, c, u * 0.72, true, Math.PI * 0.95);
    arcText(ctx, legendBottom, c, u * 0.72, false, Math.PI * 0.7);
  }

  // Zentrum: Motiv (Vorderseite) oder Nennwert (Rückseite)
  if (side === 'front') {
    const es = Math.round(u * 1.12);
    const { colorCv: ec, heightCv: eh } = emblemLayers(coin.emblem, es, pal);
    const x = c - es / 2, y = c - es / 2;
    col.save();
    col.shadowColor = 'rgba(0,0,0,0.55)';
    col.shadowBlur = u * 0.03;
    col.shadowOffsetX = u * 0.012;
    col.shadowOffsetY = u * 0.018;
    col.drawImage(ec, x, y);
    col.restore();
    bump.save();
    bump.filter = `blur(${Math.max(1, Math.round(S / 400))}px)`;
    bump.drawImage(eh, x, y);
    bump.restore();
    if (em) {
      em.save();
      em.globalAlpha = 0.35;
      em.filter = `blur(${Math.round(S / 120)}px)`;
      em.drawImage(eh, x, y);
      em.restore();
    }
  } else {
    const value = tier.value;
    const fs = value.length > 3 ? 0.36 : value.length > 2 ? 0.46 : 0.6;
    for (const [ctx, fill] of [[col, pal[0]], [bump, '#e0e0e0'], [em, coin.glow]]) {
      if (!ctx) continue;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(u * fs)}px ${LEGEND_FONT}`;
      if (ctx === col) {
        ctx.fillStyle = pal[2];
        ctx.fillText(value, c + u * 0.012, c - u * 0.03 + u * 0.016);
      }
      ctx.fillStyle = fill;
      ctx.fillText(value, c, c - u * 0.03);
      ctx.font = `${Math.round(u * 0.09)}px ${LEGEND_FONT}`;
      ctx.fillText('TALER', c, c + u * 0.36);
      // Sterne links und rechts
      for (const sx of [-1, 1]) drawStar(ctx, c + sx * u * 0.42, c + u * 0.32, u * 0.04, fill);
    }
  }

  const tex = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return {
    map: tex(colorCv, true),
    bumpMap: tex(bumpCv, false),
    emissiveMap: emCv ? tex(emCv, true) : null,
  };
}

function drawStar(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// ── Gemeinsame Effekt-Texturen ───────────────────────────────────────────────

const shared = {};

function canvasTexture(key, size, draw) {
  if (shared[key]) return shared[key];
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return (shared[key] = t);
}

const glowTexture = () =>
  canvasTexture('glow', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.15)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

const sparkTexture = () =>
  canvasTexture('spark', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(s / 2 - 1, 2, 2, s - 4);
    ctx.fillRect(2, s / 2 - 1, s - 4, 2);
  });

const raysTexture = () =>
  canvasTexture('rays', 512, (ctx, s) => {
    const c = s / 2;
    ctx.translate(c, c);
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      const len = c * (i % 2 ? 0.75 : 1);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -c * 0.045);
      ctx.lineTo(len, c * 0.045);
      ctx.closePath();
      ctx.fill();
    }
  });

const rainbowTexture = () =>
  canvasTexture('rainbow', 256, (ctx, s) => {
    const g = ctx.createConicGradient(0, s / 2, s / 2);
    ['#ff4d6d', '#ffb84d', '#fff94d', '#4dff88', '#4dd2ff', '#7a4dff', '#ff4dd8', '#ff4d6d'].forEach((c, i, a) =>
      g.addColorStop(i / (a.length - 1), c),
    );
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // radial ausblenden
    ctx.globalCompositeOperation = 'destination-in';
    const r = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(0,0,0,1)');
    r.addColorStop(0.4, 'rgba(0,0,0,0.6)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, s, s);
  });

function nebulaTexture(seedHue) {
  return canvasTexture('nebula' + seedHue, 512, (ctx, s) => {
    const c = s / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    ctx.globalCompositeOperation = 'lighter';
    let seed = seedHue * 997 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 0.7) * c * 0.75;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const rad = c * (0.15 + rnd() * 0.35);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const h = seedHue + (rnd() - 0.5) * 120;
      g.addColorStop(0, `hsla(${h},90%,60%,0.32)`);
      g.addColorStop(1, `hsla(${h},90%,40%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    }
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * c * 0.95;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`;
      const sz = rnd() < 0.08 ? 2.4 : 1.1;
      ctx.fillRect(c + Math.cos(a) * r, c + Math.sin(a) * r, sz, sz);
    }
    // runde, weiche Maske
    ctx.globalCompositeOperation = 'destination-in';
    const m = ctx.createRadialGradient(c, c, c * 0.6, c, c, c);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, s, s);
  });
}

// ── Bausteine ────────────────────────────────────────────────────────────────

function glowSprite(color, scale, opacity = 0.75) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  s.scale.setScalar(scale);
  s.renderOrder = -1;
  return s;
}

function particles(count, color, size, texture = sparkTexture()) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3).fill(1), 3));
  const mat = new THREE.PointsMaterial({
    size,
    map: texture,
    color,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.3);
  s.bezierCurveTo(0.35, 0.75, 1.05, 0.95, 1.55, 0.78);
  s.bezierCurveTo(1.4, 0.62, 1.48, 0.5, 1.3, 0.42);
  s.bezierCurveTo(1.42, 0.28, 1.3, 0.14, 1.12, 0.12);
  s.bezierCurveTo(1.18, -0.04, 1.02, -0.16, 0.86, -0.1);
  s.bezierCurveTo(0.86, -0.28, 0.66, -0.36, 0.52, -0.24);
  s.bezierCurveTo(0.42, -0.4, 0.18, -0.36, 0.08, -0.18);
  s.lineTo(0, 0.3);
  return s;
}

// ── Bühne ─────────────────────────────────────────────────────────────────────
export function makeEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();
  return env;
}

export function makeScene(env) {
  const scene = new THREE.Scene();
  scene.environment = env;
  const key = new THREE.DirectionalLight('#fff4e0', 2.2);
  key.position.set(2.5, 3, 4);
  const rim = new THREE.DirectionalLight('#9fb4ff', 1.2);
  rim.position.set(-3, -1, -2);
  scene.add(key, rim, new THREE.AmbientLight('#ffffff', 0.25));
  return scene;
}

// ── Münze ────────────────────────────────────────────────────────────────────

export function createCoin(coin, { resolution = 512 } = {}) {
  const tier = tierById[coin.tier];
  const fx = new Set(tier.fx);
  const pal = coin.metal;
  const accent = new THREE.Color(coin.glow || coin.gem || coin.ember || tier.color);

  const root = new THREE.Group();
  const spinner = new THREE.Group();
  const fxGroup = new THREE.Group();
  root.add(fxGroup, spinner);

  const disposables = [];
  const track = (o) => (disposables.push(o), o);

  // Körper
  const reeded = tier.edge === 'reeded';
  const pts = contourPoints(tier.shape, reeded);
  const bodyShape = new THREE.Shape(pts);
  const bevel = reeded ? 0.012 : 0.035;
  const bodyGeo = track(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: reeded ? 2 : 4,
      curveSegments: 1,
    }),
  );
  bodyGeo.translate(0, 0, -DEPTH / 2);

  const MatClass = fx.has('rainbow') || fx.has('wings') ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
  const bodyMat = track(
    new MatClass({
      color: new THREE.Color(tier.id === 'galaktisch' || tier.id === 'mystisch' ? pal[2] : pal[1]),
      metalness: 1,
      roughness: tier.id === 'normal' ? 0.42 : 0.26,
    }),
  );
  if (tier.id === 'mystisch') {
    bodyMat.emissive = accent.clone();
    bodyMat.emissiveIntensity = 0.12;
  }
  if (fx.has('wings')) Object.assign(bodyMat, { metalness: 0.55, clearcoat: 1, iridescence: 0.4 });
  if (fx.has('rainbow')) Object.assign(bodyMat, { iridescence: 1, iridescenceIOR: 1.6, clearcoat: 1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  spinner.add(body);

  // Seiten
  const faceShape = new THREE.Shape(contourPoints(tier.shape, false));
  const faceGeo = track(new THREE.ShapeGeometry(faceShape, 1));
  const uv = faceGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5 + 0.5, uv.getY(i) * 0.5 + 0.5);
  const faceZ = DEPTH / 2 + bevel + 0.002;

  const faces = {};
  for (const side of ['front', 'back']) {
    const t = paintFace(coin, tier, side, resolution);
    Object.values(t).forEach((x) => x && track(x));
    const mat = track(
      new (fx.has('rainbow') ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({
        map: t.map,
        bumpMap: t.bumpMap,
        bumpScale: 3,
        metalness: fx.has('wings') ? 0.75 : 1,
        roughness: tier.id === 'normal' ? 0.48 : 0.38,
      }),
    );
    if (t.emissiveMap) {
      mat.emissiveMap = t.emissiveMap;
      mat.emissive = new THREE.Color('#ffffff');
      mat.emissiveIntensity = 1.4;
    }
    if (fx.has('rainbow')) Object.assign(mat, { iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 800] });
    const m = new THREE.Mesh(faceGeo, mat);
    m.position.z = side === 'front' ? faceZ : -faceZ;
    if (side === 'back') m.rotation.y = Math.PI;
    spinner.add(m);
    faces[side] = m;
  }

  const updaters = [];
  const onUpdate = (fn) => updaters.push(fn);

  // ── Effekte ──
  if (fx.has('glow')) {
    const big = tier.index >= 7;
    const base = fx.has('rainbow') ? 0.35 : big ? 0.75 : 0.6;
    const glow = glowSprite(accent, big ? 4.2 : 3.6, base);
    fxGroup.add(glow);
    onUpdate((t) => (glow.material.opacity = base + Math.sin(t * 2) * 0.1));
  }

  if (fx.has('shine')) {
    const glint = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sparkTexture(), color: '#fff7d0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false }),
    );
    glint.scale.setScalar(0.5);
    fxGroup.add(glint);
    onUpdate((t) => {
      const cycle = (t * 0.45) % 1;
      const k = Math.max(0, Math.sin(Math.min(1, cycle * 4) * Math.PI));
      glint.material.opacity = k;
      glint.material.rotation = t;
      const a = Math.floor(t * 0.45) * 2.3;
      glint.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.4);
    });
  }

  if (fx.has('gems')) {
    const gemGeo = track(new THREE.OctahedronGeometry(0.075, 0));
    const gemMat = track(
      new THREE.MeshPhysicalMaterial({
        color: coin.gem,
        emissive: coin.gem,
        emissiveIntensity: 0.35,
        metalness: 0,
        roughness: 0.05,
        clearcoat: 1,
        flatShading: true,
      }),
    );
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = SHAPES[tier.shape](a) * 0.95;
      for (const s of [1, -1]) {
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.set(Math.cos(a) * r, Math.sin(a) * r, s * (faceZ + 0.015));
        gem.scale.set(1, 1, 0.55);
        gem.rotation.z = a;
        spinner.add(gem);
      }
    }
  }

  if (fx.has('embers')) {
    const N = 46;
    const pts = particles(N, coin.ember, 0.14);
    const seeds = Array.from({ length: N }, () => [Math.random() * Math.PI * 2, Math.random(), 0.6 + Math.random() * 0.8]);
    fxGroup.add(pts);
    onUpdate((t) => {
      const p = pts.geometry.attributes.position, col = pts.geometry.attributes.color;
      seeds.forEach(([a, off, sp], i) => {
        const life = (t * 0.35 * sp + off) % 1;
        const r = 0.85 + Math.sin(a * 3 + t) * 0.15 + life * 0.25;
        p.setXYZ(i, Math.cos(a) * r, -1.1 + life * 2.9, Math.sin(a) * r * 0.6);
        const fade = Math.sin(life * Math.PI);
        col.setXYZ(i, fade, fade, fade);
      });
      p.needsUpdate = col.needsUpdate = true;
    });
  }

  if (fx.has('runes') || fx.has('orbitRing')) {
    const mats = [faces.front.material, faces.back.material];
    onUpdate((t) => mats.forEach((m) => (m.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.6)));
    const ringMat = track(
      new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    const rings = [1.42, 1.58].map((r, i) => {
      const ring = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.012, 6, 120)), ringMat);
      ring.rotation.x = Math.PI / 2 - 0.35 + i * 0.7;
      fxGroup.add(ring);
      return ring;
    });
    // kleine Runensteine auf der Umlaufbahn
    const stones = particles(10, accent, 0.18);
    const tilt = new THREE.Euler(rings[0].rotation.x, 0, 0);
    const v = new THREE.Vector3();
    fxGroup.add(stones);
    onUpdate((t) => {
      rings[0].rotation.z = t * 0.6;
      rings[1].rotation.z = -t * 0.4;
      const p = stones.geometry.attributes.position;
      for (let i = 0; i < 10; i++) {
        const a = t * 0.6 + (i / 10) * Math.PI * 2;
        v.set(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0).applyEuler(tilt);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      p.needsUpdate = true;
    });
  }

  if (fx.has('wings')) {
    const wingGeo = track(
      new THREE.ExtrudeGeometry(wingShape(), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 }),
    );
    wingGeo.translate(0, 0, -0.03);
    const wingMat = track(
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: '#fff3d0',
        emissiveIntensity: 0.25,
        metalness: 0.2,
        roughness: 0.35,
        clearcoat: 1,
        iridescence: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    const wings = [1, -1].map((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.82, 0.1, -0.02);
      const w = new THREE.Mesh(wingGeo, wingMat);
      w.scale.set(s * 0.95, 0.95, 1);
      pivot.add(w);
      spinner.add(pivot);
      return [pivot, s];
    });
    onUpdate((t) => wings.forEach(([p, s]) => (p.rotation.y = s * (-0.35 + Math.sin(t * 3) * 0.3))));
  }

  if (fx.has('halo')) {
    const halo = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.5, 0.045, 12, 64)),
      track(new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffcf4d', emissiveIntensity: 1.6, metalness: 1, roughness: 0.2 })),
    );
    halo.rotation.x = Math.PI / 2 - 0.25;
    fxGroup.add(halo);
    const haloGlow = glowSprite('#ffe9a8', 1.6, 0.6);
    fxGroup.add(haloGlow);
    onUpdate((t) => {
      halo.position.y = haloGlow.position.y = 1.32 + Math.sin(t * 2) * 0.05;
    });
  }

  if (fx.has('rays')) {
    const rays = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: raysTexture(),
        color: fx.has('rainbow') ? '#ffffff' : accent,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    rays.scale.setScalar(fx.has('rainbow') ? 4.4 : 4.0);
    rays.renderOrder = -1;
    fxGroup.add(rays);
    onUpdate((t) => {
      rays.material.rotation = t * 0.25;
      rays.material.opacity = (fx.has('rainbow') ? 0.22 : 0.42) + Math.sin(t * 1.7) * 0.12;
    });
  }

  if (fx.has('nebula')) {
    const hue = coin.name.length * 37 % 360;
    const neb = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.66, 64)),
      track(new THREE.MeshBasicMaterial({ map: nebulaTexture(hue), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    neb.position.z = faceZ + 0.004;
    const nebBack = neb.clone();
    nebBack.position.z = -faceZ - 0.004;
    nebBack.rotation.y = Math.PI;
    spinner.add(neb, nebBack);
    onUpdate((t) => {
      neb.rotation.z = t * 0.15;
      nebBack.rotation.z = -t * 0.15;
    });
  }

  if (fx.has('planets')) {
    const plane = new THREE.Group();
    plane.rotation.set(Math.PI / 2 - 0.3, 0.25, 0);
    fxGroup.add(plane);
    const orbit = new THREE.Mesh(
      track(new THREE.RingGeometry(1.55, 1.575, 128)),
      track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    plane.add(orbit);
    const planets = [
      ['#ff9d5c', 0.11, 1.56, 0.9, 0],
      ['#5cd6ff', 0.08, 1.56, 0.9, 2.4],
      ['#e8d0ff', 0.06, 1.56, 0.9, 4.1],
    ].map(([color, size, r, speed, phase]) => {
      const p = new THREE.Mesh(
        track(new THREE.SphereGeometry(size, 20, 14)),
        track(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.6 })),
      );
      plane.add(p);
      return [p, r, speed, phase];
    });
    onUpdate((t) =>
      planets.forEach(([p, r, speed, phase]) => p.position.set(Math.cos(t * speed + phase) * r, Math.sin(t * speed + phase) * r, 0)),
    );
  }

  if (fx.has('rings')) {
    const rings = [1.3, 1.48, 1.66].map((r, i) => {
      const ring = new THREE.Mesh(
        track(new THREE.TorusGeometry(r, 0.014, 8, 140)),
        track(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })),
      );
      ring.rotation.set(Math.PI / 2 + (i - 1) * 0.6, i * 0.5, 0);
      fxGroup.add(ring);
      return ring;
    });
    onUpdate((t) =>
      rings.forEach((ring, i) => {
        ring.rotation.y = t * (0.3 + i * 0.15) * (i % 2 ? -1 : 1);
        ring.material.color.setHSL((t * 0.12 + i / 3) % 1, 0.95, 0.65);
      }),
    );
  }

  if (fx.has('rainbow')) {
    const rb = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: rainbowTexture(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    rb.scale.setScalar(3.8);
    rb.renderOrder = -2;
    fxGroup.add(rb);
    const glowSpr = fxGroup.children.find((c) => c.isSprite && c.material.map === glowTexture());
    const base = new THREE.Color(pal[1]);
    onUpdate((t) => {
      rb.material.rotation = -t * 0.4;
      const h = (t * 0.08) % 1;
      bodyMat.color.setHSL(h, 0.7, 0.72);
      glowSpr && glowSpr.material.color.setHSL((h + 0.5) % 1, 1, 0.65);
      faces.front.material.color.copy(base).lerp(new THREE.Color().setHSL(h, 1, 0.8), 0.35);
    });
  }

  if (fx.has('sparkles')) {
    const N = tier.index >= 8 ? 40 : 26;
    const pts = particles(N, fx.has('rainbow') ? '#ffffff' : accent.clone().lerp(new THREE.Color('#ffffff'), 0.5), 0.13);
    const seeds = Array.from({ length: N }, () => [Math.random() * Math.PI * 2, 1.1 + Math.random() * 0.9, (Math.random() - 0.5) * 2.6, Math.random() * 10, 0.3 + Math.random()]);
    fxGroup.add(pts);
    onUpdate((t) => {
      const p = pts.geometry.attributes.position, col = pts.geometry.attributes.color;
      seeds.forEach(([a, r, y, ph, sp], i) => {
        const ang = a + t * 0.25 * sp;
        p.setXYZ(i, Math.cos(ang) * r, y + Math.sin(t * sp + ph) * 0.1, Math.sin(ang) * r * 0.5);
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * 3 * sp + ph), 3);
        if (fx.has('rainbow')) {
          const c = new THREE.Color().setHSL((i / N + t * 0.1) % 1, 1, 0.5 + tw * 0.3);
          col.setXYZ(i, c.r * tw, c.g * tw, c.b * tw);
        } else col.setXYZ(i, tw, tw, tw);
      });
      p.needsUpdate = col.needsUpdate = true;
    });
  }

  return {
    root,
    spinner,
    tier,
    update(t) {
      for (const fn of updaters) fn(t);
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      root.traverse((o) => o.material && !disposables.includes(o.material) && o.material.dispose());
    },
  };
}
